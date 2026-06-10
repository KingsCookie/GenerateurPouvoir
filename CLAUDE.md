<!-- SPECKIT START -->
## Feature active : 004-genealogie-exploration

- **Plan** : `specs/004-genealogie-exploration/plan.md` (contexte technique, décisions, Constitution Check)
- **Spec** : `specs/004-genealogie-exploration/spec.md` (source : `rsrc/DescriptionProjet.md` §8.1–8.5, NE PAS modifier sans accord)
- **Recherche / décisions** : `specs/004-genealogie-exploration/research.md`
- **Modèle de données** : `specs/004-genealogie-exploration/data-model.md`
- **Contrats** : `specs/004-genealogie-exploration/contracts/core-api.md` (arbre, filtres, dernière génération)
- **Exploration (lecture seule)** : `src/core/genealogy/` pur — `buildGenealogyTree` (borné par N, répétition
  multi-chemins, unions conjoints actuel/ex + enfants communs), `filterPopulation` (OU intra / ET inter ; trait
  portée actifs/inactifs/tous ; pouvoir présence/absence ; nom normalisé), `lastGeneration`. Réutilise
  `computeGeneration` (tranche 20 ans), `computeAge`, `powerLabel`. Fiche : arbre profondeur **fixe 2** (cases
  nom+pouvoirs) + bouton « Explorer l'arbre » ; page dédiée : profondeur **N réglable sans plafond** (cases
  nom+âge+pouvoirs). Liste : défaut **dernière génération** dynamique + **persistance** des filtres (état UI, non
  exporté). 3 modes d'affichage des traits (**défaut Mode 3**).
- Features livrées : 1 (`specs/001-fondations-genese/`) seed/RNG, modèle, genèse, liste/fiche, export/import ;
  2 (`specs/002-reproduction-heredite/`) moteur génétique (hérédité §4, traits→pouvoirs §6.4, P/M §7.2, reproduction) ;
  3 (`specs/003-avancement-temps-population/`) tick annuel §6.6, vieillissement, mort, conjoints, état RNG sérialisé.
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
