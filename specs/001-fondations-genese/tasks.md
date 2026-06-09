---
description: "Task list — Feature 001 Fondations & Genèse de la population"
---

# Tasks: Fondations & Genèse de la population

**Input**: Design documents from `specs/001-fondations-genese/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: INCLUS — la constitution (Principe V « Tests déterministes du cœur ») rend les tests du cœur
**obligatoires**. Les tâches de test du cœur sont écrites **avant** leur implémentation (seed fixe).

**Organization**: tâches groupées par user story (US1 P1, US2 P2, US3 P3) pour une livraison incrémentale.

## Format: `[ID] [P?] [Story?] Description`

- **[P]** : parallélisable (fichiers différents, pas de dépendance non satisfaite).
- **[Story]** : US1 / US2 / US3 (uniquement pour les phases user story).
- Chemins relatifs à la racine du dépôt.

## Path Conventions

Projet unique, deux couches : cœur pur `src/core/`, UI Svelte `src/ui/`, tests `tests/unit/`.

---

## Phase 1: Setup (infrastructure partagée)

**Purpose**: initialiser le projet statique PWA (TS + Vite + Svelte + Vitest) et la CI Pages.

- [x] T001 Initialiser le projet npm dans `package.json` (TypeScript, Vite, Svelte, `@sveltejs/vite-plugin-svelte`, Vitest, `vite-plugin-pwa`) — **sans champ `author` nominatif** (Principe X), scripts `dev`/`build`/`preview`/`test`/`test:watch`.
- [x] T002 [P] Configurer TypeScript strict dans `tsconfig.json`.
- [x] T003 [P] Configurer Vite dans `vite.config.ts` : plugin Svelte, `vite-plugin-pwa` (manifeste + SW precache), **`base` lue depuis une variable d'env** (`/<repo>/` en prod, `/` en local).
- [x] T004 [P] Configurer Vitest dans `vitest.config.ts` (environnement node pour le cœur).
- [x] T005 [P] Configurer lint/format (ESLint + Prettier) dans `.eslintrc`/`.prettierrc` (porte de qualité « lint »).
- [x] T006 Créer l'arborescence `src/core/`, `src/ui/`, `tests/unit/`, `public/` (avec un `src/main.ts` minimal et `src/app.css`).
- [x] T007 [P] Ajouter le workflow CI `.github/workflows/deploy.yml` : `install → test → build (base=/<repo>/) → upload-pages-artifact → deploy-pages` sur push `main`.
- [x] T008 [P] Préparer les assets PWA : `public/icons/` et `public/404.html` (copie d'`index.html` pour le repli de routing Pages).

---

## Phase 2: Foundational (prérequis bloquants — AVANT toute user story)

**Purpose**: socle déterministe + modèle de données, requis par toutes les user stories.

**⚠️ Aucune user story ne peut démarrer avant la fin de cette phase.**

- [x] T009 [P] Définir les types du domaine dans `src/core/model/` (`traitType.ts`, `trait.ts`, `adn.ts`, `pouvoir.ts`, `personne.ts`, `espece.ts`) conformément à `data-model.md`.
- [x] T010 Implémenter le **PRNG seedé déterministe** dans `src/core/rng/rng.ts` : `createSeed()` (seul point d'entropie, isolé), `createRng(seed)`, `nextU64/nextFloat/nextInt/chance/pick/pickWeighted` (SplitMix64 + xoshiro256\*\*, seed BigInt 64 bits) — contrat `contracts/core-api.md`.
- [x] T011 [P] Test déterminisme RNG dans `tests/unit/rng.test.ts` : même seed ⇒ même séquence ; `nextInt` sans biais ; `chance(0)`/`chance(100)`.
- [x] T012 [P] Catalogues par défaut dans `src/core/catalog/defaultCatalog.ts` : embarquer les 6 listes de traits (issues de `rsrc/ExempleTraits/`) **et** l'**espèce par défaut « humain »** avec son ensemble de **genres incluant le genre spécial « tout »** (FR-007, FR-011), en données du bundle.
- [x] T013 [P] Paramètres + valeurs par défaut dans `src/core/params/parameters.ts` (`batchSize=100`, `birthYear=0`, `powerChancePct=0`, `initialResilience`, `traitTypeWeights`, `templateWeights` AE majoritaire).
- [x] T014 [P] Test de **pureté du cœur** dans `tests/unit/core-purity.test.ts` : aucun import de `svelte`, DOM, `window`, `Date`, `crypto`, ni `Math.random` sous `src/core/` (hors `createSeed`).

**Checkpoint**: socle prêt — les user stories peuvent commencer.

---

## Phase 3: User Story 1 - Génération déterministe + liste (Priority: P1) 🎯 MVP

**Goal**: générer un batch initial déterministe et l'afficher en liste ; reproductibilité par seed.

**Independent Test**: régler seed/effectif/% pouvoir, générer, voir la liste ; régénérer (même seed) ⇒ identique ; changer la seed ⇒ différent ; 0 % ⇒ aucun pouvoir, 100 % ⇒ un pouvoir par individu (puissance/maîtrise ∈ [1,10]).

### Tests (écrits AVANT l'implémentation — Principe V)

- [x] T015 [P] [US1] Tests genèse + invariants dans `tests/unit/genesis.test.ts` : INV-1 (reproductibilité), INV-2 (puissance/maîtrise ∈ [1,10]), INV-3 (0 %/100 %), INV-4 (sans pouvoir ⇒ ADN/pouvoirs vides), INV-7 (âge 0, date dans l'année), **+ test statistique sur grand effectif (≥ 1 000) : proportion d'individus avec pouvoir à moins de 5 points de `powerChancePct` (SC-003)**.

### Implementation

- [x] T016 [P] [US1] Générateur de prénoms déterministe dans `src/core/genesis/names.ts` : tirage aléatoire (via `Rng`) dans deux listes embarquées **`rsrc/ExemplesPrenoms/prenoms_feminins.csv`** et **`rsrc/ExemplesPrenoms/prenoms_masculins.csv`** (genre féminin/masculin → liste correspondante ; genre « tout » ou autre → tirage de l'une des deux listes). Listes intégrées au bundle comme les catalogues (D9). *(Générateur plus poussé prévu pour une version future.)*
- [ ] T017 ⚠️ Reopened [P] [US1] Helpers dérivés dans `src/core/genesis/derived.ts` : `computeGeneration(birthYear)`, `computeAge(birthYear, currentYear)`, `powerLabel(power, catalog)`. *(reopened — BUG-001 : `powerLabel` doit formater **par gabarit** via le formateur partagé T035, cf. FR-024.)*
- [ ] T018 ⚠️ Reopened [P] [US1] Gabarit de mutation forte dans `src/core/powers/strongMutation.ts` : tirage pondéré du gabarit {AE,PE,PA,PR}, tirage pondéré des traits, `puissance`/`maitrise`=`nextInt(10)+1`, `null` si type requis vide. *(reopened — BUG-001 : le `label` stocké doit utiliser le formateur partagé T035 — FR-024.)*
- [ ] T035 [P] [US1] **Formateur de libellé par gabarit** dans `src/core/genesis/derived.ts` : `formatPowerLabel(template, { action, element, partie, etat, ajout, remplacement })` → AE `{action} {élément}`, PE `{partie} en {état}`, PA `{ajout} sur {partie}`, PR `{remplacement} à la place de {partie}` (FR-024). Réutilisé par `powerLabel` (T017) **et** `generateStrongMutationPower` (T018). *(BUG-001)*
- [ ] T036 [P] [US1] Tests du formateur dans `tests/unit/power-label.test.ts` : vérifier les **4 formats** AE/PE/PA/PR (ordre des traits + connecteurs « en / sur / à la place de ») et la cohérence `powerLabel` ↔ `label` stocké. *(BUG-001)*
- [x] T019 [US1] `generateInitialPopulation(params, catalog, rng)` dans `src/core/genesis/genesis.ts` (effectif, ids séquentiels, dates, ADN actif à `initialResilience`, au plus un pouvoir) — dépend de T009, T010, T012, T013, T016, T017, T018.
- [x] T020 [US1] Store d'état réactif dans `src/ui/stores/appState.ts` : enveloppe le cœur (paramètres, population), action **générer**, action **régénérer la seed** (`createSeed`).
- [x] T021 [US1] Écran paramètres `src/ui/views/ParametresView.svelte` : seed **affichée + éditable** + **bouton de régénération**, champs effectif/année/% pouvoir, bouton **Générer**.
- [x] T022 [US1] Écran liste `src/ui/views/ListeView.svelte` : une ligne par individu (**nom**, **date de naissance**, **âge**, **pouvoir(s)**).
- [x] T023 [US1] Coque applicative `src/ui/App.svelte` + `src/main.ts` : navigation entre Paramètres et Liste, branchement du store.

**Checkpoint**: US1 fonctionnelle et testable seule (MVP).

---

## Phase 4: User Story 2 - Fiche individu en lecture seule (Priority: P2)

**Goal**: inspecter un individu (infos globales + pouvoirs + traits actifs).

**Independent Test**: depuis la liste, ouvrir une fiche, vérifier la correspondance des données, revenir à la liste.

- [x] T024 [P] [US2] Test du modèle de vue fiche dans `tests/unit/fiche-vm.test.ts` : libellé de pouvoir, **génération** (tranche 20 ans), liste des traits actifs.
- [x] T025 [US2] Écran fiche `src/ui/views/FicheView.svelte` : nom, date de naissance, âge, **génération**, espèce, genre, statut vivant/décédé, pouvoir(s) avec puissance/maîtrise, traits actifs ; cas « sans pouvoir » explicite.
- [x] T026 [US2] Navigation liste → fiche → retour dans `src/ui/stores/appState.ts` et `src/ui/App.svelte` (sélection d'individu, conservation de l'état de liste).

**Checkpoint**: US1 + US2 fonctionnent indépendamment.

---

## Phase 5: User Story 3 - Sauvegarde/chargement par fichier (Priority: P3)

**Goal**: exporter l'état complet dans un fichier et le réimporter à l'identique (aucune auto-save).

**Independent Test**: générer, exporter, recharger (état vide), réimporter, vérifier l'égalité ; importer un fichier invalide ⇒ rejet propre sans altérer l'état.

### Tests (écrits AVANT l'implémentation — Principe V)

- [x] T027 [P] [US3] Tests sérialisation dans `tests/unit/state.test.ts` : INV-6 (round-trip `serialize`→`deserialize` égal), ordre de clés déterministe (deux états égaux ⇒ fichier identique), rejet d'un `kind`/`formatVersion` invalide.

### Implementation

- [x] T028 [US3] Sérialisation dans `src/core/state/serialize.ts` : `serializeState` (déterministe, `kind:"full"`, `formatVersion`), `deserializeState` (validation → `Result`) — contrat `contracts/state-file.md`.
- [x] T029 [US3] UI export/import `src/ui/components/StateIO.svelte` : téléchargement via `Blob`, import via `<input type=file>`, message d'erreur clair, **aucune** sauvegarde automatique.

**Checkpoint**: les 3 user stories fonctionnent indépendamment.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: performance, responsive, déploiement vérifié, documentation anonyme.

- [x] T030 [P] Test/bench de performance dans `tests/unit/perf.test.ts` : génération de **1 000 individus < 2 s** (SC-005).
- [x] T031 [P] Styles responsive (mobile → desktop) dans `src/app.css` et composants.
- [x] T032 [P] `README.md` **anonyme** (`KingsCookie`, sans email) : build, test, déploiement GitHub Pages, base path — lève le `TODO(README)` de la constitution.
- [x] T033 Vérifier les portes de la constitution : pureté du cœur (T014 vert), absence de `Math.random`, `package.json` sans `author` nominatif ; dérouler le smoke test de `quickstart.md`.
- [x] T034 [P] Vérifier le build statique avec `base=/<repo>/` + `404.html` via `npm run build && npm run preview` (déployabilité Pages).

---

## Dependencies & Execution Order

- **Setup (Phase 1)** : aucune dépendance — démarre immédiatement.
- **Foundational (Phase 2)** : dépend du Setup — **bloque** toutes les user stories.
- **User Stories (Phases 3-5)** : dépendent de la Phase 2.
  - US1 (P1) : aucune dépendance inter-stories.
  - US2 (P2) : s'appuie sur les données générées par US1 (réutilise le store et `powerLabel`/dérivés), mais reste testable seule sur une population existante.
  - US3 (P3) : indépendante (sérialise l'état produit par US1) ; testable seule via le cœur.
- **Polish (Phase 6)** : après les user stories visées.

### Au sein d'une user story
- Les **tests** (T015, T027) sont écrits et échouent **avant** l'implémentation correspondante.
- Cœur avant UI : modèles → genèse/sérialisation → store → écrans.

## Parallel Opportunities

- **Phase 1** : T002, T003, T004, T005, T007, T008 en parallèle (après T001 ; T006 avant les écritures de fichiers source).
- **Phase 2** : T009, T011, T012, T013, T014 en parallèle ; **T010 (RNG)** d'abord car T011 le teste et T019 en dépend.
- **US1** : T015 (test) ‖ ; puis T016, T017, T018 en parallèle ; T019 ensuite ; UI T020→T021/T022→T023.
- **Phase 6** : T030, T031, T032, T034 en parallèle.

### Exemple (US1)
```text
# Tests d'abord :
Tâche T015 : tests genèse (tests/unit/genesis.test.ts)
# Puis cœur en parallèle :
Tâche T016 : names.ts
Tâche T017 : derived.ts
Tâche T018 : strongMutation.ts
# Puis assemblage :
Tâche T019 : genesis.ts (dépend de T016/T017/T018)
```

## Implementation Strategy

- **MVP = User Story 1** : Setup + Foundational + Phase 3 → générer et visualiser une population
  déterministe. S'arrêter, valider (reproductibilité, proportions), éventuellement déployer.
- **Incréments** : ajouter US2 (fiche), puis US3 (export/import), chacun testable et déployable séparément.
- **Polish** en dernier (perf, responsive, README, vérif Pages).

## Notes

- `rsrc/DescriptionProjet.md` est la source de vérité et **ne doit pas être modifié** sans accord (Principe IX).
- Tout l'aléatoire passe par le `Rng` injecté ; `createSeed()` est le seul point d'entropie (Principe I).
- Aucune donnée personnelle dans le code/commits/`package.json` (Principe X).
- Commit après chaque tâche ou groupe logique ; `main` reste déployable.

**Bugfix**: 2026-06-09 — BUG-001 — T017 & T018 rouvertes ; ajout de T035 (formateur de libellé par gabarit) et T036 (tests des 4 formats) pour FR-024.
