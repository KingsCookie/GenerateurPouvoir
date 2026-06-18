---
description: "Task list — Feature 008 : Refonte complète de l'UI"
---

# Tasks: Refonte complète de l'UI

**Input**: Design documents from `specs/008-refonte-ui/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Périmètre** : **présentation seulement**. **`src/core` n'est PAS modifié** (Principe IV) ⇒ les tests cœur
à seed fixe restent verts sans y toucher. Les seuls tests ajoutés sont **purs** et **optionnels** (helpers
UI : pagination, view-model de fiche). L'état ajouté est de l'**interface** (`src/ui/stores/ui.ts`), **hors**
`AppState`/export (Principe VI).

**Source de vérité** : `design_handoff_refonte_ui/` (visuel) + `rsrc/DefUi.md` (non-régression fonctionnelle).

## Format : `[ID] [P?] [Story?] Description (chemin)`

- **[P]** : parallélisable (fichiers distincts, aucune dépendance non satisfaite).
- **[Story]** : US1 / US2 / US3 (phases user story uniquement).

> ⚠️ **Fichiers partagés (séquentiels, pas de [P])** : `src/ui/stores/ui.ts` (T004→T021→T023),
> `src/ui/App.svelte` (T007→T009→T012), `src/ui/views/ParametresView.svelte` (T008→T016),
> `src/ui/views/ListeView.svelte` (T017→T026), `src/app.css` (T002→T003), `vite.config.ts` (T002→T010),
> `src/ui/lib/ficheViewModel.ts` (T018), `src/ui/views/FicheView.svelte` (T019),
> `src/ui/lib/treeLayout.ts` (T020) → `GenealogyTree.svelte` (T021) → `ArbreView.svelte` (T022).

---

## Phase 1 : Setup

- [x] T001 Baseline verte avant refonte : `npm run test` + `npm run lint` + `npm run build` au vert (référence cœur intact) ; noter le hash du bundle pour comparaison.

---

## Phase 2 : Foundational (prérequis bloquants)

**⚠️ Bloque US1, US2 et US3** (identité visuelle de base + polices).

- [x] T002 [P] Polices **auto-hébergées** : placer les `woff2` (Hanken Grotesk 400–700, JetBrains Mono 400–600, Space Grotesk 400–700, Space Mono 400/700) + leurs licences **OFL** dans `public/fonts/` ; déclarer les `@font-face` (avec `font-display: swap`) dans `src/app.css` ; **retirer** le `<link>` Google Fonts de `index.html` ; ajouter `woff2` aux `globPatterns` Workbox dans `vite.config.ts` (précache). (research D2)
- [x] T003 Styles de base restylés `src/app.css` : appliquer `var(--font)` au `body` et `var(--mono)` aux éléments mono ; restyler boutons (primary/contour), `input`/`select`, focus visibles ; primitives partagées (carte `--bg-elev`/`--border`/`--radius`, chip `--chip-*`/`--chip-radius`, badge accent, label `--label-transform`) conformes aux tokens, **lisibles dans les 2 modes**. Dépend de T002 (même fichier). **Note BUG-001** : la règle `.nav-item.is-active` (style A) doit rendre l'état actif **nettement distinct** (bordure d'accent marquée + fond/texte teintés), pas un chip trop léger ; aligner `.chip:has(input:checked)` et `tr.selected`.

**Checkpoint** : polices locales chargées (hors-ligne), primitives et tokens prêts pour toutes les vues.

---

## Phase 3 : User Story 1 — Thématisation & préférences d'apparence (Priority: P1) 🎯 MVP

**Goal** : 3 axes d'apparence (mode sombre défaut/clair · palette violet/cyan/vert · style A/B), toggle
permanent en-tête + section Paramètres, **mémorisés** ; toutes les vues existantes restent lisibles.

**Independent Test** : première visite ⇒ sombre/violet/A ; toggle en-tête bascule clair/sombre sans
rechargement ; changer palette/style en direct ; après rechargement, les 3 choix sont restaurés
(cf. quickstart US1).

- [x] T004 [US1] `src/ui/stores/ui.ts` : ajouter `mode` (`dark`|`light`, défaut `dark`), `palette` (`violet`|`cyan`|`vert`, défaut `violet`), `style` (`a`|`b`, défaut `a`) + `setMode`/`toggleMode`/`setPalette`/`setStyle` ; **persistance `localStorage`** ; abonnement appliquant `data-mode`/`data-palette`/`data-style` sur `document.documentElement` ; hydratation au démarrage (défauts si absent/illisible). (contrat §2)
- [x] T005 [US1] `index.html` : **script inline anti-FOUC** posant les 3 attributs depuis `localStorage` (défauts sinon) **avant** le bundle, pour éviter le flash. (research D1)
- [x] T006 [P] [US1] `src/ui/components/ThemeControls.svelte` (nouveau) : segments des 3 axes (mode, palette avec pastilles de couleur, style A/B) + une variante **toggle** compacte ; pilote `ui.ts`. Bouton actif = chip ; inactif = contour.
- [x] T007 [US1] `src/ui/App.svelte` : intégrer le **toggle de thème** (mode clair/sombre) dans l'en-tête via `ThemeControls`. Dépend de T006.
- [x] T008 [US1] `src/ui/views/ParametresView.svelte` : ajouter la section **« Paramètres graphiques »** (en tête) réglant les **3 axes** via `ThemeControls`. Dépend de T006.

**Checkpoint** : US1 testable seule — l'apparence est pilotable et mémorisée sur l'UI (même non encore restylée).

---

## Phase 4 : User Story 2 — Refonte hi-fi des 5 vues & chrome global (Priority: P2)

**Goal** : interface entièrement redessinée (fidèle maquette) sur les 5 vues + chrome (en-tête sticky, barre
I/O, **pied de page version**, **bouton remonter**), **sans perte de fonctionnalité** (DefUi).

**Independent Test** : pour chaque vue, comparer à la maquette **et** dérouler la check-list `DefUi.md`
(100 % des actions présentes). Pied de page + bouton remonter opérants (cf. quickstart US2).

### Chrome global

- [x] T009 [US2] `src/ui/App.svelte` : en-tête **sticky** (pastille logo `--logo-radius`/`--accent`, titre, nav `Paramètres`/`Population`/`Sandbox` avec `.nav-item`/`.is-active` et conditions d'activation) ; placement de la **barre I/O** (fond `--tint-bg`, bordure basse). Dépend de T007 (même fichier).
- [x] T010 [P] [US2] `src/ui/components/AppFooter.svelte` (nouveau) + `vite.config.ts` (define `__APP_VERSION__` depuis `package.json`) : **pied de page de version** persistant (« Générateur de Pouvoir · v<version> · hors-ligne »). (research D8 ; vite.config après T002)
- [x] T011 [P] [US2] `src/ui/components/ScrollToTop.svelte` (nouveau) : bouton **remonter-en-haut** visible si `scrollY > ~300` ; clic ⇒ `window.scrollTo({top:0, behavior})` (`auto` si `prefers-reduced-motion`, sinon `smooth`). (research D9)
- [x] T012 [US2] `src/ui/App.svelte` : monter `AppFooter` + `ScrollToTop` ; conserver le scroll-top à l'ouverture Fiche/Arbre. Dépend de T009, T010, T011 (même fichier).

### Restyle des composants & vues (présentation, logique inchangée)

- [x] T013 [P] [US2] Restyle `src/ui/components/TimeBar.svelte` + `src/ui/components/FilterBar.svelte` (cartes `--bg-elev`, chips de filtre, grand nombre d'année `--mono`/`--accent-text` + `--year-shadow`, bouton accent).
- [x] T014 [P] [US2] Restyle `src/ui/components/StateIO.svelte` + `src/ui/components/TraitModeSelector.svelte` + `src/ui/components/TreeLegend.svelte` (boutons export contour/accent, segments actifs en chip, légende lisible 2 modes).
- [x] T015 [P] [US2] Restyle `src/ui/components/SpeciesEditor.svelte` + `src/ui/components/GaussianCurve.svelte` + `src/ui/components/TraitCatalogEditor.svelte` + `src/ui/components/ResilienceOverrides.svelte` (cartes, chips trait+poids, champs `--mono`, courbe lisible 2 modes).
- [x] T016 [US2] Restyle `src/ui/views/ParametresView.svelte` : **index latéral collant** + sections en **cartes** (titre + pastille accent) + champs/labels conformes tokens. Dépend de T008 (même fichier).
- [x] T017 [US2] Restyle `src/ui/views/ListeView.svelte` : en-tête de résultats (`--mono`), tableau (grille de colonnes, « espèce · génération » sous le nom, **† décédé** en `--danger`, pouvoirs en **chips**, hover `--hover-bg`), **lignes cliquables** activables clavier.
- [x] T018 [US2] `src/ui/lib/ficheViewModel.ts` : exposer (pur) la **liste des enfants** (`{id, nom}[]` résolus dans la population) et le **type** de chaque trait affiché (`traitTypeOf`). (research D7)
- [x] T019 [US2] Restyle `src/ui/views/FicheView.svelte` : en-tête (nom + badge statut + « espèce · genre · génération »), 2 colonnes (Informations / Cycle de vie : conjoints, % repro, **tuer** + erreur si cause vide), cartes de pouvoir (badge gabarit, P/M), **liste des enfants** (chips cliquables → fiche), **type** par trait. Dépend de T018.

### Refonte de l'arbre

- [x] T020 [US2] `src/ui/lib/treeLayout.ts` : disposition **organigramme** conforme maquette (cartes 162×62, rangées, connecteurs « ⊓ », symbole **⚭** aux unions, **séparation nette des fratries par couple** — DefUi §11.4) ; **pur**, réutilise `buildGenealogyTree` (cœur inchangé).
- [x] T021 [US2] `src/ui/stores/ui.ts` : ajouter l'**état de vue d'arbre** — `arbreScale` (0.2–4), `arbreTx`, `arbreTy`, `arbreRootId` (`string|null`), `arbreDepth` (≥1) — **session** (non persistés). Puis refonte `src/ui/components/GenealogyTree.svelte` : rendu organigramme + **zoom** (molette non-passive bornée 0.2–4, centrée curseur) + **pan** (seuil 5 px) + **clic** (recentrer page dédiée / ouvrir fiche) ; **âge masqué** en fiche, **affiché** en page dédiée ; décédé = pointillés + « † » ; observé = bordure accent + `--chip-bg`. Dépend de T020 (et de `ui.ts` T004, même fichier).
- [x] T022 [US2] Refonte `src/ui/views/ArbreView.svelte` : barre de contrôles (← retour, **profondeur 1/2/3/4** segments, **zoom** −/%/+, **recentrer**) reliée à l'**état d'arbre** (`ui.ts`, **ajouté en T021**). Dépend de T021.

**Checkpoint** : US1 + US2 — UI entièrement redessinée, chrome complet, 0 régression DefUi.

---

## Phase 5 : User Story 3 — Pagination & organisation (Priority: P3)

**Goal** : pagination des grandes listes (Liste + Sandbox) ; sandbox en **onglets** (Population / Couples) ;
lentille temporelle champ+curseur.

**Independent Test** : 1000+ individus ⇒ une page (taille choisie) ; changer la taille ⇒ page 1 ; basculer
les onglets sandbox conserve l'état ; lentille champ/curseur synchronisés (cf. quickstart US3).

- [x] T023 [US3] `src/ui/stores/ui.ts` : ajouter `listePageSize`/`listePage`, `sbPageSize`/`sbPage` (setters de taille remettant `page=1`), `sbTab` (`population`|`couples`), `showScrollTop` — **session** (non persistés). (L'**état d'arbre** est ajouté en **T021**, US2.) Dépend de T004 et T021 (même fichier).
- [x] T024 [P] [US3] `src/ui/lib/pagination.ts` (nouveau, **pur**) : `paginate(items, page, size)` → `{ pageItems, page, nbPages, from, to, total }` ; borne `page` à `[1, nbPages]` ; gère `'all'`. (contrat §3)
- [x] T025 [P] [US3] `src/ui/components/Paginator.svelte` (nouveau) : sélecteur de taille **50/100/250/1000/Tous** (actif = chip), indicateur « début–fin / total », flèches `‹ ›` **bornées** (désactivées aux extrêmes).
- [x] T026 [US3] `src/ui/views/ListeView.svelte` : intégrer `Paginator` + `paginate` sur la population **filtrée** (au-dessus du tableau). Dépend de T017, T024, T025 (ListeView après son restyle).
- [x] T027 [US3] Refonte `src/ui/views/SandboxView.svelte` : **onglets** Population / Couples (`sbTab`) ; barre d'actions (make it real/reset/quitter) + **lentille** (champ numérique **et** curseur **synchronisés**) communes ; `FilterBar` + `Paginator` sur l'onglet Population ; **sélection de parents indépendante** du filtre/pagination (INV-UI5) ; restyle conforme maquette. Dépend de T023, T024, T025.
- [x] T028 [US3] Refonte `src/ui/components/SandboxPersonForm.svelte` (modale) conforme maquette : overlay + carte scrollable ; statut en segment Vivant/Décédé (+ raisonDeces) ; éditeur **ADN par type** (chips actif/inactif + résilience + « + trait ») ; **profil de pouvoir** « Sans pouvoir / Normal (traits → pouvoirs) / Mutation forte » ; pouvoirs P/M (1–10) + retrait. (logique `sandboxStore` inchangée)

**Checkpoint** : les 3 user stories sont indépendamment fonctionnelles ; UI complète.

---

## Phase 6 : Polish & transverse

- [x] T029 [P] `tests/unit/pagination.test.ts` (nouveau) : tests **purs** de `paginate` (bornage page, `'all'`, calcul from/to/nbPages, liste vide).
- [x] T030 [P] `tests/unit/fiche-vm.test.ts` (étendre) : enfants résolus (id→nom) + **type** de trait exposés par le view-model (purs).
- [x] T031 [P] (BUG-001 corrigé) Accessibilité & contraste : vérifier les **12 combinaisons** (mode×palette×style) sur les 5 vues — focus clavier, contraste **AA** du texte courant, arbre & courbe lisibles. **BUG-001 résolu** : `.nav-item.is-active` (style A) renforcé (bordure d'accent + fond teinté marqué + gras), `.chip:has(input:checked)` et `tr.selected` alignés ⇒ état actif/sélectionné nettement distinct en style A comme en B.
- [x] T032 Dérouler `specs/008-refonte-ui/quickstart.md` (US1/US2/US3 + non-régression DefUi + hors-ligne/polices).
- [x] T033 Portes de qualité : `npm run test` (cœur **vert**, + tests purs UI) + `npm run lint` + `npm run build` **verts** ; vérifier que les `woff2` sont **précachés** et que l'app se charge **hors-ligne** ; bundle déployable (Principe II).

---

## Dependencies & Execution Order

### Dépendances de phase

- **Setup (T001)** avant tout.
- **Foundational (T002–T003)** avant US1/US2/US3.
- **US1 (P1)** est le socle d'apparence ; **US2** (chrome/restyle) en dépend visuellement ; **US3** ajoute
  pagination/onglets (dépend de `ui.ts` T004 et des vues restylées).
- **Polish (T029–T033)** en dernier.

### Dépendances par story

- **US1** : T004 ‖ T005 ‖ T006 → T007 (après T006) ‖ T008 (après T006).
- **US2** : T009 (après T007) → T012 (après T009/T010/T011) ; T013/T014/T015 [P] ; T016 (après T008) ;
  T017 ; T018 → T019 ; T020 → T021 (ajoute l'état d'arbre à `ui.ts`) → T022. **US2 est désormais
  autosuffisante** (plus de dépendance vers US3).
- **US3** : T023 (après T004 **et** T021, même fichier) ; T024/T025 [P] ; T026 (après T017/T024/T025) ;
  T027 (après T023/T024/T025) ;
  T028.

### Même fichier (séquentiel, pas de [P])

- `src/ui/stores/ui.ts` : T004 (apparence) → T021 (état d'arbre) → T023 (pagination/onglet/scroll).
- `src/ui/App.svelte` : T007 → T009 → T012.
- `src/ui/views/ParametresView.svelte` : T008 → T016.
- `src/ui/views/ListeView.svelte` : T017 → T026.
- `src/app.css` : T002 → T003 (tokens déjà fusionnés).
- `vite.config.ts` : T002 → T010.
- `src/ui/lib/ficheViewModel.ts` (T018) → `src/ui/views/FicheView.svelte` (T019).
- `src/ui/lib/treeLayout.ts` (T020) → `GenealogyTree.svelte` (T021) → `ArbreView.svelte` (T022).

## Parallel Opportunities

- **Foundational** : T002 [P] (assets/config) pendant la préparation de T003.
- **US1** : T006 [P] (nouveau composant) en parallèle de la mise en place T004/T005.
- **US2** : T010 ‖ T011 (composants distincts) ; T013 ‖ T014 ‖ T015 (composants distincts) ; la chaîne arbre
  (T020→T021→T022) en parallèle des restyles.
- **US3** : T024 ‖ T025 (fichiers distincts).
- **Polish** : T029 ‖ T030 ‖ T031.

## Implementation Strategy

### MVP (US1 seule)

1. Setup (T001) → Foundational (T002–T003).
2. US1 (T004–T008) → **STOP & VALIDATE** : thème 3 axes pilotable et mémorisé, défaut sombre, sur l'UI
   existante.
3. Démo possible (clair/sombre + palettes + styles).

### Livraison incrémentale

1. Setup + Foundational → polices locales + primitives/tokens.
2. + US1 (thématisation) → tester → démo (MVP).
3. + US2 (refonte hi-fi des 5 vues + chrome) → tester (maquette + non-régression DefUi) → démo.
4. + US3 (pagination + onglets sandbox + lentille) → tester → démo.

## Notes

- **Cœur intouché** (Principe IV) : aucune modification de `src/core` ; les tests cœur restent verts sans y
  toucher. Tests ajoutés = **purs/optionnels** (T029/T030).
- **Persistance** (Principe VI) : seules les **préférences d'apparence** (+ `traitMode`) sont en
  `localStorage` ; pagination/onglet/arbre sont **éphémères** ; **rien** n'entre dans `AppState`/export.
- **Aucune dépendance ajoutée** (Principe VIII). **Hors-ligne strict** via polices précachées (Principes
  II/III). **Anonymat** (Principe X) : commits `KingsCookie`, email vide ; auto-hébergement = 0 appel tiers.
- **Non-régression** : SC-001 = 100 % des fonctionnalités `DefUi.md` préservées (check-list quickstart).

**Bugfix**: 2026-06-18 — BUG-001 — T031 **rouverte** (état actif/sélectionné peu visible en style A) ;
note ajoutée à T003 (renforcer `.nav-item.is-active` en style A + chips/lignes sélectionnés). Correctif
**présentation seulement** (`src/app.css`), cœur inchangé.
