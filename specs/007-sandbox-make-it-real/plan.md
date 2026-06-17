# Implementation Plan: Sandbox isolée & « make it real »

**Branch**: `007-sandbox-make-it-real` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-sandbox-make-it-real/spec.md`

## Summary

Créer un **bac à sable isolé** (copie de l'état réel) où l'utilisateur expérimente sans effet sur la
population réelle jusqu'au clic **« make it real »** (qui fait que **l'état sandbox devient l'état réel** —
transfert, pas de rejeu). Y **déplacer** la reproduction manuelle (retirée de la page principale) sous la
forme d'un **mode** dédié (bouton → (dé)sélection au clic → nombre d'enfants ≥ 1 → valider/annuler +
re-sélection des derniers parents). Permettre **création** d'individus personnalisés, **clonage** et
**édition directe** des attributs (individus créés/clonés **autonomes** ; parenté uniquement par
reproduction), et **suppression** (refusée si descendants ; propagation conjoint→état antérieur,
parents→retrait de l'enfant). Enfin, **navigation temporelle** : choisir une année (départ→courante) pour
**reconstruire l'état historique complet** (couples/divorces/décès tels qu'à l'année) — ce qui impose un
**journal d'événements daté** ajouté au cœur et émis par la genèse, le tick annuel et la mort.

Tout le périmètre métier (copie, repro, création, suppression, reconstruction) est **pur** (`src/core`),
testé à seed fixe ; l'UI détient l'écran sandbox, les boutons et l'état d'interface du mode reproduction.
**Aucune dépendance ajoutée.**

## Technical Context

**Language/Version** : TypeScript 5.x (ESM, `strict`).

**Primary Dependencies** : Svelte + Vite ; `vite-plugin-pwa`. **Aucune dépendance ajoutée** (Principe VIII).

**Storage** : aucun backend ; persistance **exclusivement** par export/import de fichier JSON (Principe VI).
La sandbox est un **état d'interface** non exporté ; seul l'état réel (après « make it real ») entre dans
le périmètre d'export (Feature 6).

**Testing** : Vitest à **seed fixe** sur le cœur (sandbox : isolation/non-mutation, repro manuelle
déterministe, suppression & propagation, reconstruction à l'année, émission du journal d'événements).

**Target Platform** : navigateurs desktop + mobiles (PWA), build statique GitHub Pages (`royalcookie.fr`).

**Project Type** : application web statique (cœur pur `src/core` ↔ UI `src/ui`).

**Performance Goals** : actions sandbox perçues instantanées sur ~1 000+ individus ; reconstruction à
l'année **O(événements + population)** sans rejeu de simulation.

**Constraints** : 100 % statique, hors-ligne, **déterministe** (Principe I), cœur **pur** (Principe IV),
français, anonymat (Principe X).

**Scale/Scope** : un écran sandbox ; ~6-8 fonctions pures de cœur (sandbox + reconstruction) ; un **journal
d'événements** ajouté à `AppState` et émis par genèse/tick/mort ; bump `FORMAT_VERSION` (3) + rétro-compat.

## Constitution Check

*GATE : doit passer avant Phase 0 ; re-vérifié après Phase 1.*

| Principe | Impact & conformité |
|----------|---------------------|
| **I. Déterminisme** | ✅ Repro manuelle via le moteur Feature 2 (RNG paramétré) ; sandbox sur **copie** de l'état RNG ; « make it real » **transfère** la position RNG (pas de rejeu). Journal d'événements = données, sans aléatoire. |
| **II. 100 % statique** | ✅ Aucun service ; sandbox 100 % client. |
| **III. PWA / responsive** | ✅ Écran sandbox responsive ; aucun I/O réseau. |
| **IV. Cœur pur, isolé** | ✅ Copie/repro/création/suppression/reconstruction **pures** dans `src/core/sandbox` + émission du journal dans genèse/tick/mort (pur) ; l'UI détient l'écran, les boutons et l'état du mode reproduction. |
| **V. Tests déterministes** | ✅ Tests cœur à seed fixe : isolation (non-mutation de l'entrée), repro manuelle, suppression+propagation, reconstruction à l'année, journal. |
| **VI. Persistance explicite** | ✅ Sandbox **non** persistée (état d'interface) ; le journal d'événements s'intègre au type `data`/`full` existant (Feature 6) ; aucune sauvegarde auto. |
| **VII. Tout est paramétrable** | ✅ Aucun comportement chiffré caché ; nombre d'enfants choisi par l'utilisateur ; réutilise les paramètres existants (portées/gaussiennes non sollicitées par la repro manuelle). |
| **VIII. Simplicité / YAGNI** | ⚠️ **Une** complexité justifiée : le **journal d'événements daté** (requis par la clarification « reconstruction historique complète »). Voir **Complexity Tracking**. Le reste réutilise `AppState`, `reproduce`, `kill`. |
| **IX. Spec source de vérité** | ✅ Périmètre tracé sur §10.2/§10.3/§6.8/§8.4 ; la navigation temporelle est une **extension clarifiée par l'auteur** (2026-06-17), cohérente avec §10.3 (« explorer des scénarios ») ; **aucune** modification de `DescriptionProjet.md`. |
| **X. Anonymat** | ✅ Aucune identité dans le code/journal/commits ; identité `KingsCookie`, email vide. |

**Verdict** : ✅ PASS (avant et après design). Une entorse YAGNI **justifiée** (journal d'événements) —
documentée en Complexity Tracking ; aucune autre violation.

## Décisions techniques (détail en research.md)

| Sujet | Décision |
|-------|----------|
| **Isolation sandbox** | La sandbox est une **copie profonde** de l'`AppState` réel, détenue par un store UI distinct + une instance RNG **forkée** (`createRngFromState(snapshot.rngState)`). Les stores réels ne sont **jamais** touchés avant « make it real ». Les **opérations** sont des fonctions **pures** du cœur prenant/rendant un `AppState`. |
| **« Make it real » (transfert)** | Les stores réels sont **remplacés** par l'état sandbox (population, couples, année, **rngState**, **journal**) ; `engineRng = createRngFromState(sandbox.rngState)`. **Aucun rejeu** (Clarification). |
| **Reset** | La sandbox est ré-initialisée à partir d'un **nouveau snapshot** de l'état réel courant. |
| **Repro manuelle (mode)** | État d'interface UI : `mode actif`, `parents sélectionnés`, `nb enfants`, `derniers parents`. « Valider » appelle la fonction pure `manualReproduce(state, parentIds, n, birthYear, rng)` (n enfants via `reproduce`, chacun né un jour aléatoire de `birthYear`), pose la parenté, puis sort du mode + vide la sélection. « Annuler » sort sans effet. Bouton **re-sélection des derniers parents** (ignore les absents). |
| **Création / clonage / édition** | Fonctions pures : `createPerson` (individu **autonome**, id séquentiel), `clonePerson` (attributs repris, **sans** liens de parenté), `editPerson` (patch **d'attributs** ; pas la parenté). Parenté **uniquement** via `manualReproduce`. |
| **Suppression** | `deletePerson(state, id)` : **refus** si `enfants.length > 0` ; sinon retire l'individu **partout** : conjoints (le partenaire repasse à son état antérieur — retrait du lien `actuel`/`ex` correspondant, dissolution du couple actif), parents (retrait de l'id de leurs `enfants`), couples (retrait du membre / dissolution). Pur, sans aléatoire. |
| **Reconstruction à l'année** | `reconstructAtYear(state, year): AppState` **pure** : projection filtrée à partir du **journal d'événements daté** (naissances ≤ année, décès ≤ année ⇒ décédé, couples formés ≤ année et non dissous ≤ année). Pas de rejeu de simulation. |
| **Journal d'événements daté** | `AppState.history: PopulationEvent[]` (additif). Émis par `generateInitialPopulation` (naissances an de genèse), `tick` (naissances, couples, divorces), `kill` (décès) — chacun **estampille l'année**. `FORMAT_VERSION → 3` ; rétro-compat : `history` absent ⇒ `[]` (reconstruction dégradée, documentée). |
| **Retrait page principale** | La page principale (liste) **retire** la reproduction manuelle (`reproduceSelected`/sélection) ; seul « avancer de X années » fait évoluer la population réelle. La logique de sélection migre dans l'écran sandbox. |
| **Aucune dépendance** | Réutilise `reproduce`, `kill`, la sérialisation canonique, l'état RNG, le rendu de liste/arbre existants. |
| **Cycle de vie conjugal** (BUG-001 volet B) | Fonctions pures `formCouple`/`divorceCouple`/`dissolveConjugalLink` (conjoints symétriques + `couples` cohérent + émission/purge `couple`/`divorce` pour la reconstruction ; jamais `parents`/`enfants`). Détail D11. |
| **Formulaire complet** (BUG-001 volet A) | Correction **UI** : `SandboxView` expose **tous** les attributs de `PersonDraft` (ADN, pouvoirs incl. sans-pouvoir / mutation forte / normale, `raisonDeces`). Le cœur est inchangé (les acceptait déjà). |
| **Filtres sandbox** (BUG-002) | Correction **UI** : `SandboxView` réutilise `FilterBar` + `filterPopulation` (Feature 4/5) sur l'état reconstruit ; sélection de parents indépendante du filtrage. Détail D12. |

> **Bugfix**: 2026-06-17 — BUG-001 — Mise à jour depuis le patch bugfix (volet A : formulaire UI complet ;
> volet B : édition du cycle de vie conjugal — nouvelles fonctions pures cœur, sans toucher la parenté).

> **Bugfix**: 2026-06-17 — BUG-002 — Mise à jour depuis le patch bugfix (parité de filtrage sandbox — UI seule).

## Project Structure

### Documentation (this feature)

```text
specs/007-sandbox-make-it-real/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — décisions techniques
├── data-model.md        # Phase 1 — entités, journal, invariants
├── quickstart.md        # Phase 1 — validation manuelle US1/US2/US3
├── contracts/
│   └── core-api.md      # Phase 1 — API pure (sandbox, reconstruction, journal)
└── tasks.md             # Phase 2 (/speckit-tasks — NON créé ici)
```

### Source Code (repository root)

```text
src/core/sandbox/
├── sandbox.ts            # NOUVEAU — createPerson/clonePerson/editPerson/deletePerson/manualReproduce (purs)
│                         #   + (BUG-001 vB) formCouple/divorceCouple/dissolveConjugalLink (purs)
└── reconstruct.ts        # NOUVEAU — reconstructAtYear (projection à partir du journal)

src/core/model/
└── event.ts              # NOUVEAU — type PopulationEvent (birth/death/couple/divorce, daté)

src/core/state/
└── serialize.ts          # MODIFIÉ — AppState.history ; FORMAT_VERSION=3 ; défaut history→[] (rétro-compat)

src/core/genesis/genesis.ts   # MODIFIÉ — émet les événements `birth` (année de genèse)
src/core/time/tick.ts         # MODIFIÉ — émet `birth`/`couple`/`divorce` (année courante)
src/core/life/death.ts        # MODIFIÉ — émet `death` (année courante)
src/core/index.ts             # MODIFIÉ — ré-exports (sandbox, reconstruct, PopulationEvent)

src/ui/stores/
├── appState.ts           # MODIFIÉ — RETRAIT repro manuelle de la page principale ; helpers make it real/reset
└── sandboxStore.ts       # NOUVEAU — état sandbox isolé (AppState copié + RNG forké) + mode reproduction

src/ui/views/
├── SandboxView.svelte    # NOUVEAU — écran sandbox (liste + mode repro + sélecteur d'année + boutons)
│                         #   + (BUG-001 vA) formulaire complet ADN/pouvoirs/raisonDeces ; (vB) édition couples
│                         #   + (BUG-002) réutilise FilterBar + filterPopulation
└── ListeView.svelte      # MODIFIÉ — retrait des contrôles de reproduction manuelle

src/ui/components/        # réutilise liste/fiche/arbre ; ajout boutons make it real / reset / sélecteur année

tests/unit/
├── sandbox.test.ts       # NOUVEAU — isolation, repro manuelle, création/clonage/édition, suppression
├── reconstruct.test.ts   # NOUVEAU — reconstruction à l'année (couples/divorces/décès)
└── state.test.ts         # ÉTENDU — history sérialisé/désérialisé, rétro-compat (FORMAT_VERSION 3)
```

**Structure Decision** : conserver la séparation **cœur pur** ↔ **UI**. Toute la logique sandbox et la
reconstruction sont **pures et testées à seed fixe** ; l'UI ne détient que l'écran, les boutons et l'**état
d'interface** du mode reproduction (sélection, nb enfants, derniers parents). Réutilisation maximale de
`reproduce`/`kill`/sérialisation.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| **Journal d'événements daté** ajouté à `AppState` (émis par genèse/tick/mort) + bump `FORMAT_VERSION` (Principe VIII) | La clarification 2026-06-17 exige une **reconstruction historique complète** (couples/divorces/décès **tels qu'à l'année** sélectionnée). Le modèle actuel ne conserve **que l'état courant** (pas d'année de décès ni de dates de couple) — impossible de reconstruire sans données datées. | **Re-simulation déterministe** (rejouer genèse+ticks jusqu'à l'année) : rejetée car les **interventions manuelles** (morts manuelles, injections « make it real » d'états arbitraires) **cassent** le rejeu depuis la seed. **Champs datés éparpillés** (death year + dates de couple sur chaque entité) : rejeté car plus invasif pour Feature 3 (mutation de `Couple`/`Conjoint`) qu'un journal **additif** qui laisse la logique « état courant » inchangée. |
