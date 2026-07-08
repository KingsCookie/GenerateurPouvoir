# Modèle de données — 011-corrections-bugs-ui

Phase 1. Ce lot ne crée pas de nouvelle entité de domaine ; il **ajoute un champ d'état**
(`genesisYear`), **change la sémantique** d'un paramètre (`duplicationD`) et **lève une contrainte**
(bornes P/M en saisie). Détail des impacts.

## Entités & champs touchés

### AppState (`src/core/state/serialize.ts` / `appState`)
- **+ `genesisYear: number`** (US3) — année de la genèse initiale ; origine du calcul de génération.
  - Défini à `parameters.birthYear` lors de la genèse initiale.
  - **Sérialisé** dans les exports `data` et `full`.
  - **Migration v3→v4** : si absent à l'import, fallback = **plus petite `birthYear`** de la
    population (sinon `parameters.birthYear ?? 0`).
- `FORMAT_VERSION` : **3 → 4**.

### Parameters (`src/core/params/parameters.ts`)
- **`duplicationD: number`** (US8) — **change de sémantique** : diviseur → **multiplicateur** de la
  probabilité de duplication. Contrainte : **≥ 0** (`0` ⇒ aucune duplication).
  - **Défaut** : `20` → `0.25`.
  - Reste exporté/paramétrable (Principe VII). Commentaire mis à jour.

### Pouvoir (`src/core/model/pouvoir.ts`)
- `puissance: number`, `maitrise: number` (US10) — **entiers non bornés**. Le domaine autorise
  désormais négatif / 0 / > 10. Aucune migration (les valeurs existantes restent valides).

### ResilientTrait (`src/core/model/adn.ts`)
- Inchangé (US7 réutilise `active`/`resilience` déjà éditables).

## Fonctions dérivées — signatures impactées

### `computeGeneration` (`src/core/genesis/derived.ts`) — US3
- Avant : `computeGeneration(birthYear: number): number`
- Après : `computeGeneration(birthYear: number, genesisYear: number): number`
  → `Math.floor((birthYear − genesisYear) / 20)`
- Répercussion sur les appelants : `ficheViewModel.buildListRow` / `buildFiche`, `genealogy/filter`.

### `FilterContext` (`src/core/genealogy/filter.ts`) — US3
- **+ `genesisYear: number`** (utilisé par le filtre/tri par génération).

### ViewModel de liste (`src/ui/lib/ficheViewModel.ts`) — US3/US4
- `buildListRow` reçoit `genesisYear` (génération relative). Le rendu P/M (US4) est côté vues
  (`ListeView`/`SandboxView`), inchangé côté données (`{label, puissance, maitrise}`).

### Reproduction — US2
- `ReproduceOptions` (`src/core/birth/reproduce.ts`) : **+ `birthDayOfYear?: number`** (jour partagé
  de la portée). Absent ⇒ tirage interne (comportement conservé hors portée).

## Règles de validation

| Règle | Source | Où |
|---|---|---|
| Probabilité de duplication ∈ [0, 100] % = `clamp(résilience · D)` | FR-018 | `traitsToPowers.ts` |
| `duplicationD` ≥ 0 | FR-018 | `parameters.ts` (défaut 0.25) |
| Enfants d'une même portée : date identique | FR-004 | `tick.ts` + `reproduce.ts` |
| Génération 0 = année de genèse ; +1 par tranche de 20 ans | FR-006/007 | `derived.ts` |
| Import sans `genesisYear` ⇒ fallback naissance la plus ancienne | FR-008a | `serialize.ts` |
| Pas d'appariement lignée directe (2 niveaux) si consanguinité interdite | FR-001/002 | `pairing.ts` |
| P/M bornées [1,10] **uniquement** au tirage aléatoire (mutation forte, §7.2 cas A, régé sans parents, genèse) | FR-024 | `inheritStats.ts` (déjà), genèse, mutation forte |
| P/M saisie manuelle non bornée (entier) | FR-023 | `SandboxPersonForm.svelte` |

## États / transitions

- **Régénération (US9)** : `pouvoirs(individu)` ← dérivés de `traits actifs` (§6.4) ; `adn(individu)`
  ← enrichi des traits K générés ; transition **destructive immédiate** (remplace l'état courant),
  déclenchée par action utilisateur, consommant `sbRng`.
- **Aperçu (US7)** : état **transitoire** du formulaire (non persistant tant que non « Créé/Enregistré ») ;
  recalculé à chaque changement via seed d'aperçu stable ; devient l'état persistant à l'enregistrement.
