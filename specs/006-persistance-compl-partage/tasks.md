---
description: "Task list — Feature 006 : Persistance complète & partage"
---

# Tasks: Persistance complète & partage

**Input**: Design documents from `specs/006-persistance-compl-partage/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/core-api.md, quickstart.md

**Tests** : **OBLIGATOIRES sur le cœur** (Constitution Principe V) — tests Vitest à **seed fixe**,
écrits **avant** l'implémentation correspondante (TDD). Tous dans `tests/unit/state.test.ts`.

**Organisation** : par user story (US1 P1 → US2 P2 → US3 P3), chacune livrant un export + import
utilisable pour son type.

## Format : `[ID] [P?] [Story?] Description (chemin)`

- **[P]** : parallélisable (fichiers distincts, aucune dépendance non satisfaite).
- **[Story]** : US1 / US2 / US3 (phases user story uniquement).

> ⚠️ **Fichiers partagés (séquentiels, pas de [P])** : `src/core/state/serialize.ts` (T002, T004,
> T005, T009, T010, T014), `tests/unit/state.test.ts` (T003, T008, T013), `src/ui/stores/appState.ts`
> (T006, T011), `src/ui/components/StateIO.svelte` (T007, T012, T015), `src/core/index.ts` (ré-exports).

---

## Phase 1 : Setup

- [X] T001 Baseline verte avant modification : `npm run test` + `npm run lint` + `npm run build` au vert ; repérer dans `tests/unit/state.test.ts` les tests `full` existants (round-trip, rejets) qui servent de socle.

---

## Phase 2 : Foundational (prérequis bloquants)

**⚠️ Bloque US1, US2 et US3.** Aucun changement de comportement (additions de types seulement).

- [X] T002 `src/core/state/serialize.ts` : ajouter les types `ConfigState { formatVersion, kind:'config', parameters, catalog, especes }`, `DataState { formatVersion, kind:'data', population, currentYear, couples, rngState }` et l'union `ParsedImport` (`config|data|full`). Conserver `AppState` (`full`) et la constante **unique** `FORMAT_VERSION` partagée. Ré-exporter les types via `src/core/index.ts`.

**Checkpoint** : types disponibles ; `serializeState`/`deserializeState` (full) inchangés.

---

## Phase 3 : User Story 1 — Configuration seule (Priority: P1) 🎯 MVP

**Goal** : exporter la configuration (seed + paramètres + catalogues + espèces) et l'importer ;
l'import de config **conserve** la population existante (Clarification 2026-06-17).

**Independent Test** : régler des paramètres + éditer un catalogue, exporter un `config`, recharger,
importer ⇒ réglages restaurés, aucune population créée ; puis générer une population et réimporter le
`config` ⇒ réglages réappliqués, **population inchangée** (cf. quickstart US1).

### Tests cœur (écrits AVANT — Principe V)

- [X] T003 [US1] `tests/unit/state.test.ts` (étendre) : `serializeConfig` produit `kind:"config"` + JSON **canonique** (clés triées) ; `parseImport` **détecte** `config` et renvoie `{kind:'config', config}` ; round-trip `extractConfig`→`serializeConfig`→`parseImport` égal sur parameters/catalog/especes ; rétro-compat (config sans `resilienceOverrides`/`Trait.weight` ⇒ défauts) ; **INV-K7** : `mergeConfig(state, config)` remplace parameters/catalog/especes et **conserve** population/couples/currentYear/rngState (population inchangée). Seed fixe.

### Implémentation cœur (pur)

- [X] T004 [US1] `src/core/state/serialize.ts` : implémenter `extractConfig(state): ConfigState`, `serializeConfig(state): string` (réutilise la canonicalisation existante) **et** `mergeConfig(state, config): AppState` (pur, non destructif — remplace parameters/catalog/especes, conserve les données ; INV-K7). Ré-export `src/core/index.ts`. Dépend de T002, T003.
- [X] T005 [US1] `src/core/state/serialize.ts` : implémenter `parseImport(json): Result<ParsedImport>` — parse JSON, lit `kind`, **branche `config`** (validation structure + version + défaut rétro-compat) ; `kind` inconnu ⇒ `Err`, version `>` supportée ⇒ `Err`. Ré-export. Dépend de T004. *(Les branches `data`/`full` sont complétées en T010/T014 — même fichier, séquentiel.)*

### Implémentation UI

- [X] T006 [US1] `src/ui/stores/appState.ts` : `buildConfigJson()` (= `serializeConfig(snapshot())`) et `applyConfig(config)` qui **délègue** à `mergeConfig(snapshot(), config)` (cœur) puis met à jour les stores `parameters`/`catalog`/`especes` (sans toucher population/couples/année/RNG). Brancher `applyImport(json)` sur `parseImport` (dispatcher ; branche `config` → `applyConfig`) ; en cas d'`Err`, renseigner `importError` **sans** toucher l'état (INV-K9).
- [X] T007 [US1] `src/ui/components/StateIO.svelte` : bouton **« Exporter la configuration »** (télécharge `royalcookie-config-<horodatage>.json`, horodatage généré côté UI) ; conserver l'import unique branché sur `applyImport`. Dépend de T006.

**Checkpoint** : US1 testable seule (config exportable/importable, population préservée).

---

## Phase 4 : User Story 2 — Données générées seules (Priority: P2)

**Goal** : exporter les données (population, généalogie, couples, année, **état RNG**) et les
importer sur la config courante ; reprise **au tirage près**.

**Independent Test** : générer + avancer, exporter un `data`, recharger avec une config différente,
importer ⇒ population/généalogie/couples restaurés, **config conservée** ; avancer d'un an donne le
**même** résultat qu'avant l'export (cf. quickstart US2).

### Tests cœur (écrits AVANT — Principe V)

- [X] T008 [US2] `tests/unit/state.test.ts` (étendre) : `serializeData` produit `kind:"data"` (avec `rngState`) ; `parseImport` détecte `data` ; round-trip `extractData`→`serializeData`→`parseImport` égal sur population/couples/currentYear/rngState ; **INV-K7** : `mergeData(state, data)` remplace population/couples/currentYear/rngState et **conserve** parameters/catalog/especes (config inchangée) ; **déterminisme de reprise** : restaurer `rngState` via `createRngFromState` ⇒ même séquence de tirages. Seed fixe.

### Implémentation cœur (pur)

- [X] T009 [US2] `src/core/state/serialize.ts` : implémenter `extractData(state): DataState` (pur, immutable, inclut `rngState`), `serializeData(state): string` **et** `mergeData(state, data): AppState` (pur, non destructif — remplace les données, conserve la config ; INV-K7). Ré-export. Dépend de T002, T008.
- [X] T010 [US2] `src/core/state/serialize.ts` : compléter `parseImport` avec la **branche `data`** (validation structure + version + défaut `rngState`/`couples`/`currentYear` absents). Dépend de T009, T005 (même fichier — séquentiel).

### Implémentation UI

- [X] T011 [US2] `src/ui/stores/appState.ts` : `buildDataJson()` et `applyData(data)` qui **délègue** à `mergeData(snapshot(), data)` (cœur) puis met à jour les stores population/couples/année et **restaure le RNG** via `engineRng = createRngFromState(data.rngState)` (conserve la config). Brancher la branche `data` du dispatcher `applyImport`. Dépend de T006, T010.
- [X] T012 [US2] `src/ui/components/StateIO.svelte` : bouton **« Exporter les données »** (`royalcookie-data-<horodatage>.json`). Dépend de T011, T007 (même fichier — séquentiel).

**Checkpoint** : US1 + US2 fonctionnelles indépendamment.

---

## Phase 5 : User Story 3 — Complet, détection automatique & versionnage (Priority: P3)

**Goal** : export `full` (config + data) ; **import unique** qui détecte les 3 types ; **refus
propre** des fichiers invalides/version trop récente ; **rétro-compatibilité**.

**Independent Test** : exporter un `full`, importer via le bouton unique les 3 types successivement
(détection correcte) ; un fichier de version supérieure / non-JSON / `kind` inconnu est **refusé**
sans altérer l'état ; un ancien `full` (sans `resilienceOverrides`) s'importe en défautant (cf.
quickstart US3).

### Tests cœur (écrits AVANT — Principe V)

- [X] T013 [US3] `tests/unit/state.test.ts` (étendre) : `serializeFull` (= `serializeState`) round-trip via `parseImport` ⇒ `{kind:'full', state}` égal à l'état ; **détection** correcte sur les 3 types ; refus `formatVersion > FORMAT_VERSION` ; refus `kind` absent/inconnu et JSON invalide (messages FR) ; rétro-compat d'un `full` antérieur (sans `resilienceOverrides`). Seed fixe.

### Implémentation cœur (pur)

- [X] T014 [US3] `src/core/state/serialize.ts` : exposer `serializeFull` (alias de `serializeState`, conservé) ; compléter `parseImport` avec la **branche `full`** + les **erreurs** transverses (version trop récente, `kind` inconnu, JSON invalide) factorisées ; conserver `deserializeState` (full) pour la rétro-compat des tests existants. Ré-export. Dépend de T010 (même fichier — séquentiel).

### Implémentation UI

- [X] T015 [US3] `src/ui/components/StateIO.svelte` : bouton **« Exporter tout (complet) »** (`royalcookie-full-<horodatage>.json`, consolide l'export actuel) ; finaliser l'**import unique auto-détecté** (3 types) et les **messages d'erreur FR** (`importError`). Dépend de T012, T011 (dispatcher complet).

**Checkpoint** : les 3 user stories sont indépendamment fonctionnelles ; import unique opérationnel.

---

## Phase 6 : Polish & transverse

- [X] T016 [P] `tests/unit/core-purity.test.ts` : vérifier que `src/core/state/serialize.ts` reste **pur** (aucun `Date`/`Math.random`/DOM) ; la garde scanne déjà `src/core` — ajouter une assertion ciblée si nécessaire. *(Couvert par la garde existante : elle scanne récursivement `src/core` ⇒ `serialize.ts` inclus ; l'horloge du nom de fichier vit dans `StateIO.svelte`, côté UI. Aucune assertion ajoutée nécessaire.)*
- [X] T017 [P] `src/ui/components/StateIO.svelte` (+ `src/app.css` si besoin) : styles **responsive** des 3 boutons d'export + import (mobile → desktop), libellés clairs.
- [X] T018 Dérouler `specs/006-persistance-compl-partage/quickstart.md` (validation manuelle US1/US2/US3 + déterminisme/partage).
- [X] T019 Portes de qualité : `npm run test` + `npm run lint` + `npm run build` **verts** ; bundle déployable (Principe II).

---

## Dependencies & Execution Order

### Dépendances de phase

- **Setup (T001)** avant tout.
- **Foundational (T002)** avant US1/US2/US3.
- **Polish (T016–T019)** en dernier.

### Dépendances par story

- **US1 (P1, MVP)** : T003 (test) → T004 → T005 → T006 → T007.
- **US2 (P2)** : T008 (test) → T009 → T010 (après T005) → T011 (après T006) → T012 (après T007).
- **US3 (P3)** : T013 (test) → T014 (après T010) → T015 (après T012).

### Même fichier (séquentiel, pas de [P])

- `src/core/state/serialize.ts` : T002 → T004 → T005 → T009 → T010 → T014.
- `tests/unit/state.test.ts` : T003 → T008 → T013.
- `src/ui/stores/appState.ts` : T006 → T011.
- `src/ui/components/StateIO.svelte` : T007 → T012 → T015.
- `src/core/index.ts` : ré-exports ajoutés par T002/T004/T005/T009/T014 (fusionnés ou séquentiels).

## Parallel Opportunities

- Peu de parallélisme : le cœur tient dans **un seul fichier** (`serialize.ts`) et l'UI d'I/O dans
  **un seul composant** (`StateIO.svelte`) ⇒ tâches majoritairement séquentielles.
- **Polish** : T016 ‖ T017 (fichiers distincts).
- Les tests d'une story peuvent être écrits pendant que l'UI de la story précédente est stylée.

## Parallel Example: Polish

```text
Tâche T016 : garde de pureté du cœur (tests/unit/core-purity.test.ts)
Tâche T017 : styles responsive (src/ui/components/StateIO.svelte)
```

## Implementation Strategy

### MVP (US1 seule)

1. Setup (T001) → Foundational (T002).
2. US1 (T003–T007) → **STOP & VALIDATE** : export/import `config`, population préservée.
3. Démo/déploiement possible (presets partageables).

### Livraison incrémentale

1. Setup + Foundational → types partagés.
2. + US1 (config) → tester → démo (MVP).
3. + US2 (data + reprise au tirage près) → tester → démo.
4. + US3 (full + détection + versionnage + refus propre) → tester → démo.

## Notes

- Tests **cœur obligatoires à seed fixe** (Principe V) : T003, T008, T013 (+ pureté T016). Écrits
  **avant** l'implémentation correspondante.
- **Clarifications 2026-06-17** : import `config` ⇒ **conserve la population** ; `data`/`full` ⇒
  **position complète du RNG** (reprise au tirage près).
- **Cœur pur** (Principe IV) : (dé)sérialisation/détection dans `src/core/state` ; l'**horodatage du
  nom de fichier** (horloge) reste dans `src/ui` (interdit dans le cœur, Principes I/IV).
- **Rejet sûr** (INV-K9) : l'état courant n'est mis à jour qu'en cas d'import réussi.
- **Aucune dépendance ajoutée** (Principe VIII) — JSON natif, `Blob`, `<input type="file">`.
- **Anonymat** (Principe X) : aucun champ d'identité dans les fichiers ; commits `KingsCookie`, email
  vide ; `main` reste déployable.
- Sandbox & « make it real » = **Feature 7** (hors périmètre).
