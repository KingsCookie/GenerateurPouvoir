---
description: "Task list — Feature 002 Reproduction & hérédité (moteur génétique)"
---

# Tasks: Reproduction & hérédité (moteur génétique)

**Input**: Design documents from `specs/002-reproduction-heredite/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: INCLUS — la constitution (Principe V) rend les tests du cœur **obligatoires** ; la spec exige en
plus la reproduction des **exemples chiffrés** (§6.4.1 ex.1/2, §7.2 ex.1/2). Les tests du cœur sont écrits
**avant** leur implémentation (seed fixe).

**Organization**: tâches groupées par user story (US1 P1, US2 P2, US3 P3). Étend la Feature 1 (cœur + UI).

## Format: `[ID] [P?] [Story?] Description`

- **[P]** : parallélisable (fichiers différents, pas de dépendance non satisfaite).
- **[Story]** : US1 / US2 / US3 (uniquement pour les phases user story).
- Chemins relatifs à la racine du dépôt.

## Path Conventions

Projet unique, deux couches : cœur pur `src/core/`, UI Svelte `src/ui/`, tests `tests/unit/`.

---

## Phase 1: Setup

**Purpose**: la stack et le projet existent déjà (Feature 1) ; rien à initialiser. Cette feature **étend**
le cœur et l'UI sans nouvelle dépendance (Principe VIII).

- [x] T001 Vérifier l'état de départ : `npm install`, `npm run test` (Feature 1 verte) avant d'étendre le moteur.

---

## Phase 2: Foundational (prérequis bloquants — AVANT toute user story)

**Purpose**: paramètres du moteur + primitive de mélange déterministe, requis par toutes les user stories.

**⚠️ Aucune user story ne peut démarrer avant la fin de cette phase.**

- [x] T002 [P] Étendre `Parameters` + défauts dans `src/core/params/parameters.ts` : `duplicationD=20`, `generationK=10`, `resilienceMax=95`, `bonusPoints=5`, `malusPoints=5`, `disappearThreshold=2`, `strongMutationRatePct=0`, `noPowerRatePct=0`, `weakMutationGainPct=0`, `weakMutationLossPct=0`, `genomeMalusEnabled=false`, `statB=10`, `statC=30` (cf. data-model). Vérifier que `serializeState` les inclut (sérialisation générique).
- [x] T003 Ajouter `shuffle<T>(items)` (Fisher–Yates déterministe via `nextInt`) à l'interface `Rng` et à `createRng` dans `src/core/rng/rng.ts` ; l'exposer via `src/core/rng/index.ts` et la façade `src/core/index.ts`.
- [x] T004 [P] Test déterminisme du mélange dans `tests/unit/rng-shuffle.test.ts` : même seed ⇒ même permutation ; `shuffle` est une permutation (mêmes éléments) ; ne mute pas l'entrée.

**Checkpoint**: paramètres + shuffle prêts — les user stories peuvent commencer.

---

## Phase 3: User Story 1 - Reproduction normale : hérédité + pouvoirs dérivés (Priority: P1) 🎯 MVP

**Goal**: sélectionner ≥ 1 individus, produire **un enfant** déterministe dont l'ADN suit l'hérédité (§4) et
les pouvoirs sont dérivés (§6.4) avec puissance/maîtrise héritées (§7.2).

**Independent Test**: reproduire 2 individus dotés de traits actifs à seed fixe → enfant déterministe (ADN +
pouvoirs + P/M) ; relancer (même seed) ⇒ identique ; les exemples §6.4.1 et §7.2 se reproduisent.

### Tests (écrits AVANT l'implémentation — Principe V)

- [x] T005 [P] [US1] Tests hérédité dans `tests/unit/heredity.test.ts` : §4.2 Cas 1 (un porteur) et Cas 2 (0/1/≥2 tirages actifs), **bonus/malus additif** (±points), plafond `resilienceMax`, **disparition** sous `disappearThreshold` (INV-2), transmission des inactifs, déterminisme à seed fixe.
- [x] T006 [P] [US1] Tests traits→pouvoirs dans `tests/unit/traits-to-powers.test.ts` : **exemple 1** (§6.4.1, sans duplication) et **exemple 2** (avec duplication) reproduits **à l'identique** (INV-7) ; duplication ≤ 1/sous-liste (INV-5) ; génération `K` inscrite à l'ADN (INV-6) ; `null` si `K` requis échoue ; aucun trait actif ⇒ aucun pouvoir.
- [x] T007 [P] [US1] Tests de l'arbre §6.4.2 dans `tests/unit/power-label-tree.test.ts` : pour des combinaisons de présence `a/e/p/aj/r/et`, le libellé correspond **exactement** aux feuilles de l'arbre (y compris les cas `{Ka}`, `{Ke}`, `{Kp}`, `{Kaj}` et `null`).
- [x] T008 [P] [US1] Tests héritage P/M dans `tests/unit/inherit-stats.test.ts` : **exemples 1 & 2** (§7.2, mapping `i mod n`), arrondi (`x≥n+0,5⇒n+1`), tirage A/B/C, **bornage cas A uniquement** (INV-4), cas « aucun parent source » ⇒ aléatoire 1-10.
- [x] T009 [P] [US1] Tests reproduction (chemin normal) dans `tests/unit/reproduce.test.ts` : déterminisme (INV-1), héritage total des traits (INV-2/SC-002), parenté symétrique (INV-9), enfant âge 0 / année courante.

### Implementation (cœur)

- [x] T010 [P] [US1] Hérédité de résilience dans `src/core/heredity/inherit.ts` : `inheritADN(parents, params, rng)` — union des traits, tirages par parent (résilience), agrégation §4.2, bonus/malus **additif**, clamp `[0, resilienceMax]`, suppression sous le seuil ; ordre de tirage **stable** (traits triés, parents dans l'ordre fourni).
- [x] T011 [P] [US1] Arbre de libellé §6.4.2 **verbatim** dans `src/core/powers/powerLabelTree.ts` : `powerLabelFromSublist({a,e,p,aj,r,et})` reproduisant la structure `if/else` exacte (faisant foi, Principe IX) ; renvoie le libellé ou `null`.
- [x] T012 [US1] Algorithme traits→pouvoirs dans `src/core/powers/traitsToPowers.ts` : `derivePowersFromTraits(adn, catalog, params, rng)` — sous-listes (principaux Action sinon PartieCorps sinon liste unique), mélange déterministe, assignation cyclique, **duplication** (`résilience/duplicationD` %, ≤ 1/sous-liste, sans toucher l'ADN), regroupement par type (« , … et » / « ou » états), libellé via T011, **génération `K`** (proba `generationK` %, trait inscrit actif dans l'ADN), `null` si `K` requis échoue — dépend de T003, T010, T011.
- [x] T013 [P] [US1] Héritage puissance/maîtrise dans `src/core/powers/inheritStats.ts` : `inheritStats(i, parents, params, rng)` — moyenne des i-ᵉ pouvoirs des parents pourvus (mélange déterministe, `i mod n`), arrondi, tirage A/B/C/B (`A=100−2·B−C`), **seul A borné [1,10]** ; aucun parent source ⇒ cas A — dépend de T003.
- [x] T014 [US1] Pipeline de reproduction (chemin **normal**) dans `src/core/birth/reproduce.ts` : `reproduce(parents, params, catalog, rng, {childId, birthYear})` — pour le cas normal : `inheritADN` → `derivePowersFromTraits` → `inheritStats` par pouvoir ; construit la `Personne` enfant (id, date dans l'année, âge 0, `parents`) — dépend de T010, T012, T013. *(Les cas spéciaux sont ajoutés en US2.)*
- [x] T015 [US1] Exposer le moteur via la façade `src/core/index.ts` (`inheritADN`, `derivePowersFromTraits`, `inheritStats`, `reproduce`, `powerLabelFromSublist`).

### Implementation (UI)

- [x] T016 [US1] Store : sélection + reproduction dans `src/ui/stores/appState.ts` — état `selectedIds`, `toggleSelect(id)`, action `reproduceSelected()` (construit le `Rng` depuis la seed, appelle `reproduce`, ajoute l'enfant à la population, met à jour `parents`/`enfants` des deux côtés — INV-9).
- [x] T017 [US1] Composant `src/ui/components/ReproduceBar.svelte` : affiche le nombre de sélectionnés + bouton **« Reproduire »** (désactivé si 0 sélectionné).
- [x] T018 [US1] Sélection dans `src/ui/views/ListeView.svelte` : case/clic de sélection multiple par ligne (sans casser l'ouverture de fiche), branché au store ; insérer `ReproduceBar`.

**Checkpoint**: US1 fonctionnelle et testable seule (MVP du moteur génétique).

---

## Phase 4: User Story 2 - Cas spéciaux : mutation forte, sans pouvoir, mutation faible (Priority: P2)

**Goal**: orienter chaque naissance via le pipeline §5 selon les taux paramétrables.

**Independent Test**: taux mutation forte 100 % ⇒ enfant à 1 pouvoir gabarit (P/M 1-10), ADN parental inactif ;
taux sans pouvoir 100 % ⇒ enfant sans pouvoir ; mutation faible activée ⇒ gain/perte observables.

- [x] T019 [P] [US2] Tests des cas spéciaux dans `tests/unit/birth-cases.test.ts` : tirage du cas selon les taux (0 %/100 % et proportion ±5 pts sur ≥ 1000 — SC-005) ; mutation forte (traits inactifs + 1 pouvoir gabarit + P/M ∈ [1,10] — INV-3/INV-4) ; sans pouvoir (0 pouvoir, ADN inactif) ; mutation faible gain (mise active + bonus si présent, sinon ajout actif à la résilience initiale) et perte (retrait d'un trait).
- [x] T020 [US2] Étendre `src/core/birth/reproduce.ts` : tirage `BirthCase` (`strongMutationRatePct`/`noPowerRatePct`, sinon normale) ; cas spéciaux → tous traits parentaux **inactifs** (option `genomeMalusEnabled`) ; **mutation forte** → `generateStrongMutationPower` (Feature 1) + P/M aléatoire 1-10 ; **sans pouvoir** → aucun pouvoir ; **mutation faible** (normale uniquement) gain puis perte. **Ordre du pipeline (§5)** : la mutation faible (gain puis perte) DOIT être appliquée à l'ADN **avant** `derivePowersFromTraits` (étape 3 avant étape 4), de sorte que les pouvoirs dérivent de l'ADN post-mutation. Dépend de T014.
- [x] T021 [US2] (BUG-001 corrigé) Édition **complète** des paramètres du moteur dans `src/ui/views/ParametresView.svelte` (FR-027/FR-030/**FR-031**) : champs éditables pour `D`, `K`, résilience initiale, résilience maximale, bonus (points), malus (points), seuil de disparition, taux (mutation forte / sans pouvoir / mutation faible gain / perte), option « malus génome », `B`, `C` ; **`A = 100 − 2·B − C` affichée en lecture seule**. **FR-031** : **regrouper** en sections thématiques (Génération de pouvoir §9.1 / Hérédité & naissance §9.2 / Population §9.3) et afficher une **description fonctionnelle** sous **chaque** champ (pas seulement `A`). *(L'organisation avancée 3 niveaux + courbes reste en Feature 5.)*

**Checkpoint**: US1 + US2 — pipeline complet de naissance exerçable.

---

## Phase 5: User Story 3 - Inspection génétique de l'enfant (Priority: P3)

**Goal**: fiche enrichie montrant l'ADN complet (actifs + inactifs + résilience) en plus des pouvoirs.

**Independent Test**: après une reproduction, ouvrir la fiche de l'enfant et vérifier ADN complet + pouvoirs.

- [x] T022 [P] [US3] Étendre `tests/unit/fiche-vm.test.ts` : la vue expose **traits actifs et inactifs** avec leur **résilience** (en plus des pouvoirs).
- [x] T023 [US3] Étendre `src/ui/lib/ficheViewModel.ts` : ajouter `traitsInactifs` (libellé + résilience) et conserver `traitsActifs` ; à partir de l'ADN complet.
- [x] T024 [US3] Étendre `src/ui/views/FicheView.svelte` : section **ADN** affichant traits actifs et inactifs avec résilience, en plus des pouvoirs (puissance/maîtrise).

**Checkpoint**: les 3 user stories fonctionnent indépendamment.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: round-trip, performance, garde-fous, vérification déployable.

- [x] T025 [P] Test round-trip dans `tests/unit/reproduce.test.ts` (ou `state.test.ts`) : export → import après reproductions ⇒ état **égal**, parenté incluse (INV-10/SC-007).
- [x] T026 [P] Test/bench de performance dans `tests/unit/perf.test.ts` : une reproduction (un enfant) **< 50 ms** ; pas de régression sur la génération.
- [x] T027 [P] Styles responsive pour la sélection + `ReproduceBar` + section ADN (mobile → desktop) dans `src/app.css` et composants.
- [x] T028 Vérifier les portes de la constitution : pureté du cœur (la garde `core-purity.test.ts` couvre `heredity/`, `powers/`, `birth/` ; aucun `Math.random`/`Date`/`crypto`) ; dérouler le smoke test de `quickstart.md` ; `npm run lint` + `npm run build` verts.

---

## Dependencies & Execution Order

- **Setup (Phase 1)** : T001 d'abord (état sain).
- **Foundational (Phase 2)** : T002, T003, T004 — **bloque** toutes les user stories ; T003 (shuffle) avant T012/T013.
- **User Stories (Phases 3-5)** :
  - US1 (P1) : aucune dépendance inter-stories.
  - US2 (P2) : **étend** `reproduce.ts` (T020 dépend de T014) ; testable seule via les taux.
  - US3 (P3) : indépendante (inspection d'un individu existant) ; testable seule.
- **Polish (Phase 6)** : après les user stories visées.

### Au sein d'une user story
- Les **tests** (T005-T009, T019, T022, T025) sont écrits **avant** l'implémentation correspondante.
- Cœur avant UI : hérédité/arbre/pouvoirs/stats → `reproduce` → store → écrans.

## Parallel Opportunities

- **Phase 2** : T002 ‖ T004 (après T003 pour le test shuffle).
- **US1 (tests)** : T005, T006, T007, T008, T009 en parallèle.
- **US1 (cœur)** : T010 ‖ T011 ‖ T013 ; puis T012 (dépend T010/T011) ; puis T014 (dépend T010/T012/T013) ; UI T016→T017/T018.
- **Polish** : T025, T026, T027 en parallèle.

### Exemple (US1)
```text
# Tests d'abord :
T005 heredity.test.ts · T006 traits-to-powers.test.ts · T007 power-label-tree.test.ts · T008 inherit-stats.test.ts · T009 reproduce.test.ts
# Puis cœur :
T010 inherit.ts ‖ T011 powerLabelTree.ts ‖ T013 inheritStats.ts
T012 traitsToPowers.ts (dépend T010/T011)
T014 reproduce.ts (dépend T010/T012/T013)
# Puis UI :
T016 store → T017 ReproduceBar / T018 ListeView
```

## Implementation Strategy

- **MVP = User Story 1** : Setup + Foundational + Phase 3 → reproduire deux individus et obtenir un enfant
  déterministe (hérédité + pouvoirs dérivés + P/M). S'arrêter, valider (exemples §6.4/§7.2), éventuellement déployer.
- **Incréments** : US2 (cas spéciaux), puis US3 (inspection), chacun testable et déployable séparément.
- **Polish** en dernier (round-trip, perf, responsive, vérif déployable).

## Notes

- `rsrc/DescriptionProjet.md` est la source de vérité ; l'**arbre §6.4.2** est reproduit **verbatim** (Principe IX).
- Tout l'aléatoire passe par le `Rng` injecté ; `D` (duplication) et `K` (génération) sont **distincts** (Principe VII).
- Bornage P/M **uniquement** cas A & mutation forte ; les moyennes ne sont pas bornées (§7).
- Aucune donnée personnelle dans le code/commits (Principe X) ; `main` reste déployable.

**Bugfix**: 2026-06-09 — BUG-001 Updated from bugfix patch (T021 rouverte : regroupement en sections + descriptions, FR-031).
- Commit après chaque tâche ou groupe logique.
