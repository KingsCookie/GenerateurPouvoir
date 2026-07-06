# Implementation Plan: Filtres de trait, tri par colonne & étiquettes de pouvoir enrichies

**Branch**: `010-tri-filtres-etiquettes` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-tri-filtres-etiquettes/spec.md`

## Summary

Trois améliorations d'exploration appliquées aux **listes** Population (`ListeView`) et Sandbox
(`SandboxView`, onglet Population), qui partagent déjà `FilterBar` et le moteur `filterPopulation` :

1. **Filtres de présence de trait** (4 options, mono-sélection) : « aucun trait actif », « au moins un
   trait actif », « au moins un trait inactif », « au moins un trait » → nouveau critère **pur** dans le
   cœur généalogie (`filterPopulation`).
2. **Tri par clic sur en-tête** (Nom / Date de naissance / Âge ; « Pouvoir(s) » non triable) avec cycle
   **défaut → croissant → décroissant → défaut** → comparateur **pur** dans le cœur + **état de tri de
   session par liste** dans le store d'interface.
3. **Étiquettes de pouvoir enrichies** « P : x » / « M : y » dans les listes → enrichissement du
   view-model **pur** `buildListRow` (données déjà présentes sur l'individu).

Contrairement aux Features 008/009 (présentation pure), celle-ci **touche légitimement le cœur**
(`src/core/genealogy`) : logique de **filtrage/tri en lecture seule, déterministe**, donc **tests Vitest
obligatoires** (Principe V). La génétique/hérédité/simulation restent inchangées. Les états de filtre/tri
sont de l'**interface** (session), **hors** export/import (Principe VI).

## Technical Context

**Language/Version** : TypeScript 5.x (cœur + UI). Cœur pur sans DOM/Svelte.

**Primary Dependencies** : Aucune **nouvelle** dépendance (Principe VIII). Vite / Svelte / Vitest existants.

**Storage** : États de filtre (`criteria`, partagé Population↔Sandbox) et de **tri** (par liste) = **stores
d'interface** en session ; **aucun** changement à l'export/import de l'état applicatif (Principe VI).

**Testing** : Vitest à seed fixe. **Nouveaux tests cœur** : prédicat de présence de trait (4 valeurs) et
`sortPopulation` (3 clés × 2 sens + défaut + stabilité). **Test view-model** : `buildListRow` expose P/M.
Portes : `npm run test`, `npm run build`, `npm run lint`.

**Target Platform** : PWA statique (navigateurs modernes), hors-ligne — inchangé.

**Project Type** : Application web statique mono-projet (PWA), cœur pur + UI Svelte.

**Performance Goals** : Filtre + tri appliqués **< 1 s** sans rechargement (SC-003), sur population
courante. Le tri s'applique à l'ensemble filtré **avant** pagination.

**Constraints** : déterminisme (aucun `Math.random`/horloge ; l'âge dérive de `currentYear` fourni, pas de
l'horloge système), cœur pur/isolé, français, accessibilité (en-têtes triables actionnables clavier +
ARIA `aria-sort`), 100 % statique/hors-ligne.

**Scale/Scope** : périmètre fichiers — **cœur** : `genealogy/filter.ts` (+ tri), `genealogy/index.ts`,
`core/index.ts` ; **UI** : `stores/filters.ts`, `stores/ui.ts`, `components/FilterBar.svelte`,
`views/ListeView.svelte`, `views/SandboxView.svelte`, `lib/ficheViewModel.ts` ; **tests** : genealogy
filter/sort + fiche-vm. Aucune vue/logique métier hors listes/filtres.

## Constitution Check

*GATE : doit passer avant Phase 0. Re-vérifié après Phase 1.*

| Principe | Statut | Justification |
|----------|--------|---------------|
| I. Déterminisme (seed unique) | ✅ PASS | Filtre/tri **purs et déterministes** ; aucun aléatoire/horloge ; l'âge dérive de `currentYear` passé en contexte. |
| II. 100 % statique / client-side | ✅ PASS | Aucun backend ; logique cliente uniquement. |
| III. PWA multiplateforme / hors-ligne | ✅ PASS | Aucun asset réseau ; comportement hors-ligne inchangé. |
| IV. Cœur pur, isolé, testable | ✅ PASS | Nouvelle logique dans `src/core/genealogy` (lecture seule, sans dépendance UI) ; l'UI consomme le cœur. |
| V. Tests déterministes du cœur | ✅ PASS | Tests Vitest ajoutés pour le prédicat de présence **et** `sortPopulation` (obligatoire). |
| VI. Persistance par fichiers | ✅ PASS | États filtre/tri = interface (session), **hors** `AppState`/export. |
| VII. Tout est paramétrable | ✅ N/A | Aucune constante métier introduite. |
| VIII. Simplicité / YAGNI | ✅ PASS | Réutilise `FilterBar`/`filterPopulation`/`buildListRow` ; aucune dépendance ajoutée. |
| IX. Spéc fonctionnelle = vérité | ✅ PASS | `rsrc/DescriptionProjet.md` intouché ; non-régression `rsrc/DefUi.md` (SC-005). |
| X. Anonymat de l'auteur | ✅ PASS | Aucune PII ; commits `KingsCookie` sans email. |

**Résultat** : aucune violation. **Complexity Tracking** non requis.

## Project Structure

### Documentation (this feature)

```text
specs/010-tri-filtres-etiquettes/
├── plan.md              # Ce fichier (/speckit-plan)
├── research.md          # Phase 0 — décisions (présence, tri, P/M, reset)
├── data-model.md        # Phase 1 — types étendus (critère, état de tri, ligne de liste)
├── quickstart.md        # Phase 1 — recette (filtres, tri, P/M, non-régression)
├── contracts/
│   └── ui-contract.md   # Phase 1 — contrat cœur (filtre/tri) + store + view-model + non-régression
├── checklists/
│   └── requirements.md  # 16/16 (déjà validé)
└── tasks.md             # Phase 2 — /speckit-tasks (NON créé ici)
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── index.ts                       # ré-export TraitPresence + sortPopulation + SortKey/SortDir
│   └── genealogy/
│       ├── index.ts                   # façade : expose le nouveau critère + le tri
│       └── filter.ts                  # + TraitPresence dans FilterCriteria + matchTraitPresence ;
│                                      #   + sortPopulation() (réutilise normalize/byBirthThenId)
└── ui/
    ├── stores/
    │   ├── filters.ts                 # + traitPresence dans emptyCriteria + setTraitPresence()
    │   └── ui.ts                      # + état de tri par liste (listeSort/sbSort) + cycleSort()/resetSort()
    ├── components/
    │   └── FilterBar.svelte           # + contrôle « présence de trait » (4 options, mono) ;
    │                                  #   prop `list` ; Réinitialiser → resetFilters() + resetSort(list)
    ├── views/
    │   ├── ListeView.svelte           # en-têtes cliquables (aria-sort) + application du tri + chips P/M
    │   └── SandboxView.svelte         # idem (en-têtes triables + chips P/M), état de tri propre
    └── lib/
        └── ficheViewModel.ts          # buildListRow.pouvoirs : { label, puissance, maitrise }[]

tests/unit/
├── genealogy-filter.test.ts           # + cas présence de trait (4 valeurs, ADN vide/tous actifs/inactifs)
├── genealogy-sort.test.ts             # NEW — sortPopulation : 3 clés × 2 sens + défaut + stabilité
└── fiche-vm.test.ts                   # buildListRow expose puissance/maîtrise par pouvoir
```

**Structure Decision** : mono-projet existant. La logique de **présence** et de **tri** va dans le **cœur
généalogie** (pur, testable — FR-017), l'UI ne fait que **piloter** (état de session) et **afficher**. Le
tri s'applique en composant après `filterPopulation`, avant `paginate`. `FilterBar` reçoit un prop `list`
pour cibler le bon état de tri au « Réinitialiser » (les filtres `criteria` restent partagés
Population↔Sandbox comme aujourd'hui ; le **tri** est propre à chaque liste — FR-012/FR-018).

## Complexity Tracking

> Aucune violation de la Constitution → section sans objet.
