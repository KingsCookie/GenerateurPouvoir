<!-- SPECKIT START -->
## Feature active : 005-parametrage-catalogues

- **Plan** : `specs/005-parametrage-catalogues/plan.md` (contexte technique, décisions, Constitution Check)
- **Spec** : `specs/005-parametrage-catalogues/spec.md` (source : `rsrc/DescriptionProjet.md` §9, §3.1, §3.4, §6.6 — NE PAS modifier sans accord)
- **Recherche / décisions** : `specs/005-parametrage-catalogues/research.md`
- **Modèle de données** : `specs/005-parametrage-catalogues/data-model.md`
- **Contrats** : `specs/005-parametrage-catalogues/contracts/core-api.md` (résolution résilience, mutations catalogue/espèce, validation)
- **Périmètre** : rendre **éditable dans l'UI** les **catalogues** (traits par type, espèces, genres ; suppression =
  **futur seulement**), les **paramètres de reproduction par espèce** + **courbe gaussienne SVG**, le **% repro par
  couple** (déjà branché côté store), les **pondérations** (type/gabarit/trait), l'**option consanguinité**, et la
  **déclinaison 3 niveaux de la résilience** (initiale/maximale/seuil de disparition) **global → type → trait**.
- **Extension cœur** (seule) : `Parameters.resilienceOverrides` `{ byType, byTrait }` + `resolveResilience(params,
  traitId)` **pure** (résolution par champ ; type via préfixe d'id ⇒ robuste si trait supprimé). Threadée dans
  `inherit.ts`/`reproduce.ts`/`genesis.ts`/`traitsToPowers.ts`. Mutations catalogue/espèce **pures** (`editCatalog`,
  `editEspeces`) ; stores UI `catalog`/`especes` (remplacent les constantes de module). `Couple.reproPct` +
  `setCoupleReproPct` **existent déjà** (Feature 3). `traitTypeWeights` était **défini mais inexploité** → câblé en
  facteur `type × individuel`. **Aucune dépendance ajoutée** (courbe en SVG sur-mesure).
- Features livrées : 1 (`specs/001-fondations-genese/`) seed/RNG, modèle, genèse, liste/fiche, export/import ;
  2 (`specs/002-reproduction-heredite/`) moteur génétique (hérédité §4, traits→pouvoirs §6.4, P/M §7.2, reproduction) ;
  3 (`specs/003-avancement-temps-population/`) tick annuel §6.6, vieillissement, mort, conjoints, état RNG sérialisé ;
  4 (`specs/004-genealogie-exploration/`) arbre généalogique (fiche prof. 2 + page dédiée N réglable), filtres/recherche,
  3 modes d'affichage des traits, rendu SVG des liens (BUG-001→007).
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
