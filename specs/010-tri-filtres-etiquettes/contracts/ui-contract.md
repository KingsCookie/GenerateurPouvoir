# Contrats — Feature 010 (filtres de trait, tri, étiquettes P/M)

Ajouts en **lecture seule** au cœur généalogie (filtre/tri purs) et à l'UI (états de session + affichage).
Rien n'est retiré ; non-régression `rsrc/DefUi.md` (SC-005).

## 1. Contrat cœur (`src/core/genealogy/filter.ts`, ré-exporté par `core/index.ts`)

```ts
// Présence de trait — nouvelle dimension de filtre (nullable ⇒ ignorée), ET avec les autres.
export type TraitPresence = 'none-active' | 'some-active' | 'some-inactive' | 'some-any' | null;

interface FilterCriteria { /* …existant… */ traitPresence: TraitPresence } // défaut null

// Tri — comparateur pur, déterministe, ne mute pas l'entrée.
export type SortKey = 'nom' | 'naissance' | 'age';
export type SortDir = 'asc' | 'desc';
export function sortPopulation(
  pop: readonly Personne[], key: SortKey | null, dir: SortDir, ctx: FilterContext,
): Personne[];
```

**Contrats** :
- `filterPopulation` applique `traitPresence` (si ≠ null) **en ET** avec les autres critères ; `null` sans
  effet. Comportement des autres dimensions **inchangé** (non-régression).
- `sortPopulation` : `key === null` ⇒ ordre d'entrée **préservé** ; sinon tri stable et **déterministe**
  (départage constant) ; `nom` insensible casse/accents ; `age` via `ctx.currentYear` ; `desc` = inverse.
  **Pure** (nouveau tableau, aucune mutation).

## 2. Contrat store d'interface

### `src/ui/stores/filters.ts` (critères partagés Population↔Sandbox)

```ts
emptyCriteria(): FilterCriteria // gagne traitPresence: null
setTraitPresence(p: TraitPresence): void  // mono-sélection : re-cliquer la valeur active ⇒ null
resetFilters(): void            // remet criteria (dont traitPresence) au défaut (existant)
```

### `src/ui/stores/ui.ts` (état de tri de session, **par liste**, non exporté)

```ts
listeSort: Writable<ListSort>   // Population
sbSort:    Writable<ListSort>   // Sandbox    ; ListSort = { key: SortKey|null; dir: SortDir }
cycleSort(list: 'population'|'sandbox', key: SortKey): void  // défaut→asc→desc→défaut
resetSort(list: 'population'|'sandbox'): void                // → { key: null, dir: 'asc' }
```

**Contrats** : états de session, **hors** `AppState`/export (Principe VI) ; chaque liste garde le sien
(FR-012). `cycleSort` sur une **autre** colonne repart en `asc`.

## 3. Contrat composants UI

### `FilterBar.svelte`
- Nouveau prop **`list: 'population' | 'sandbox'`** (défaut `'population'`).
- Section **Trait** : ajout d'un contrôle « présence » à **4 options** mono-sélection reliées à
  `criteria.traitPresence` via `setTraitPresence` (ergonomie des chips « Pouvoir » existants).
- Bouton **« Réinitialiser »** : `resetFilters()` **puis** `resetSort(list)` (FR-018).

### `ListeView.svelte` / `SandboxView.svelte`
- En-têtes **Nom / Date de naissance / Âge** : cliquables (souris + clavier), `aria-sort` reflétant l'état,
  indicateur ▲/▼ ; clic ⇒ `cycleSort(list, key)`.
- En-tête **Pouvoir(s)** : **non** cliquable, pas d'`aria-sort` actionnable.
- Pipeline : `filtered = filterPopulation(...)` → `sorted = sortPopulation(filtered, sort.key, sort.dir,
  ctx)` → `rows = sorted.map(buildListRow)` → `paginate(rows, page, size)`.
- `FilterBar` monté avec `list="population"` (Liste) / `list="sandbox"` (Sandbox).
- Étiquettes de pouvoir : rendu enrichi « P : x » / « M : y ».

## 4. Contrat view-model (`src/ui/lib/ficheViewModel.ts`)

```ts
buildListRow(person, catalog, currentYear): {
  // …existant… ;
  pouvoirs: { label: string; puissance: number; maitrise: number }[]  // était string[]
}
```

**Contrat** : fonction **pure** ; valeurs P/M = celles de la fiche (FR-014).

## 5. Non-régression (SC-005)

| Doit rester identique | Vérification |
|-----------------------|--------------|
| Filtres existants (nom, génération, espèce, statut, pouvoir, traits+portée) | `genealogy-filter.test.ts` inchangés au vert |
| Ordre par défaut de la liste | `sortPopulation(…, null, …)` = ordre `filterPopulation` |
| Recherche / pagination / navigation fiche | quickstart §non-régression |
| `rsrc/DefUi.md` (100 %) | dérouler le mapping |
| Export/import de l'état | inchangé (filtre/tri = interface) |
