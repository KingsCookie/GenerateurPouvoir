<!-- SPECKIT START -->
## Feature active : 011-corrections-bugs-ui

- **Plan** : `specs/011-corrections-bugs-ui/plan.md` (contexte technique, décisions, Constitution Check)
- **Spec** : `specs/011-corrections-bugs-ui/spec.md` (10 user stories, clarifications 2026-07-08)
- **Recherche / décisions** : `specs/011-corrections-bugs-ui/research.md` (R1→R10 + maj doc §IX)
- **Modèle de données** : `specs/011-corrections-bugs-ui/data-model.md` (genesisYear, duplicationD, P/M)
- **Contrats** : `specs/011-corrections-bugs-ui/contracts/ui-contract.md` (signatures cœur + points UI)
- **Périmètre** : lot de 10 corrections indépendantes (issu de `rsrc/BugReport.txt` + 4 ajouts) :
  US1 consanguinité **lignée directe** (2 niveaux, `pairing.ts`) ; US2 **date partagée de portée**
  (`tick.ts`+`reproduce.ts`) ; US3 **génération 0 relative à la genèse** (`derived.ts`, `genesisYear`
  persisté, `FORMAT_VERSION` 3→4) ; US4 étiquettes **« P x » / « M y »** (sans « : ») ; US5 filtres de
  trait **à la ligne** ; US6 export **`PowerGenerator_{type}_…`** (underscore) ; US7 **aperçu de pouvoir
  temps réel** (seed d'aperçu **stable**) sur le formulaire de création ; US8 duplication
  **`min(100, résilience·D)`**, `D` multiplicateur défaut **0.25** (`traitsToPowers.ts`/`parameters.ts`) ;
  US9 bouton **« Régénérer »** sandbox (§6.4 seul, P/M §7.2 ou cas A) ; US10 **P/M non bornées** en
  saisie manuelle (cœur §7.2 déjà conforme).
- **Actions Constitution** : Principe IX → **mettre à jour `rsrc/DescriptionProjet.md`** (§6.4.1, §6.6.1,
  §6.6.2, génération) **avec autorisation auteur** avant le code, puis régénérer le `.adoc` ; Principe VI
  → bump `FORMAT_VERSION` + migration/fallback (naissance la plus ancienne). **Aucune dépendance ajoutée** ;
  déterminisme préservé (US2/US7/US8/US9) → **tests Vitest obligatoires** (US1/US2/US3/US8/US9).
- Features livrées : 10 (`specs/010-tri-filtres-etiquettes/`) filtres de présence de trait (4 options
  mono-sélection) + tri par clic sur en-tête (Nom/Date/Âge) + étiquettes P/M enrichies ;
  9 (`specs/009-ajout-4-styles/`) +4 styles (Éditorial/Terminal/Néo-brutaliste/Organique)
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
