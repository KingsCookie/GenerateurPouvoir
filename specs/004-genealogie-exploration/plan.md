# Implementation Plan: Généalogie & exploration

**Branch**: `004-genealogie-exploration` | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-genealogie-exploration/spec.md`

## Summary

Couche **exploration / visualisation** en **lecture seule** au-dessus des données produites par
les Features 1–3. Trois axes : (1) **arbre généalogique** centré sur un individu — fiche à
profondeur **fixe 2** + bouton « Explorer l'arbre » → **page dédiée** à profondeur **N réglable
(≥ 1, sans plafond)**, avec **conjoints/ex + enfants des unions** et **répétition** d'un individu
atteint par plusieurs chemins ; (2) **recherche & filtres** de la liste (nom + génération + espèce
+ trait[portée actifs/inactifs/tous] + pouvoir[présence/absence] + statut ; **OU** intra-dimension,
**ET** inter-dimensions ; **défaut = dernière génération** dynamique ; **persistance** des filtres
en session) ; (3) **3 modes** d'affichage des traits sur la fiche (**défaut Mode 3**).

Approche : tout le calcul (construction d'arbre bornée, moteur de filtres, génération, « dernière
génération ») vit dans le **cœur pur** `src/core/genealogy/` (déterministe, testé à seed fixe) ;
l'UI Svelte consomme ces fonctions et porte uniquement l'**état d'interface** (filtres persistants,
mode d'affichage, racine/profondeur de l'arbre de la page dédiée).

## Technical Context

**Language/Version** : TypeScript 5.x (ES modules).

**Primary Dependencies** : Vite, Svelte, vite-plugin-pwa (existant) ; **aucune nouvelle dépendance**
(YAGNI, Principe VIII). Arbre rendu par un composant Svelte récursif maison.

**Storage** : aucune (lecture seule sur l'état en mémoire ; persistance inchangée — export/import F1).
L'**état de filtres** et le **mode d'affichage** sont de l'**UI state de session**, **non** exporté.

**Testing** : Vitest à seed fixe sur le cœur (`genealogy/`), VM purs côté UI.

**Target Platform** : PWA statique (navigateurs desktop & mobile), GitHub Pages.

**Project Type** : application web statique (cœur pur `src/core` ↔ UI `src/ui`).

**Performance Goals** : filtrage/recherche d'une population de **1 000 individus < 1 s** (SC-002) ;
construction d'arbre de profondeur courante (2) instantanée.

**Constraints** : déterminisme (Principe I) ; cœur pur sans DOM/Svelte (Principe IV) ; lecture seule
(ne modifie ni population, ni ADN, ni RNG) ; PWA hors-ligne (Principe III). Profondeur N **sans
plafond** ⇒ le rendu de très grands arbres relève d'une garde **UI** (défilement), pas du cœur.

**Scale/Scope** : ~1 000–quelques milliers d'individus ; 2 pages nouvelles (arbre dédié) + extension
de la Liste et de la Fiche.

## Constitution Check

*GATE : doit passer avant Phase 0 et être re-vérifié après Phase 1.*

| Principe | Respect | Comment |
|---|---|---|
| I. Déterminisme (seed unique) | ✅ | Fonctionnalités **lecture seule** ; aucun aléatoire. Tri **déterministe** (par date puis id) pour l'ordre des nœuds/résultats. |
| II. 100 % statique | ✅ | Aucun backend ; tout en client. |
| III. PWA hors-ligne / responsive | ✅ | Pages & composants responsives ; aucun appel réseau. |
| IV. Cœur pur isolé | ✅ | `src/core/genealogy/` sans Svelte/DOM ; l'UI consomme. `core-purity.test.ts` couvre le nouveau dossier. |
| V. Tests déterministes | ✅ | Tests Vitest à seed fixe : arbre (bornes, répétition, unions), filtres (OU/ET, portée, présence), dernière génération. |
| VI. Persistance par fichiers | ✅ | Inchangée ; filtres & mode = état de session **non** persistant (choix explicite). |
| VII. Tout est paramétrable | ✅ | Profondeur N, portée du filtre trait, mode d'affichage : tous réglables par l'utilisateur. |
| VIII. Simplicité / YAGNI | ✅ | Aucune dépendance ajoutée ; composant arbre récursif minimal ; réutilise `computeGeneration`, `powerLabel`, `computeAge`. |
| IX. Spéc = source de vérité | ✅ | Conforme à `rsrc/DescriptionProjet.md` §8.1–8.5 ; aucune modification de la source. |
| X. Anonymat | ✅ | Aucune donnée perso ; commits `KingsCookie` email vide. |

**Verdict** : ✅ aucune violation. Aucune entrée de « Complexity Tracking » nécessaire.

## Décisions de conception (synthèse research.md)

| Sujet | Décision |
|---|---|
| Construction d'arbre | Récursive bornée par N, **séparée** ancêtres (via `parents`) / descendants (via `enfants`) ; **répétition** assumée (pas de déduplication) ; terminaison par décrément de N. |
| Unions/conjoints | Pour chaque nœud, rattacher conjoint **actuel + ex** (`conjoints`) et les **enfants communs** (enfants dont `parents` = {nœud, conjoint}) ; **pas** les autres enfants des conjoints, **pas** leurs parents. |
| Contenu des cases | Le cœur renvoie des nœuds **complets** (id, nom, âge, libellés de pouvoirs) ; l'UI **fiche** affiche nom + pouvoirs, l'UI **page dédiée** affiche nom + âge + pouvoirs (FR-003b). |
| Profondeur | Fiche **figée 2** ; page dédiée **N réglable ≥ 1 sans plafond**. |
| Moteur de filtres | Fonction pure `filterPopulation(pop, criteria, ctx)` ; **OU** intra-dimension, **ET** inter-dimensions ; nom **normalisé** (casse/accents) en sous-chaîne. |
| Filtre trait | Portée **actifs / inactifs / tous** ; correspondance si un trait recherché est présent selon la portée. |
| Filtre pouvoir | **présence/absence** uniquement (`any` / `none`). |
| Dernière génération | `lastGeneration(pop)` = max `computeGeneration` présent ; **défaut dynamique** tant qu'aucune modif manuelle du filtre génération. |
| Persistance des filtres | Store UI **module-level** (vit toute la session) + drapeau `generationTouched` ; restauré au retour sur la Liste ; **non** exporté. |
| Mode d'affichage | Énumération `1 | 2 | 3`, **défaut 3** ; store UI. |
| Tri déterministe | Nœuds & résultats triés par **date de naissance puis id** (stable, déterministe). |
| Interaction arbre (BUG-002) | `GenealogyTree.svelte` = **viewport pan/zoom** : transform CSS `translate`+`scale` ; **molette** + **pincement** (2 pointeurs) pour le zoom (borné min/max) ; **pan** au **clic droit + drag** et au **drag tactile** ; `contextmenu` supprimé sur la zone. **UI pure**, sans impact cœur. Fiche : zone **en haut**, sous « Retour à la liste », **pleine largeur**. |

## Project Structure

### Documentation (this feature)

```text
specs/004-genealogie-exploration/
├── plan.md              # Ce fichier
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── core-api.md      # Contrats du cœur (arbre, filtres, génération)
├── checklists/requirements.md
├── bugs/BUG-001.md
└── tasks.md             # /speckit-tasks (pas créé ici)
```

### Source Code (repository root)

```text
src/core/genealogy/
├── tree.ts          # buildGenealogyTree(root, byId, depth, opts) → TreeNode ; types
├── filter.ts        # filterPopulation(pop, criteria, ctx) ; FilterCriteria ; lastGeneration(pop)
└── index.ts         # ré-exports (façade)
src/core/genesis/derived.ts   # computeGeneration (existant, réutilisé)
src/core/index.ts             # ré-expose genealogy

src/ui/stores/
├── filters.ts       # store persistant (session) des critères + generationTouched
└── ui.ts            # mode d'affichage des traits (défaut 3) ; vue courante (liste|fiche|arbre) ; racine/profondeur arbre
src/ui/lib/
├── treeViewModel.ts # adapte TreeNode (cœur) → vues fiche (nom+pouvoirs) / page (nom+âge+pouvoirs)
└── ficheViewModel.ts# existant (buildFicheView/buildListRow) — étendu si besoin
src/ui/components/
├── GenealogyTree.svelte    # composant récursif (props : nœud, mode d'affichage des champs)
├── FilterBar.svelte        # recherche + filtres (génération/espèce/trait+portée/pouvoir/statut)
└── TraitModeSelector.svelte# sélecteur Mode 1/2/3
src/ui/views/
├── ListeView.svelte # + FilterBar, défaut dernière génération, persistance
├── FicheView.svelte # + arbre profondeur 2 (cases nom+pouvoirs) + bouton « Explorer l'arbre » + sélecteur de mode
└── ArbreView.svelte # NOUVELLE page dédiée (profondeur N réglable, cases nom+âge+pouvoirs)
src/ui/App.svelte    # routage interne : ajout de la vue « arbre »

tests/unit/
├── genealogy-tree.test.ts    # bornes, répétition multi-chemins, unions/conjoints, déterminisme
├── genealogy-filter.test.ts  # chaque dimension, OU/ET, portée trait, présence pouvoir, dernière génération, nom normalisé
└── genealogy-perf.test.ts    # filtrage 1 000 individus < 1 s
```

**Structure Decision** : on **étend** le cœur pur par un dossier cohésif **`src/core/genealogy/`**
(arbre + filtres + dernière génération, purs et déterministes) consommé par l'UI. La frontière
`src/core` (pur) ↔ `src/ui` (Svelte) est préservée (Principe IV). L'**état d'interface** nouveau
(filtres, mode, navigation arbre) reste **dans `src/ui`** et **hors** export (Principe VI). Aucune
dépendance ajoutée (Principe VIII) ; réutilisation de `computeGeneration`, `computeAge`,
`powerLabel`.

## Complexity Tracking

> Aucune violation de la Constitution Check → section vide.

**Bugfix**: 2026-06-10 — BUG-002 Arbre interactif (viewport pan/zoom) et placement sur la fiche.
Impact **UI seul** (`GenealogyTree.svelte`, `FicheView.svelte`) ; le cœur `genealogy/` reste pur,
déterministe et en lecture seule (aucun changement de contrat).
