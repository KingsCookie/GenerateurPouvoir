<!-- SPECKIT START -->
## Feature active : 010-tri-filtres-etiquettes

- **Plan** : `specs/010-tri-filtres-etiquettes/plan.md` (contexte technique, décisions, Constitution Check)
- **Spec** : `specs/010-tri-filtres-etiquettes/spec.md` (contrat **fonctionnel** : `rsrc/DefUi.md` —
  gitignoré/local. `DescriptionProjet.md` inchangé.)
- **Recherche / décisions** : `specs/010-tri-filtres-etiquettes/research.md` (présence, tri, P/M, reset)
- **Modèle de données** : `specs/010-tri-filtres-etiquettes/data-model.md` (TraitPresence, état de tri, ligne)
- **Contrats** : `specs/010-tri-filtres-etiquettes/contracts/ui-contract.md` (cœur filtre/tri, store, VM)
- **Périmètre** : 3 améliorations des **listes** Population + Sandbox (barre de filtres et
  `filterPopulation` partagés) : (1) **filtres de présence de trait** 4 options mono-sélection
  (`none-active`/`some-active`/`some-inactive`/`some-any`) ; (2) **tri par clic** sur en-tête
  (Nom/Date/Âge, cycle défaut→croissant→décroissant ; Pouvoir(s) non triable) ; (3) **étiquettes de
  pouvoir** enrichies « P : x » / « M : y ». États filtre/tri = **interface** (session), hors export.
- **Clarifications 2026-07-06** : présence = **mono-sélection** ; « au moins un trait » = actif **ou**
  inactif ; « Réinitialiser » remet **filtres ET tri** ; **+4ᵉ** option « au moins un trait inactif ».
- **Cœur TOUCHÉ (légitime, Principe IV/V)** : logique **pure/lecture seule** ajoutée à
  `src/core/genealogy/filter.ts` (`TraitPresence` + `matchTraitPresence` ; `sortPopulation` +
  `SortKey`/`SortDir`) → **tests Vitest obligatoires**. UI : `stores/filters.ts`, `stores/ui.ts`,
  `FilterBar.svelte`, `ListeView.svelte`, `SandboxView.svelte`, `lib/ficheViewModel.ts`. **Aucune
  dépendance ajoutée** ; génétique/hérédité/simulation inchangées ; rien dans `AppState`/export (Principe VI).
- Features livrées : 9 (`specs/009-ajout-4-styles/`) +4 styles (Éditorial/Terminal/Néo-brutaliste/Organique)
  + 3 palettes (ambre/rose/bleu), 72 combinaisons, 6 polices OFL précachées ;
  8 (`specs/008-refonte-ui/`) refonte UI 5 vues + chrome, système de thème 3 axes
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
