# Tasks: Filtres de trait, tri par colonne & étiquettes de pouvoir enrichies

**Feature** : `010-tri-filtres-etiquettes` | **Spec** : [spec.md](./spec.md) | **Plan** : [plan.md](./plan.md)

**Input** : plan.md, spec.md (US1 P1, US2 P2, US3 P3), research.md (D1–D4), data-model.md,
contracts/ui-contract.md, quickstart.md.

**Périmètre** : 3 améliorations des **listes** Population + Sandbox (barre de filtres et `filterPopulation`
partagés). Logique de **filtrage/tri** ajoutée au **cœur** généalogie (pure, déterministe → **tests
Vitest obligatoires**, Principe V) ; états filtre/tri = **interface** (session), hors export (Principe VI) ;
génétique/hérédité/simulation **inchangées**.

**Fichiers** — cœur : `src/core/genealogy/filter.ts`, `src/core/genealogy/index.ts`, `src/core/index.ts` ·
UI : `src/ui/stores/filters.ts`, `src/ui/stores/ui.ts`, `src/ui/components/FilterBar.svelte`,
`src/ui/views/ListeView.svelte`, `src/ui/views/SandboxView.svelte`, `src/ui/lib/ficheViewModel.ts` ·
tests : `tests/unit/genealogy-filter.test.ts`, `tests/unit/genealogy-sort.test.ts` (NEW),
`tests/unit/fiche-vm.test.ts`.

**Convention** : `[P]` = parallélisable (fichiers distincts, sans dépendance bloquante). Les tâches sur un
**même fichier** sont séquentielles.

---

## Phase 1 — Setup

- [x] T001 Vérifier l'état de départ : `npm run test` vert (baseline 257) et repérer les 2 constructeurs de
  `FilterCriteria` à mettre à jour quand le champ `traitPresence` deviendra requis (`emptyCriteria` de
  `src/ui/stores/filters.ts` et le helper `emptyCriteria` de `tests/unit/genealogy-filter.test.ts`).

**Checkpoint** : baseline connue, consommateurs de `FilterCriteria` identifiés.

---

## Phase 2 — Foundational (cœur pur : critère de présence + comparateur de tri)

> Bloquant pour US1 (présence) et US2 (tri) : l'UI consomme ces fonctions du cœur. À faire avant le câblage
> UI. TDD léger : écrire les tests cœur en même temps que la logique.

- [x] T002 Ajouter le **critère de présence de trait** dans `src/core/genealogy/filter.ts` : type
  `TraitPresence = 'none-active' | 'some-active' | 'some-inactive' | 'some-any' | null`, champ
  `traitPresence: TraitPresence` dans `FilterCriteria`, prédicat pur `matchTraitPresence(p, presence)` et
  branchement dans `filterPopulation` (ET, `null` = ignoré) — cf. data-model §1.
- [x] T003 Ajouter le **comparateur de tri** dans `src/core/genealogy/filter.ts` : types
  `SortKey = 'nom' | 'naissance' | 'age'`, `SortDir = 'asc' | 'desc'`, fonction pure
  `sortPopulation(pop, key, dir, ctx)` réutilisant `normalize` (nom) et `byBirthThenId` (départage stable) ;
  `key === null` ⇒ copie inchangée ; `age` via `ctx.currentYear` ; ne mute pas l'entrée — cf. data-model §3.
- [x] T004 Exposer les nouveautés via les façades : `export type { TraitPresence, SortKey, SortDir }` et
  `export { sortPopulation }` dans `src/core/genealogy/index.ts`, propagés par `src/core/index.ts`.
- [x] T005 [P] Tests présence dans `tests/unit/genealogy-filter.test.ts` : mettre à jour le helper
  `emptyCriteria` (`traitPresence: null`) puis couvrir les 4 valeurs sur ADN **vide**, **tous actifs**,
  **tous inactifs**, **mixte** ; vérifier la combinaison ET avec une autre dimension et l'indépendance
  vis-à-vis de `traitIds`/`traitScope`.
- [x] T006 [P] Tests tri dans `tests/unit/genealogy-sort.test.ts` (NEW) : `nom`/`naissance`/`age` ×
  `asc`/`desc`, `key=null` = ordre par défaut (identique à `filterPopulation`), **stabilité** du départage
  (deux individus égaux), non-mutation de l'entrée.

**Checkpoint** : cœur prêt et **testé** (déterministe) ; `filterPopulation`/`sortPopulation` utilisables par l'UI.

---

## Phase 3 — User Story 1 : Filtres de présence de trait (P1) 🎯 MVP

**Goal** : rendre les 4 filtres de présence sélectionnables (mono) en Population **et** Sandbox.

**Independent Test** : activer chaque option et vérifier le sous-ensemble (compteur N/total) ; identique
dans les deux vues ; re-clic désactive.

- [x] T007 [US1] Étendre le store de filtres `src/ui/stores/filters.ts` : `traitPresence: null` dans
  `emptyCriteria` ; setter `setTraitPresence(p: TraitPresence)` **mono-sélection** (re-cliquer la valeur
  active ⇒ `null`), sur le modèle de `setPowerPresence`. `resetFilters` remet déjà `traitPresence` (via
  `emptyCriteria`).
- [x] T008 [US1] Ajouter le contrôle **« présence de trait »** dans la section Trait de
  `src/ui/components/FilterBar.svelte` : 4 options (« aucun trait actif », « au moins un trait actif »,
  « au moins un trait inactif », « au moins un trait ») liées à `$criteria.traitPresence` via
  `setTraitPresence`, ergonomie chips (mono, sélection nette BUG-001), coexistant avec la portée
  actifs/inactifs/tous et les traits précis.

**Checkpoint US1** : les deux listes filtrent par présence (mono, désactivable), en ET avec les autres
critères. **MVP livrable.**

---

## Phase 4 — User Story 2 : Tri par clic sur les en-têtes de colonnes (P2)

**Goal** : tri tri-état par en-tête (Nom/Date/Âge ; Pouvoir(s) non triable), état propre à chaque liste.

**Independent Test** : cycle défaut→asc→desc→défaut sur chaque colonne triable ; Pouvoir(s) inerte ;
Population et Sandbox indépendantes.

- [x] T009 [US2] Ajouter l'**état de tri de session par liste** dans `src/ui/stores/ui.ts` :
  **importer** `SortKey`/`SortDir` **depuis `../../core/index.js`** (définis par T003/T004 — **ne pas les
  redéfinir**, M1) ; ne définir localement que `ListSort = { key: SortKey | null; dir: SortDir }` ; stores
  `listeSort` et `sbSort` (défaut `{ key: null, dir: 'asc' }`), `cycleSort(list, key)`
  (défaut→asc→desc→défaut ; autre colonne ⇒ `asc`) et `resetSort(list)`. **Non** persistés, **non**
  exportés — cf. data-model §2.
- [x] T010 [US2] `src/ui/components/FilterBar.svelte` : ajouter le prop **`list: 'population' | 'sandbox'`**
  (défaut `'population'`) et faire appeler à « Réinitialiser » `resetFilters()` **puis** `resetSort(list)`
  (FR-018).
- [x] T011 [US2] `src/ui/views/ListeView.svelte` : monter `<FilterBar list="population" />` ; insérer
  `sortPopulation(filtered, $listeSort.key, $listeSort.dir, { currentYear: $currentYear })` **entre**
  `filterPopulation` et `paginate` ; rendre les en-têtes Nom/Date/Âge cliquables (souris + clavier) avec
  `aria-sort` et indicateur ▲/▼, `on:click={() => cycleSort('population', key)}` ; en-tête « Pouvoir(s) »
  **non** cliquable.
- [x] T012 [US2] `src/ui/views/SandboxView.svelte` : idem avec `list="sandbox"`, `$sbSort` et
  `cycleSort('sandbox', …)` ; tri inséré entre `filterPopulation` et `paginate` (contexte `$sandboxYear`) ;
  en-têtes triables `aria-sort` (Nom/Naissance/Âge), Pouvoir(s) et Actions non triables.

**Checkpoint US2** : tri tri-état opérationnel et **indépendant** par liste, appliqué à l'ensemble filtré,
survivant aux changements de filtres/temps.

---

## Phase 5 — User Story 3 : Étiquettes de pouvoir enrichies (P/M) (P3)

**Goal** : chaque étiquette de pouvoir en liste affiche « P : x » / « M : y ».

**Independent Test** : comparer une étiquette à la fiche du même individu ; sans pouvoir ⇒ « — ».

- [x] T013 [US3] `src/ui/lib/ficheViewModel.ts` : `buildListRow` renvoie
  `pouvoirs: { label; puissance; maitrise }[]` (au lieu de `string[]`), valeurs issues de
  `person.pouvoirs` + `powerLabel` — cf. data-model §4.
- [x] T014 [US3] Mettre à jour l'assertion de forme dans `tests/unit/fiche-vm.test.ts` (le test
  `buildListRow` attend désormais des objets `{ label, puissance, maitrise }`, valeurs = fiche).
- [x] T015 [US3] Rendu des étiquettes enrichies dans `src/ui/views/ListeView.svelte` **et**
  `src/ui/views/SandboxView.svelte` : chaque chip affiche `{label}` + « P : {puissance} » + « M : {maitrise} »
  (mentions mono, mise en page maîtrisée) ; individu sans pouvoir ⇒ « — » inchangé.

**Checkpoint US3** : P/M visibles et cohérents avec la fiche, en Population et Sandbox.

---

## Phase 6 — Polish & non-régression transverse

- [x] T016 [P] Dérouler la non-régression `rsrc/DefUi.md` + filtres/recherche/pagination/navigation fiche ;
  confirmer que l'ordre **par défaut** et les filtres existants sont inchangés (SC-005) — cf. quickstart §5.
- [x] T017 [P] Vérifier l'accessibilité des en-têtes triables (focus clavier, activation Entrée/Espace,
  `aria-sort` correct) et la mise en page des étiquettes P/M longues (petits écrans) — cf. quickstart §2/§3.
- [x] T018 Portes de qualité finales : `npm run test` (cœur vert, tris/présence inclus), `npm run build`
  (tsc + vite), `npm run lint` (propre). Corriger toute régression avant clôture.

---

## Dependencies & ordre d'exécution

```
Phase 1 (T001)
        ↓
Phase 2 — cœur : T002 → T003 → T004  (même fichier filter.ts puis façades) ; T005, T006 [P] (tests)
        ↓
Phase 3 — US1 (P1) : T007 → T008
Phase 4 — US2 (P2) : T009 → T010 → (T011 ∥ T012)
Phase 5 — US3 (P3) : T013 → T014 → T015
        ↓
Phase 6 — Polish : T016, T017 [P] → T018 (porte finale)
```

- **US1/US2 dépendent de** Phase 2 (fonctions cœur). **US3** ne dépend que du view-model (T013) — pourrait
  démarrer en parallèle de la Phase 2, mais T015 touche ListeView/SandboxView aussi modifiés en US2.
- **Fichiers partagés séquentiels** : `filter.ts` (T002/T003/T004) ; `ListeView.svelte` (T011 puis T015) ;
  `SandboxView.svelte` (T012 puis T015) ; `FilterBar.svelte` (T008 puis T010).
- **Parallélisable** : T005 ∥ T006 (tests, fichiers distincts) ; T011 ∥ T012 (vues distinctes) ;
  T016 ∥ T017.

## Exemples d'exécution parallèle

- **Phase 2** : `T005` (tests présence) ∥ `T006` (tests tri) une fois T002–T004 posés.
- **US2** : `T011` (ListeView) ∥ `T012` (SandboxView) après T009/T010.
- **Polish** : `T016` (DefUi) ∥ `T017` (a11y), puis `T018`.

## Implementation strategy

- **MVP = US1** (Phases 1→3, T001–T008) : filtres de présence de trait, valeur immédiate, indépendant.
- **US2** (Phase 4) : tri par colonne (dépend du comparateur cœur de la Phase 2).
- **US3** (Phase 5) : étiquettes P/M (autonome, touche le view-model + rendu des listes).
- **Clôture** (Phase 6) : non-régression, a11y, portes de qualité.
- Toute valeur/logique **existante** (filtres actuels, ordre par défaut, génétique) reste **intouchée**.
