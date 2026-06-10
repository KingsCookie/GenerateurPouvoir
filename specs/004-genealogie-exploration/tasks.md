# Tasks — Généalogie & exploration (Feature 004)

**Spec** : [spec.md](./spec.md) · **Plan** : [plan.md](./plan.md) · **Contrats** :
[contracts/core-api.md](./contracts/core-api.md) · **Modèle** : [data-model.md](./data-model.md)

Feature **lecture seule** : cœur pur `src/core/genealogy/` (déterministe, testé à seed fixe —
Principe V) consommé par l'UI Svelte. Aucune dépendance ajoutée. Légende : **[P]** = parallélisable
(fichiers distincts, sans dépendance non satisfaite) ; **[US#]** = rattaché à une user story.

## Phase 1 : Setup

- [ ] T001 Créer le dossier `src/core/genealogy/` avec `src/core/genealogy/index.ts` (façade) et le ré-exporter depuis `src/core/index.ts` (la garde `core-purity.test.ts` couvre automatiquement le nouveau dossier).

## Phase 2 : Foundational (prérequis bloquants — AVANT les user stories)

- [ ] T002 [P] Ajouter une **fixture de test partagée** `tests/unit/_genealogyFixture.ts` : familles déterministes (parents/enfants, conjoints actuel/ex, enfants d'unions multiples, consanguinité, plusieurs générations sur > 60 ans) réutilisée par les tests cœur US1/US2.

## Phase 3 : User Story 1 — Arbre généalogique (Priority: P1) 🎯 MVP

**Objectif** : arbre centré (fiche profondeur fixe 2 ; page dédiée N réglable sans plafond) avec
conjoints/unions, répétition multi-chemins, zoom/pan, recentrage.
**Test indépendant** : ouvrir une fiche → arbre prof. 2 (cases nom+pouvoirs) ; « Explorer l'arbre »
→ page dédiée (N réglable, cases nom+âge+pouvoirs) ; zoom/pan ; clic = recentrage.

- [ ] T003 [P] [US1] Tests cœur `tests/unit/genealogy-tree.test.ts` : profondeur bornée (ancêtres via `parents`, descendants via `enfants`) ; **répétition** d'un individu multi-chemins (INV-G1) ; **unions** = conjoint actuel/ex + **enfants communs uniquement**, exclusion des enfants tiers et des parents du conjoint (INV-G2) ; **ordre déterministe** date puis id (INV-G3) ; **lecture seule** (entrées non mutées, INV-G6) ; racine absente.
- [ ] T004 [US1] Implémenter `buildGenealogyTree(rootId, byId, depth, ctx)` + types `TreeNode`/`Union` dans `src/core/genealogy/tree.ts` (cf. contracts/core-api) ; ré-exporter via `src/core/genealogy/index.ts`. Réutilise `computeAge`, `powerLabel`.
- [ ] T005 [P] [US1] `src/ui/lib/treeViewModel.ts` : adapter `TreeNode` → vue **fiche** (nom + pouvoirs) et vue **page dédiée** (nom + âge + pouvoirs) — FR-003b.
- [ ] T006 [US1] Étendre `src/ui/stores/appState.ts` : type `View` += `'arbre'` ; ajouter `treeRootId`/`treeDepth` (défaut 2, ≥ 1, sans plafond) ; fonctions `goToArbre(rootId)`, `recenterTree(id)`, `setTreeDepth(n)`.
- [ ] T007 [US1] Composant `src/ui/components/GenealogyTree.svelte` : rendu récursif des cases (champs paramétrables) + **viewport pan/zoom** (FR-002b) : zoom **molette** + **pincement** (2 pointeurs), borné min/max ; **pan** clic droit + drag et drag tactile ; `contextmenu` supprimé ; clic gauche sur une case ⇒ recentrage.
- [ ] T008 [US1] `src/ui/views/FicheView.svelte` : insérer la zone arbre **en haut, juste sous « Retour à la liste », pleine largeur** (FR-002c) ; profondeur **fixe 2** (FR-002a) ; cases **nom + pouvoirs** ; bouton **« Explorer l'arbre »** → `goToArbre` (FR-002a).
- [ ] T009 [US1] Créer `src/ui/views/ArbreView.svelte` (page dédiée) : profondeur **N réglable sans plafond**, cases **nom + âge + pouvoirs**, recentrage au clic, **sans informations latérales** ; brancher la vue `'arbre'` dans `src/ui/App.svelte` (rendu + navigation).

## Phase 4 : User Story 2 — Recherche & filtres (Priority: P2)

**Objectif** : liste filtrable (nom + génération + espèce + trait[portée] + pouvoir[présence] +
statut ; OU intra / ET inter) ; défaut **dernière génération** dynamique ; **persistance** session.
**Test indépendant** : appliquer chaque filtre isolément puis combiné ; vérifier défaut, recalage,
persistance, reset.

- [ ] T010 [P] [US2] Tests cœur `tests/unit/genealogy-filter.test.ts` : chaque dimension ; **OU** intra-dimension / **ET** inter-dimensions (INV-G4) ; portée trait **actifs/inactifs/tous** ; pouvoir **présence/absence** ; nom **normalisé** (casse/accents, sous-chaîne) ; `lastGeneration` (max tranche, `null` si vide) ; **lecture seule** (INV-G6).
- [ ] T011 [US2] Implémenter `filterPopulation(pop, criteria, ctx)`, `FilterCriteria` et `lastGeneration(pop)` dans `src/core/genealogy/filter.ts` (cf. contracts) ; ré-exporter via l'index. Réutilise `computeGeneration`.
- [ ] T012 [US2] `src/ui/stores/filters.ts` : store **module-level** (session) `{ criteria, generationTouched }` ; défaut **dernière génération** dynamique tant que `generationTouched === false` (FR-011a) ; bascule à la 1ʳᵉ modif manuelle (FR-011b) ; `resetFilters()` (FR-010) remet `generationTouched=false` ; **non** exporté dans l'état.
- [ ] T013 [P] [US2] Composant `src/ui/components/FilterBar.svelte` : recherche par nom + filtres **génération**, **espèce**, **trait** (+ sélecteur de **portée** actifs/inactifs/tous), **pouvoir** (présence/absence), **statut** ; multi-valeurs (OU) ; bouton **Réinitialiser**.
- [ ] T014 [US2] `src/ui/views/ListeView.svelte` : intégrer `FilterBar` + appliquer `filterPopulation` (avec `$currentYear`) sur `$population` ; appliquer le **défaut dernière génération** et la **persistance** via le store `filters` ; conserver le séparateur ` || ` des pouvoirs (BUG-001 F3).

## Phase 5 : User Story 3 — Modes d'affichage des traits (Priority: P3)

**Objectif** : 3 modes sur la fiche (défaut Mode 3).
**Test indépendant** : sur un individu avec actifs/inactifs/pouvoirs, basculer 1/2/3 et vérifier le contenu.

- [ ] T015 [P] [US3] `src/ui/stores/ui.ts` : store `traitMode` (`1 | 2 | 3`, **défaut 3**) + setter.
- [ ] T016 [US3] Composant `src/ui/components/TraitModeSelector.svelte` : bascule Mode 1 / 2 / 3.
- [ ] T017 [US3] `src/ui/views/FicheView.svelte` : appliquer `$traitMode` au rendu — Mode 1 = pouvoirs seuls ; Mode 2 = + traits actifs ; Mode 3 = + traits inactifs + résilience (réutilise `buildFicheView` : `pouvoirs`/`traitsActifs`/`traitsInactifs`) ; insérer `TraitModeSelector`.

## Phase 6 : Polish & Cross-Cutting Concerns

- [ ] T018 [P] Test de performance `tests/unit/genealogy-perf.test.ts` : `filterPopulation` sur **1 000 individus < 1 s** (SC-002).
- [ ] T019 [P] Styles **responsive** (mobile → desktop) pour `FilterBar`, le viewport `GenealogyTree` (zone tactile, pleine largeur sur la fiche) et `ArbreView`, dans `src/app.css` et les composants.
- [ ] T020 Portes de la constitution : `core-purity.test.ts` couvre `genealogy/` (aucun `Math.random`/`Date`/`crypto`/DOM) ; dérouler le smoke test de `quickstart.md` ; `npm run test` + `npm run lint` + `npm run build` verts.

## Dependencies & Execution Order

- **Setup (T001)** avant tout. **Foundational (T002)** avant les tests cœur des stories.
- **US1 (P1, MVP)** : T003 → T004 ; T005 ‖ T006 ; T007 (dépend T005/T006) ; puis T008 ‖ T009 (dépendent T007). Livrable testable seul.
- **US2 (P2)** : T010 → T011 ; T012 ; T013 → T014 (T014 dépend T011/T012/T013). Indépendante d'US1.
- **US3 (P3)** : T015 → T016 ; T017 (dépend T015 + **T008**, même fichier `FicheView.svelte`).
- **Polish** : T018 (dépend T011), T019, T020 en fin.
- **Même fichier (séquentiel, pas de [P])** : `FicheView.svelte` (T008 puis T017) ; `App.svelte`/stores partagés.

## Parallel Opportunities

- **US1** : T005 ‖ T006 ; puis T008 ‖ T009.
- **Tests cœur** (après T002) : T003 ‖ T010 (fichiers distincts).
- **US3** : T015 ‖ (tests US1/US2) ; **Polish** : T018 ‖ T019.

## Implementation Strategy

- **MVP = User Story 1** (arbre fiche + page dédiée, zoom/pan, recentrage) : Setup + Foundational +
  Phase 3 → s'arrêter, valider, éventuellement déployer.
- **Incréments** : US2 (recherche & filtres), puis US3 (modes d'affichage), chacun testable et
  déployable séparément.
- **Polish** en dernier (perf, responsive, portes constitution).

## Notes

- `rsrc/DescriptionProjet.md` §8.1–8.5 = source de vérité ; lecture seule (ne modifie ni population,
  ni ADN, ni pouvoirs, ni RNG) — Principes IX / I / IV.
- Tests **cœur** obligatoires à seed fixe (Principe V) : T003, T010, T018.
- État d'interface (filtres, mode d'affichage, navigation arbre) **non** exporté (Principe VI).
- Aucune dépendance ajoutée (Principe VIII) ; réutilise `computeGeneration`/`computeAge`/`powerLabel`.
- Bugfix intégrés : **BUG-001** (fiche prof. 2 / page N ; cases distinctes ; défaut+persistance ;
  trait portée ; pouvoir présence) et **BUG-002** (zoom/pan ; placement sur la fiche).
- Anonymat (Principe X) ; `main` reste déployable ; commit après chaque tâche ou groupe logique.
