# Recherche & décisions — Feature 008 (Refonte complète de l'UI)

Phase 0. Décisions techniques. **Présentation seulement** ; **aucune dépendance ajoutée** (Principe VIII) ;
**`src/core` intouché** (Principe IV). Source visuelle : `design_handoff_refonte_ui/` ; contrat fonctionnel :
`rsrc/DefUi.md`.

## D1 — Application & mémorisation du thème (3 axes)

- **Décision** : trois axes posés en **attributs sur `<html>`** : `data-mode` (`dark`|`light`),
  `data-palette` (`violet`|`cyan`|`vert`), `data-style` (`a`|`b`). Le store `ui.ts` détient l'état,
  l'**applique** à `document.documentElement` via un abonnement, et le **persiste** dans `localStorage`.
  Défauts : `dark` / `violet` / `a`. `tokens.css` (déjà fusionné dans `app.css`) fait le reste via
  `color-mix()`.
- **Anti-FOUC** : un **petit script inline** dans `index.html` (avant le bundle) lit `localStorage` et pose
  les attributs **avant** le premier rendu (évite le flash clair→sombre). Repli : défauts si rien.
- **Rationale** : zéro dépendance, bascule instantanée (échange d'attribut, SC-004), persistance simple
  (préférence d'interface, hors `AppState` — Principe VI).
- **Alternatives rejetées** : classes CSS sur `body` (moins lisible que data-attributs) ; thème dans
  `AppState`/export (violerait Principe VI : ce n'est pas une donnée applicative) ; bibliothèque de
  theming (inutile, anti-YAGNI).

## D2 — Polices auto-hébergées (hors-ligne)

- **Décision** : héberger les **4 familles** en `woff2` sous `public/fonts/` et les déclarer en
  `@font-face` dans `app.css` : **Hanken Grotesk** (400–700) & **JetBrains Mono** (400–600) pour le style A,
  **Space Grotesk** (400–700) & **Space Mono** (400/700) pour le style B. **Retirer** le `<link>` Google
  Fonts d'`index.html`. Inclure `woff2` dans le **précache Workbox** (`vite-plugin-pwa` globPatterns).
- **Rationale** : autonomie **hors-ligne stricte** (Principes II/III), suppression de l'appel tiers
  (Principe X), polices disponibles dès le 1er rendu après install. `font-display: swap` + **repli système**
  (`system-ui`/`monospace`) en sécurité.
- **Alternatives rejetées** : CDN Google Fonts (dépendance réseau, appel tiers) ; polices variables vs
  statiques — on prend les graisses nécessaires en `woff2` (poids maîtrisé).
- **Note licences** : les 4 familles sont sous **SIL Open Font License** (redistribuables) ; conserver les
  fichiers de licence à côté des polices.

## D3 — État d'interface (`ui.ts`)

- **Décision** : étendre `ui.ts` (état d'interface, **non** exporté — Principe VI) avec :
  - **persistés `localStorage`** : `mode`, `palette`, `style`, `traitMode` (existant) ;
  - **session (non persistés requis)** : `listePageSize`/`listePage` ; `sbTab` (`population`|`couples`),
    `sbPageSize`/`sbPage` ; `arbreScale`/`arbreTx`/`arbreTy`/`arbreRootId`/`arbreDepth` ; `showScrollTop`.
  - Le **mode reproduction** et la **sélection de parents** restent gérés par `sandboxStore` (existant) ;
    on n'y touche pas la logique.
- **Rationale** : centralise la présentation, garde `appState`/`sandboxStore` (logique) **inchangés**
  (FR-014). Persistance limitée aux préférences (apparence + mode traits).
- **Alternatives rejetées** : tout en local-composant (perte d'état entre navigations) ; tout persisté
  (pagination/onglet n'ont pas à survivre au rechargement).

## D4 — Pagination (Liste & Sandbox)

- **Décision** : pagination **purement présentationnelle** : on **tranche** la liste **déjà filtrée**
  (`filterPopulation`) selon `pageSize` ∈ {50, 100, 250, 1000, Tous} (**défaut 50**) et `page`. Changer la
  taille ⇒ **retour page 1**. Indicateur « début–fin / total » + flèches **bornées**. Composant
  `Paginator.svelte` réutilisé.
- **Rationale** : DOM borné ⇒ fluidité 1000+ (SC-006) ; aucune logique métier touchée.
- **Interaction repro (sandbox)** : la **sélection de parents** est un `Set` d'ids **indépendant** des lignes
  rendues ⇒ un parent hors page/filtré **reste sélectionné** (FR-019). Aucun changement à faire côté logique,
  juste ne pas dériver la sélection des lignes visibles.
- **Alternatives rejetées** : virtualisation (overkill pour ces volumes, ajout de complexité) ; pagination
  côté cœur (le cœur ne fait pas d'affichage).

## D5 — Sandbox en onglets

- **Décision** : deux **onglets internes** — **Population** (liste, repro manuelle, créer/cloner/éditer/
  supprimer) et **Couples & cycle de vie conjugal** (former/divorcer/dissoudre) — avec **barre d'actions**
  (make it real / reset / quitter) et **lentille temporelle** **communes**. Onglet actif dans `ui.ts`
  (`sbTab`). Réutilise les contrôles existants de `SandboxView`.
- **Lentille** : **champ numérique** + **curseur** liés à la **même** valeur d'année (bornée
  `[birthYear, currentYear]`), via les setters existants du `sandboxStore`.
- **Rationale** : clarté (la sandbox est dense) ; aucune logique modifiée.
- **Alternatives rejetées** : tout sur une page (encombré) ; séparer en 2 vues distinctes (perd la barre
  d'actions/lentille communes).

## D6 — Arbre généalogique (organigramme)

- **Décision** : **refondre le rendu** (`GenealogyTree.svelte` + `treeLayout.ts`) selon la maquette
  (organigramme : cartes ~162×62, rangées, connecteurs « ⊓ », symbole ⚭ aux unions ; **âge masqué** en
  fiche, **affiché** en page dédiée ; décédé = pointillés + « † » ; observé = bordure accent + fond chip).
  **Réutiliser** `buildGenealogyTree` du **cœur** (inchangé) ; `treeLayout` reste **pur**. Le zoom/pan
  (molette **non-passive** bornée 0.2–4 centrée curseur ; pan pointer seuil 5 px ; clic = recentrer en page
  dédiée / ouvrir fiche en fiche) reste un comportement **UI** (état dans `ui.ts` ou local au composant).
- **Rationale** : le calcul d'arbre métier est déjà fourni par le cœur ; seule la **disposition/rendu**
  change (présentation). Le `treeLayout` pur reste testable.
- **Alternatives rejetées** : déplacer le layout dans le cœur (le cœur ne fait pas d'affichage — Principe IV) ;
  lib d'arbres externe (anti-YAGNI, dépendance).
- **Bien séparer les fratries** (DefUi §11.4 / handoff) : la disposition DOIT regrouper les enfants **par
  couple** sans chevauchement (amélioration de `treeLayout`).

## D7 — Enrichissements Fiche (liste enfants, type de trait)

- **Décision** : étendre le **view-model pur** `ficheViewModel.ts` pour exposer (a) la **liste des enfants**
  (ids → `{id, nom}` cliquables) et (b) le **type** de chaque trait (via le préfixe d'id `traitTypeOf`,
  déjà dans le cœur, ou le catalogue). Données **déjà présentes** dans le modèle ⇒ **aucun** changement de
  logique métier.
- **Rationale** : satisfait FR-015 (+ backlog DefUi §11.2) ; reste pur et testable.
- **Alternatives rejetées** : calcul ad hoc dans le composant (moins testable).

## D8 — Pied de page de version

- **Décision** : afficher « Générateur de Pouvoir · v<version> · hors-ligne » ; `<version>` provient de
  `package.json` injectée **au build** (Vite `define`, ex. `__APP_VERSION__`). Pas d'horloge runtime.
- **Rationale** : déterministe, sans dépendance ; valeur indicative (SC). Le « build N » de la maquette est
  cosmétique et **optionnel**.
- **Alternatives rejetées** : numéro de build via horloge/CI runtime (introduirait une source non
  déterministe côté affichage ; inutile).

## D9 — Bouton « remonter en haut »

- **Décision** : composant `ScrollToTop.svelte` ; visible quand `scrollY > ~300 px` (état `showScrollTop`) ;
  clic ⇒ `window.scrollTo({ top: 0, behavior })` avec `behavior: 'auto'` si `prefers-reduced-motion`, sinon
  `'smooth'`. **Pas** de `scrollIntoView`. Le scroll-top à l'ouverture Fiche/Arbre (existant) est conservé.
- **Rationale** : confort de navigation (FR-010), accessibilité (`prefers-reduced-motion`).

## D10 — Accessibilité & responsive

- **Décision** : navigation **clavier** (focus visibles, lignes de tableau activables), **ARIA**
  (régions/labels existants conservés et étendus), **contraste** vérifié dans les **2 modes** (cible AA pour
  le texte courant) ; cibles tactiles ≥ 44 px (déjà dans `app.css`), tableaux défilables, arbre tactile
  (pan/zoom/pincement). `prefers-reduced-motion` désactive les transitions (déjà présent).
- **Rationale** : Principe III + FR-022 + SC-005/SC-008.

## D11 — Aucune dépendance ajoutée

- **Décision** : tout est réalisé avec l'existant (Svelte, Vite, `vite-plugin-pwa`, `color-mix()` CSS,
  polices locales). **Aucune** dépendance (Principe VIII).
