# Contrats du cœur — Généalogie & exploration (`src/core/genealogy/`)

> Fonctions **pures et déterministes** (Principe I/IV), sans Svelte/DOM/Date/crypto/Math.random.
> Toutes prennent leurs entrées en paramètre et **ne les modifient pas** (INV-G6).

## `buildGenealogyTree(rootId, byId, depth, ctx): TreeNode`

- **Entrées** :
  - `rootId: string` — individu centre.
  - `byId: Map<string, Personne>` — index de la population (lecture seule).
  - `depth: number` — profondeur (≥ 1, **sans plafond**).
  - `ctx: { currentYear: number }` — pour calculer l'âge des nœuds.
- **Sortie** : `TreeNode` (cf. data-model) avec `ancestors` (≤ depth niveaux via `parents`),
  `descendants` (≤ depth niveaux via `enfants`) et `unions`.
- **Contrat** :
  - Borné par `depth` ; **termine** même en présence de parentés partagées (consanguinité).
  - Un individu atteignable par plusieurs chemins est **reconstruit à chaque emplacement** (pas de
    déduplication ; INV-G1).
  - `unions` : pour chaque conjoint (actuel/ex) du nœud, expose les **enfants communs** (enfants
    dont `parents` contient à la fois le nœud **et** ce conjoint) ; **exclut** les autres enfants du
    conjoint et **n'inclut pas** les parents du conjoint (INV-G2).
  - Ordre de `ancestors`, `descendants`, `unions[].enfantsCommuns` : **trié par date de naissance
    puis id** (INV-G3).
  - `rootId` absent de `byId` ⇒ comportement documenté (retourne un nœud minimal vide **ou** lève ;
    à figer en implémentation et tester).
- **Pureté** : `byId` et les `Personne` ne sont pas modifiés (INV-G6).

## `filterPopulation(pop, criteria, ctx): Personne[]`

- **Entrées** :
  - `pop: Personne[]` — population (lecture seule).
  - `criteria: FilterCriteria` (cf. data-model).
  - `ctx: { currentYear: number }`.
- **Sortie** : sous-ensemble de `pop` (mêmes références), **trié par date de naissance puis id**.
- **Contrat (INV-G4)** :
  - Dimensions vides (`Set` vide, `nameQuery` vide, `powerPresence === null`) ⇒ **sans effet**.
  - **OU** au sein d'une dimension ; **ET** entre dimensions renseignées.
  - `nameQuery` : correspondance **sous-chaîne** sur le nom **normalisé** (minuscule + diacritiques
    retirés).
  - `generations` : `computeGeneration(annéeNaissance) ∈ criteria.generations`.
  - `especeIds` : `personne.especeId ∈ criteria.especeIds`.
  - `traitIds` selon `traitScope` :
    - `actifs` : au moins un `traitId` présent **et `active`** dans l'ADN ;
    - `inactifs` : au moins un `traitId` présent **et non `active`** ;
    - `tous` : au moins un `traitId` présent (quel que soit l'état).
  - `powerPresence` : `any` ⇒ `pouvoirs.length > 0` ; `none` ⇒ `pouvoirs.length === 0`.
  - `statuses` : `vivant` ⇒ `personne.vivant === true` ; `décédé` ⇒ `false`.
- **Pureté** : `pop` non modifié (nouveau tableau ; INV-G6).

## `lastGeneration(pop): number | null`

- **Entrée** : `pop: Personne[]`.
- **Sortie** : plus grande génération présente = `max(computeGeneration(annéeNaissance))` ; `null`
  si `pop` est vide.
- **Usage** : défaut dynamique du filtre génération (FR-011a) côté UI.

## Réutilisations (cœur existant)

- `computeGeneration(birthYear): number` — tranche de 20 ans (`src/core/genesis/derived.ts`).
- `computeAge(birthYear, currentYear): number` — âge.
- `powerLabel(pouvoir, catalog): string` — libellé de pouvoir.

## Notes UI (hors cœur, pour mémoire)

- Le **choix des champs** affichés par case (fiche : nom + pouvoirs ; page dédiée : nom + âge +
  pouvoirs) est une responsabilité **UI** (`treeViewModel.ts`), pas du cœur.
- Les **stores** de filtres (persistance session) et de mode d'affichage sont de l'**état
  d'interface**, **non** exporté (Principe VI).
