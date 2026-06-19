<!-- SPECKIT START -->
## Feature active : 009-ajout-4-styles

- **Plan** : `specs/009-ajout-4-styles/plan.md` (contexte technique, décisions, Constitution Check)
- **Spec** : `specs/009-ajout-4-styles/spec.md` (contrat **fonctionnel** : `rsrc/DefUi.md` — gitignoré/local.
  `DescriptionProjet.md` inchangé.)
- **Recherche / décisions** : `specs/009-ajout-4-styles/research.md` (polices OFL, accents, tokens par style)
- **Modèle de données** : `specs/009-ajout-4-styles/data-model.md` (énumérations Style/Palette étendues)
- **Contrats** : `specs/009-ajout-4-styles/contracts/ui-contract.md` (thème étendu, store, non-régression)
- **Périmètre** : **extension purement présentationnelle** du système de thème F008 — on **ajoute des
  valeurs** aux axes existants : `data-style` **+4** (`c` Éditorial serif · `d` Terminal mono · `e`
  Néo-brutaliste · `f` Organique) → 6 ; `data-palette` **+3** (`ambre` · `rose` · `bleu`) → 6.
  **72 combinaisons** (6 styles × 6 palettes × 2 modes). **Chaque** nouveau style a **son couple de polices
  auto-hébergé** (woff2 latin OFL, précaché ; mono réutilisée sauf D). Non-régression DefUi + styles/palettes
  existants à 100 %.
- **Clarification 2026-06-19** : polices = **une par style** (titre/corps + mono au besoin), auto-hébergées
  et précachées, repli système.
- **Cœur INTOUCHÉ** (Principe IV) : modifs limitées à `src/app.css`, `src/ui/stores/ui.ts`,
  `src/ui/components/ThemeControls.svelte`, `index.html` (anti-FOUC), `public/fonts/`. **Aucune dépendance
  ajoutée** ; aucune vue ni store de logique touchés ; rien dans `AppState`/export (Principe VI).
- Features livrées : 8 (`specs/008-refonte-ui/`) refonte UI 5 vues + chrome, système de thème 3 axes
  (`data-mode`/`data-palette`/`data-style` en `localStorage`), polices auto-hébergées woff2 précachées,
  pied de page version, bouton remonter, pagination (défaut 50), onglets sandbox, lentille, Fiche enrichie
  (enfants + type de trait), correctif BUG-001 (état actif visible en style A) ;
  7 (`specs/007-sandbox-make-it-real/`) sandbox isolée & make it real (transfert RNG),
  reproduction manuelle déplacée en sandbox, création/clonage/édition directe + cycle de vie conjugal,
  suppression avec propagation, reconstruction historique via journal d'événements daté (`FORMAT_VERSION` 3) ;
  6 (`specs/006-persistance-compl-partage/`) persistance 3 types (config/data/full),
  détection auto à l'import, fusion pure non destructive, versionnage + rétro-compat ;
  1 (`specs/001-fondations-genese/`) seed/RNG, modèle, genèse, liste/fiche, export/import ;
  2 (`specs/002-reproduction-heredite/`) moteur génétique (hérédité §4, traits→pouvoirs §6.4, P/M §7.2, reproduction) ;
  3 (`specs/003-avancement-temps-population/`) tick annuel §6.6, vieillissement, mort, conjoints, état RNG sérialisé ;
  4 (`specs/004-genealogie-exploration/`) arbre généalogique (fiche prof. 2 + page dédiée N réglable), filtres/recherche,
  3 modes d'affichage des traits, rendu SVG des liens (BUG-001→007) ;
  5 (`specs/005-parametrage-catalogues/`) catalogues éditables, reproduction/courbe SVG, pondérations (héritage
  type→trait), résilience 3 niveaux (global→type→trait), tirage tolérant `pickWeightedOrNull` (type à 0 ⇒ pouvoir null).
  Défauts humain : gaussienne 18/25/50 pic 40 %, groupe 2, portée M1/N4/X15 %, consanguinité interdite.

### Stack
TypeScript 5.x · Vite · Svelte · Vitest · vite-plugin-pwa. App **100 % statique** (PWA), déployée sur
**GitHub Pages**. Aucun backend.

### Règles non négociables (constitution `.specify/memory/constitution.md`)
- Déterminisme : **une seule seed** ; aucun `Math.random`/horloge/UUID aléatoire dans `src/core`.
- Cœur **pur** `src/core` (sans Svelte/DOM/navigateur) ↔ UI `src/ui` ; l'UI consomme le cœur.
- Tests **Vitest à seed fixe** sur le cœur.
- Persistance **uniquement** par export/import de fichier (pas d'auto-save).
- **Anonymat** : identité `KingsCookie`, aucun nom/email perso dans le code, `package.json` ou les commits.

### Commandes
`npm run dev` · `npm run test` · `npm run build` · `npm run preview`
<!-- SPECKIT END -->
