<!-- SPECKIT START -->
## Feature active : 001-fondations-genese

- **Plan** : `specs/001-fondations-genese/plan.md` (contexte technique, structure, Constitution Check)
- **Spec** : `specs/001-fondations-genese/spec.md` (source : `rsrc/DescriptionProjet.md`, NE PAS modifier sans accord)
- **Recherche / décisions** : `specs/001-fondations-genese/research.md`
- **Modèle de données** : `specs/001-fondations-genese/data-model.md`
- **Contrats** : `specs/001-fondations-genese/contracts/` (API cœur + fichier d'état)

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
