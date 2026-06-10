---
description: "Task list — Feature 003 Avancement du temps & dynamique de population"
---

# Tasks: Avancement du temps & dynamique de population

**Input**: Design documents from `specs/003-avancement-temps-population/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: INCLUS — la constitution (Principe V) rend les tests du cœur **obligatoires** (seed fixe).
Les tests du cœur sont écrits **avant** leur implémentation.

**Organization**: tâches groupées par user story (US1 P1, US2 P2, US3 P3). Étend les Features 1 & 2.

## Format: `[ID] [P?] [Story?] Description`

- **[P]** : parallélisable (fichiers différents, pas de dépendance non satisfaite).
- **[Story]** : US1 / US2 / US3 (uniquement pour les phases user story).
- Chemins relatifs à la racine du dépôt.

## Path Conventions

Projet unique, deux couches : cœur pur `src/core/`, UI Svelte `src/ui/`, tests `tests/unit/`.

---

## Phase 1: Setup

**Purpose**: la stack et le projet existent déjà (Features 1-2) ; rien à initialiser. Cette feature
**étend** le cœur et l'UI sans nouvelle dépendance (Principe VIII).

- [x] T001 Vérifier l'état de départ : `npm install`, `npm run test` (Features 1-2 vertes, 90 tests) avant d'étendre.

---

## Phase 2: Foundational (prérequis bloquants — AVANT toute user story)

**Purpose**: sérialisation de l'état du RNG, paramètres d'espèce/consanguinité, entité Couple et état étendu
(année courante, couples, état RNG) — requis par toutes les user stories.

**⚠️ Aucune user story ne peut démarrer avant la fin de cette phase.**

- [x] T002 [P] Ajouter `getState(): string[]` à l'interface `Rng` et à `createRng`, plus `createRngFromState(state)` dans `src/core/rng/rng.ts` ; exposer via `src/core/rng/index.ts` et la façade `src/core/index.ts` (FR-021, R2).
- [x] T003 [P] Test sérialisation RNG dans `tests/unit/rng-state.test.ts` : `createRngFromState(r.getState())` produit la **même suite** que `r` ; `getState` ne consomme pas d'aléatoire.
- [x] T004 [P] Étendre `Espece` (paramètres de reproduction) dans `src/core/model/espece.ts` : `reproStartAge`, `reproPeakAge`, `reproEndAge`, `reproPeakPct`, `reproSlope`, `groupSize`, `litterMin`, `litterMax`, `litterExtraPct`, `divorcePct` (cf. data-model).
- [x] T005 [P] Renseigner les **défauts humain** (18/25/50, pic 40 %, pente 8, groupe 2, M1/N4/X15 %, divorce 0 %) dans `defaultEspece`/`defaultEspeces` (`src/core/catalog/defaultCatalog.ts`).
- [x] T006 [P] Ajouter `consanguinityAllowed: boolean` (défaut `false`) à `Parameters` + `defaultParameters()` dans `src/core/params/parameters.ts`.
- [x] T007 [P] Créer l'entité `Couple` dans `src/core/model/couple.ts` (`id`, `memberIds[]`, `reproPct: number | null`) ; l'exporter via `src/core/model/index.ts`.
- [x] T008 Étendre l'état dans `src/core/state/serialize.ts` : `AppState` gagne `currentYear`, `couples`, `rngState` ; `FORMAT_VERSION = 2` ; `deserializeState` accepte `formatVersion: 1` avec défauts sûrs (currentYear = birthYear, couples = [], rngState ré-amorcé) — INV-11 ; `createInitialState` initialise les nouveaux champs.
- [x] T009 [P] Test compatibilité/round-trip de base dans `tests/unit/state.test.ts` : sérialisation inclut `currentYear`/`couples`/`rngState` ; import d'un fichier `formatVersion: 1` réussit avec défauts (INV-11).

**Checkpoint**: RNG sérialisable + paramètres d'espèce + Couple + état étendu prêts — les user stories peuvent commencer.

---

## Phase 3: User Story 1 - Avancer le temps : reproduction automatique annuelle (Priority: P1) 🎯 MVP

**Goal**: « avancer de X années » applique le tick annuel déterministe (gaussienne → candidats →
appariement → portées) + vieillissement + date courante ; les nouveaux couples se reproduisent dès l'année.

**Independent Test**: avancer d'1 an sur une population à seed fixe ⇒ des couples se forment et produisent
des portées (enfants reliés, nés dans l'année), tout le monde vieillit d'1 an ; rejouer ⇒ identique.

### Tests (écrits AVANT l'implémentation — Principe V)

- [x] T010 [P] [US1] Tests gaussienne dans `tests/unit/gaussian.test.ts` : `reproProbability` = 0 hors [début, fin], maximum `reproPeakPct` au pic, décroissance symétrique (R3).
- [x] T011 [P] [US1] Tests portée dans `tests/unit/litter.test.ts` : `litterSize` ∈ [M, N] ; procédure « M garantis + X % » (INV-3) ; X=0 ⇒ M ; X=100 ⇒ N.
- [x] T012 [P] [US1] Tests appariement dans `tests/unit/pairing.test.ts` : **non-inter-espèces** (INV-5), **anti-consanguinité** parents/grands-parents (INV-4), candidats non appariés reportés (FR-008), déterminisme (même seed ⇒ mêmes couples). *(Le genre n'intervient pas en F3 — décision A1 ; pas d'assertion de genre.)*
- [x] T013 [P] [US1] Tests tick (chemin normal) dans `tests/unit/tick.test.ts` : déterminisme (INV-1), vieillissement + `currentYear += 1` (INV-2), formation de couples + portées, nouveau couple reproduit **dès l'année de formation**, parenté symétrique (INV-9).

### Implementation (cœur)

- [x] T014 [P] [US1] Gaussienne dans `src/core/repro/gaussian.ts` : `reproProbability(age, espece)` (cloche tronquée, pure) — dépend de T004.
- [x] T015 [P] [US1] Portée dans `src/core/repro/litter.ts` : `litterSize(espece, rng)` (M + boucle X % ≤ N) — dépend de T004.
- [x] T016 [P] [US1] Sélection des candidats dans `src/core/repro/candidates.ts` : éligibilité (vivant, célibataire/divorcé, `âge ≤ reproEndAge`) + volonté via `reproProbability` ; ordre stable (R4) — dépend de T014.
- [x] T017 [US1] Appariement dans `src/core/repro/pairing.ts` : `formCouples(candidateIds, population, params, especeById, rng, nextCoupleId)` — mélange déterministe, groupes de `groupSize`, **même espèce**, anti-consanguinité (parents/grands-parents), non appariés reportés (R5/R6). **Le genre n'est pas une contrainte en F3** (décision A1, reporté) — dépend de T002, T007.
- [x] T018 [US1] Tick annuel & avance dans `src/core/time/tick.ts` : `tick(state, rng)` (chemin **normal** : candidats → appariement → reproduction des nouveaux couples via `litterSize` + `reproduce` F2, parenté posée, `currentYear += 1`) et `advanceYears(state, years, rng)` (boucle X fois, persiste `rngState`) — dépend de T015, T016, T017, et `reproduce` (F2). *(Divorce & couples existants ajoutés en US2.)*
- [x] T019 [US1] Exposer via la façade `src/core/index.ts` : `reproProbability`, `litterSize`, `formCouples`, `tick`, `advanceYears` (+ types `Couple`).

### Implementation (UI)

- [x] T020 [US1] Store : avance du temps dans `src/ui/stores/appState.ts` — `currentYear`, `couples`, action `advanceYears(X)` (construit le `Rng` depuis `rngState`/seed, appelle `advanceYears`, met à jour population/couples/année/rngState).
- [x] T021 [US1] Composant `src/ui/components/TimeBar.svelte` : champ **X (≥ 1)** + bouton **« avancer de X ans »** + affichage de la **date/année courante**.
- [x] T022 [US1] Brancher l'année courante dans `src/ui/views/ListeView.svelte` (âge calculé sur `currentYear`) et insérer `TimeBar` ; la colonne âge reflète l'avance.

**Checkpoint**: US1 fonctionnelle et testable seule (MVP de la simulation temporelle).

---

## Phase 4: User Story 2 - Cycle de vie des couples : divorces & reproduction des couples (Priority: P2)

**Goal**: les couples existants se reproduisent d'année en année et peuvent divorcer (ex-conjoints).

**Independent Test**: divorce 100 % ⇒ tous les couples dissous en 1 an (ex-conjoints) ; taux de repro de
couple élevé ⇒ portées annuelles des couples existants.

- [x] T023 [P] [US2] Tests divorce & repro des couples dans `tests/unit/tick.test.ts` : divorce 0 % ⇒ 0 divorce, 100 % ⇒ tous dissous + conjoints en `ex` (INV-7) ; couple existant produit une portée selon `reproPct ?? gaussienne` ; un couple ne se reproduit qu'en son sein.
- [x] T024 [US2] Étendre `src/core/time/tick.ts` : (1) **divorces** en début de tick (`chance(espèce.divorcePct)` → couple retiré, conjoints `actuel` → `ex`) ; (4 bis) **reproduction des couples existants** (`chance(reproPct ?? reproProbability(âge moyen))`) ⇒ portée. **Ordre §6.6 respecté** : divorces → candidats/appariement (nouveaux couples) → reproduction nouveaux couples → reproduction couples existants → avance. Dépend de T018.
- [x] T025 [US2] Mise à jour des conjoints (actuel/ex) côté store dans `src/ui/stores/appState.ts` : refléter formations/divorces dans la population affichée.
- [x] T026 [US2] Édition du **% de reproduction par couple** (FR-011) dans `src/ui/views/FicheView.svelte` : afficher les conjoints actuels/ex et permettre de régler `reproPct` du couple (sinon hérité de la gaussienne).

**Checkpoint**: US1 + US2 — cycle de vie complet des couples exerçable.

---

## Phase 5: User Story 3 - Mort manuelle (Priority: P3)

**Goal**: tuer un individu (cause obligatoire) ; il reste marqué décédé et ne se reproduit plus.

**Independent Test**: depuis une fiche, tuer avec une cause ⇒ statut décédé ; aux avancements suivants,
exclu de la reproduction ; tuer sans cause ⇒ refusé.

- [x] T027 [P] [US3] Tests mort dans `tests/unit/death.test.ts` : cause vide ⇒ refus (aucune mutation) ; cause valide ⇒ `vivant=false` + `raisonDeces` ; mort exclu des candidats/couples ; dissolution du couple si un membre meurt (INV-8).
- [x] T028 [US3] Mort manuelle dans `src/core/life/death.ts` : `kill(state, personId, cause)` (cause obligatoire, dissout le couple éventuel, conjoints `actuel` → `ex`) ; exposer via la façade `src/core/index.ts`.
- [x] T029 [US3] Exclusion des morts dans `src/core/repro/candidates.ts` (déjà filtrés `vivant`) — vérifier/garantir l'invariant au tick.
- [x] T030 [US3] UI : action **« tuer »** dans `src/ui/views/FicheView.svelte` (saisie de cause obligatoire) + affichage du statut **décédé** et de la cause ; action `kill` dans `src/ui/stores/appState.ts`.

**Checkpoint**: les 3 user stories fonctionnent indépendamment.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: continuation déterministe, performance, responsive, portes de la constitution.

- [x] T031 [P] Test continuation/round-trip dans `tests/unit/state.test.ts` : export → import (avec `rngState`/`currentYear`/`couples`) ⇒ état **égal** ; `advanceYears` après import = même résultat qu'une session continue (INV-10 / SC-008).
- [x] T032 [P] Test de performance dans `tests/unit/perf.test.ts` : avancer **1 an sur ~1 000 individus < ~1 s** (SC-009).
- [x] T033 [P] Styles responsive pour `TimeBar`, le statut décédé et l'édition de couple (mobile → desktop) dans `src/app.css` et composants.
- [x] T034 Vérifier les portes de la constitution : pureté du cœur (la garde `core-purity.test.ts` couvre `repro/`, `time/`, `life/` ; aucun `Math.random`/`Date`/`crypto` ; `Math.exp` autorisé) ; dérouler le smoke test de `quickstart.md` ; `npm run lint` + `npm run build` verts.
- [x] T035 [US1] (BUG-001) Séparer les **pouvoirs multiples** par ` || ` (au lieu de `, `) dans `src/ui/views/ListeView.svelte` (FR-022).

**Bugfix**: 2026-06-10 — BUG-001 Ajout de T035 (séparateur ` || ` des pouvoirs multiples dans la liste).

---

## Dependencies & Execution Order

- **Setup (Phase 1)** : T001 d'abord.
- **Foundational (Phase 2)** : T002-T009 — **bloque** toutes les user stories ; T002 (RNG state) avant T017 ; T007 (Couple) avant T017 ; T004 (Espece) avant T014/T015/T016.
- **User Stories (Phases 3-5)** :
  - US1 (P1) : aucune dépendance inter-stories.
  - US2 (P2) : **étend** `tick.ts` (T024 dépend de T018).
  - US3 (P3) : indépendante (action sur un individu) ; testable seule.
- **Polish (Phase 6)** : après les user stories visées.

### Au sein d'une user story
- Les **tests** (T010-T013, T023, T027, T031) sont écrits **avant** l'implémentation correspondante.
- Cœur avant UI : gaussienne/portée/candidats/appariement → `tick` → store → écrans.

## Parallel Opportunities

- **Phase 2** : T002, T004, T005, T006, T007 en parallèle ; T003 après T002 ; T009 après T008.
- **US1 (tests)** : T010, T011, T012, T013 en parallèle.
- **US1 (cœur)** : T014 ‖ T015 ; puis T016 (dépend T014) ; T017 (dépend T002/T007) ; puis T018 (dépend T015/T016/T017) ; UI T020→T021/T022.
- **Polish** : T031, T032, T033 en parallèle.

### Exemple (US1)
```text
# Tests d'abord :
T010 gaussian · T011 litter · T012 pairing · T013 tick
# Puis cœur :
T014 gaussian.ts ‖ T015 litter.ts
T016 candidates.ts (dépend T014)
T017 pairing.ts (dépend T002/T007)
T018 tick.ts (dépend T015/T016/T017 + reproduce F2)
# Puis UI :
T020 store → T021 TimeBar / T022 ListeView
```

## Implementation Strategy

- **MVP = User Story 1** : Setup + Foundational + Phase 3 → avancer le temps, voir couples & naissances
  déterministes + vieillissement. S'arrêter, valider, éventuellement déployer.
- **Incréments** : US2 (divorces & repro des couples), puis US3 (mort manuelle), chacun testable et
  déployable séparément.
- **Polish** en dernier (continuation déterministe, perf, responsive, portes constitution).

## Notes

- `rsrc/DescriptionProjet.md` est la source de vérité ; §6.5/§6.6/§6.7/§9.4 respectés.
- Tout l'aléatoire passe par le `Rng` injecté ; l'**état du RNG** est sérialisé (FR-021) ⇒ continuation
  déterministe après import.
- Réutiliser `reproduce` (Feature 2) pour chaque enfant d'une portée (pas de duplication du moteur).
- **Décision A1** : le **genre** n'impacte pas l'appariement en F3 (contraintes de genre reportées).
- **Décision C1** : le paramètre **consanguinité** est exposé au niveau **modèle & export/import** (T006) ;
  son **édition dans l'écran des paramètres** relève de la **Feature 5** (aucune tâche UI en F3).
- Aucune donnée personnelle dans le code/commits (Principe X) ; `main` reste déployable.
- Commit après chaque tâche ou groupe logique.
