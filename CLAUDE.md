<!-- SPECKIT START -->
## Feature active : 007-sandbox-make-it-real

- **Plan** : `specs/007-sandbox-make-it-real/plan.md` (contexte technique, décisions, Constitution Check, Complexity Tracking)
- **Spec** : `specs/007-sandbox-make-it-real/spec.md` (source : `rsrc/DescriptionProjet.md` §10.2, §10.3, §6.8, §8.4 — NE PAS modifier sans accord)
- **Recherche / décisions** : `specs/007-sandbox-make-it-real/research.md`
- **Modèle de données** : `specs/007-sandbox-make-it-real/data-model.md`
- **Contrats** : `specs/007-sandbox-make-it-real/contracts/core-api.md` (sandbox, reconstruction, journal d'événements)
- **Périmètre** : **bac à sable isolé** (copie de l'état réel) ; **make it real** = l'état sandbox **devient**
  l'état réel (transfert, pas de rejeu) ; **reset** = re-snapshot du réel. **Reproduction manuelle déplacée**
  de la page principale vers la sandbox (mode : bouton → (dé)sélection au clic → **nb enfants ≥ 1** →
  valider/annuler + re-sélection des derniers parents ; **1 « valider » = N enfants**). **Création / clonage /
  édition directe** d'attributs (individus créés/clonés **autonomes** ; parenté **via reproduction
  uniquement**). **Suppression** refusée si descendants ; propagation conjoint→état antérieur,
  parents→retrait de l'enfant. **Navigation temporelle** : année ∈ [départ, courante] ⇒ **reconstruction
  historique complète** (couples/divorces/décès tels qu'à l'année).
- **Clarifications 2026-06-17** : make it real = remplacement complet (transfert RNG) ; vue à l'année =
  **reconstruction historique complète** ; édition directe libre ; rattachement via reproduction ; nb enfants
  libre (≥ 1, sans plafond) ; valider sort du mode + désélectionne.
- **Extension cœur** : `src/core/sandbox/` (`createPerson`/`clonePerson`/`editPerson`/`deletePerson`/
  `manualReproduce`, purs) + `reconstruct.ts` (`reconstructAtYear`) ; **journal d'événements daté**
  `AppState.history: PopulationEvent[]` (émis par genèse/tick/mort), **`FORMAT_VERSION` 2→3** + défaut
  rétro-compat `history→[]`. UI : `sandboxStore` (état copié + RNG forké), `SandboxView.svelte`, retrait
  de la repro manuelle de `ListeView`. **Aucune dépendance ajoutée.**
- **Complexité justifiée (YAGNI)** : le **journal d'événements daté** est requis par la reconstruction
  historique ; re-simulation rejetée (interventions manuelles) et champs datés épars rejetés (plus invasifs).
- Features livrées : 6 (`specs/006-persistance-compl-partage/`) persistance 3 types (config/data/full),
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
