<!-- SPECKIT START -->
## Feature active : 003-avancement-temps-population

- **Plan** : `specs/003-avancement-temps-population/plan.md` (contexte technique, défauts d'espèce, Constitution Check)
- **Spec** : `specs/003-avancement-temps-population/spec.md` (source : `rsrc/DescriptionProjet.md`, NE PAS modifier sans accord)
- **Recherche / décisions** : `specs/003-avancement-temps-population/research.md`
- **Modèle de données** : `specs/003-avancement-temps-population/data-model.md`
- **Contrats** : `specs/003-avancement-temps-population/contracts/` (RNG sérialisable, gaussienne, tick, mort)
- **Simulation** : tick annuel §6.6 (divorces → candidats/gaussienne → appariement → portées), vieillissement §6.5,
  mort manuelle §6.7, conjoints actuel/ex, portées M/N/X. **État du RNG sérialisé** (continuation déterministe, FR-021).
  Réutilise `reproduce` (F2) pour chaque enfant. Défauts humain gaussienne 18/25/50 pic 40 %, groupe 2, portée M1/N4/X15 %, consanguinité interdite.
- Features livrées : 1 (`specs/001-fondations-genese/`) seed/RNG, modèle, genèse, liste/fiche, export/import ;
  2 (`specs/002-reproduction-heredite/`) moteur génétique (hérédité §4, traits→pouvoirs §6.4, P/M §7.2, reproduction).

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
