# Data Model — Généalogie & exploration (Feature 4)

> Feature **en lecture seule** : **aucune** modification du modèle persistant (`Personne`, `ADN`,
> `Pouvoir`, `Espece`, `Couple`, `AppState`). Les types ci-dessous sont des **structures de calcul
> / d'affichage** (cœur pur + UI state), **non** sérialisées dans l'export (Principe VI).

## Entités de calcul (cœur pur — `src/core/genealogy/`)

### TreeNode (arbre généalogique)

| Champ | Type | Notes |
|---|---|---|
| `id` | string | id de la personne |
| `nom` | string | |
| `age` | number | `currentYear − année de naissance` (réutilise `computeAge`) |
| `vivant` | boolean | repris de `Personne.vivant` — pour le rendu « décédé » (BUG-005) |
| `pouvoirs` | string[] | libellés de pouvoir (réutilise `powerLabel`) |
| `ancestors` | TreeNode[] | parents dépliés (niveau +1…+N) ; `[]` si `depth` atteint ou racine |
| `descendants` | TreeNode[] | enfants dépliés (niveau −1…−N) ; `[]` si `depth` atteint ou feuille |
| `unions` | Union[] | conjoints (actuel/ex) + enfants communs (cf. ci-dessous) |

- **Construction** : `buildGenealogyTree(rootId, byId, depth, ctx)` ; récursif, **borné par
  `depth`** ; **répétition** d'un individu multi-chemins (pas de déduplication) ; ordre des
  `ancestors`/`descendants` **trié par date de naissance puis id** (déterministe, INV-G3).
- **Validation** : `depth ≥ 1` ; `rootId` doit exister dans `byId` (sinon erreur/retour vide
  documenté). Pas de plafond supérieur sur `depth`.

### Union (regroupement par conjoint dans l'arbre)

| Champ | Type | Notes |
|---|---|---|
| `conjointId` | string | id du conjoint (actuel ou ex) |
| `statut` | 'actuel' \| 'ex' | repris de `Personne.conjoints` |
| `conjoint` | TreeNodeLite | nom + âge + **vivant** + pouvoirs du conjoint (**non** déplié vers ses ancêtres) |
| `enfantsCommuns` | string[] | ids des enfants dont `parents` ⊇ {nœud, conjointId} **uniquement** |

- **Règle (INV-G2)** : `enfantsCommuns` exclut les enfants du conjoint avec des tiers ; les
  **parents** du conjoint sont **hors** de l'arbre.

### FilterCriteria (moteur de filtres)

| Champ | Type | Sémantique |
|---|---|---|
| `nameQuery` | string | sous-chaîne, **normalisée** (casse + accents) ; vide ⇒ ignoré |
| `generations` | Set<number> | OU intra ; vide ⇒ ignoré |
| `especeIds` | Set<string> | OU intra ; vide ⇒ ignoré |
| `traitIds` | Set<string> | OU intra ; vide ⇒ ignoré |
| `traitScope` | 'actifs' \| 'inactifs' \| 'tous' | portée du filtre trait (défaut `actifs`) |
| `powerPresence` | 'any' \| 'none' \| null | présence/absence ; `null` ⇒ ignoré |
| `statuses` | Set<'vivant' \| 'décédé'> | OU intra ; vide ⇒ ignoré |

- **Combinaison (INV-G4)** : **OU** au sein d'une dimension non vide, **ET** entre dimensions
  renseignées (dimensions vides/`null` = sans effet). `nameQuery` se combine en **ET**.
- **Fonction** : `filterPopulation(pop, criteria, ctx)` pure ; `ctx = { currentYear }` (la
  génération se calcule depuis l'année de naissance ; trait actif/inactif depuis l'ADN ; pouvoir
  depuis `pouvoirs.length`).

### Génération (réutilisé)

- `computeGeneration(birthYear) = floor(birthYear / 20)` — **existant** (`src/core/genesis/derived.ts`).
- `lastGeneration(pop)` = `max(computeGeneration(annéeNaissance))` parmi `pop` ; population vide ⇒
  convention documentée (ex. `0` ou `null` — voir contrat).

## État d'interface (UI — `src/ui/stores/`, NON exporté)

### FilterState (`filters.ts`, module-level ⇒ persistant en session)

| Champ | Type | Notes |
|---|---|---|
| `criteria` | FilterCriteria | critères actifs |
| `generationTouched` | boolean | `false` au départ ⇒ défaut « dernière génération » dynamique (FR-011a) ; passe `true` dès modification manuelle du filtre génération (FR-011b) |

- **INV-G5** : tant que `generationTouched === false`, `criteria.generations` reflète
  `{ lastGeneration(pop) }` recalculé ; après bascule, l'état est figé sur le choix utilisateur
  jusqu'à réinitialisation (FR-010 remet `generationTouched = false`).

### UiState (`ui.ts`)

| Champ | Type | Notes |
|---|---|---|
| `traitMode` | 1 \| 2 \| 3 | mode d'affichage des traits ; **défaut 3** (FR-013) |
| `view` | 'liste' \| 'fiche' \| 'arbre' | vue courante (routage interne) |
| `treeRootId` | string \| null | racine de la page dédiée |
| `treeDepth` | number | profondeur de la page dédiée (≥ 1, défaut 2, sans plafond) |

## Invariants (testables, seed fixe)

- **INV-G1** : l'arbre est **borné par la profondeur** et **termine** même en cas de consanguinité.
- **INV-G2** : unions = conjoint (actuel/ex) + **enfants communs uniquement** ; pas d'enfants tiers,
  pas de parents du conjoint.
- **INV-G3** : ordre des nœuds et des résultats **déterministe** (date puis id).
- **INV-G4** : filtres OU intra-dimension, ET inter-dimensions ; trait selon portée ; pouvoir
  présence/absence.
- **INV-G5** : défaut « dernière génération » dynamique tant que non modifié manuellement ;
  persistance de l'état de filtres en session.
- **INV-G6** : **lecture seule** — `filterPopulation`/`buildGenealogyTree` ne mutent ni la
  population, ni l'ADN, ni les pouvoirs, ni le RNG (entrées non modifiées).
