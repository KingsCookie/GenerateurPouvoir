# Contrats — API cœur Feature 006 (Persistance complète & partage)

API **pure** (`src/core/state`, sans Svelte/DOM/horloge/`Math.random`). Toutes les fonctions sont
**déterministes** et renvoient de **nouveaux** objets/chaînes. L'UI (`src/ui`) consomme ces fonctions
et détient les stores, le téléchargement et la sélection de fichier.

## 1. Types

```ts
interface ConfigState { formatVersion: number; kind: 'config'; parameters: Parameters; catalog: Catalog; especes: Espece[] }
interface DataState   { formatVersion: number; kind: 'data';   population: Personne[]; currentYear: number; couples: Couple[]; rngState: string[] }
// FullState = AppState (kind:'full'), inchangé.

type ParsedImport =
  | { kind: 'config'; config: ConfigState }
  | { kind: 'data';   data: DataState }
  | { kind: 'full';   state: AppState };

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
```

## 2. Extraction & fusion (pure)

```ts
// Sélectionne la configuration depuis un état complet (immutables).
function extractConfig(state: AppState): ConfigState;

// Sélectionne les données générées depuis un état complet (immutables).
function extractData(state: AppState): DataState;

// Fusionne une CONFIG dans un état : remplace parameters/catalog/especes, CONSERVE les données
// (population/currentYear/couples/rngState). Renvoie un NOUVEL AppState. (Clarification 2026-06-17)
function mergeConfig(state: AppState, config: ConfigState): AppState;

// Fusionne des DONNÉES dans un état : remplace population/currentYear/couples/rngState, CONSERVE la
// config (parameters/catalog/especes). Renvoie un NOUVEL AppState.
function mergeData(state: AppState, data: DataState): AppState;
```

**Contrat** :
- `extract*` ne mutent pas `state` ; `extractConfig` ne lit que parameters/catalog/especes,
  `extractData` que population/currentYear/couples/rngState (INV-K4).
- `mergeConfig`/`mergeData` sont **purs** (nouvel objet) et **non destructifs** (INV-K7) :
  `mergeConfig` ne touche **aucun** champ de données ; `mergeData` ne touche **aucun** champ de
  config. Ce sont eux qui portent la sémantique des clarifications 2026-06-17 et qui sont
  **testables à seed fixe** (au lieu de la logique de store UI).
- L'UI : `applyConfig(c)` = `state = mergeConfig(state, c)` puis maj des stores ; `applyData(d)` =
  `state = mergeData(state, d)` puis maj des stores **et** `engineRng = createRngFromState(d.rngState)`
  (restauration RNG, INV-K8).

## 3. Sérialisation (pure, canonique)

```ts
function serializeConfig(state: AppState): string; // kind:"config"
function serializeData(state: AppState): string;   // kind:"data"
function serializeFull(state: AppState): string;    // kind:"full" — = serializeState (conservé)
```

**Contrat** : sortie JSON **canonique** (clés triées) ⇒ deux états égaux ⇒ fichiers identiques
(SC-001). Chaque fichier porte `kind` + `formatVersion` (INV-K1).

## 4. Détection & désérialisation à l'import (pure)

```ts
// Parse, détecte le kind, valide la structure du type et la version, défaut les champs absents.
function parseImport(json: string): Result<ParsedImport>;
```

**Contrat** :
- JSON illisible ⇒ `{ ok:false, error:"Fichier illisible : JSON invalide." }`.
- `kind` absent/inconnu ⇒ `Err` (« type de fichier non reconnu ») (INV-K2).
- `formatVersion > FORMAT_VERSION` ⇒ `Err` (« version non prise en charge ») (INV-K3).
- Structure incohérente pour le `kind` ⇒ `Err` explicite (FR-010).
- Sinon ⇒ `Ok` avec l'**union étiquetée** correspondante, champs récents **défautés** (INV-K5).
- Pure ; ne consomme pas le RNG, n'utilise pas l'horloge.
- `deserializeState(json): Result<AppState>` (full) **conservé** (rétro-compat / tests existants).

## 5. Invariants transverses

- **Pur & déterministe** (INV-K4) : aucune fonction n'emploie `Math.random`/horloge/DOM ; à entrées
  égales, sorties égales.
- **Round-trip** (INV-K6) : `parseImport(serializeFull(s)).value.state` ≡ `s` ; idem config/data sur
  leurs champs.
- **Rejet sûr** (INV-K9) : un `Err` n'altère jamais l'état appelant.
- **Sérialisation partagée** : `config`/`data`/`full` réutilisent la **même** canonicalisation et la
  **même** constante `FORMAT_VERSION`.

## 6. Frontière UI (hors cœur — `src/ui`)

> Pour mémoire ; ces points **ne sont pas** dans le cœur (Principe IV).

- `buildConfigJson()` / `buildDataJson()` / `buildFullJson()` : `serialize*` sur `snapshot()`.
- `applyConfig` / `applyData` / dispatcher `applyImport` : **délèguent la fusion** aux helpers purs
  `mergeConfig`/`mergeData` (cœur, INV-K7), puis mettent à jour les stores ; **sans** toucher l'état
  en cas d'échec (INV-K9). La logique non-destructive n'est **pas** dupliquée dans l'UI.
- Génération du **nom de fichier horodaté** (`royalcookie-<kind>-YYYYMMDD-HHMMSS.json`) : utilise
  l'horloge ⇒ **UI uniquement**.
