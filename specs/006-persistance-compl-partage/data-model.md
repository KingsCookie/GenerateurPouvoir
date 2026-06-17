# Modèle de données — Feature 006 (Persistance complète & partage)

Réutilise `AppState` (Features 1-5). Seules les **additions** sont décrites. Types dans
`src/core/state/serialize.ts` (purs).

## Entités existantes réutilisées (rappel)

- **`AppState`** `{ formatVersion, kind:'full', parameters, catalog, especes, population, currentYear,
  couples, rngState }` — la forme `full` **ne change pas**.
- **`Parameters`**, **`Catalog`**, **`Espece[]`** — composent la **configuration**.
- **`Personne[]`** (population, ADN, pouvoirs, généalogie via `parents`/`enfants`), **`Couple[]`**,
  **`currentYear`**, **`rngState: string[]`** (4 mots xoshiro) — composent les **données**.
- **`FORMAT_VERSION`** — constante unique, **partagée** par les trois types.

## Nouveau — Sous-états typés

```ts
// src/core/state/serialize.ts
export interface ConfigState {
  formatVersion: number;
  kind: 'config';
  parameters: Parameters;
  catalog: Catalog;
  especes: Espece[];
}

export interface DataState {
  formatVersion: number;
  kind: 'data';
  population: Personne[];
  currentYear: number;
  couples: Couple[];
  rngState: string[]; // position exacte du RNG (reprise au tirage près)
}

// `full` reste AppState (kind:'full').

// Union étiquetée renvoyée par la détection à l'import.
export type ParsedImport =
  | { kind: 'config'; config: ConfigState }
  | { kind: 'data'; data: DataState }
  | { kind: 'full'; state: AppState };
```

## Invariants

- **INV-K1 (en-tête)** : tout fichier exporté porte `kind ∈ {config, data, full}` et `formatVersion`.
- **INV-K2 (détection)** : `parseImport` renvoie l'union correspondant **exactement** au `kind` lu ;
  un `kind` absent/inconnu ⇒ `Err` (jamais d'interprétation par défaut).
- **INV-K3 (version)** : `formatVersion > FORMAT_VERSION` ⇒ `Err` (« version non prise en charge ») ;
  `≤` ⇒ accepté avec défaut des champs absents (INV-K5).
- **INV-K4 (immutabilité / pureté)** : `extractConfig`/`extractData`/`serialize*`/`parseImport` sont
  **pures** ; aucune ne consomme le RNG, n'utilise l'horloge ni le DOM, et ne mute ses entrées.
- **INV-K5 (rétro-compatibilité)** : un fichier antérieur (champs récents absents) est accepté en
  **défautant** : `resilienceOverrides → {byType:{},byTrait:{}}`, `Trait.weight` absent → `null`,
  `rngState` absent/longueur ≠ 4 → reconstruit depuis la seed, `couples → []`, `especes` vide →
  défaut, `currentYear → birthYear`.
- **INV-K6 (round-trip)** : `parseImport(serializeFull(s))` redonne un état **égal** à `s` ; idem
  pour `config`/`data` sur leurs champs respectifs (déterminisme + canonicalisation).
- **INV-K7 (application partielle — non destructive)** : portée par les helpers **purs**
  `mergeConfig(state, config)` / `mergeData(state, data)` (cœur, **testables à seed fixe**) :
  - `mergeConfig` remplace `parameters`/`catalog`/`especes` et **ne modifie pas**
    `population`/`couples`/`currentYear`/`rngState` (Clarification 2026-06-17) ;
  - `mergeData` remplace `population`/`couples`/`currentYear`/`rngState` et **ne modifie pas**
    `parameters`/`catalog`/`especes`.
  - L'UI ne duplique pas cette logique : `applyConfig`/`applyData` appellent ces helpers.
- **INV-K8 (déterminisme de reprise)** : après application d'un `data`/`full`, l'état RNG restauré +
  la seed garantissent une suite de tirages **identique** (continuation au tirage près).
- **INV-K9 (rejet sûr)** : tout import invalide (JSON illisible, `kind` inconnu, version trop
  récente, structure incohérente) **n'altère pas** l'état courant (le store n'est mis à jour qu'en
  cas de succès).
- **INV-K10 (anonymat)** : aucun champ des fichiers exportés ne contient d'identité personnelle.

## Couche UI (stores réactifs — `src/ui`, non cœur)

- `buildConfigJson()` / `buildDataJson()` / `buildFullJson()` : sérialisent l'instantané courant
  (`snapshot()`) via les extracteurs/sérialiseurs purs.
- `applyConfig(c)` / `applyData(d)` : **délèguent** à `mergeConfig`/`mergeData` (cœur, INV-K7) puis
  mettent à jour les stores ; `applyData` restaure en plus `engineRng = createRngFromState(d.rngState)`.
- `applyImport(json)` : **dispatcher** — `parseImport` puis `applyConfig`/`applyData`/(full) ;
  renseigne `importError` en cas d'échec, **sans** toucher l'état courant (INV-K9).
- Nom de fichier horodaté généré côté UI (`royalcookie-<kind>-YYYYMMDD-HHMMSS.json`).
