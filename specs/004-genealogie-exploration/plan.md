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
| Interaction arbre (BUG-002) | `GenealogyTree.svelte` = **viewport pan/zoom** : transform CSS `translate`+`scale` ; **molette** + **pincement** (2 pointeurs) pour le zoom (borné min/max) ; **pan** au ~~clic droit~~ drag et au **drag tactile** ; `contextmenu` ~~supprimé~~. **UI pure**, sans impact cœur. Fiche : zone **en haut**, sous « Retour à la liste », **pleine largeur**. |
| Interaction arbre (BUG-003) | **Pan au clic gauche maintenu** (et tactile) avec **seuil clic/glisser** (~5 px) : `pointerdown` mémorise l'origine **sans** paner ; le pan (et `setPointerCapture`) ne démarre qu'**au-delà du seuil** ; `pointerup` **sous** le seuil ⇒ **navigation** (FR-004). **Recentrage de vue** (reset zoom/translation). **Centrage initial** sur la racine (offset de base, pas écrasé par la `transform`). Suppression du `contextmenu` **facultative** (clic droit libre). |
| Rendu graphique arbre (BUG-003) | **⚭ entre les deux membres** de chaque union ; **liens de filiation** ⚭→**enfants communs** (overlay SVG ou bordures/pseudo-éléments CSS) ; **ex-conjoint + enfants d'ex en pointillés** (classe selon `statut`), unions actuelles en trait plein ; **racine** en **couleur distincte**. **UI pure** ; le cœur `genealogy/` expose déjà `unions[].enfantsCommuns` (corrélation par id avec les cases `descendants`). |
| Scroll fiche (BUG-003) | À l'ouverture d'une fiche (liste ou clic d'arbre), **défilement remis en haut** (FR-016) — UI, sans impact cœur. |
| Tracé des liens (BUG-004) | **Refonte en SVG** : les connecteurs CSS approximatifs sont remplacés par un **overlay `<svg>` enfant du `canvas`** (donc soumis au même `transform` ⇒ suit zoom/pan). Stratégie **mesure-puis-tracé** : on mesure les ancrages (⚭, cases) **relativement au `canvas`** (`getBoundingClientRect`) et on trace des `<path>`/`<line>` ; recalcul au **changement de données** et via `ResizeObserver`, **pas** à chaque pan/zoom. Alignement exact, **sans dépendance** (pas de D3 ni lib ⇒ Constitution VIII préservée). |
| Ascendants en couples (BUG-004) | Les deux parents (et grands-parents) **groupés en couple** avec **⚭** + **trait de filiation** vers **leur seul enfant de la lignée** (FR-003a/FR-003d). **Statut actuel/ex du couple parental — option (c)** : déduit des **`unions` déjà portées par les nœuds ascendants** du `TreeNode` (pour `[parent1, parent2]`, lire `parent1.unions` → `conjointId === parent2.id`). **Ni cœur modifié, ni `byId`** ; **défaut trait plein** si non trouvé. |
| Recentrage ⟳ (BUG-004) | Le bouton recentrage ramène le **centre de la case racine** au **centre du viewport** (et plus un simple `tx=ty=0`) : calcul à partir des **positions mesurées** (même mécanisme de mesure DOM que le tracé SVG). FR-002d. |
| Liens en équerre (BUG-005) | `treeLayout.ts` produit des **poly-lignes** : (a) segments **membre↔⚭** (case → ⚭ → case) ; (b) filiation en **3 segments orthogonaux** (⚭ ↓ jusqu'à une **barre horizontale** par fratrie, puis ↓ vers chaque enfant). Rendu `<polyline>` SVG. Remplace les segments droits. |
| Codes couleur cumulables (BUG-005) | Dimensions CSS **distinctes** ⇒ combinables : **ex** = `border-style: dashed` ; **conjoint/pièce rapportée** = `background` grisé (flag posé au layout pour les cases `spouse` de la racine/descendance ; ascendants exclus) ; **décédé** = `border-color` dédiée + marqueur « † » ; **racine** = accentuation. |
| Donnée `vivant` (BUG-005) | **Ajout au cœur** : `vivant: boolean` sur `TreeNodeLite` (donc chaque nœud + conjoint), repris de `Personne.vivant`. Pur, déterministe, lecture seule ; data-model + contrats + test à seed fixe. |
| Légende (BUG-005) | Composant `TreeLegend.svelte` (UI pur) inséré sous la zone arbre dans `FicheView` **et** `ArbreView` (FR-003e). |
| Lien de couple 2 segments (BUG-006) | `treeLayout.ts` : le lien membre↔membre devient une **poly-ligne passant par le ⚭** (`[bord A, ⚭, bord B]`) ⇒ 2 segments dont le ⚭ est le sommet. |
| Familles à N parents (BUG-006) | **Ascendance** : `placeUp` gère `parents.length ≥ 1` — tous les parents en ligne, un **⚭ entre chaque paire consécutive** en union (statut via `ancestors[].unions`), filiation en équerre depuis le **centre du groupe parental** vers l'enfant. **Descendance** : regrouper les enfants par **ensemble de parents** (et non par `conjointId` binaire) ; un enfant à > 2 parents est relié au groupe. **Cœur inchangé** (`parents` est déjà `string[]` sans plafond). |

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
├── GenealogyTree.svelte    # viewport pan/zoom + rendu SVG (cf. lib/treeLayout.ts ; BUG-004/005)
├── TreeLegend.svelte       # légende des symboles/couleurs (fiche + page dédiée ; BUG-005)
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

**Bugfix**: 2026-06-10 — BUG-003 Updated from bugfix patch. Pan au **clic gauche** + seuil
clic/glisser, **recentrage**/**centrage** de la vue, **rendu graphique** (⚭ entre membres, liens
⚭→enfants, ex en pointillés, racine colorée) et **scroll fiche** en haut. Impact **UI seul**
(`GenealogyTree.svelte`, `ArbreView.svelte`, `FicheView.svelte`/navigation) ; le cœur `genealogy/`
**inchangé** (aucun changement de contrat).

**Bugfix**: 2026-06-10 — BUG-004 Updated from bugfix patch. **Ascendants en couples** (⚭ + filiation
vers le seul enfant de la lignée) et **refonte des connecteurs en SVG** (overlay `<svg>` mesuré,
fin des traits CSS approximatifs). Statut du couple parental **déduit de `ancestors[].unions`**
(option (c) — ni cœur modifié, ni `byId`). **Recentrage ⟳** = racine centrée dans le viewport
(FR-002d). Impact **UI seul** (`GenealogyTree.svelte`) ; **aucune dépendance ajoutée**
(Constitution VIII) ; cœur `genealogy/` **inchangé**.

**Bugfix**: 2026-06-10 — BUG-005 Updated from bugfix patch. Finitions visuelles : segments
**membre↔⚭**, **liens en équerre** (poly-lignes), **conjoints grisés** (pièces rapportées),
**décédés colorés** (+ « † »), styles **cumulables**, **légende** (`TreeLegend.svelte`) sur les deux
pages. **Petite addition au cœur** : `vivant` sur `TreeNodeLite` (déterministe, lecture seule,
testée). Reste **sans dépendance** (Constitution VIII).

**Bugfix**: 2026-06-10 — BUG-006 Updated from bugfix patch. Lien de couple en **2 segments** (⚭
sommet) et **familles à > 2 parents** : ascendance à N parents (⚭ entre chaque paire, filiation
depuis le groupe), descendance regroupée par **ensemble de parents**. Impact **UI seul**
(`treeLayout.ts`, `GenealogyTree.svelte`) ; cœur `genealogy/` **inchangé**.
