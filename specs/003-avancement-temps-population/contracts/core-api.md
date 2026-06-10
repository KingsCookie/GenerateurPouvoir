# Contrat — API publique de la simulation temporelle (`src/core`)

Le cœur reste **pur** : aucune fonction n'accède au DOM, réseau, horloge ou `Math.random`. Toute l'aléatoire
passe par le `Rng` **injecté**. Signatures **indicatives** (TypeScript) définissant le contrat vérifié par
les tests (`tests/unit/*.test.ts`).

## RNG — sérialisation d'état (FR-021)

```ts
interface Rng {
  // … (existant : nextU64, nextFloat, nextInt, chance, pick, pickWeighted, shuffle)
  getState(): string[]; // 4 mots xoshiro256** en décimal (capture de l'état courant)
}

function createRngFromState(state: string[]): Rng; // restitue un Rng à l'état exact
```

- **Contrat** : `createRngFromState(r.getState())` produit un Rng dont la **suite** est identique à celle de
  `r` à partir de ce point. `getState` ne consomme **pas** d'aléatoire.

## Gaussienne de reproduction (§9.4)

```ts
// Probabilité (%) de vouloir se reproduire à un âge donné, selon les paramètres d'espèce.
function reproProbability(age: number, espece: Espece): number;
```

- **Contrat** : `0` si `age < reproStartAge` ou `age > reproEndAge` ; sinon
  `reproPeakPct × exp(−((age − reproPeakAge)²) / (2 × reproSlope²))`. Pure, déterministe, ∈ [0, reproPeakPct].

## Portée (§6.6.2)

```ts
function litterSize(espece: Espece, rng: Rng): number;
```

- **Contrat** : part de `litterMin` ; tant que `n < litterMax`, tire `chance(litterExtraPct)` ⇒ `n+1` ;
  s'arrête au premier échec ou à `litterMax`. Résultat ∈ `[litterMin, litterMax]` (INV-3).

## Appariement (§6.6, §6.6.1)

```ts
interface PairingResult { couples: Couple[]; unpaired: string[] } // unpaired = re-candidats l'an prochain

function formCouples(
  candidateIds: string[],     // volontaires (déjà filtrés), ordre stable
  population: Personne[],
  params: Parameters,         // consanguinityAllowed
  especeById: Map<string, Espece>,
  rng: Rng,
  nextCoupleId: () => string,
): PairingResult;
```

- **Contrat** : mélange déterministe (`rng.shuffle`) ; forme des groupes de `groupSize` **compatibles** —
  **même espèce** (INV-5) et **non consanguins** si `!consanguinityAllowed` (mêmes parents OU grands-parents,
  INV-4). Le **genre n'intervient pas** en F3 (décision A1, reporté). Groupe complet ⇒ `Couple` (membres en
  conjoints `actuel`). Sinon ids reportés dans `unpaired` (FR-008). Déterministe.

## Tick annuel & avance (§6.5, §6.6)

```ts
// Applique UN tick annuel déterministe ; renvoie le nouvel état (immutable).
function tick(state: AppState, rng: Rng): AppState;

// Applique X ticks (X ≥ 1) ; met à jour currentYear et rngState dans l'état renvoyé.
function advanceYears(state: AppState, years: number, rng: Rng): AppState;
```

- **Contrat** (cf. data-model INV-1..10) : ordre **fixe** divorces → candidats/volonté → appariement →
  reproduction (nouveaux couples puis couples existants, portée via `reproduce` F2) → `currentYear += 1`.
  Tout l'aléatoire via `rng` ; à `rngState`+état+paramètres identiques ⇒ résultat **identique** (INV-1).
  `advanceYears` enchaîne `tick` `years` fois. L'appelant **persiste** `rng.getState()` dans
  `state.rngState` (FR-021).

## Mort manuelle (§6.7)

```ts
type KillResult = { ok: true; state: AppState } | { ok: false; error: string };

function kill(state: AppState, personId: string, cause: string): KillResult;
```

- **Contrat** : `cause` vide/espaces ⇒ `{ ok:false }` (aucune mutation). Sinon `vivant=false`,
  `raisonDeces=cause`, dissout le couple éventuel (conjoints `actuel`→`ex`). Un mort est exclu des candidats
  et des couples ultérieurs (INV-8).

## Garanties transverses (tests Vitest)

- Aucune importation de `svelte`, DOM, `window`, `Date`, `crypto`, `Math.random` dans `src/core` (la garde
  de pureté F1 couvre `repro/`, `time/`, `life/`). `Math.exp` (gaussienne) est autorisé (pur, déterministe).
- Pour un même `rngState` : tick, appariement, portées et enfants **stables** ; continuation après
  round-trip identique (INV-10).
