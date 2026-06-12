---
description: "Task list — Feature 005 : Paramétrage complet & catalogues éditables"
---

# Tasks: Paramétrage complet & catalogues éditables

**Input**: Design documents from `specs/005-parametrage-catalogues/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/core-api.md, quickstart.md

**Tests** : **OBLIGATOIRES sur le cœur** (Constitution Principe V) — tests Vitest à **seed fixe**. Les
tests cœur sont écrits **avant** l'implémentation correspondante (TDD).

**Organisation** : par user story (US1 P1 → US2 P2 → US3 P3), chacune indépendamment testable.

## Format : `[ID] [P?] [Story?] Description (chemin)`

- **[P]** : parallélisable (fichiers distincts, aucune dépendance non satisfaite).
- **[Story]** : US1 / US2 / US3 (phases user story uniquement).

---

## Phase 1 : Setup (infrastructure partagée)

- [X] T001 Scaffolder les modules cœur vides + ré-exports : créer `src/core/params/resolveResilience.ts`, `src/core/catalog/editCatalog.ts`, `src/core/species/editEspeces.ts` (stubs typés) et les **ré-exporter** via `src/core/index.ts` ; vérifier `npm run test`/`npm run lint` verts (baseline). La garde `core-purity.test.ts` couvre déjà ces dossiers.

---

## Phase 2 : Foundational (prérequis bloquants)

**⚠️ Bloque US1 et US2 (édition de catalogue/espèces). Refactor à comportement inchangé (défauts).**

- [X] T002 `src/ui/stores/appState.ts` : convertir le **catalogue** (constante de module `const catalog = defaultCatalog()`) en **store** `writable<Catalog>` ; adapter `getCatalog`, `generate()`, `snapshot()`, `reproduceSelected()`/`advanceYears()` pour lire le store. Comportement inchangé tant qu'aucune édition (défaut = `defaultCatalog()`).
- [X] T003 `src/ui/stores/appState.ts` : convertir `especesRef` (`let`) en **store** `writable<Espece[]>` ; adapter `generate()`, `snapshot()`, `advanceYears()`, `applyImport()` pour lire/écrire le store. Comportement inchangé (défaut = `defaultEspeces()`).

**Checkpoint** : catalogue & espèces réactifs, prêts à être édités. Aucun changement fonctionnel visible.

---

## Phase 3 : User Story 1 — Catalogues éditables : traits, espèces, genres (Priority: P1) 🎯 MVP

**Goal** : ajouter/renommer/supprimer des traits (6 types fixes), des espèces et leurs genres ; la
suppression n'affecte que les tirages futurs ; « tout » non supprimable.

**Independent Test** : ajouter/renommer/supprimer un trait, une espèce et un genre ; vérifier que la
genèse/naissance suivante tient compte des changements et que les individus existants ne sont pas
cassés (cf. quickstart US1).

### Tests cœur (écrits AVANT l'implémentation — Principe V)

- [X] T004 [P] [US1] `tests/unit/edit-catalog.test.ts` : `addTrait` (id unique `type:slug-n`, doublon de libellé toléré), `renameTrait` (id inchangé), `removeTrait` (futur seulement : **ne mute aucun ADN**, no-op si id absent), `setTraitWeight` (≥ 0). Pur, déterministe.
- [X] T005 [P] [US1] `tests/unit/edit-especes.test.ts` : `addEspece` (inclut « tout »), `renameEspece`, `removeEspece` (futur seulement), `addGenre`/`renameGenre`/`removeGenre` (refus de supprimer « tout », pas de doublon « tout »), `validateEspece` (INV-E3). Pur, déterministe.

### Implémentation cœur (pur)

- [X] T006 [US1] `src/core/catalog/editCatalog.ts` : implémenter `addTrait`, `renameTrait`, `removeTrait`, `setTraitWeight` (immutables, INV-C1/C2/C3) + ré-export `src/core/index.ts`. Dépend de T004.
- [X] T007 [US1] `src/core/species/editEspeces.ts` : implémenter `addEspece`, `renameEspece`, `removeEspece`, `addGenre`, `renameGenre`, `removeGenre`, `setEspeceParam`, `validateEspece` (immutables, INV-E1/E2/E3) + ré-export `src/core/index.ts`. Dépend de T005.

### Implémentation UI

- [X] T008 [P] [US1] `src/ui/components/TraitCatalogEditor.svelte` : par type (6 onglets/sections), liste des traits avec **ajout / renommage / suppression** et **poids individuel** (`setTraitWeight`) ; branché sur le store `catalog` (mutations T006). Dépend de T006.
- [X] T009 [P] [US1] `src/ui/components/SpeciesEditor.svelte` : liste des espèces avec **ajout / renommage / suppression** et, par espèce, gestion des **genres** (« tout » affiché non supprimable) ; branché sur le store `especes` (mutations T007). Dépend de T007.
- [X] T010 [US1] `src/ui/views/ParametresView.svelte` : ajouter une section **Catalogues** intégrant `TraitCatalogEditor` et `SpeciesEditor`. Dépend de T008, T009 (+ T002, T003).
- [X] T011 [US1] Repli d'affichage des **libellés de traits supprimés** : `src/ui/lib/ficheViewModel.ts` / `src/ui/lib/treeViewModel.ts` (et liste) DOIVENT afficher un libellé de repli (libellé connu ou slug de l'id) quand un `traitId` n'est plus au catalogue — garantit qu'aucun individu existant n'est cassé (SC-006).

**Checkpoint** : US1 pleinement fonctionnelle et testable seule (catalogues éditables, données existantes intactes).

---

## Phase 4 : User Story 2 — Reproduction par espèce + courbe + consanguinité + % par couple (Priority: P2)

**Goal** : éditer la gaussienne/portée/divorce/groupe d'une espèce avec **courbe affichée en direct**,
basculer la **consanguinité**, et régler le **% de reproduction d'un couple** depuis la fiche.

**Independent Test** : modifier la courbe d'une espèce et la voir se mettre à jour ; régler portée/
divorce ; basculer consanguinité ; éditer puis réinitialiser le % d'un couple (cf. quickstart US2).

### Tests cœur (Principe V)

- [X] T012 [P] [US2] `tests/unit/edit-especes.test.ts` (compléter) : cas de **validation des paramètres de reproduction** via `setEspeceParam`/`validateEspece` — `début ≤ pic ≤ fin`, `M ≤ N`, `pente > 0`, `groupSize ≥ 1`, pourcentages ∈ [0,100] (INV-E3). Pur, déterministe.

### Implémentation UI

- [X] T013 [P] [US2] `src/ui/components/GaussianCurve.svelte` : tracé **SVG sur-mesure** de la densité de reproduction (réutilise la fonction de `src/core/repro/gaussian.ts`), échantillonnée sur [début, fin] ; recalcul réactif (< 1 s, SC-004). **Aucune dépendance.**
- [X] T014 [US2] `src/ui/components/SpeciesEditor.svelte` (étendre) : sous-panneau **reproduction** par espèce (âge début/pic/fin, probabilité au pic, pente, portée M/N/X, taille de groupe, % divorce) via `setEspeceParam` + **validation** (messages FR) ; intégrer `GaussianCurve`. Dépend de T009, T013, T007.
- [X] T015 [US2] `src/ui/views/ParametresView.svelte` : ajouter le **toggle consanguinité** (`Parameters.consanguinityAllowed`, défaut interdite) dans la section reproduction/espèces. Dépend de T010 (même fichier).
- [X] T016 [US2] `src/ui/views/FicheView.svelte` : contrôle d'édition du **% de reproduction du couple** d'un membre (via `coupleOf` + `setCoupleReproPct`, déjà au store) avec **réinitialisation** (vide ⇒ `null` ⇒ dérivé de la gaussienne). FR-040/FR-041.

**Checkpoint** : US1 + US2 fonctionnelles indépendamment.

---

## Phase 5 : User Story 3 — Pondérations + déclinaison de la résilience (Priority: P3)

**Goal** : faire du **poids/résilience d'un type** le **défaut de ses traits** (surcharge par trait +
bouton **« Propager »**), décliner la **résilience** (initiale, maximale, seuil) **global → type →
trait**, et rendre le tirage **tolérant aux poids nuls** (type à 0 ⇒ pouvoir null, traits déjà tirés
actifs). Le moteur utilise la **valeur effective** résolue.

**Independent Test** : mettre le poids du type « Éléments » à 0 ⇒ aucun Élément tiré et un AE tiré
donne **aucun pouvoir** mais l'Action reste active ; surcharger/Propager un poids ; poser des
surcharges de résilience par type/trait et vérifier (seed fixe) la valeur effective (cf. quickstart US3).

### Tests cœur (écrits AVANT — Principe V)

- [X] T017 [P] [US3] `tests/unit/resolve-resilience.test.ts` : `resolveResilience(params, traitId)` — résolution **par champ** (`byTrait → byType → global`), **type via préfixe d'id**, trait **absent du catalogue** (type encore résolu), trait à préfixe inconnu (saut du niveau type), bornes (INV-P1..P4). Seed fixe.
- [X] T017b [P] [US3] `tests/unit/resolve-weight.test.ts` : `resolveWeight(catalog/params, traitId)` — poids effectif = **surcharge du trait ?? poids du type** ; « Propager » efface les surcharges du type ; cas **poids de type 0** ⇒ poids effectif nul pour les traits non surchargés (INV-W1).
- [X] T018 [P] [US3] Étendre `tests/unit/heredity.test.ts` et `tests/unit/genesis.test.ts` : surcharge par **type** et par **trait** ⇒ `inherit.ts` applique le **plafond** et le **seuil** effectifs ; genèse/`traitsToPowers`/mutation faible appliquent la **résilience initiale** effective. Seed fixe, valeurs exactes.
- [X] T018b [P] [US3] Étendre `tests/unit/strong-mutation.test.ts` : un gabarit **AE** avec type « Élément » à poids effectif **nul** ⇒ **`pouvoir = null`** ET le trait **Action déjà tiré reste actif** dans l'ADN (FR-052b) ; aucune exception. Seed fixe.

### Implémentation cœur (pur)

- [X] T019 [US3] `src/core/params/parameters.ts` : ajouter `resilienceOverrides: ResilienceOverrides` (+ types `ResiliencePatch`/`ResilienceOverrides`) avec défaut `{ byType: {}, byTrait: {} }` ; helpers purs `setResiliencePatch`, `clearResiliencePatch`, `validateResiliencePatch` (bornes, `seuil ≤ max`) **et** `propagateResilienceType(params, type)` (efface les surcharges de trait du type). Ré-export `src/core/index.ts`.
- [X] T019b [US3] `src/core/state/serialize.ts` (`deserializeState`) : **rétro-compatibilité** — si un fichier importé **ne contient pas** `resilienceOverrides`, le **défauter** à `{ byType: {}, byTrait: {} }` ; tolérer un `Trait.weight` **absent/null** (⇒ hérite du type). Aucune exception sur un fichier antérieur à la Feature 5. Couvrir par un test (`tests/unit/state.test.ts` étendu, seed fixe). Dépend de T019, T020b. *(Évite que `resolveResilience` lise `undefined.byType`.)*
- [X] T020 [US3] `src/core/params/resolveResilience.ts` : implémenter `resolveResilience` (type via préfixe d'id validé contre `TRAIT_TYPES` ; résolution par champ) + `EffectiveResilience`. Dépend de T017, T019.
- [X] T020b [US3] `src/core/params/resolveWeight.ts` : `resolveWeight(traitId, override, traitTypeWeights)` (= surcharge ?? poids du type) ; le **poids d'un trait** devient une **surcharge optionnelle** (modèle héritage type→trait). **Migration `src/core/catalog/defaultCatalog.ts`** : les traits par défaut ne portent **aucune surcharge** (`weight = null`/absent) ⇒ ils héritent du poids de leur type ; `traitTypeWeights` (défaut **1** par type) reste la base. Adapter les points de tirage à `weight ?? traitTypeWeights[type]`. Ré-export. Dépend de T017b.
- [X] T020c [US3] `src/core/rng/rng.ts` : ajouter `pickWeightedOrNull(items, weightOf): T | null` (renvoie `null` si total ≤ 0) **sans modifier** `pickWeighted`. Couvrir par un test (rng). Dépend de T017b.
- [X] T021 [US3] `src/core/heredity/inherit.ts` : remplacer les lectures directes `params.resilienceMax` / `params.disappearThreshold` par la **valeur effective** `resolveResilience(params, traitId)` (plafond + seuil **par trait hérité**). Dépend de T020.
- [X] T022 [US3] `src/core/birth/reproduce.ts`, `src/core/genesis/genesis.ts`, `src/core/powers/traitsToPowers.ts` : router `initialResilience`/`resilienceMax` vers la **valeur effective** résolue par `traitId` (mutation faible gain, trait `K…` généré, trait du pouvoir de genèse). Dépend de T020.
- [X] T023 [US3] **Modèle de poids type→trait + tolérance** : aux points de tirage (`powers/strongMutation.ts`, `powers/traitsToPowers.ts`, `birth/reproduce.ts`), utiliser le **poids effectif** `resolveWeight` et `pickWeightedOrNull` ; si aucun candidat tirable ⇒ **`pouvoir = null`** en **conservant actifs les traits déjà tirés** (FR-052b) ; gain de mutation faible ⇒ **no-op**. Dépend de T020b, T020c, T022 (mêmes fichiers `reproduce.ts`/`traitsToPowers.ts` — séquentiel).

### Implémentation UI

- [X] T024 [US3] `src/ui/views/ParametresView.svelte` + `src/ui/components/TraitCatalogEditor.svelte` : section **Pondérations** — éditer `templateWeights` (AE/PE/PA/PR), le **poids par type** (`traitTypeWeights`) et la **surcharge** de poids par trait, avec bouton **« Propager »** par type. Dépend de T015 (même `ParametresView`), T020b.
- [X] T025 [US3] `src/ui/components/ResilienceOverrides.svelte` + intégration dans `ParametresView.svelte` : éditer la résilience (initiale / maximale / seuil) aux **3 niveaux** (global, par type, par trait) via `setResiliencePatch`/`clearResiliencePatch`/`propagateResilienceType` + `validateResiliencePatch` ; **bouton « Propager »** par type/champ ; indiquer la valeur **héritée** quand aucune surcharge. Dépend de T019, T024 (même fichier ParametresView — séquentiel).

**Checkpoint** : les 3 user stories sont indépendamment fonctionnelles.

---

## Phase 6 : Polish & transverse

- [X] T026 [P] Vérifier que `tests/unit/core-purity.test.ts` couvre les nouveaux modules `params`/`catalog`/`species` (aucun `Math.random`/`Date`/`crypto`/DOM) ; ajouter une assertion si nécessaire.
- [X] T027 [P] Styles **responsive** des nouveaux écrans (`ParametresView`, `TraitCatalogEditor`, `SpeciesEditor`, `ResilienceOverrides`, `GaussianCurve`) dans `src/app.css` et composants.
- [ ] T028 Dérouler `specs/005-parametrage-catalogues/quickstart.md` (validation manuelle US1/US2/US3 + déterminisme).
- [X] T029 Portes de qualité : `npm run test` + `npm run lint` + `npm run build` **verts** ; bundle déployable (Principe II).

---

## Dependencies & Execution Order

### Dépendances de phase

- **Setup (T001)** avant tout.
- **Foundational (T002, T003)** avant US1 et US2 (stores éditables). **US3 ne dépend pas** des stores
  (extension cœur indépendante) — peut démarrer après T001.
- **Polish (T026–T029)** en dernier.

### Dépendances par story

- **US1 (P1, MVP)** : T004 ‖ T005 (tests) → T006, T007 → T008 ‖ T009 → T010 ; T011 indépendant
  (fichiers viewModel). Dépend de T002/T003 pour le branchement des stores.
- **US2 (P2)** : T012 (test) ; T013 [P] ; T014 (dépend T009 + T013 + T007) ; T015 (dépend T010, même
  `ParametresView`) ; T016 indépendant (`FicheView`). Indépendante d'US1 à l'exécution (mais
  `SpeciesEditor`/`ParametresView` partagés ⇒ séquentiel sur ces fichiers).
- **US3 (P3)** : T017 ‖ T017b ‖ T018 ‖ T018b (tests) → T019, T020b, T020c → T019b (rétro-compat
  import) ‖ T020 → T021 ‖ T022 → T023 ; UI T024 → T025 (même `ParametresView`). Indépendante des
  stores catalogue/espèces.

### Même fichier (séquentiel, pas de [P])

- `src/ui/views/ParametresView.svelte` : T010 → T015 → T024 → T025.
- `src/ui/components/SpeciesEditor.svelte` : T009 → T014.
- `src/core/birth/reproduce.ts` & `src/core/powers/traitsToPowers.ts` : T022 → T023.
- `src/ui/views/ParametresView.svelte` (poids) : T024 inclut aussi `TraitCatalogEditor.svelte`
  (touché en T008) ⇒ séquentiel T008 → T024 sur ce composant.
- `src/core/index.ts` : ré-exports ajoutés par T006, T007, T019, T020, T020b (séquentiel ou fusionné).

## Parallel Opportunities

- **Tests cœur** : T004 ‖ T005 (US1) ; T017 ‖ T017b ‖ T018 ‖ T018b (US3).
- **US1** : T008 ‖ T009 (composants distincts) ; T011 ‖ (T006/T007).
- **US3** : T019 ‖ T020b ‖ T020c (fichiers distincts) ; puis T021 ‖ T022 (après T020).
- **Polish** : T026 ‖ T027.
- Une fois Foundational fait, **US1, US2 et US3** peuvent progresser en parallèle (en tenant compte
  des fichiers partagés ci-dessus).

## Parallel Example: User Story 1

```text
# Tests d'abord (parallèles) :
Tâche T004 : tests editCatalog (tests/unit/edit-catalog.test.ts)
Tâche T005 : tests editEspeces (tests/unit/edit-especes.test.ts)

# Puis composants UI (parallèles) après le cœur :
Tâche T008 : TraitCatalogEditor.svelte
Tâche T009 : SpeciesEditor.svelte
```

## Implementation Strategy

### MVP (US1 seule)

1. Setup (T001) → Foundational (T002, T003).
2. US1 (T004–T011) → **STOP & VALIDATE** : catalogues éditables, données existantes intactes.
3. Démo/déploiement possible.

### Livraison incrémentale

1. Setup + Foundational → socle réactif.
2. + US1 (catalogues) → tester → démo (MVP).
3. + US2 (reproduction/courbe/consanguinité/% couple) → tester → démo.
4. + US3 (pondérations + résilience 3 niveaux, extension cœur) → tester → démo.

## Notes

- Tests **cœur obligatoires à seed fixe** (Principe V) : T004, T005, T012, T017, T017b, T018, T018b
  (+ core-purity T026). Écrire les tests cœur **avant** l'implémentation correspondante.
- **Poids = héritage type → trait** (clarif. 2026-06-12) : poids effectif = `surcharge ?? poids du
  type` ; « Propager » efface les surcharges ; **pas** de multiplication type×individuel.
- **Type à poids effectif nul** : le trait n'est pas tiré ⇒ **pouvoir = null** + traits déjà tirés
  **actifs** (FR-052b, calque l'échec `K` §6.4.2) ; via `pickWeightedOrNull` (jamais d'exception).
- **Déterminisme** (Principe I) : aucune mutation/résolution n'utilise `Math.random`/horloge ; les
  tirages restent pilotés par le RNG seedé.
- **Cœur pur** (Principe IV) : toute logique (résolution, mutations, validation) dans `src/core` ;
  l'UI ne fait que détenir les stores et le rendu.
- **Aucune dépendance ajoutée** (Principe VIII) — courbe gaussienne en SVG sur-mesure.
- **Suppression de catalogue = futur seulement** : ne jamais muter un ADN existant (INV-C1/INV-E2).
- **Anonymat** (Principe X) : commits `KingsCookie`, email vide. Commit après chaque tâche ou groupe
  logique ; `main` reste déployable.
- Persistance complète (export/import des catalogues/config) = **Feature 6** (hors périmètre).
