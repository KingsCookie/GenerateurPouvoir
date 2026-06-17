<!-- SPECKIT START -->
## Feature active : 006-persistance-compl-partage

- **Plan** : `specs/006-persistance-compl-partage/plan.md` (contexte technique, décisions, Constitution Check)
- **Spec** : `specs/006-persistance-compl-partage/spec.md` (source : `rsrc/DescriptionProjet.md` §11, §12, §13.1/§13.4 — NE PAS modifier sans accord)
- **Recherche / décisions** : `specs/006-persistance-compl-partage/research.md`
- **Modèle de données** : `specs/006-persistance-compl-partage/data-model.md`
- **Contrats** : `specs/006-persistance-compl-partage/contracts/core-api.md` (extraction, sérialisation, détection/import)
- **Périmètre** : finaliser la persistance par fichier (Principe VI) — **3 types JSON typés** : `config`
  (paramètres + seed + catalogues), `data` (population + généalogie + couples + année + **état RNG**), `full`
  (les deux). **Détection automatique du `kind` à l'import** + application **partielle**, **versionnage**
  (`formatVersion`), **rétro-compatibilité**, refus propre. **Partage** entre appareils/utilisateurs.
- **Clarifications 2026-06-17** : import **config seule** ⇒ **conserve la population** ; export `data`/`full` ⇒
  **position complète du RNG** (reprise au tirage près).
- **Extension cœur** : `src/core/state/serialize.ts` — types `ConfigState`/`DataState`/`ParsedImport` ;
  `extractConfig`/`extractData` ; `serializeConfig`/`serializeData` (`serializeFull` = `serializeState` conservé) ;
  `parseImport` (détection du `kind` + validation + défaut rétro-compat). UI : `applyConfig`/`applyData`,
  `applyImport` devient un dispatcher ; `StateIO.svelte` à 3 exports + 1 import auto-détecté ; **nom de fichier
  horodaté côté UI uniquement** (horloge interdite dans le cœur). **Aucune dépendance ajoutée.**
- Features livrées : 1 (`specs/001-fondations-genese/`) seed/RNG, modèle, genèse, liste/fiche, export/import ;
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
