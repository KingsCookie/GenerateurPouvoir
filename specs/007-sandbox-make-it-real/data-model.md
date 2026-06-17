# Modèle de données — Feature 007 (Sandbox & « make it real »)

Réutilise `AppState`, `Personne`, `Couple`, `Conjoint` (Features 1-6). Seules les **additions** sont
décrites. Types cœur (purs) dans `src/core`.

## Entités existantes réutilisées (rappel)

- **`AppState`** `{ formatVersion, kind:'full', parameters, catalog, especes, population, currentYear,
  couples, rngState }`.
- **`Personne`** `{ id, nom, especeId, genreId, dateNaissance, vivant, raisonDeces, parents, enfants,
  conjoints: Conjoint[], adn, pouvoirs, notes }`.
- **`Conjoint`** `{ id, statut:'actuel'|'ex' }` ; **`Couple`** `{ id, memberIds, reproPct }`.

## Nouveau — Journal d'événements daté

```ts
// src/core/model/event.ts
export type PopulationEvent =
  | { kind: 'birth';   year: number; personId: string }
  | { kind: 'death';   year: number; personId: string }
  | { kind: 'couple';  year: number; coupleId: string; memberIds: string[] }
  | { kind: 'divorce'; year: number; coupleId: string };
```

- Ajout à `AppState` : **`history: PopulationEvent[]`** (ordre d'émission ; année croissante de fait).
- **`FORMAT_VERSION` : 2 → 3.** Rétro-compat : `history` absent à l'import ⇒ `[]` (INV-S8).
- Émetteurs (estampillent l'année) :
  - `generateInitialPopulation` → `birth` (année de genèse `birthYear`) pour chaque individu du batch ;
  - `tick` → `birth` (naissances de l'année), `couple` (formations), `divorce` (dissolutions), à `currentYear` ;
  - `kill` → `death` à `currentYear` ;
  - `manualReproduce` (sandbox) → `birth` à `birthYear` (année sélectionnée).

## Nouveau — Brouillon d'individu (création/édition)

```ts
// Sous-ensemble ÉDITABLE des attributs d'une Personne (jamais parents/enfants/conjoints).
// NB (BUG-001 volet A) : `adn`, `pouvoirs` et `raisonDeces` font partie du brouillon ÉDITABLE ; l'UI DOIT
// tous les exposer (formulaire), y compris le profil sans-pouvoir / mutation forte / normale.
export type PersonDraft = Pick<
  Personne,
  'nom' | 'especeId' | 'genreId' | 'dateNaissance' | 'vivant' | 'raisonDeces' | 'adn' | 'pouvoirs' | 'notes'
>;
export type PersonPatch = Partial<PersonDraft>;
```

## Nouveau — Édition directe du cycle de vie conjugal (BUG-001 volet B)

Le **cycle de vie conjugal** (conjoints/couples) n'est **pas** dans `PersonDraft`/`PersonPatch`
(INV-S5 préservé) : il est géré par des **opérations dédiées pures**, distinctes de `editPerson`, qui
maintiennent la **symétrie** des liens et émettent/retirent les événements `couple`/`divorce` à l'année
sélectionnée (cohérence reconstruction, INV-S9).

```ts
// Forme un couple « actuel » entre deux individus distincts (conjoints symétriques) ; émet `couple{year}`.
function formCouple(state: AppState, aId: string, bId: string, year: number): Result<AppState>;
// Divorce/sépare un couple actif : conjoints → « ex » des deux côtés ; émet `divorce{year}` ; couple inactif.
function divorceCouple(state: AppState, coupleId: string, year: number): Result<AppState>;
// Dissout totalement un lien conjugal (retour célibataire) : retire le lien symétrique + purge les
// événements `couple`/`divorce` du couple concerné (le lien n'a jamais existé pour la reconstruction).
function dissolveConjugalLink(state: AppState, coupleId: string): Result<AppState>;
```

## Couche UI — état sandbox (non cœur, non persisté)

- **État sandbox** : un `AppState` **copié** (snapshot de l'état réel) + une instance RNG forkée.
- **Session de reproduction manuelle** (état d'interface) :
  `{ active: boolean; selected: Set<string>; childCount: number; lastParents: string[] }`.
- **Année sélectionnée** : `selectedYear ∈ [birthYear, currentYear]` (lentille d'affichage + année de
  naissance des enfants de reproduction manuelle).

## Invariants

- **INV-S1 (isolation)** : aucune fonction sandbox ne mute l'`AppState` d'entrée ; elles renvoient un
  **nouvel** état. Les stores réels ne changent **que** lors de « make it real ».
- **INV-S2 (make it real = transfert)** : après promotion, l'état réel **égale** l'état sandbox (population,
  couples, année, `rngState`, `history`) ; `engineRng` restauré depuis `rngState` (continuation, pas de rejeu).
- **INV-S3 (reset)** : après reset, l'état sandbox **égale** l'état réel courant (deep-equal).
- **INV-S4 (repro manuelle)** : `manualReproduce` produit **exactement `count` ≥ 1** enfants depuis les
  parents donnés via `reproduce` ; chaque enfant a `parents = parentIds`, chaque parent reçoit l'enfant
  dans `enfants` ; `count < 1` ou `parentIds` vide ⇒ **no-op**/erreur (pas de naissance).
- **INV-S5 (autonomie)** : un individu issu de `createPerson`/`clonePerson` a `parents=[]`, `enfants=[]`,
  `conjoints=[]` ; `clonePerson` ne copie **aucun** lien de parenté ; `editPerson` ne modifie **jamais**
  `parents`/`enfants`/`conjoints`.
- **INV-S6 (suppression)** : `deletePerson` **refuse** si `enfants.length > 0` ; sinon l'id **n'apparaît
  plus nulle part** (population, `parents`/`enfants` d'autrui, `conjoints` d'autrui, `couples`).
- **INV-S7 (propagation suppression)** : à la suppression, chaque **parent** perd l'id dans `enfants` ;
  chaque **conjoint** perd le lien vers l'id (s'il n'a plus de conjoint `actuel`, il redevient célibataire) ;
  le **couple** contenant l'id est dissous (ou réduit) — aucun lien pendant (INV-S6).
- **INV-S8 (rétro-compat journal)** : un état/fichier sans `history` est accepté avec `history = []` ; la
  reconstruction d'années passées **dégrade** alors (l'état courant reste exact).
- **INV-S9 (reconstruction)** : `reconstructAtYear(state, Y)` est **pure** et renvoie un `AppState` projeté :
  individus avec `birth.year ≤ Y` (vivant ⇔ aucun `death.year ≤ Y`), couples `couple.year ≤ Y` sans
  `divorce.year ≤ Y` **et dont aucun membre n'a `death.year ≤ Y`** (un décès dissout le couple — §6.7 —
  sans émettre de `divorce`), `enfants`/`conjoints` filtrés sur les individus/relations visibles à `Y`. Ne
  mute pas l'entrée ; n'altère pas `history`.
- **INV-S10 (déterminisme)** : à seed fixe + mêmes actions sandbox, l'état résultant (et après « make it
  real ») est strictement reproductible (Principe I).
- **INV-S11 (année)** : `selectedYear` est borné à `[birthYear, currentYear]` ; un enfant de reproduction
  manuelle naît un **jour aléatoire** (RNG) de `selectedYear`.
- **INV-S12 (cycle de vie conjugal — BUG-001 volet B)** : `formCouple`/`divorceCouple`/`dissolveConjugalLink`
  maintiennent des liens **symétriques** (si A a B en `actuel`/`ex`, alors B a A au même statut) et un
  `couples` cohérent (un couple « actuel » existe ⇔ ses deux membres se référencent en `actuel`). Elles
  émettent (`formCouple`→`couple`, `divorceCouple`→`divorce`) ou **purgent** (`dissolveConjugalLink`) les
  événements correspondants pour rester cohérentes avec `reconstructAtYear` (INV-S9). Elles **ne touchent
  jamais** `parents`/`enfants` (la parenté reste réservée à la reproduction, FR-011b). **Pures** (INV-S1),
  sans RNG. `Err` si individu/couple introuvable, individus identiques, ou couple déjà existant (`formCouple`).

> **Bugfix**: 2026-06-17 — BUG-001 — Volet A : note sur `PersonDraft` (ADN/pouvoirs/`raisonDeces` éditables,
> à exposer dans l'UI). Volet B : ajout des opérations conjugales dédiées + INV-S12 (INV-S5 inchangé : la
> parenté et les conjoints restent hors `editPerson`).

## Reconstruction — règles de projection (détail INV-S9)

À l'année `Y` :
- **Individu visible** ⇔ il existe un `birth(year ≤ Y)` pour lui (les individus sans événement `birth` —
  données héritées sans journal — sont considérés présents si `yearOf(dateNaissance) ≤ Y`, repli INV-S8).
- **Vivant à `Y`** ⇔ aucun `death(year ≤ Y)`. Sinon décédé (avec `raisonDeces` courant).
- **Couple actif à `Y`** ⇔ `couple(year ≤ Y)`, **sans** `divorce(year ≤ Y)` pour ce `coupleId`, **et**
  aucun de ses membres n'a `death(year ≤ Y)` (le décès d'un membre dissout le couple, §6.7 — `kill`
  n'émet pas de `divorce`). Les conjoints d'un couple ainsi dissous par décès apparaissent **« ex »** à `Y`.
- **`enfants` d'un individu à `Y`** = enfants dont l'événement `birth.year ≤ Y`.
- **`conjoints` à `Y`** : reconstruits depuis les événements `couple`/`divorce` (actuel si couple actif à
  `Y`, ex si dissous avant `Y`).
