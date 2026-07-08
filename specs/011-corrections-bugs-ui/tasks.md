# Tasks: Lot de corrections (bugs & ajustements UI)

**Feature**: `011-corrections-bugs-ui` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Tests** : le cœur `src/core` est couvert par des **tests Vitest à seed fixe obligatoires**
(Principe V) → les tâches de test sont incluses pour US1, US2, US3, US8, US9 (TDD : test avant code).
UI-only (US4/US5/US6/US7/US10) : validation manuelle (quickstart), sans test unitaire imposé.

**Conventions** : `[P]` = parallélisable (fichiers distincts, sans dépendance non satisfaite).
`[USn]` = user story. Chemins relatifs à la racine du dépôt.

---

## Phase 1 : Setup

- [X] T001 Vérifier la base saine avant travaux : `npm run test`, `npm run build`, `npm run lint` passent (aucun fichier modifié)

---

## Phase 2 : Foundational (prérequis bloquants)

**Principe IX (source de vérité)** : mettre à jour la spécification fonctionnelle **avant** le code des
règles qui en divergent (US1, US2, US3, US8). Ces tâches bloquent les phases correspondantes.

- [X] T002 Mettre à jour `rsrc/DescriptionProjet.md` : §6.4.1 (proba duplication `min(100, résilience·D)`, `D` multiplicateur défaut 0.25) ; §6.6.1 (blocage consanguinité **lignée directe** 2 niveaux) ; §6.6.2 (enfants d'une portée = **même date**) ; définition « génération d'affichage » (tranche de 20 ans **relative à l'année de genèse**)
- [X] T003 Régénérer `rsrc/DescriptionProjet.adoc` cohérent avec T002 (restauration depuis git + patch ciblé des mêmes sections, sans outil externe) et vérifier le diff limité aux sections modifiées

**Checkpoint** : la spécification fonctionnelle reflète les nouvelles règles → le code peut diverger de l'ancienne.

---

## Phase 3 : US1 — Consanguinité lignée directe (P1)

**Goal** : aucun appariement entre un individu et son parent/grand-parent quand la consanguinité est interdite.
**Independent test** : simulation multi-générations, consanguinité interdite → 0 couple en lignée directe.

- [X] T004 [P] [US1] Écrire `tests/unit/genealogy-consanguinity.test.ts` (seed fixe) : couple parent↔enfant et grand-parent↔petit-enfant **interdits** si `consanguinityAllowed=false` ; **autorisés** si `true` ; symétrie ; application à chaque paire d'un groupe > 2
- [X] T005 [US1] Implémenter `isDirectLineage(a, b, byId)` (2 niveaux) dans `src/core/repro/pairing.ts` et l'intégrer à la garde de `formCouples` (en plus de `areConsanguine`)

---

## Phase 4 : US2 — Date partagée de portée (P1)

**Goal** : tous les enfants d'une même portée ont la même date de naissance.
**Independent test** : portée de taille ≥ 2 → dates identiques ; portées distinctes → dates propres.

- [X] T006 [P] [US2] Écrire `tests/unit/litter-date.test.ts` (seed fixe) : une portée ≥ 2 → même `dateNaissance` ; portée de 1 inchangée ; déterminisme préservé
- [X] T007 [US2] Ajouter `birthDayOfYear?: number` à `ReproduceOptions` et l'utiliser dans `src/core/birth/reproduce.ts` (tirage interne seulement si absent)
- [X] T008 [US2] Dans `src/core/time/tick.ts` (`reproduceCouple`), tirer le jour **une seule fois** par portée (`rng.nextInt(365)`) et le passer à chaque `reproduce(...)`

---

## Phase 5 : US3 — Génération 0 relative à la genèse (P2)

**Goal** : la population initiale est génération 0 quelle que soit l'année de départ ; année de genèse persistée.
**Independent test** : genèse en 1900 → tous en génération 0 ; +1 / 20 ans ; import ancien fichier via fallback.

- [X] T009 [P] [US3] Écrire `tests/unit/generation-origin.test.ts` (seed fixe) : `computeGeneration(gy, gy)=0` ; +1 toutes les 20 ans ; valeur négative avant genèse ; genèse 1900 → génération 0
- [X] T010 [P] [US3] Étendre `tests/unit/*serialize*` : round-trip `FORMAT_VERSION` 4 avec `genesisYear` ; import v3 (sans `genesisYear`) → fallback = naissance la plus ancienne
- [X] T011 [US3] Ajouter `genesisYear: number` à `AppState` (`src/core/state/appState.ts`) et modifier `computeGeneration(birthYear, genesisYear)` dans `src/core/genesis/derived.ts`
- [X] T012 [US3] `src/core/state/serialize.ts` : `FORMAT_VERSION` 3→4 ; inclure `genesisYear` dans `serializeData`/`serializeState` ; migration/fallback (min `birthYear` sinon `parameters.birthYear ?? 0`) dans `deserializeData`/`deserializeState`
- [X] T013 [US3] Initialiser `genesisYear = parameters.birthYear` lors de la genèse (`src/core/genesis/genesis.ts`)
- [X] T014 [US3] Propager `genesisYear` : `FilterContext` + calcul dans `src/core/genealogy/filter.ts` ; `src/ui/lib/ficheViewModel.ts` (buildListRow/buildFiche) et appelants (`ListeView`/`SandboxView`/stores) passent `genesisYear`

---

## Phase 6 : US4 — Étiquettes « P x » / « M y » (P2)

**Goal** : puissance/maîtrise affichées sans deux-points.
**Independent test** : liste avec un pouvoir P=12/M=3 → « P 12 » / « M 3 ».

- [X] T015 [P] [US4] `src/ui/views/ListeView.svelte` : étiquettes `P {puissance}` / `M {maitrise}` (retrait du « : »)
- [X] T016 [P] [US4] `src/ui/views/SandboxView.svelte` : mêmes étiquettes `P {puissance}` / `M {maitrise}`

---

## Phase 7 : US8 — Formule de la constante de duplication (P2)

**Goal** : proba de duplication = `min(100, résilience·D)`, `D` multiplicateur défaut 0.25.
**Independent test** : fréquence observée ≈ `min(100, résilience·D)` à seed fixe ; `D=0` ⇒ 0.

- [X] T017 [P] [US8] Écrire `tests/unit/duplication-formula.test.ts` (seed fixe) : fréquence ≈ `min(100, résilience·D)` ; `D=0` ⇒ aucune duplication ; borne à 100 %
- [X] T018 [P] [US8] `src/core/params/parameters.ts` : `duplicationD` = multiplicateur (≥ 0), **défaut 0.25**, commentaire mis à jour
- [X] T019 [US8] `src/core/powers/traitsToPowers.ts` : remplacer `rng.chance(résilience / D)` par `rng.chance(min(100, max(0, résilience · D)))` ; mettre à jour les commentaires §6.4.1

---

## Phase 8 : US7 — Aperçu de pouvoir temps réel (P2)

**Goal** : aperçu du pouvoir mis à jour en temps réel sur le formulaire de création (seed d'aperçu stable).
**Independent test** : activer des traits → aperçu instantané ; même état → même aperçu ; enregistré = aperçu.

- [X] T020 [US7] `src/ui/stores/sandboxStore.ts` : `sbDerivePreview(adn)` dérivant un `Rng` d'une **seed stable** (seed session + triplets `(traitId, active, resilience)` triés), sans consommer `sbRng`
- [X] T021 [US7] ✅ Fixed (BUG-001) `src/ui/components/SandboxPersonForm.svelte` : bloc réactif recalculant l'aperçu (pouvoirs + ADN enrichi K) à chaque changement de `fAdn` ; l'enregistrement conserve l'aperçu affiché — **rouvert** : les contrôles actif/résilience par trait ne s'affichent pas en création (voir T032)

**Bugfix**: 2026-07-08 — [BUG-001] Updated from bugfix patch (parité création/édition des contrôles de trait).

---

## Phase 9 : US9 — Bouton « Régénérer » (P2)

**Goal** : régénérer les pouvoirs d'un individu depuis ses traits actifs (§6.4 seul, P/M §7.2/cas A).
**Independent test** : clic « Régénérer » → pouvoirs recalculés ; P/M §7.2 si parents sinon [1,10] ; K dans l'ADN.

- [X] T022 [P] [US9] Écrire `tests/unit/regenerate-powers.test.ts` (seed fixe) ciblant la **fonction cœur pure** `regeneratePowers` : dérivation §6.4 seule (pas de cas « sans pouvoir »/« mutation forte ») ; P/M via §7.2 avec parents, ∈ [1,10] sans parents ; traits K inscrits dans l'ADN retourné ; sans trait actif ⇒ aucun pouvoir ; déterminisme à seed fixe
- [X] T023 [US9] Créer la fonction **cœur pure** `regeneratePowers(person, parents, catalog, params, rng): { adn, pouvoirs }` dans `src/core/powers/regenerate.ts` (compose `derivePowersFromTraits` §6.4 + `inheritStats` §7.2/cas A ; aucun tirage de cas) et l'exporter via `src/core/index.ts` — **aucune dépendance UI/DOM** (Principe IV)
- [X] T024 [US9] `src/ui/stores/sandboxStore.ts` : `sbRegeneratePowers(id)` = simple **appel** à `regeneratePowers(...)` (récupère l'individu + ses parents depuis l'état, passe `sbRng`), puis écrit `adn`+`pouvoirs` sur l'individu
- [X] T025 [US9] `src/ui/views/SandboxView.svelte` : bouton « Régénérer » par ligne, à côté d'Éditer/Cloner/Supprimer → `sbRegeneratePowers(id)`

---

## Phase 10 : US10 — P/M non bornées en saisie (P2)

**Goal** : saisie manuelle de P/M libre (ex. 5000, −34) ; bornage réservé aux tirages aléatoires.
**Independent test** : saisir 5000 / −34 → conservés ; cas §7.2 moyenne peut donner > 10.

- [X] T026 [P] [US10] Ajouter/adapter un test (ex. `tests/unit/*stats*`/`inheritStats`) confirmant qu'une moyenne parentale peut produire > 10 (cas non borné) et que seul le cas A est borné [1,10]
- [X] T027 [US10] `src/ui/components/SandboxPersonForm.svelte` : `setPuissance`/`setMaitrise` sans clamp `[1,10]` (garder `Math.floor` + repli 0) ; retirer `min`/`max` des `<input>` P/M

---

## Phase 11 : US5 — Section traits des filtres à la ligne (P3)

**Goal** : la section des filtres de trait occupe sa propre ligne.
**Independent test** : barre de filtres (Population/Sandbox) → section trait sur une ligne dédiée, toutes largeurs.

- [X] T028 [US5] `src/ui/components/FilterBar.svelte` : forcer la section des filtres de trait sur sa propre ligne (flex-basis 100 % / saut de ligne) ; vérifier aux largeurs usuelles

---

## Phase 12 : US6 — Renommer le fichier exporté (P3)

**Goal** : fichiers exportés préfixés `PowerGenerator_` (underscores).
**Independent test** : export config/data/full → noms `PowerGenerator_{type}_…` ; import ancien `royalcookie-…` OK.

- [X] T029 [US6] `src/ui/components/StateIO.svelte` : `a.download = \`PowerGenerator_${kind}_${timestamp()}.json\``

---

## Phase 13 : Polish & cross-cutting

- [X] T030 Mettre à jour les tests existants impactés par les changements déterministes : sorties de `reproduce`/`tick` (US2 : ordre RNG), `fiche-vm` (US4 : format P/M), et tout test dépendant de `computeGeneration`/`duplicationD`
- [X] T031 Exécuter `npm run test`, `npm run build`, `npm run lint` (tout vert) puis dérouler `specs/011-corrections-bugs-ui/quickstart.md` (US1→US10) en `npm run dev`

---

## Phase 14 : Correctifs (BUG-001)

**Bugfix**: 2026-07-08 — [BUG-001] Contrôles actif/résilience par trait absents à la **création** (sandbox).

- [X] T032 [US7] `src/ui/components/SandboxPersonForm.svelte` : rendre l'affichage des contrôles de trait (case « actif » + champ « rés. ») **réactif à `fAdn`** — remplacer `{@const entry = traitEntry(t.id)}` par une expression dépendant directement de `fAdn` (ex. `{@const entry = fAdn.find((x) => x.traitId === t.id)}`), de sorte que les contrôles apparaissent/s'actualisent en **création** comme en **édition** (referme T021)
- [X] T033 Revalider : `npm run test` + `npm run build` + `npm run lint` verts, puis dérouler **quickstart US7** (`npm run dev`) — en création, cocher un trait ⇒ contrôles actif/résilience présents et l'aperçu reflète immédiatement un trait rendu inactif ou une résilience modifiée

---

## Dependencies

- **Phase 1** (T001) → **Phase 2** (T002, T003) : le gate doc (Principe IX) précède le code des règles divergentes.
- **T002 → T003** (même règles ; .adoc après .md).
- **US1** : T004 (test) → T005.
- **US2** : T006 (test) → T007 → T008 (T008 dépend de l'option ajoutée en T007).
- **US3** : T009, T010 (tests) → T011 → {T012, T013, T014}. T011 (signature `computeGeneration`) précède T012/T014.
- **US8** : T017 (test) → {T018, T019}.
- **US7** : T020 → T021. **US9** : T022 (test) → T023 (cœur pur) → T024 (store) → T025 (bouton).
- **US10** : T026 (test) → T027.
- **US4/US5/US6** : indépendantes (UI pure), aucune dépendance inter-story (T028, T029, T015/T016).
- **Polish** : T030/T031 après toutes les phases de code (dépend surtout de US2/US3/US4/US8/US9).

Les user stories sont **indépendantes entre elles** au niveau code (fichiers disjoints), sauf le gate
doc commun (Phase 2). US3 est la plus transverse (cœur + sérialisation + UI).

## Parallel execution examples

- **Tests cœur en parallèle** (fichiers distincts) : T004, T006, T009, T010, T017, T022, T026 peuvent
  s'écrire ensemble.
- **UI pure en parallèle** : T015, T016 (US4), T027 (US5), T028 (US6) — fichiers disjoints.
- **US8** : T018 (`parameters.ts`) et T019 (`traitsToPowers.ts`) — fichiers distincts, parallélisables
  après T017.

## Implementation strategy

- **MVP correctness d'abord** (P1) : Phase 2 (doc) → US1 → US2. Livre les corrections de reproduction
  les plus critiques.
- **Puis P2** : US3 (transverse, prévoir la migration format), US8 (formule), US7 (aperçu), US9
  (régénérer), US4 (étiquettes), US10 (P/M libres).
- **Puis P3** : US5, US6 (ajustements légers).
- **Clore** par le polish (tests existants + quickstart).
- Chaque user story est un incrément **livrable et testable** indépendamment (hors gate doc commun).
