# Phase 1 — Modèle de données

Portée : entités/champs nécessaires à la **simulation temporelle** (Feature 3). Étend le modèle des
Features 1 & 2 **sans le casser**. Réutilise `Personne` (dont `conjoints` actuel/ex, `vivant`,
`raisonDeces`, `parents`/`enfants`), `Espece`/`Genre`, `ADN`, `Pouvoir`, `Parameters`, `AppState`.

## Entités réutilisées (rappel)

- **Personne** : `parents[]`, `enfants[]`, `conjoints: Conjoint[]` (`statut: 'actuel' | 'ex'`), `vivant`,
  `raisonDeces`, `dateNaissance`, `adn`, `pouvoirs`, `especeId`, `genreId`.
- **Espece** `{ id, label, genres: Genre[] }` ; **Genre** `{ id, label }` ; `GENRE_TOUT = 'tout'`.
- **AppState** `kind:"full"` `{ formatVersion, parameters, catalog, population }`.

## Espece — champs ajoutés (paramètres de reproduction, §9.4)

| Champ | Type | Défaut (humain) | Règles |
|---|---|---|---|
| `reproStartAge` | number | **16** | âge de début de reproduction (≥ 0). |
| `reproPeakAge` | number | **25** | âge du pic de probabilité. |
| `reproEndAge` | number | **50** | âge de fin/maximal ; au-delà, probabilité nulle. |
| `reproPeakPct` | number | **40** | probabilité (%) au pic [0..100]. |
| `reproSlope` | number | **8** | pente = écart-type (années, > 0) de la cloche. |
| `groupSize` | number | **2** | taille du groupe de reproduction (≥ 1). |
| `litterMin` (M) | number | **1** | enfants garantis (≥ 0). |
| `litterMax` (N) | number | **4** | plafond (≥ M). |
| `litterExtraPct` (X) | number | **15** | chance (%) d'un enfant supplémentaire [0..100]. |
| `divorcePct` | number | **0** | chance (%) de divorce par an et par couple [0..100]. |

## Parameters — champ ajouté

| Champ | Type | Défaut | Règles |
|---|---|---|---|
| `consanguinityAllowed` | boolean | **false** | si `false`, interdit l'appariement entre individus partageant parents OU grands-parents (§6.6.1). |

> Les paramètres du moteur génétique (F2) et de génération (F1) sont inchangés. Tout `Parameters` et toute
> `Espece` sont exportés (Principe VII).

## Nouvelle entité — Couple

```ts
interface Couple {
  id: string;            // id séquentiel déterministe (ex. "c-000001")
  memberIds: string[];   // ids des conjoints actuels (taille = groupSize de l'espèce)
  reproPct: number | null; // % de reproduction éditable ; null ⇒ dérivé de la gaussienne (âge moyen)
}
```

- Les membres d'un `Couple` se référencent mutuellement comme **conjoints `actuel`** (`Personne.conjoints`).
- Au **divorce** ou à la **mort** d'un membre : le `Couple` est supprimé ; les conjoints `actuel` mutuels
  passent en `ex` ; les survivants redeviennent célibataires.

## AppState — champs ajoutés

| Champ | Type | Défaut | Règles |
|---|---|---|---|
| `currentYear` | number | = `parameters.birthYear` | année courante (1ᵉʳ janvier) ; progresse de 1 par tick. |
| `couples` | Couple[] | `[]` | couples actuels. |
| `rngState` | string[] | état initial du RNG | 4 mots xoshiro256\*\* en décimal (FR-021) ; mis à jour à chaque avance. |

> `formatVersion` est **incrémenté** (1 → 2). L'import d'un fichier `formatVersion: 1` (F1/F2) reste accepté
> avec des **valeurs par défaut** pour les nouveaux champs (`currentYear = birthYear`, `couples = []`,
> `rngState` ré-amorcé depuis la seed) — compatibilité ascendante.

## Règles métier (tick annuel §6.6)

Ordre **fixe** par année (déterminisme) :

1. **Divorces** : pour chaque couple (ordre stable), `chance(espèce.divorcePct)` ⇒ dissolution (conjoints
   `actuel` → `ex`, couple retiré).
2. **Candidats & volonté** : chaque individu **vivant, célibataire/divorcé, `âge ≤ reproEndAge`** tire
   `chance(p(âge))` (gaussienne). Les volontaires forment la liste des candidats.
3. **Appariement** : mélange déterministe des candidats ; formation de **groupes de `groupSize`** compatibles
   (**même espèce**, **non consanguins** ; le **genre n'intervient pas** en F3 — reporté). Groupe complet ⇒
   **Couple** créé. Candidats non appariés ⇒ **reportés** à l'année suivante (pas de couple partiel).
4. **Reproduction** : chaque **nouveau couple** produit **une portée** (dès cette année) ; chaque **couple
   existant** tire `chance(reproPct ?? p(âge moyen))` ⇒ portée si succès. Chaque portée = `litterSize`
   enfants via `reproduce` (F2) avec les membres comme parents ; parenté posée des deux côtés.
5. **Avance** : `currentYear += 1` (l'âge en découle).

### Portée (§6.6.2)
`n = M` ; tant que `n < N` et `chance(X)` ⇒ `n += 1` ; sinon stop. `n ∈ [M, N]`.

### Mort (§6.7)
`kill(id, cause)` : cause **non vide** obligatoire ⇒ `vivant=false`, `raisonDeces=cause` ; dissout le couple
éventuel ; exclut des candidats/couples ultérieurs. Cause vide ⇒ **refus** (aucune mutation).

## Invariants (testables)

- **INV-1** : déterminisme — `(rngState, état, paramètres)` identiques ⇒ après `advanceYears(X)`, population
  **identique** (SC-001).
- **INV-2** : vieillissement — après `advanceYears(k)`, `currentYear` augmente de `k` et l'âge de tout vivant
  augmente de `k` (SC-002).
- **INV-3** : portée bornée — toute portée a un effectif dans `[M, N]`, ≥ M (SC-003).
- **INV-4** : anti-consanguinité — consanguinité interdite ⇒ aucun couple entre individus partageant parents
  ou grands-parents (SC-004).
- **INV-5** : non-inter-espèces — aucun couple entre espèces différentes (SC-006).
- **INV-6** : genre — *(reporté en F3, décision A1)* le genre **n'impacte pas** l'appariement ; toute
  contrainte de compatibilité de genre relève d'une feature ultérieure. (Numéro conservé.)
- **INV-7** : divorce — `divorcePct = 0` ⇒ 0 divorce ; `= 100` ⇒ tous les couples dissous en 1 an (SC-005).
- **INV-8** : mort — un mort n'est jamais candidat ni membre d'un nouveau couple ; cause obligatoire (SC-007).
- **INV-9** : parenté — chaque enfant d'une portée a `parents = membres du couple` et chaque membre reçoit
  l'id de l'enfant.
- **INV-10** : round-trip & continuation — export → import (avec `rngState`/`currentYear`/`couples`) ⇒ état
  **égal** ; `advanceYears` après import = même résultat qu'une session continue (SC-008).
- **INV-11** : compatibilité ascendante — un fichier `formatVersion: 1` s'importe avec des défauts sûrs.
