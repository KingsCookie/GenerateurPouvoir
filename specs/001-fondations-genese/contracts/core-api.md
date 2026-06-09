# Contrat — API publique du cœur métier (`src/core`)

Le cœur est **pur** : aucune fonction n'accède au DOM, au réseau, à l'horloge ou à `Math.random`.
Toute l'aléatoire passe par un objet `Rng` **injecté**. Les signatures ci-dessous sont indicatives
(TypeScript) ; elles définissent le **contrat** que les tests vérifient.

## RNG

```ts
// Crée une nouvelle seed 64 bits. SEUL point d'entropie non déterministe (appelé par l'UI).
function createSeed(): bigint;

// Crée un générateur déterministe à partir d'une seed 64 bits.
function createRng(seed: bigint): Rng;

interface Rng {
  nextU64(): bigint;                    // prochain mot 64 bits
  nextFloat(): number;                  // [0,1)
  nextInt(maxExclusive: number): number;// [0, max) sans biais
  chance(pct: number): boolean;         // true avec une probabilité pct% (0..100)
  pick<T>(items: readonly T[]): T;      // choix uniforme
  pickWeighted<T>(items: readonly T[], weightOf: (t: T) => number): T; // tirage pondéré
}
```

- **Contrat de déterminisme** : `createRng(s)` puis la même séquence d'appels ⇒ même suite de résultats,
  indépendamment de la plateforme. `createSeed()` est exclu de ce contrat (entropie volontaire).

## Catalogues & paramètres

```ts
function defaultCatalog(): Catalog;        // 6 types, listes par défaut (D9)
function defaultParameters(): Parameters;  // batchSize=100, birthYear=0, powerChancePct=0, ...
```

## Genèse

```ts
// Génère le batch initial de façon déterministe. N'utilise QUE rng pour l'aléatoire.
function generateInitialPopulation(
  params: Parameters,
  catalog: Catalog,
  rng: Rng,
): Personne[];
```

- **Contrat** (cf. data-model INV-1..7) : effectif = `params.batchSize` ; chaque personne `age 0`,
  `dateNaissance ∈ birthYear` ; `params.powerChancePct` pilote la présence d'un pouvoir ; un pouvoir suit
  le gabarit (`AE/PE/PA/PR`) avec traits **pondérés**, `puissance`/`maitrise` ∈ [1,10] ; traits du pouvoir
  inscrits en ADN **actifs** à `params.initialResilience`.

## Pouvoir de genèse (gabarit de mutation forte)

```ts
function generateStrongMutationPower(catalog: Catalog, params: Parameters, rng: Rng): Pouvoir | null;
```

- Tire un gabarit pondéré ∈ {AE, PE, PA, PR} (AE majoritaire), puis les traits requis (pondérés).
- Renvoie `null` si un type requis est **vide** dans le catalogue (cf. spec Edge Cases) → individu sans pouvoir.
- `puissance` et `maitrise` = `rng.nextInt(10)+1`.
- Le `label` produit DOIT suivre le **format par gabarit** (FR-024), identique à celui de `powerLabel`
  (formateur partagé) : AE `{action} {élément}` · PE `{partie} en {état}` · PA `{ajout} sur {partie}` ·
  PR `{remplacement} à la place de {partie}`.

## Dérivés

```ts
function computeGeneration(birthYear: number): number; // floor(birthYear / 20)
function computeAge(birthYear: number, currentYear: number): number;
function powerLabel(power: Pouvoir, catalog: Catalog): string; // libellé formaté PAR GABARIT (FR-024)
```

## État & persistance

```ts
function createInitialState(params?: Partial<Parameters>): AppState;
function serializeState(state: AppState): string;          // JSON (kind:"full", formatVersion)
function deserializeState(json: string): Result<AppState>; // valide kind/version, sinon Err

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
```

- **Contrat** : `deserializeState(serializeState(s))` ⇒ `ok` et valeur **égale** à `s` (INV-6).
- Un JSON dont `kind`/`formatVersion` est invalide ⇒ `{ ok:false }` (l'UI n'altère pas l'état courant).

## Garanties transverses (vérifiées par tests Vitest)

- Aucune importation de `svelte`, du DOM, de `window`, `Date`, `crypto` ou `Math.random` dans `src/core`
  (hors `createSeed`, isolé et explicitement documenté).
- Pour une seed fixe, snapshots stables de population et de sérialisation.
