# Feature Specification: Refonte complète de l'UI

**Feature Branch**: `008-refonte-ui`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "on va faire une refonte complète de l'UI. lis bien tout ce qu'il y a dans
design_handoff_refonte_ui pour comprendre ce qu'il faut faire. pour cette feature c'est la source de vérité"

> **Source de vérité (déclarée par l'utilisateur pour cette feature)** : le dossier
> `design_handoff_refonte_ui/` — `README.md` (handoff détaillé, cartographie vue par vue), `tokens.css`
> (système de thème) et `maquette.html` (prototype hi-fi de référence). La préservation **fonctionnelle**
> est régie par `rsrc/DefUi.md`. La refonte est **purement visuelle** : la logique métier, les contrats de
> données et les stores **logiques** restent ceux du dépôt.

## Clarifications

### Session 2026-06-18

- Q: Périmètre du système de thème (la demande initiale ne parlait que de clair/sombre) ? → A: **Système
  complet 3 axes** — mode (sombre défaut / clair) × palette (violet / cyan / vert) × style (A « Atelier » /
  B « Signal »), tous sélectionnables et mémorisés (conforme au handoff).
- Q: Comment gérer les polices vu la contrainte PWA 100 % hors-ligne ? → A: **Auto-héberger** les polices
  (fichiers locaux `woff2` + `@font-face`, précachées par le service worker) pour une autonomie hors-ligne
  stricte ; repli système conservé en sécurité.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Thématisation & préférences d'apparence (Priority: P1)

En tant qu'utilisateur, je veux choisir l'**apparence** de l'application selon **trois axes indépendants**
et que mon choix soit **mémorisé** : le **mode** (sombre — **défaut** — ou clair), la **palette d'accent**
(violet — défaut — / cyan / vert) et le **style graphique** (A « Atelier » — défaut — / B « Signal »). Le
basculement clair/sombre doit être accessible **en permanence** depuis l'en-tête ; les trois axes se
règlent aussi depuis une section dédiée des Paramètres.

**Why this priority**: C'est la demande explicite (« thème clair et thème sombre, sombre par défaut ») et le
**socle** de toute la refonte : tous les écrans consomment ces variables d'apparence. Sans elle, rien ne
s'affiche correctement dans la nouvelle identité.

**Independent Test**: À la première visite (sans préférence), l'app s'affiche en **sombre / violet / style A**.
Basculer le mode via l'en-tête change instantanément l'apparence sans rechargement ; changer palette/style
dans les Paramètres se reflète immédiatement ; après **rechargement**, les trois choix sont **restaurés**.

**Acceptance Scenarios**:

1. **Given** une première visite sans préférence enregistrée, **When** l'app se charge, **Then** elle
   s'affiche en **mode sombre**, palette **violet**, style **A**.
2. **Given** l'app ouverte, **When** je clique le **toggle de thème** de l'en-tête, **Then** l'apparence
   bascule clair ⇄ sombre **immédiatement** (sans rechargement) et le choix est **mémorisé**.
3. **Given** la section « Paramètres graphiques », **When** je change la palette (violet/cyan/vert) ou le
   style (A/B), **Then** toute l'interface se met à jour en direct et le choix est **mémorisé**.
4. **Given** n'importe laquelle des **12 combinaisons** (2 modes × 3 palettes × 2 styles), **When**
   j'explore les 5 vues, **Then** tous les éléments (texte, badges, tableaux, **arbre SVG**, **courbe SVG**,
   états de sélection, erreurs) restent **lisibles et contrastés**.

---

### User Story 2 - Refonte visuelle hi-fi des 5 vues & du chrome global (Priority: P2)

En tant qu'utilisateur, je veux une interface **entièrement redessinée**, fidèle à la maquette, sur les
**5 vues** (Paramètres, Population, Fiche, Arbre dédié, Sandbox) et le **chrome global** (en-tête,
barre import/export, pied de page, aides de navigation), **sans perdre aucune fonctionnalité** existante.

**Why this priority**: C'est le cœur de la « refonte complète ». Elle apporte la valeur visuelle attendue
mais dépend du socle de thème (US1). La contrainte absolue est la **non-régression fonctionnelle**
(`DefUi.md`).

**Independent Test**: Pour chaque vue, comparer à la maquette (revue visuelle) **et** dérouler la
check-list fonctionnelle de `DefUi.md` : 100 % des actions/champs/états restent présents et opérants.

**Acceptance Scenarios**:

1. **Given** l'app chargée, **When** j'observe l'**en-tête**, **Then** il est **collant** (sticky), montre
   logo + titre + navigation (Paramètres / Population / Sandbox, les deux derniers désactivés sans
   population) + **toggle de thème**, et la **barre import/export** est présente dessous.
2. **Given** n'importe quelle vue, **When** je regarde le bas de page, **Then** un **pied de page de
   version** persistant est affiché ; **When** je défile de plus de ~300 px, **Then** un **bouton
   « remonter en haut »** apparaît et me ramène en haut au clic.
3. **Given** une des 5 vues, **When** je l'utilise, **Then** **toutes** les fonctionnalités décrites dans
   `DefUi.md` pour cette vue sont présentes et fonctionnelles (aucune perte).
4. **Given** la **Fiche** d'un individu, **When** je la consulte, **Then** j'y vois (en plus de l'existant)
   la **liste de ses enfants** (cliquables vers leur fiche) et le **type** de chacun de ses traits.

---

### User Story 3 - Confort sur gros volumes & organisation (Priority: P3)

En tant qu'utilisateur, je veux **paginer** les grandes listes et **organiser** la sandbox en onglets, pour
rester à l'aise même avec une population nombreuse.

**Why this priority**: Améliore l'ergonomie et la performance perçue, mais n'est pas indispensable au rendu
de base (US1/US2).

**Independent Test**: Avec une population de 1000+ individus, la liste n'affiche qu'une **page** (taille
choisie) ; changer la taille ou la page met à jour l'affichage. Dans la sandbox, basculer entre les onglets
**Population** et **Couples** conserve l'état.

**Acceptance Scenarios**:

1. **Given** une grande population, **When** j'ouvre la liste, **Then** une **pagination** est proposée
   (tailles 50 / 100 / 250 / 1000 / Tous, **défaut 50**) avec un indicateur « début–fin sur total » et des
   flèches précédent/suivant **bornées**.
2. **Given** une taille de page choisie, **When** je la change, **Then** l'affichage revient à la **page 1**.
3. **Given** la **Sandbox**, **When** je bascule entre les onglets **Population** et **Couples & cycle de
   vie conjugal**, **Then** chaque onglet conserve ses contrôles ; la **lentille temporelle** (champ
   numérique **et** curseur synchronisés) reste disponible et commune.
4. **Given** le **mode reproduction manuelle** en sandbox, **When** un filtre ou la pagination masque des
   parents déjà sélectionnés, **Then** ces parents **restent sélectionnés** (« Valider » les inclut).

---

### Edge Cases

- **Les 12 combinaisons d'apparence** (mode × palette × style) restent lisibles ; cas sensibles :
  **arbre généalogique** (cartes, liens, symboles ⚭/⚮, bordures « ex » en pointillés) et **courbe
  gaussienne**.
- **Hors-ligne / polices indisponibles** : si les polices web ne sont pas (encore) chargées, l'app **retombe
  proprement** sur les polices système (`system-ui` / `monospace`) **sans casse** ni perte de
  fonctionnalité.
- **Mouvement réduit** (`prefers-reduced-motion`) : transitions désactivées ; le bouton « remonter » ramène
  en haut **sans animation**.
- **Pagination** : flèches désactivées en première/dernière page ; changement de taille → page 1 ; « Tous »
  affiche tout.
- **Petits écrans (mobile)** : navigation, tableaux (défilement horizontal), arbre (zoom/pan/pincement) et
  formulaires restent utilisables ; cibles tactiles confortables.
- **Première visite** sans `localStorage` : défauts sombre / violet / A ; **`localStorage` indisponible** :
  l'app fonctionne quand même (apparence par défaut, sans mémorisation).
- **Bascule de thème pendant une saisie** : l'état des formulaires/sélections est **préservé** (changement
  purement visuel).

## Requirements *(mandatory)*

### Functional Requirements

#### Thématisation (US1)

- **FR-001**: Le système DOIT proposer **3 axes d'apparence indépendants** : **mode** (`sombre` | `clair`),
  **palette** (`violet` | `cyan` | `vert`), **style** (`A — Atelier` | `B — Signal`).
- **FR-002**: Les **défauts** DOIVENT être **sombre / violet / A** lorsqu'aucune préférence n'est
  enregistrée.
- **FR-003**: Un **basculement clair/sombre** DOIT être accessible **en permanence** depuis l'en-tête, sans
  rechargement de page.
- **FR-004**: Une section **« Paramètres graphiques »** (dans la vue Paramètres) DOIT permettre de régler
  les **3 axes** ; tout changement se reflète **immédiatement** sur toute l'interface.
- **FR-005**: Les **3 choix** DOIVENT être **mémorisés** (préférence d'interface locale) et **restaurés** au
  rechargement — sans être inclus dans l'export/import de l'état applicatif.
- **FR-006**: Toutes les **12 combinaisons** d'apparence DOIVENT préserver la **lisibilité/contraste** de
  l'ensemble des éléments (texte, badges, tableaux, SVG arbre & courbe, sélections, erreurs).

#### Chrome global (US2)

- **FR-007**: L'**en-tête** DOIT être **persistant/collant** et contenir : identité (logo + titre),
  **navigation** vers Paramètres / Population / Sandbox (les deux derniers **désactivés** sans population),
  l'élément **actif** étant visuellement distinct, et le **toggle de thème**.
- **FR-008**: La **barre import/export** DOIT rester présente et fonctionnelle (3 exports + import auto-détecté).
- **FR-009**: Un **pied de page de version** persistant DOIT être affiché sur toutes les vues (nom de l'app
  + version/indicateur hors-ligne).
- **FR-010**: Un **bouton « remonter en haut »** DOIT apparaître au-delà d'un certain défilement (≈ 300 px)
  et ramener en haut au clic, en respectant `prefers-reduced-motion`.
- **FR-011**: À l'ouverture d'une **Fiche** ou de l'**Arbre dédié**, le défilement DOIT être remis **en
  haut**.

#### Refonte des vues, sans perte fonctionnelle (US2)

- **FR-012**: Les **5 vues** (Paramètres, Population, Fiche, Arbre, Sandbox) et **tous les composants**
  (barre de temps, filtres, arbre, légende, sélecteur de mode de traits, éditeurs d'espèces/catalogues/
  résilience, courbe, import/export, formulaire d'individu) DOIVENT être **restylés** conformément au
  handoff.
- **FR-013**: La refonte NE DOIT entraîner **aucune perte de fonctionnalité** : **100 %** des
  fonctionnalités décrites dans `rsrc/DefUi.md` restent présentes et opérantes.
- **FR-014**: La refonte est **purement présentationnelle** : le **cœur** (`src/core`) et les **stores de
  logique** (état applicatif, sandbox) NE DOIVENT PAS être modifiés dans leur logique ; seuls des **états
  d'interface** (apparence, pagination, onglets, vue d'arbre…) peuvent être ajoutés.
- **FR-015**: La **Fiche** DOIT afficher, en plus de l'existant, la **liste des enfants** de l'individu
  (cliquables vers leur fiche) et le **type** de chaque trait.

#### Confort & organisation (US3)

- **FR-016**: Les tableaux de **Population** et de **Sandbox** DOIVENT proposer une **pagination** : tailles
  **50 / 100 / 250 / 1000 / Tous** (**défaut 50**), indicateur « début–fin sur total », flèches
  précédent/suivant **bornées** ; changer la taille **revient à la page 1**.
- **FR-017**: La **Sandbox** DOIT organiser ses contrôles en **deux onglets** — **Population** (liste,
  reproduction manuelle, création/clonage/édition/suppression) et **Couples & cycle de vie conjugal** — la
  **barre d'actions** (make it real / reset / quitter) et la **lentille temporelle** restant communes.
- **FR-018**: La **lentille temporelle** de la sandbox DOIT offrir un **champ numérique** et un **curseur**
  **synchronisés** sur la même année (bornée à l'intervalle autorisé).
- **FR-019**: En **mode reproduction manuelle**, la **sélection de parents** DOIT rester **indépendante** du
  filtrage et de la pagination (les parents masqués restent sélectionnés).

#### Polices & contraintes transverses

- **FR-020**: L'interface DOIT utiliser les polices du handoff selon le style (A → Hanken Grotesk + JetBrains
  Mono ; B → Space Grotesk + Space Mono). Ces polices DOIVENT être **auto-hébergées** (fichiers locaux
  `woff2`, déclarées en `@font-face`) et **précachées** par le service worker pour être disponibles
  **hors-ligne** ; un **repli système** est conservé en sécurité si une police manque.
- **FR-021**: Les contraintes du projet DOIVENT être préservées : **100 % statique / hors-ligne**,
  **déterminisme** (aucun aléatoire/horloge introduit dans la logique), **persistance applicative par
  fichier uniquement**, **français**, **anonymat**.
- **FR-022**: L'interface DOIT rester **accessible** (navigation clavier, rôles/libellés ARIA, contraste
  dans les deux thèmes) et **responsive/tactile** (cibles ≥ ~44 px, tableaux défilables, arbre tactile).

### Key Entities *(include if feature involves data)*

> Toutes ces entités sont des **états d'interface** (non exportés dans l'état applicatif, non persistés en
> fichier ; l'apparence peut l'être en préférence locale).

- **Préférences d'apparence** : `mode` (sombre/clair), `palette` (violet/cyan/vert), `style` (A/B) ;
  mémorisées localement, appliquées à toute l'UI.
- **État de pagination** : taille de page + page courante, pour la liste de Population et pour la Sandbox.
- **État d'onglet Sandbox** : onglet actif (Population / Couples) + état du mode reproduction.
- **État de vue d'arbre** : zoom, déplacement (tx/ty), individu centré, profondeur.
- **Mode d'affichage des traits** : 1 / 2 / 3 (existant), défaut 3.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **100 %** des fonctionnalités listées dans `rsrc/DefUi.md` restent disponibles et opérantes
  après la refonte (**0 régression**).
- **SC-002**: À la première visite (aucune préférence), l'app s'affiche en **sombre / violet / A** dans
  **100 %** des cas.
- **SC-003**: Les **3 préférences d'apparence** sont **restaurées** après rechargement dans **100 %** des
  cas où `localStorage` est disponible.
- **SC-004**: Le basculement de thème est reflété en **moins d'1 seconde**, **sans rechargement**.
- **SC-005**: Les **12 combinaisons** d'apparence présentent un **contraste suffisant** pour le texte
  courant (cible niveau AA) — vérifiable visuellement/au contrôleur de contraste.
- **SC-006**: Avec **1000+ individus**, la liste n'affiche qu'**au plus la taille de page choisie** et reste
  **fluide** (navigation de page perçue instantanée).
- **SC-007**: **Chaque** vue correspond à la maquette de référence (revue visuelle hi-fi validée).
- **SC-008**: L'ensemble des actions est atteignable **au clavier** ; le bouton « remonter » apparaît
  au-delà d'~300 px de défilement.
- **SC-009**: L'application reste **statique et pleinement utilisable hors-ligne, polices incluses**
  (auto-hébergées et précachées) ; un repli système garantit **zéro casse** si une police venait à manquer.

## Assumptions

- **Source de vérité** : pour cette feature, `design_handoff_refonte_ui/` prime pour **tout le visuel** ;
  `rsrc/DefUi.md` fait foi pour la **préservation fonctionnelle**. (Le `DescriptionProjet.md` reste la source
  métier mais n'est pas modifié par cette refonte.)
- **Présentation seulement** : `src/core` et les stores de **logique** (état applicatif, sandbox) ne sont pas
  modifiés dans leur logique ; l'état d'**interface** (apparence, pagination, onglets, vue d'arbre) peut être
  ajouté côté UI.
- **Système de thème déjà amorcé** : `design_handoff_refonte_ui/tokens.css` a été **fusionné** dans
  `src/app.css`. Les **4 polices** ont été déclarées dans `index.html` **via CDN** en préparation — ce
  chargement CDN sera **remplacé** par un **hébergement local** (cf. Clarification 2026-06-18).
- **Polices** : **auto-hébergées** (fichiers locaux `woff2`, `@font-face`) et **précachées** par le service
  worker pour une autonomie **hors-ligne stricte** (Principe II) ; repli système en sécurité.
- **Version affichée** : la chaîne du pied de page (numéro/build) provient de la configuration du projet ;
  sa valeur exacte est indicative.
- **Préférences d'interface en `localStorage`** : autorisées par `DefUi.md` (ce ne sont pas des données
  applicatives) ; en l'absence de `localStorage`, l'app fonctionne avec les défauts sans mémorisation.
- **Nouveaux affichages de Fiche** (liste des enfants, type de trait) : dérivés de données **déjà
  présentes** dans le modèle, donc sans changement de logique métier.
