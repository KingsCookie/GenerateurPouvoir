<!-- SPECKIT START -->
## Feature active : 008-refonte-ui

- **Plan** : `specs/008-refonte-ui/plan.md` (contexte technique, décisions, Constitution Check)
- **Spec** : `specs/008-refonte-ui/spec.md` (source de vérité **visuelle** : `design_handoff_refonte_ui/`
  — gitignoré/local ; contrat **fonctionnel** : `rsrc/DefUi.md` — gitignoré/local. `DescriptionProjet.md`
  inchangé.)
- **Recherche / décisions** : `specs/008-refonte-ui/research.md`
- **Modèle de données** : `specs/008-refonte-ui/data-model.md` (état d'**interface** uniquement)
- **Contrats** : `specs/008-refonte-ui/contracts/ui-contract.md` (thème, store `ui.ts`, non-régression DefUi)
- **Périmètre** : **refonte purement visuelle** des 5 vues + chrome global ; **aucune perte de
  fonctionnalité** (DefUi). **Système de thème 3 axes** sur `<html>` : `data-mode` (sombre défaut/clair),
  `data-palette` (violet/cyan/vert), `data-style` (A/B), mémorisés en `localStorage`. Ajouts : pied de page
  version, bouton remonter, **pagination** (liste+sandbox, défaut 50), **onglets sandbox** (Population/
  Couples), lentille champ+curseur, **Fiche** (liste enfants + type de trait). **Polices auto-hébergées**
  (woff2 + `@font-face`, précachées) ⇒ hors-ligne strict.
- **Clarifications 2026-06-18** : périmètre thème = **système complet 3 axes** ; polices = **auto-hébergées**
  (local, précachées) avec repli système.
- **Cœur INTOUCHÉ** (Principe IV) : refonte limitée à `src/ui/**`, `src/app.css`, `index.html`, config build
  (version + précache woff2), `public/fonts/`. État ajouté = **interface** (`src/ui/stores/ui.ts`), **hors**
  `AppState`/export (Principe VI). `tokens.css` déjà fusionné dans `src/app.css`. **Aucune dépendance ajoutée.**
- Features livrées : 7 (`specs/007-sandbox-make-it-real/`) sandbox isolée & make it real (transfert RNG),
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
