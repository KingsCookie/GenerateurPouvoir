# Contrats — API cœur Feature 007 (Sandbox & « make it real »)

API **pure** (`src/core`, sans Svelte/DOM/horloge/`Math.random`). Déterministe : à entrées égales (RNG
inclus), sorties égales. Ne mute **jamais** ses entrées (renvoie de nouveaux objets). L'UI consomme ces
fonctions et détient l'écran sandbox, les boutons et l'état d'interface du mode reproduction.

## 1. Journal d'événements (modèle)

```ts
type PopulationEvent =
  | { kind: 'birth';   year: number; personId: string }
  | { kind: 'death';   year: number; personId: string }
  | { kind: 'couple';  year: number; coupleId: string; memberIds: string[] }
  | { kind: 'divorce'; year: number; coupleId: string };

// AppState gagne :  history: PopulationEvent[]
// FORMAT_VERSION : 3
```

**Contrat émission** (modifications de fonctions existantes, **purs**) :
- `generateInitialPopulation(...)` : ajoute un `birth{year: birthYear}` par individu du batch.
- `tick(state, rng)` : ajoute `birth` (chaque naissance), `couple` (chaque formation), `divorce` (chaque
  dissolution) à `currentYear` ; renvoie l'état avec `history` étendu (ordre stable, déterministe).
- `kill(state, id, cause)` : ajoute `death{year: currentYear, personId:id}`.
- Aucune émission ne consomme le RNG ni l'horloge.

## 2. Sandbox — opérations pures

```ts
// Crée un individu AUTONOME (parents/enfants/conjoints vides) ; id fourni par l'appelant (déterministe).
function createPerson(state: AppState, draft: PersonDraft, newId: string): AppState;

// Clone les ATTRIBUTS d'un individu existant (sans liens de parenté) ; individu autonome.
function clonePerson(state: AppState, sourceId: string, newId: string): AppState;

// Édite des ATTRIBUTS d'un individu (jamais parents/enfants/conjoints).
function editPerson(state: AppState, id: string, patch: PersonPatch): AppState;

// Supprime un individu SANS descendant ; propage (conjoints/parents/couples). Err sinon.
function deletePerson(state: AppState, id: string): Result<AppState>;

// Reproduction manuelle : `count` ≥ 1 enfants depuis `parentIds` (≥ 1) via reproduce(), nés un jour
// aléatoire de `birthYear` ; pose la parenté ; émet les `birth`. Consomme le RNG (déterministe).
function manualReproduce(
  state: AppState, parentIds: string[], count: number, birthYear: number, rng: Rng,
): AppState;

// --- Édition directe du cycle de vie conjugal (BUG-001 volet B) — purs, sans RNG ---
// Forme un couple « actuel » entre deux individus distincts ; conjoints symétriques ; émet `couple{year}`.
function formCouple(state: AppState, aId: string, bId: string, year: number): Result<AppState>;
// Divorce/sépare un couple actif : conjoints → « ex » des deux côtés ; émet `divorce{year}` ; couple inactif.
function divorceCouple(state: AppState, coupleId: string, year: number): Result<AppState>;
// Dissout un lien conjugal (retour célibataire) : retrait symétrique + purge des événements couple/divorce.
function dissolveConjugalLink(state: AppState, coupleId: string): Result<AppState>;
```

**Contrats** :
- `createPerson`/`clonePerson` ⇒ nouvel individu avec `parents=[]`, `enfants=[]`, `conjoints=[]` (INV-S5) ;
  `clonePerson` copie espèce/genre/ADN/pouvoirs/notes/vivant, **pas** la parenté.
- `editPerson` applique `patch` aux seuls attributs (INV-S5) ; `id` introuvable ⇒ état inchangé (ou `Err`
  selon implémentation — recommandé : no-op sûr).
- `deletePerson` : `Err` si `enfants.length > 0` (« a des descendants ») ou id introuvable ; sinon `Ok`
  avec l'id retiré **partout** + propagation (INV-S6/S7).
- `manualReproduce` : `count < 1` ou `parentIds` vide ⇒ `state` inchangé (no-op) ; sinon `count` enfants
  via `reproduce` (Feature 2), `parents`/`enfants` posés, `history` étendu (INV-S4). **Pur** (RNG en
  paramètre). Ne fait **aucune** vérification d'appariement (sandbox = libre).
- `formCouple`/`divorceCouple`/`dissolveConjugalLink` : liens **symétriques** + `couples` cohérent ;
  émission/purge des événements `couple`/`divorce` pour rester cohérent avec `reconstructAtYear` ;
  **ne touchent jamais** `parents`/`enfants` (INV-S12). `Err` si introuvable / individus identiques /
  couple déjà existant (`formCouple`). Sandbox = libre (aucune contrainte d'appariement génétique).
- Toutes : **ne mutent pas** `state` (INV-S1).

## 3. Reconstruction historique (pure)

```ts
// Projette l'état à l'année `year` (∈ [birthYear, currentYear]) à partir de history. Ne mute pas l'entrée.
function reconstructAtYear(state: AppState, year: number): AppState;
```

**Contrat** : renvoie un `AppState` où `population`/`couples`/`conjoints`/`enfants` reflètent l'état **à
`year`** (INV-S9) : naissances ≤ year, décès ≤ year ⇒ décédé, couples formés ≤ year non dissous ≤ year
**et dont aucun membre n'est mort ≤ year** (un décès dissout le couple — §6.7 — sans émettre de
`divorce` ; les conjoints concernés apparaissent alors « ex »). `history` n'est pas altéré. Données sans
journal ⇒ repli sur `yearOf(dateNaissance)` pour la présence, état courant pour le reste (INV-S8).
**Pure**, sans RNG.

## 4. Invariants transverses

- **Pur & déterministe** (INV-S1/S10) : aucune fonction n'emploie `Math.random`/horloge/DOM ; RNG explicite.
- **Isolation** : les fonctions opèrent sur un `AppState` (la copie sandbox) ; elles n'ont **aucune** notion
  de « réel » — l'isolation est garantie par l'UI qui ne promeut qu'au « make it real ».
- **Rétro-compat** : `parseImport`/`deserializeState` défautent `history → []` ; `FORMAT_VERSION = 3`.

## 5. Frontière UI (hors cœur — `src/ui`)

> Pour mémoire ; ces points **ne sont pas** dans le cœur (Principe IV).

- `sandboxStore` : détient l'`AppState` **copié** + RNG forké ; expose `enterSandbox()` (snapshot de l'état
  réel), `resetSandbox()` (re-snapshot), `makeItReal()` (stores réels ← état sandbox ; `engineRng =
  createRngFromState(sandbox.rngState)`).
- **Mode reproduction manuelle** (état d'interface) : `startManualRepro()`, toggle au clic, `setChildCount`,
  `validate()` (→ `manualReproduce`, puis sortie du mode + vidage), `cancel()` (sortie sans effet),
  `reselectLastParents()` (ignore les absents). Le **jour aléatoire** de naissance vient du RNG forké.
- **Sélecteur d'année** : borne `[birthYear, currentYear]` ; l'affichage applique `reconstructAtYear`.
- **Page principale** : **retrait** des contrôles de reproduction manuelle (sélection + `reproduceSelected`).
- L'écran sandbox réutilise les rendus **liste/fiche/arbre** existants sur l'état (reconstruit) de la sandbox.
- **Formulaire création/édition (BUG-001 volet A)** : expose **tous** les attributs de `PersonDraft`
  (nom, espèce, genre, statut + `raisonDeces`, **ADN/traits**, **pouvoirs** avec profil sans-pouvoir /
  mutation forte / normale, notes). L'**édition du cycle de vie conjugal** (volet B) appelle les
  opérations cœur `formCouple`/`divorceCouple`/`dissolveConjugalLink` (à l'année sélectionnée).
- **Filtres (BUG-002)** : l'écran sandbox réutilise `FilterBar` + le moteur pur `filterPopulation`
  (Feature 4/5) appliqué à l'état **reconstruit** ; en mode reproduction manuelle, les parents sélectionnés
  masqués par un filtre **restent** sélectionnés (cohérence).
