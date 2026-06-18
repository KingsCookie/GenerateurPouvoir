---
description: "Task list — Feature 007 : Sandbox isolée & « make it real »"
---

# Tasks: Sandbox isolée & « make it real »

**Input**: Design documents from `specs/007-sandbox-make-it-real/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/core-api.md, quickstart.md

**Tests** : **OBLIGATOIRES sur le cœur** (Constitution Principe V) — Vitest à **seed fixe**, écrits
**avant** l'implémentation correspondante (TDD).

**Organisation** : par user story (US1 P1 MVP → US2 P2 → US3 P3). US1/US2 n'exigent que le **champ**
`history` (foundational) ; US3 ajoute l'**émission** du journal (genèse/tick/mort) + la reconstruction.

## Format : `[ID] [P?] [Story?] Description (chemin)`

- **[P]** : parallélisable (fichiers distincts, aucune dépendance non satisfaite).
- **[Story]** : US1 / US2 / US3 (phases user story uniquement).

> ⚠️ **Fichiers partagés (séquentiels, pas de [P])** : `src/core/state/serialize.ts` (T004),
> `src/core/sandbox/sandbox.ts` (T006, T011), `src/ui/stores/sandboxStore.ts` (T007, T019),
> `src/ui/views/SandboxView.svelte` (T008, T012, T019), `tests/unit/sandbox.test.ts` (T005, T010),
> `src/core/index.ts` (ré-exports), `tests/unit/state.test.ts` (T003).

---

## Phase 1 : Setup

- [X] T001 Baseline verte avant modification : `npm run test` + `npm run lint` + `npm run build` au vert ; repérer les tests `state`/`tick`/`genesis`/`death` existants servant de socle.

---

## Phase 2 : Foundational (prérequis bloquants)

**⚠️ Bloque US1, US2 et US3.** Ajoute le **champ** journal + versionnage, sans émission ni reconstruction.

- [X] T002 [P] `src/core/model/event.ts` : définir le type `PopulationEvent` (`birth`/`death`/`couple`/`divorce`, datés à l'`year`). Ré-exporter via `src/core/index.ts`.
- [X] T003 `tests/unit/state.test.ts` (étendre, **avant** T004) : `AppState.history` survit au round-trip `serializeFull`/`serializeData`→`parseImport` ; un fichier **sans** `history` ⇒ `history = []` (rétro-compat) ; `FORMAT_VERSION === 3`. Seed fixe.
- [X] T004 `src/core/state/serialize.ts` : ajouter `history: PopulationEvent[]` à `AppState` **et** `DataState` ; bump `FORMAT_VERSION` 2→3 ; `createInitialState` initialise `history: []` ; `extractData`/`mergeData` incluent `history` ; `deserializeState` + branches `data`/`full` de `parseImport` **défautent** `history → []`. Ré-export. Dépend de T002, T003.

**Checkpoint** : `AppState.history` existe, sérialisé/désérialisé, rétro-compatible.

---

## Phase 3 : User Story 1 — Sandbox isolé, reproduction manuelle, make it real (Priority: P1) 🎯 MVP

**Goal** : un bac à sable isolé (copie de l'état réel) ; reproduction manuelle (mode → sélection → nb
enfants → valider/annuler) ; « make it real » (transfert) ; reset ; **retrait** de la repro manuelle de
la page principale.

**Independent Test** : ouvrir la sandbox, entrer en mode repro, sélectionner 2 individus, choisir un
nombre d'enfants, valider ⇒ enfants créés **dans la sandbox**, population réelle inchangée ; « make it
real » ⇒ enfants présents dans le réel ; page principale **sans** reproduction manuelle (cf. quickstart US1).

### Tests cœur (écrits AVANT — Principe V)

- [X] T005 [US1] `tests/unit/sandbox.test.ts` (nouveau) : `manualReproduce(state, parentIds, count, birthYear, rng)` — produit **exactement `count`** enfants (≥ 1) depuis les parents, pose `parents`/`enfants`, émet `count` événements `birth{year:birthYear}`, **ne mute pas** l'entrée (INV-S1/S4) ; `count < 1` ou `parentIds` vide ⇒ **no-op** ; déterminisme à seed fixe (INV-S10). Réutilise le moteur `reproduce`.

### Implémentation cœur (pur)

- [X] T006 [US1] `src/core/sandbox/sandbox.ts` (nouveau) : implémenter `manualReproduce` (réutilise `reproduce` Feature 2 ; chaque enfant `dateNaissance` = jour aléatoire de `birthYear` via le RNG ; pose la parenté ; ajoute les `birth` à `history`). Ré-export `src/core/index.ts`. Dépend de T004, T005.

### Implémentation UI

- [X] T007 [US1] `src/ui/stores/sandboxStore.ts` (nouveau) : état sandbox **isolé** (`AppState` copié de l'état réel + RNG **forké** `createRngFromState`) ; `enterSandbox()` (snapshot), `resetSandbox()` (re-snapshot), `makeItReal()` (stores réels ← état sandbox, `engineRng = createRngFromState(sandbox.rngState)`) ; **état du mode repro** (`active`, `selected:Set`, `childCount`, `lastParents`) + `startManualRepro()`/`toggle(id)`/`setChildCount(n)`/`validate()` (→ `manualReproduce`, puis sortie du mode + vidage, mémorise `lastParents`)/`cancel()`/`reselectLastParents()` (ignore les absents). Dépend de T006.
- [X] T008 [US1] `src/ui/views/SandboxView.svelte` (nouveau) : écran sandbox réutilisant le rendu liste/fiche ; bouton **mode repro**, (dé)sélection au clic, champ **nombre d'enfants** (≥ 1), boutons **« valider »**/**« annuler »**/**« re-sélectionner les derniers parents »**, et boutons **« make it real »**/**« reset »** ; messages FR. Dépend de T007.
- [X] T009 [US1] `src/ui/stores/appState.ts` + `src/ui/views/ListeView.svelte` : **retirer** la reproduction manuelle de la page principale (`selectedIds`/`toggleSelect`/`reproduceSelected` et l'UI associée) ; ajouter l'**accès à la sandbox** (navigation/vue). Dépend de T007.

**Checkpoint** : US1 testable seule (sandbox isolée, repro manuelle, make it real, reset ; page principale nettoyée).

---

## Phase 4 : User Story 2 — Création, clonage, édition, suppression (Priority: P2)

**Goal** : créer un individu personnalisé (autonome), cloner (attributs sans parenté), éditer directement
les attributs, supprimer (refus si descendants ; propagation conjoint/parents/couples).

**Independent Test** : créer/cloner/éditer un individu dans la sandbox ; supprimer un individu sans
descendant ⇒ disparaît de partout (conjoint redevient célibataire/divorcé, parents perdent l'enfant) ;
suppression refusée si descendants (cf. quickstart US2).

### Tests cœur (écrits AVANT — Principe V)

- [X] T010 [US2] `tests/unit/sandbox.test.ts` (étendre) : `createPerson`/`clonePerson` produisent un individu **autonome** (`parents`/`enfants`/`conjoints` vides ; clone sans liens — INV-S5) ; `editPerson` modifie des **attributs** sans toucher la parenté ; `deletePerson` **refuse** si `enfants.length > 0`, sinon retire l'id **partout** + propagation : parent perd l'id dans `enfants`, conjoint repasse à l'état antérieur, couple dissous/réduit (INV-S6/S7). Ne mute pas l'entrée. Seed fixe.

### Implémentation cœur (pur)

- [X] T011 [US2] `src/core/sandbox/sandbox.ts` (étendre) : `createPerson(state, draft, newId)`, `clonePerson(state, sourceId, newId)`, `editPerson(state, id, patch)`, `deletePerson(state, id): Result<AppState>` (propagation conjoints/parents/couples ; `Err` si descendants/introuvable). Ré-export. Dépend de T006, T010.

### Implémentation UI

- [X] T012 [US2] (corrigé via T026 — BUG-001 volet A) `src/ui/views/SandboxView.svelte` : UI de **création** (tous attributs), **clonage**, **édition directe** des attributs, et **suppression** (bouton désactivé / message FR si descendants). Dépend de T008, T011. **Correctif livré** : le formulaire complet (ADN/traits, pouvoirs avec profil sans-pouvoir / mutation forte / normale, `raisonDeces`) est extrait dans `SandboxPersonForm.svelte` (T026).

**Checkpoint** : US1 + US2 fonctionnelles indépendamment.

---

## Phase 5 : User Story 3 — Navigation temporelle & reconstruction historique (Priority: P3)

**Goal** : journal d'événements **émis** par genèse/tick/mort ; sélecteur d'année [départ, courante] ;
**reconstruction historique complète** ; enfants de repro manuelle nés dans l'année sélectionnée.

**Independent Test** : sélectionner une année antérieure ⇒ seuls les individus nés ≤ année, couples/
divorces/décès tels qu'à l'année ; reproduire manuellement ⇒ enfants nés dans l'année sélectionnée (cf.
quickstart US3).

### Tests cœur (écrits AVANT — Principe V)

- [X] T013 [US3] `tests/unit/history.test.ts` (nouveau) : `generateInitialPopulation` émet un `birth{year:birthYear}` par individu ; `tick` émet `birth`/`couple`/`divorce` à `currentYear` ; `kill` émet `death` à `currentYear`. Seed fixe.
- [X] T014 [US3] `tests/unit/reconstruct.test.ts` (nouveau) : `reconstructAtYear(state, Y)` — individus nés ≤ Y seulement ; un individu mort en D apparaît **vivant** pour Y < D et **décédé** pour Y ≥ D ; couple formé en F absent pour Y < F, présent si non dissous ≤ Y ; **couple dont un membre meurt en D : actif pour Y < D, dissous (conjoints « ex ») pour Y ≥ D** (le décès dissout le couple sans `divorce` — C1) ; repli sans journal (INV-S8) ; **pure** (ne mute pas l'entrée, INV-S9). Seed fixe.

### Implémentation cœur (pur)

- [X] T015 [US3] `src/core/genesis/genesis.ts` : émettre les événements `birth` (année de genèse) pour le batch initial ; renvoyer/peupler `history`. Dépend de T013.
- [X] T016 [US3] `src/core/time/tick.ts` : émettre `birth` (naissances), `couple` (formations), `divorce` (dissolutions) à `currentYear`, en étendant `history`. Dépend de T013.
- [X] T017 [US3] `src/core/life/death.ts` : émettre `death{year:currentYear}` ; étendre `history`. Dépend de T013.
- [X] T018 [US3] `src/core/sandbox/reconstruct.ts` (nouveau) : `reconstructAtYear(state, year): AppState` (projection pure depuis `history` ; un couple est actif à `year` seulement si formé ≤ year, non `divorce ≤ year`, **et aucun membre mort ≤ year** — C1, conjoints « ex » sinon ; repli `yearOf(dateNaissance)` sans journal). Ré-export. Dépend de T014.

### Implémentation UI

- [X] T019 [US3] `src/ui/views/SandboxView.svelte` + `src/ui/stores/sandboxStore.ts` : **sélecteur d'année** borné `[birthYear, currentYear]` ; l'affichage applique `reconstructAtYear` ; la reproduction manuelle utilise l'**année sélectionnée** comme `birthYear`. Dépend de T018, T008.

**Checkpoint** : les 3 user stories sont indépendamment fonctionnelles.

---

## Phase 6 : Polish & transverse

- [X] T020 [P] `tests/unit/core-purity.test.ts` : vérifier que `src/core/sandbox/*` et l'émission du journal restent **purs** (aucun `Date`/`Math.random`/DOM) ; la garde scanne déjà `src/core` — confirmer la couverture.
- [X] T021 [P] `src/ui/views/SandboxView.svelte` (+ `src/app.css` si besoin) : styles **responsive** (mobile → desktop) de l'écran sandbox et de ses contrôles.
- [X] T022 Dérouler `specs/007-sandbox-make-it-real/quickstart.md` (validation manuelle US1/US2/US3 + isolation/déterminisme). **Validé par l'utilisateur 2026-06-18.**
- [X] T023 Portes de qualité : `npm run test` + `npm run lint` + `npm run build` **verts** ; bundle déployable (Principe II).

---

## Phase 7 : Correctifs (bugfix)

**Bugfix**: 2026-06-17 — BUG-001 (volet A : formulaire incomplet ; volet B : édition du cycle de vie
conjugal) + BUG-002 (parité de filtrage sandbox). Voir `bugs/BUG-001.md`, `bugs/BUG-002.md`.

### BUG-001 volet A — Formulaire complet (UI seule ; cœur inchangé)

- [X] T026 [US2] (BUG-001 vA) `src/ui/components/SandboxPersonForm.svelte` (nouveau, utilisé par `SandboxView.svelte`) : exposer dans la création/édition les attributs manquants — **ADN/traits** (éditeur de traits par type, actif + résilience), **pouvoirs** avec **profil** (sans-pouvoir / mutation forte / mutation normale, puissance/maîtrise éditables), et **`raisonDeces`** (visible quand `vivant = false`). Mappe vers `PersonDraft`/`PersonPatch`. Lève T012.

### BUG-001 volet B — Édition du cycle de vie conjugal (cœur pur + UI)

- [X] T024 [US2] (BUG-001 vB) `tests/unit/sandbox.test.ts` (étendre, **avant** T025) : `formCouple(state, aId, bId, year)` pose des conjoints **« actuel » symétriques** + un `Couple` + émet `couple{year}` (Err si même id / introuvable / déjà en couple) ; `divorceCouple(state, coupleId, year)` passe les conjoints en **« ex »**, désactive le couple, émet `divorce{year}` ; `dissolveConjugalLink(state, coupleId)` **retire** le lien symétrique (retour célibataire) et **purge** les événements `couple`/`divorce` du couple ; aucune ne touche `parents`/`enfants` ; **ne mute pas** l'entrée ; cohérence `reconstructAtYear` (INV-S12). Seed fixe. **(8 tests, verts)**
- [X] T025 [US2] (BUG-001 vB) `src/core/sandbox/sandbox.ts` (étendre) : implémenter `formCouple`/`divorceCouple`/`dissolveConjugalLink` (purs, `Result<AppState>`, liens symétriques, `couples` cohérent, émission/purge d'événements). Ré-export `src/core/index.ts`. Dépend de T011, T024.
- [X] T027 [US2] (BUG-001 vB) `src/ui/views/SandboxView.svelte` + `src/ui/stores/sandboxStore.ts` : panneau **« Couples & cycle de vie conjugal »** (former un couple entre 2 individus, divorcer/séparer, dissoudre) appelant les fonctions cœur à l'**année sélectionnée** ; messages FR sur `Err`. Dépend de T025, T019.

### BUG-002 — Parité de filtrage sandbox (UI seule)

- [X] T028 [US3] (BUG-002) `src/ui/views/SandboxView.svelte` : intégrer **`FilterBar`** + le moteur pur **`filterPopulation`** (Feature 4/5) appliqué à la population **reconstruite** (`reconstructAtYear`), avec défaut dynamique « dernière génération » ; en **mode reproduction manuelle**, la sélection de parents (Set) reste **indépendante** du filtrage (les parents masqués restent sélectionnés). Dépend de T019.

### Validation du correctif

- [X] T029 (bugfix) Étendre `quickstart.md` (scénarios : formulaire complet, édition couples, filtres sandbox) + portes de qualité `npm run test` (**243 verts**) + `npm run lint` (**clean**) + `npm run build` (**OK, 176 kB**).

**Checkpoint** : BUG-001 (A+B) et BUG-002 corrigés, testés (cœur à seed fixe pour vB), portes vertes.

---

## Dependencies & Execution Order

### Dépendances de phase

- **Setup (T001)** avant tout.
- **Foundational (T002–T004)** avant US1/US2/US3.
- **Polish (T020–T023)** en dernier.

### Dépendances par story

- **US1 (P1, MVP)** : T005 (test) → T006 → T007 → T008 → T009.
- **US2 (P2)** : T010 (test) → T011 (après T006) → T012 (après T008).
- **US3 (P3)** : T013/T014 (tests) → T015 ‖ T016 ‖ T017 (fichiers distincts) → T018 → T019 (après T008).
- **Correctifs (Phase 7)** : BUG-001 vA → T012 (rouverte) ‖ T026 (après T012) ; BUG-001 vB → T024 (test) →
  T025 (après T011) → T027 (après T025, T019) ; BUG-002 → T028 (après T019) ; validation → T029 (en dernier).

### Même fichier (séquentiel, pas de [P])

- `src/core/state/serialize.ts` : T004.
- `src/core/sandbox/sandbox.ts` : T006 → T011.
- `tests/unit/sandbox.test.ts` : T005 → T010.
- `src/ui/stores/sandboxStore.ts` : T007 → T019.
- `src/ui/views/SandboxView.svelte` : T008 → T012 → T019.
- `src/core/index.ts` : ré-exports ajoutés par T002/T004/T006/T011/T018 (séquentiels).

## Parallel Opportunities

- **Foundational** : T002 [P] (nouveau fichier) pendant la préparation de T003.
- **US3 cœur** : T015 ‖ T016 ‖ T017 (genèse/tick/mort = fichiers distincts) après les tests T013/T014.
- **Polish** : T020 ‖ T021 (fichiers distincts).
- Les tests d'une story peuvent être écrits pendant que l'UI de la story précédente est finalisée.

## Parallel Example: US3 cœur

```text
Tâche T015 : émission birth (src/core/genesis/genesis.ts)
Tâche T016 : émission birth/couple/divorce (src/core/time/tick.ts)
Tâche T017 : émission death (src/core/life/death.ts)
```

## Implementation Strategy

### MVP (US1 seule)

1. Setup (T001) → Foundational (T002–T004).
2. US1 (T005–T009) → **STOP & VALIDATE** : sandbox isolée, repro manuelle, make it real, reset ; page
   principale nettoyée.
3. Démo possible (bac à sable + promotion).

### Livraison incrémentale

1. Setup + Foundational → `AppState.history` + versionnage.
2. + US1 (sandbox + make it real) → tester → démo (MVP).
3. + US2 (création/clonage/édition/suppression) → tester → démo.
4. + US3 (journal émis + reconstruction + navigation temporelle) → tester → démo.

## Notes

- Tests **cœur obligatoires à seed fixe** (Principe V) : T003, T005, T010, T013, T014 (+ pureté T020).
  Écrits **avant** l'implémentation correspondante.
- **Cœur pur** (Principe IV) : sandbox/reconstruction/émission dans `src/core` ; **horloge** (jour de
  naissance) via le **RNG** (pas `Date`) ; l'UI détient l'écran et l'état d'interface du mode repro.
- **Isolation** (INV-S1) : les stores réels ne changent qu'au « make it real ».
- **Complexité justifiée** : le **journal d'événements daté** (Phase 2 + US3) est requis par la
  reconstruction historique (cf. plan.md › Complexity Tracking).
- **Aucune dépendance ajoutée** (Principe VIII). **Anonymat** (Principe X) : commits `KingsCookie`, email
  vide ; `main` reste déployable.
