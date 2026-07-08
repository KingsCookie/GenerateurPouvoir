# Contrats — 011-corrections-bugs-ui

Phase 1. Signatures cœur (pures, testables Vitest) et points de contrat UI. « Contrat » = surface
stable attendue par l'UI et les tests ; l'implémentation reste libre tant qu'elle respecte ces formes.

## Cœur (`src/core`) — signatures

### US1 — Consanguinité lignée directe (`repro/pairing.ts`)
```ts
// Nouveau : a est ascendant OU descendant direct de b, sur 2 niveaux (parent/grand-parent).
export function isDirectLineage(a: string, b: string, byId: Map<string, Personne>): boolean;
```
- Intégré dans `formCouples` : `if (!params.consanguinityAllowed && (areConsanguine(gid, other, byId) || isDirectLineage(gid, other, byId))) continue;`
- **Invariants** : symétrique (`isDirectLineage(a,b) === isDirectLineage(b,a)`) ; ne dépend pas de
  l'ordre ; s'applique à chaque paire du groupe.

### US2 — Date de portée (`birth/reproduce.ts`, `time/tick.ts`)
```ts
export interface ReproduceOptions {
  childId: string;
  birthYear: number;
  birthDayOfYear?: number; // NOUVEAU : jour partagé de la portée ; si absent, tiré via rng
}
```
- `tick.reproduceCouple` : `const day = rng.nextInt(365)` **une fois** avant la boucle ; passé à
  chaque `reproduce(..., { childId, birthYear, birthDayOfYear: day })`.
- **Invariant** : tous les enfants d'une portée ont `dateNaissance` identique.

### US3 — Génération relative (`genesis/derived.ts`, `genealogy/filter.ts`)
```ts
export function computeGeneration(birthYear: number, genesisYear: number): number; // floor((by - gy)/20)
export interface FilterContext { currentYear: number; genesisYear: number; } // + genesisYear
```
- **Invariants** : `computeGeneration(genesisYear, genesisYear) === 0` ; +1 toutes les 20 ans ;
  valeurs négatives possibles pour naissances antérieures à la genèse.

### US3 — Sérialisation (`state/serialize.ts`, `state/appState.ts`)
```ts
export const FORMAT_VERSION = 4; // 3 → 4
interface AppState { /* … */ genesisYear: number; } // NOUVEAU
```
- `serializeData` / `serializeState` incluent `genesisYear`.
- `deserializeData` / `deserializeState` : si `genesisYear` absent ⇒
  `genesisYear = min(population.birthYear) ?? parameters.birthYear ?? 0`.
- **Invariant** : import v4 → export v4 idempotent ; import v3 → numérotation cohérente via fallback.

### US8 — Formule de duplication (`powers/traitsToPowers.ts`, `params/parameters.ts`)
```ts
// Avant : rng.chance(ref.resilience / params.duplicationD)
// Après : rng.chance(Math.min(100, Math.max(0, ref.resilience * params.duplicationD)))
// parameters.ts : duplicationD (multiplicateur, ≥ 0), défaut 0.25
```
- **Invariants** : proba ∈ [0,100] ; `D = 0` ⇒ jamais de duplication ; `résilience · D` sinon.

### US9 — Régénération (fonction **cœur pure**, `src/core/powers/regenerate.ts`)
```ts
// Cœur pur (Principe IV) — testable Vitest sans UI :
export function regeneratePowers(
  person: Personne,
  parents: Personne[],
  catalog: Catalog,
  params: Parameters,
  rng: Rng,
): { adn: ADN; pouvoirs: Pouvoir[] };
// Compose :
//   const d = derivePowersFromTraits(person.adn, catalog, params, rng); // §6.4 seul (duplications + K)
//   const pouvoirs = d.pouvoirs.map((pw, i) => ({ ...pw, ...inheritStats(i, parents, params, rng) }));
//   return { adn: d.adn, pouvoirs };
// inheritStats : §7.2 si parents avec pouvoirs, sinon cas A (1–10).
```
- Exportée via `src/core/index.ts`. Le store `sbRegeneratePowers(id)` **ne fait que l'appeler**
  (récupère `person` + `parents` depuis l'état, passe `sbRng`, réécrit `adn`/`pouvoirs`).
- **Invariants** : aucun tirage de cas (« sans pouvoir »/« mutation forte ») ; K enrichit l'ADN
  retourné ; déterministe pour une séquence de seed donnée ; **aucune dépendance UI/DOM**.

### US10 — P/M non bornées
- **Cœur** : `inheritStats` inchangé (seul cas A borné). Aucun contrat cœur modifié.

## UI (`src/ui`) — points de contrat

### `stores/sandboxStore.ts`
```ts
export function sbRegeneratePowers(id: string): void;         // US9 — appelle regeneratePowers(cœur), consomme sbRng
export function sbDerivePreview(adn: ADN): { pouvoirs: Pouvoir[]; adn: ADN }; // US7 — seed d'aperçu STABLE (pas sbRng)
```
- `sbDerivePreview` construit un `Rng` à partir d'une **seed stable** dérivée de (seed session +
  triplets `(traitId, active, resilience)` triés) ; ne consomme pas `sbRng`.

### `components/SandboxPersonForm.svelte`
- US7 : bloc réactif `$: preview = sbDerivePreview({ traits: fAdn })` (ou équivalent) mettant à jour
  l'affichage de l'aperçu et l'ADN montré à chaque changement de `fAdn` ; à l'enregistrement, l'état
  persisté correspond à l'aperçu.
- US10 : `setPuissance`/`setMaitrise` → `Math.floor(Number.isFinite(v) ? v : 0)` **sans** clamp [1,10] ;
  retirer aussi `min`/`max` des `<input type="number">` P/M (ou les rendre indicatifs).

### `views/SandboxView.svelte`
- US9 : bouton « Régénérer » par ligne, à côté d'« Éditer »/« Cloner »/« Supprimer » → `sbRegeneratePowers(id)`.
- US4 : étiquettes `P {puissance}` / `M {maitrise}`.

### `views/ListeView.svelte`
- US4 : étiquettes `P {puissance}` / `M {maitrise}` (sans « : »).

### `components/FilterBar.svelte`
- US5 : la section des filtres de trait occupe une **ligne dédiée** (flex-basis 100 % / saut de ligne).

### `components/StateIO.svelte`
- US6 : `a.download = \`PowerGenerator_${kind}_${timestamp()}.json\``.

## Tests (Vitest, seed fixe) — attendus

| Test | US | Vérifie |
|---|---|---|
| `genealogy-consanguinity.test.ts` | US1 | aucun couple parent↔enfant / grand-parent↔petit-enfant si interdit ; autorisé si permis |
| `litter-date.test.ts` | US2 | enfants d'une portée = même date ; portées distinctes = dates propres |
| `generation-origin.test.ts` | US3 | génération 0 à l'année de genèse (ex. 1900) ; +1 / 20 ans ; fallback import |
| `serialize` (maj) | US3 | round-trip v4 ; import v3 → fallback genesisYear |
| `duplication-formula.test.ts` | US8 | fréquence ≈ `min(100, résilience·D)` ; D=0 ⇒ 0 ; défaut 0.25 |
| `regenerate-powers.test.ts` | US9 | régé = §6.4 seul ; P/M §7.2 avec parents, [1,10] sans ; K dans l'ADN |
| `inheritStats`/P/M (maj) | US10 | moyenne parentale peut donner > 10 (non borné) ; cas A borné |
