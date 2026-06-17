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

## 2. Extraction (pure)

```ts
// Sélectionne la configuration depuis un état complet (immutables).
function extractConfig(state: AppState): ConfigState;

// Sélectionne les données générées depuis un état complet (immutables).
function extractData(state: AppState): DataState;
```

**Contrat** : ne mutent pas `state` ; `extractConfig` ne lit que parameters/catalog/especes,
`extractData` que population/currentYear/couples/rngState (INV-K4).

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
- `applyConfig` / `applyData` / dispatcher `applyImport` : appliquent `ParsedImport` aux stores,
  **partiellement** (INV-K7) et **sans** toucher l'état en cas d'échec (INV-K9).
- Génération du **nom de fichier horodaté** (`royalcookie-<kind>-YYYYMMDD-HHMMSS.json`) : utilise
  l'horloge ⇒ **UI uniquement**.
