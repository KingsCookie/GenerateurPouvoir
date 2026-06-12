# Implementation Plan: Paramétrage complet & catalogues éditables

**Branch**: `005-parametrage-catalogues` | **Date**: 2026-06-12 | **Spec**:
[spec.md](./spec.md)

**Input**: Feature specification from `specs/005-parametrage-catalogues/spec.md`

## Summary

Rendre **éditable dans l'UI** tout ce que la description (§9, §3.1, §3.4, §6.6) veut paramétrable et
qui ne l'est pas encore : **catalogues** (traits par type, espèces, genres), **paramètres de
reproduction par espèce** avec **courbe gaussienne affichée**, **% de reproduction par couple**,
**pondérations de tirage** (type / gabarit / trait), **option de consanguinité**, et la **déclinaison
3 niveaux de la résilience** (initiale, maximale, seuil de disparition) **global → type → trait**.

Le cœur expose déjà `Parameters` (résilience globale, poids de type/gabarit, consanguinité), `Trait.weight`,
`Espece` (gaussienne/portée/divorce/genres) et `Couple.reproPct` (édition couple déjà branchée en
Feature 3). La seule **extension de cœur** nécessaire est une **structure de surcharge de résilience
par type/trait** + une **fonction de résolution pure** utilisée par le moteur d'hérédité et la genèse.
Le reste est de l'**exposition UI** : transformer le catalogue et le catalogue d'espèces (aujourd'hui
constantes de module) en **stores éditables**, et ajouter les écrans/contrôles correspondants.

## Technical Context

**Language/Version** : TypeScript 5.x (ESM, `strict`).

**Primary Dependencies** : Svelte + Vite ; `vite-plugin-pwa`. **Aucune dépendance ajoutée**
(Principe VIII) — la courbe gaussienne est tracée en **SVG sur-mesure** (comme l'arbre en Feature 4),
pas de librairie de graphes.

**Storage** : aucun backend. État en mémoire (stores Svelte) ; persistance par export/import de
fichier traitée en **Feature 6** (les catalogues/espèces/paramètres sont déjà dans `AppState` et
sérialisés).

**Testing** : Vitest à **seed fixe** sur le cœur (résolution de surcharge, hérédité avec surcharge,
validation, mutations de catalogue pures).

**Target Platform** : navigateurs desktop + mobiles (PWA), build statique GitHub Pages.

**Project Type** : application web statique (cœur pur `src/core` ↔ UI `src/ui`).

**Performance Goals** : édition réactive ; **courbe gaussienne** recalculée en < 1 s (perçue
immédiate, SC-004) ; la résolution de surcharge ne doit pas dégrader l'hérédité sur de grandes
populations (résolution O(1) par trait, indexée).

**Constraints** : 100 % statique, hors-ligne, déterministe (Principe I), cœur pur (Principe IV),
français.

**Scale/Scope** : 6 types de traits fixes ; des centaines de traits ; quelques espèces ; population
jusqu'à ~1 000+ individus. La déclinaison par trait peut donc générer de nombreuses surcharges :
structure indexée par `traitId` / `type`.

## Constitution Check

*GATE : doit passer avant Phase 0 ; re-vérifié après Phase 1.*

| Principe | Impact & conformité |
|----------|---------------------|
| **I. Déterminisme** | ✅ La résolution de surcharge et les validations sont **pures** ; aucun `Math.random`/horloge. Les tirages restent pilotés par le RNG seedé. Édition de paramètres = données, pas d'aléatoire. |
| **II. 100 % statique** | ✅ UI seule + petite logique cœur ; aucun service. |
| **III. PWA / responsive** | ✅ Nouveaux écrans responsive ; pas d'I/O réseau. |
| **IV. Cœur pur, isolé** | ✅ La surcharge + résolution vivent dans `src/core/params` (pur). Les **mutations de catalogue/espèce** sont des fonctions **pures** (renvoient un nouvel objet) dans le cœur ; les **stores** réactifs vivent dans `src/ui`. L'UI consomme le cœur. |
| **V. Tests déterministes** | ✅ Tests cœur à seed fixe : résolution (trait→type→global), hérédité utilisant la valeur effective, validation, mutations de catalogue. |
| **VI. Persistance explicite** | ✅ Pas d'auto-save ; catalogues/espèces/paramètres déjà dans `AppState` (export en Feature 6). Les surcharges s'ajoutent à `Parameters` (donc exportées avec la config). |
| **VII. Tout est paramétrable** | ✅ **Cœur de la feature** : on retire les derniers réglages codés en dur de l'UI. |
| **VIII. Simplicité / YAGNI** | ✅ Réutilise les structures existantes (`Trait.weight`, `Espece`, `Couple.reproPct`). Seule addition : surcharge résilience (justifiée par le §9 + clarification). Pas de nouvelle dépendance. |
| **IX. Spec source de vérité** | ✅ `rsrc/DescriptionProjet.md` non modifié ; périmètre tracé sur §9/§3/§6.6. |
| **X. Anonymat** | ✅ Commits `KingsCookie`, email vide ; aucun nom/email. |

**Verdict** : ✅ PASS. Une seule extension de cœur (surcharge résilience), conforme aux principes et
explicitement assumée (clarification 2026-06-12). Voir Complexity Tracking.

## Décisions techniques (détail en research.md)

| Sujet | Décision |
|-------|----------|
| **Surcharge résilience** | Ajouter à `Parameters` un objet `resilienceOverrides = { byType: Partial<Record<TraitType, ResiliencePatch>>, byTrait: Record<traitId, ResiliencePatch> }`, `ResiliencePatch = { initial?, max?, disappearThreshold? }`. Les 3 valeurs **globales** existantes restent la base. |
| **Résolution** | Fonction **pure** `resolveResilience(params, traitId): { initial, max, disappearThreshold }` ; **par champ**, priorité `byTrait[traitId].champ ?? byType[type].champ ?? global.champ`. Le **type** est dérivé du **préfixe de l'id** (`type:slug-i`) — robuste même si le trait a été supprimé du catalogue. |
| **Threading cœur** | `inheritADN` reçoit un **resolver** (ou `params` + helper) au lieu de lire `params.resilienceMax`/`disappearThreshold` directement ; idem `reproduce`, `genesis`, `traitsToPowers` pour `initialResilience`/`resilienceMax`. Signatures étendues a minima. |
| **Catalogue éditable** | `defaultCatalog()` reste pur ; l'UI détient un **store** `catalog` (writable). Fonctions **pures** de mutation dans le cœur : `addTrait`, `renameTrait`, `removeTrait` (renvoient un nouveau `Catalog`). Suppression = **futur seulement** (aucune mutation des ADN existants). |
| **Espèces éditables** | `especes` devient un **store** ; mutations pures `addEspece`/`renameEspece`/`removeEspece`/`addGenre`/`renameGenre`/`removeGenre` (garde « tout » non supprimable) ; validation des params de reproduction. |
| **Courbe gaussienne** | Composant SVG sur-mesure lisant la fonction de densité déjà utilisée par le tick (réutiliser `gaussian`/repro) ; recalcul réactif. **Aucune dépendance**. |
| **Poids** | `traitTypeWeights` (aujourd'hui **défini mais inexploité**) appliqué au point de tirage en **facteur** combiné au poids individuel (`type × individuel`) ; `templateWeights` (déjà utilisé) et `Trait.weight` exposés à l'édition. |
| **% par couple** | `Couple.reproPct` + `setCoupleReproPct` **existent déjà** (Feature 3) ; il reste à **brancher l'UI** sur la fiche. |

## Project Structure

### Documentation (this feature)

```text
specs/005-parametrage-catalogues/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — décisions techniques
├── data-model.md        # Phase 1 — entités & invariants
├── quickstart.md        # Phase 1 — scénarios de validation manuelle
├── contracts/
│   └── core-api.md      # Phase 1 — API pure (résolution, mutations catalogue/espèce, validation)
└── tasks.md             # Phase 2 (/speckit-tasks — NON créé ici)
```

### Source Code (repository root)

```text
src/core/
├── params/
│   ├── parameters.ts          # + resilienceOverrides ; helpers statA (existant)
│   └── resolveResilience.ts   # NOUVEAU — résolution pure trait→type→global (+ type via préfixe id)
├── catalog/
│   ├── defaultCatalog.ts      # inchangé (données par défaut)
│   └── editCatalog.ts         # NOUVEAU — addTrait/renameTrait/removeTrait (purs)
├── model/
│   ├── espece.ts              # inchangé (structure déjà complète)
│   └── … (trait, couple, adn : inchangés)
├── species/
│   └── editEspeces.ts         # NOUVEAU — add/rename/remove espèce & genres + validation (purs)
├── heredity/inherit.ts        # MODIFIÉ — utilise la résilience effective résolue
├── birth/reproduce.ts         # MODIFIÉ — initialResilience/max résolus (mutation faible + powers)
├── genesis/genesis.ts         # MODIFIÉ — initialResilience résolue
├── powers/traitsToPowers.ts   # MODIFIÉ — initialResilience/max résolus ; poids type×individuel
└── powers/strongMutation.ts   # MODIFIÉ (option) — poids type×individuel

src/ui/
├── stores/
│   ├── appState.ts            # MODIFIÉ — catalog & especes deviennent des stores éditables
│   └── catalogStore.ts        # (option) extraction des stores catalogue/espèces
├── views/
│   └── ParametresView.svelte  # MODIFIÉ — sections Espèces, Catalogues, Pondérations, Résilience 3 niveaux
├── components/
│   ├── GaussianCurve.svelte    # NOUVEAU — courbe SVG
│   ├── TraitCatalogEditor.svelte   # NOUVEAU
│   ├── SpeciesEditor.svelte        # NOUVEAU
│   └── ResilienceOverrides.svelte  # NOUVEAU (global/type/trait)
└── views/FicheView.svelte     # MODIFIÉ — contrôle du % de reproduction du couple

tests/unit/
├── resolve-resilience.test.ts # NOUVEAU
├── edit-catalog.test.ts       # NOUVEAU
├── edit-especes.test.ts       # NOUVEAU
├── heredity.test.ts           # ÉTENDU — surcharge par type/trait
└── genesis.test.ts            # ÉTENDU — initialResilience par trait
```

**Structure Decision** : conserver la séparation **cœur pur** (`src/core`) ↔ **UI** (`src/ui`).
Toute logique (résolution, mutation de catalogue/espèce, validation) est **pure et testée** ; l'UI ne
fait que détenir les stores réactifs et le rendu. Réutilisation maximale de l'existant.

## Complexity Tracking

| Violation / Ajout | Pourquoi nécessaire | Alternative plus simple rejetée car |
|-------------------|---------------------|--------------------------------------|
| **Extension du cœur** (surcharge résilience + résolution) | §9.2 + clarification 2026-06-12 : résilience initiale/maximale/seuil déclinables par type/trait | « Résilience globale uniquement » rejetée par l'utilisateur ; impossible de satisfaire le §9.2 sans valeur effective par trait. Maintenu **minimal** : 1 structure + 1 fonction pure, threadée dans les points déjà existants. |
