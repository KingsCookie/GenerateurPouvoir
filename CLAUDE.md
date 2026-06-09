<!-- SPECKIT START -->
## Feature active : 002-reproduction-heredite

- **Plan** : `specs/002-reproduction-heredite/plan.md` (contexte technique, défauts paramètres, Constitution Check)
- **Spec** : `specs/002-reproduction-heredite/spec.md` (source : `rsrc/DescriptionProjet.md`, NE PAS modifier sans accord)
- **Recherche / décisions** : `specs/002-reproduction-heredite/research.md`
- **Modèle de données** : `specs/002-reproduction-heredite/data-model.md`
- **Contrats** : `specs/002-reproduction-heredite/contracts/` (API du moteur génétique)
- **Moteur** : hérédité §4, pipeline naissance §5, traits→pouvoirs §6.4 (D/K distincts), P/M héritées §7.2,
  mutations forte/faible/sans pouvoir ; déclenché par **reproduction manuelle** (1 enfant). Arbre §6.4.2 **verbatim**.
- Feature 1 (`specs/001-fondations-genese/`) **livrée** : seed/RNG, modèle, genèse, liste/fiche, export/import.

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
