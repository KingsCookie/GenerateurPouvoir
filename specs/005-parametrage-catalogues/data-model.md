# Modèle de données — Feature 005 (Paramétrage & catalogues)

Réutilise au maximum les entités existantes (Features 1-3). Seules les additions/changements sont
détaillés. Les types vivent dans `src/core/**` (purs).

## Entités existantes réutilisées (rappel)

- **`Trait`** `{ id: "type:slug-i", type: TraitType, label: string, weight: number }` — `weight` =
  **poids individuel** (déjà présent ; devient éditable).
- **`Catalog`** `{ byType: Record<TraitType, Trait[]> }` — devient **éditable** (mutations pures).
- **`TraitType`** : 6 valeurs **fixes** (`Remplacement`, `PartieCorps`, `Etat`, `Element`, `Ajout`,
  `Action`). Non modifiables.
- **`Espece`** `{ id, label, genres: Genre[], reproStartAge, reproPeakAge, reproEndAge, reproPeakPct,
  reproSlope, groupSize, litterMin (M), litterMax (N), litterExtraPct (X), divorcePct }` — déjà
  complète ; devient **éditable**.
- **`Genre`** `{ id, label }` ; `GENRE_TOUT = "tout"` toujours présent, non supprimable.
- **`Couple`** `{ id, memberIds, reproPct: number | null }` — `reproPct` éditable (déjà branché).
- **`ADN` / `ResilientTrait`** `{ traitId, active, resilience }` — **inchangés** ; non mutés par
  l'édition de catalogue.

## Nouveau — Surcharge de résilience

```ts
// src/core/params/parameters.ts
export interface ResiliencePatch {
  initial?: number;            // résilience initiale [0..100]
  max?: number;                // plafond [0..100]
  disappearThreshold?: number; // seuil de disparition (« minimale ») [0..100]
}

export interface ResilienceOverrides {
  byType: Partial<Record<TraitType, ResiliencePatch>>;
  byTrait: Record<string, ResiliencePatch>; // clé = traitId
}

// Ajout au type Parameters :
//   resilienceOverrides: ResilienceOverrides;
// Les 3 valeurs globales existantes (initialResilience, resilienceMax, disappearThreshold)
// restent la base (niveau global).
```

- **Défaut** : `resilienceOverrides = { byType: {}, byTrait: {} }` (aucune surcharge ⇒ comportement
  identique à aujourd'hui).
- **Sérialisation** : porté par `Parameters`, donc inclus dans `AppState.parameters` (export config —
  Feature 6) sans changement de `serializeState`.

### Valeur effective résolue

```ts
// src/core/params/resolveResilience.ts
export interface EffectiveResilience {
  initial: number;
  max: number;
  disappearThreshold: number;
}
export function resolveResilience(params: Parameters, traitId: string): EffectiveResilience;
```

**Règle (par champ, indépendamment)** :
`byTrait[traitId]?.champ ?? byType[typeOf(traitId)]?.champ ?? global.champ`.

`typeOf(traitId)` = préfixe avant `:` s'il appartient à `TRAIT_TYPES`, sinon `undefined` (le niveau
type est alors sauté).

## Invariants

- **INV-P1 (résolution totale)** : `resolveResilience` renvoie **toujours** 3 nombres définis (jamais
  `undefined`/`NaN`) ; en l'absence de toute surcharge, égale exactement les valeurs globales.
- **INV-P2 (par champ)** : surcharger un seul champ (ex. `initial` au niveau trait) **n'affecte pas**
  les deux autres, qui réhéritent du niveau supérieur.
- **INV-P3 (type via id)** : la résolution fonctionne pour un `traitId` **absent du catalogue**
  (trait supprimé) tant que son préfixe est un `TraitType` connu.
- **INV-P4 (bornes)** : toute valeur effective (et toute surcharge saisie) est dans **[0, 100]** ;
  `disappearThreshold ≤ max` (cohérence) — garanti par la validation (D7).
- **INV-C1 (catalogue futur seulement)** : `addTrait`/`renameTrait`/`removeTrait` renvoient un
  **nouveau** `Catalog` et **ne mutent jamais** un `ADN` existant.
- **INV-C2 (unicité d'id)** : l'ajout d'un trait produit un id **stable et unique** dans son type
  (`type:slug-n`), même en cas de libellé déjà présent (suffixe différenciateur).
- **INV-C3 (types fixes)** : aucune opération n'ajoute/retire un `TraitType`.
- **INV-E1 (« tout » permanent)** : toute espèce contient `GENRE_TOUT`, non supprimable, jamais
  dupliqué.
- **INV-E2 (espèce futur seulement)** : `removeEspece` n'invalide pas les individus existants de
  cette espèce.
- **INV-E3 (cohérence reproduction)** : `reproStartAge ≤ reproPeakAge ≤ reproEndAge` ; `litterMin ≤
  litterMax` ; `reproSlope > 0` ; `groupSize ≥ 1` ; pourcentages ∈ [0, 100].
- **INV-W1 (poids)** : `Trait.weight ≥ 0`, `traitTypeWeights[t] ≥ 0`, `templateWeights[t] ≥ 0` ;
  poids effectif d'un trait = `traitTypeWeights[type] × Trait.weight` (FR-052).
- **INV-D1 (déterminisme)** : à seed fixe, catalogue + paramètres + surcharges identiques ⇒ résultats
  identiques (genèse, naissances). Aucune mutation ne consomme le RNG.
- **INV-D2 (lecture seule sur l'existant)** : éditer un paramètre/catalogue ne recalcule jamais les
  pouvoirs déjà attribués (§3.3).

## Mutations pures (signatures — détail en contracts/core-api.md)

- **Catalogue** : `addTrait`, `renameTrait`, `removeTrait`.
- **Espèces** : `addEspece`, `renameEspece`, `removeEspece`, `setEspeceParam`, `addGenre`,
  `renameGenre`, `removeGenre`.
- **Surcharges** : `setResiliencePatch(params, scope, patch)` / `clearResiliencePatch(...)` (helpers
  purs pour poser/retirer une surcharge global/type/trait) — ou édition directe de la structure côté
  store + validation.
- **Validation** : `validateEspece`, `validateResiliencePatch`, `clampPct`, etc.

## Couche UI (stores réactifs — `src/ui`, non cœur)

- `catalog: writable<Catalog>` (remplace la constante de module).
- `especes: writable<Espece[]>` (remplace `let especesRef`).
- `parameters: writable<Parameters>` (existant ; gagne `resilienceOverrides`).
- `snapshot()` lit ces stores (export Feature 6 inchangé dans sa forme).
