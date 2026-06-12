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
| **VIII. Simplicité / YAGNI** | ✅ Réutilise les structures existantes (`Trait.weight`, `Espece`, `Couple.reproPct`). Additions : surcharge **résilience** + modèle **poids type→trait** (même mécanisme de résolution/propagation, mutualisé) + variante `pickWeightedOrNull`. Justifiées par §9 + clarifications. Pas de nouvelle dépendance. |
| **IX. Spec source de vérité** | ✅ `rsrc/DescriptionProjet.md` (.md + .adoc + PDF) **mis à jour sur autorisation explicite** (2026-06-12, §9.1/§9.2 : héritage poids/résilience type→trait, « Propager », type à 0 ⇒ pouvoir null) ; périmètre tracé sur §9/§3/§6.6. |
| **X. Anonymat** | ✅ Commits `KingsCookie`, email vide ; aucun nom/email. |

**Verdict** : ✅ PASS. Extensions de cœur **pures et déterministes** (surcharge résilience + modèle
poids type→trait + tirage tolérant `pickWeightedOrNull`), conformes aux principes et explicitement
assumées (clarifications 2026-06-12). Le comportement « type à 0 ⇒ pouvoir null + traits déjà tirés
actifs » est **documenté au §9.1 de `DescriptionProjet.md`** (modifié sur **autorisation explicite**
2026-06-12, Principe IX), cohérent avec §6.4.2. Voir Complexity Tracking.

## Décisions techniques (détail en research.md)

| Sujet | Décision |
|-------|----------|
| **Surcharge résilience** | Ajouter à `Parameters` un objet `resilienceOverrides = { byType: Partial<Record<TraitType, ResiliencePatch>>, byTrait: Record<traitId, ResiliencePatch> }`, `ResiliencePatch = { initial?, max?, disappearThreshold? }`. Les 3 valeurs **globales** existantes restent la base. |
| **Résolution** | Fonction **pure** `resolveResilience(params, traitId): { initial, max, disappearThreshold }` ; **par champ**, priorité `byTrait[traitId].champ ?? byType[type].champ ?? global.champ`. Le **type** est dérivé du **préfixe de l'id** (`type:slug-i`) — robuste même si le trait a été supprimé du catalogue. |
| **Threading cœur** | `inheritADN` reçoit un **resolver** (ou `params` + helper) au lieu de lire `params.resilienceMax`/`disappearThreshold` directement ; idem `reproduce`, `genesis`, `traitsToPowers` pour `initialResilience`/`resilienceMax`. Signatures étendues a minima. |
| **Catalogue éditable** | `defaultCatalog()` reste pur ; l'UI détient un **store** `catalog` (writable). Fonctions **pures** de mutation dans le cœur : `addTrait`, `renameTrait`, `removeTrait` (renvoient un nouveau `Catalog`). Suppression = **futur seulement** (aucune mutation des ADN existants). |
| **Espèces éditables** | `especes` devient un **store** ; mutations pures `addEspece`/`renameEspece`/`removeEspece`/`addGenre`/`renameGenre`/`removeGenre` (garde « tout » non supprimable) ; validation des params de reproduction. |
| **Courbe gaussienne** | Composant SVG sur-mesure lisant la fonction de densité déjà utilisée par le tick (réutiliser `gaussian`/repro) ; recalcul réactif. **Aucune dépendance**. |
| **Poids (héritage type → trait)** | `traitTypeWeights[type]` = **poids par défaut des traits du type** ; le **poids d'un trait** est une **surcharge optionnelle** (`trait ?? type`, **2 niveaux**, **pas** une multiplication). Bouton **« Propager »** (par type) = efface les surcharges. `templateWeights` (gabarit) exposé. Même modèle que la résilience ⇒ logique de résolution/propagation **partagée**. |
| **Tirage tolérant aux poids nuls** | `pickWeighted` jette si total ≤ 0. Ajouter `pickWeightedOrNull` (sans toucher l'existant) ; un type à poids effectif nul ⇒ le trait n'est **pas tiré** ⇒ **`pouvoir = null`** (comme un échec `K`) avec les **traits déjà tirés actifs** (FR-052b). Appelants : `strongMutation`, `traitsToPowers` (K), gain de mutation faible. |
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
│   ├── resolveResilience.ts   # NOUVEAU — résolution pure trait→type→global (+ type via préfixe id)
│   └── resolveWeight.ts       # NOUVEAU — poids effectif d'un trait = surcharge ?? poids du type
├── catalog/
│   ├── defaultCatalog.ts      # inchangé (données par défaut)
│   └── editCatalog.ts         # NOUVEAU — addTrait/renameTrait/removeTrait/setTraitWeight + « Propager » (purs)
├── model/
│   ├── espece.ts              # inchangé (structure déjà complète)
│   └── … (trait : poids = surcharge optionnelle ; couple, adn : inchangés)
├── species/
│   └── editEspeces.ts         # NOUVEAU — add/rename/remove espèce & genres + validation (purs)
├── rng/rng.ts                 # MODIFIÉ — ajout pickWeightedOrNull (pickWeighted inchangé)
├── heredity/inherit.ts        # MODIFIÉ — utilise la résilience effective résolue
├── birth/reproduce.ts         # MODIFIÉ — résilience/poids effectifs ; gain de mutation faible tolérant (null)
├── genesis/genesis.ts         # MODIFIÉ — initialResilience résolue
├── powers/traitsToPowers.ts   # MODIFIÉ — résilience/poids effectifs ; génération K tolérante (null)
└── powers/strongMutation.ts   # MODIFIÉ — poids effectif (type→trait) ; type à 0 ⇒ pouvoir null, traits tirés actifs

src/ui/
├── stores/
│   ├── appState.ts            # MODIFIÉ — catalog & especes deviennent des stores éditables
│   └── catalogStore.ts        # (option) extraction des stores catalogue/espèces
├── views/
│   └── ParametresView.svelte  # MODIFIÉ — sections Espèces, Catalogues, Pondérations, Résilience 3 niveaux
├── components/
│   ├── GaussianCurve.svelte    # NOUVEAU — courbe SVG
│   ├── TraitCatalogEditor.svelte   # NOUVEAU — poids type + surcharge trait + « Propager »
│   ├── SpeciesEditor.svelte        # NOUVEAU
│   └── ResilienceOverrides.svelte  # NOUVEAU (global/type/trait + « Propager »)
└── views/FicheView.svelte     # MODIFIÉ — contrôle du % de reproduction du couple

tests/unit/
├── resolve-resilience.test.ts # NOUVEAU
├── resolve-weight.test.ts     # NOUVEAU — poids effectif (surcharge ?? type) + « Propager »
├── edit-catalog.test.ts       # NOUVEAU
├── edit-especes.test.ts       # NOUVEAU
├── strong-mutation.test.ts    # ÉTENDU — type à poids 0 ⇒ pouvoir null, traits tirés actifs
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
| **Modèle poids type→trait** (poids du type = défaut, surcharge par trait, « Propager ») | §9.1 + clarification 2026-06-12 : régler le poids d'un type doit réellement biaiser ses traits | « Poids effectif = type × individuel » rejetée : **inerte** dans les tirages mono-type (le facteur de type se simplifie) ⇒ le scénario « type à 0 ⇒ plus de tirage » serait faux. Le modèle héritage/surcharge **réutilise** la même résolution que la résilience (coût marginal). |
| **`pickWeightedOrNull`** (tirage tolérant aux poids nuls) | FR-052b : un type à poids 0 ne doit pas planter `pickWeighted` (qui jette sur total nul) | « Garder `pickWeighted` qui jette » rejetée : plantage en pleine genèse/naissance dès qu'un poids de type vaut 0. Variante additive **sans** changer `pickWeighted` (déterminisme des features livrées préservé) ; comportement calqué sur l'échec `K` (§6.4.2). |
