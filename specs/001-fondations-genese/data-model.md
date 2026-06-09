# Phase 1 — Modèle de données

Portée : entités nécessaires à la **genèse** (Feature 1). Les champs liés à l'hérédité, au temps et aux
couples existent dans la source de vérité mais sont **hors périmètre** ici (laissés vides/non utilisés).

## TraitType (énumération)

Les **6 types fixes** : `Remplacement`, `PartieCorps`, `Etat`, `Element`, `Ajout`, `Action`.

## Trait

| Champ | Type | Règles |
|---|---|---|
| `id` | string | Identifiant stable (ex. `type:slug`) ; unique par (type, libellé). |
| `type` | TraitType | L'un des 6 types. |
| `label` | string | Libellé affiché (ex. « Pinces de crabe »). |
| `weight` | number | Poids de tirage (> 0). Défaut paramétrable (cf. Parameters). |

- Un même libellé peut exister dans **plusieurs types** : ce sont des traits **distincts** (id distinct).

## Catalog

| Champ | Type | Règles |
|---|---|---|
| `byType` | `Record<TraitType, Trait[]>` | Liste des traits disponibles par type. Initialisée aux valeurs par défaut (D9). |

- Un type peut être vide (cas limite géré : pouvoir non produit, cf. spec Edge Cases).

## Genre & Espece

| Entité | Champ | Type | Règles |
|---|---|---|---|
| Espece | `id` | string | Défaut : `"humain"`. |
| Espece | `label` | string | Nom affiché. |
| Espece | `genres` | `Genre[]` | Ensemble de genres ; contient **toujours** le genre spécial `"tout"`. |
| Genre | `id` | string | Ex. `"tout"`, et autres selon l'espèce. |

> Les autres paramètres d'espèce (reproduction, portée, gaussienne…) existent dans la source de vérité
> mais ne sont **pas** utilisés en Feature 1.

## ResilientTrait (entrée d'ADN)

Triplet `(trait, état, résilience)`.

| Champ | Type | Règles |
|---|---|---|
| `traitId` | string | Référence un `Trait` du catalogue. |
| `active` | boolean | `true` = actif, `false` = inactif. En genèse : actifs uniquement (traits du pouvoir). |
| `resilience` | number | Pourcentage [0..100]. En genèse : **résilience initiale** paramétrable. |

## ADN

| Champ | Type | Règles |
|---|---|---|
| `traits` | `ResilientTrait[]` | Liste des triplets. **Vide** pour un individu sans pouvoir. |

## Pouvoir

| Champ | Type | Règles |
|---|---|---|
| `id` | string | Identifiant stable au sein de l'individu. |
| `label` | string | Libellé lisible **formaté selon le gabarit** (FR-024) : AE `{action} {élément}` ; PE `{partie} {état}` ; PA `{ajout} sur {partie}` ; PR `{remplacement} à la place de {partie}`. |
| `template` | `"AE" \| "PE" \| "PA" \| "PR"` | Type de gabarit (genèse uniquement). |
| `traitIds` | string[] | Traits constitutifs (référencent l'ADN). |
| `puissance` | integer | **1..10** inclus (genèse : aléatoire). |
| `maitrise` | integer | **1..10** inclus (genèse : aléatoire). |

## Personne

| Champ | Type | Règles |
|---|---|---|
| `id` | string | Identifiant unique déterministe (séquentiel). |
| `nom` | string | Généré (déterministe), éditable ultérieurement. |
| `especeId` | string | Référence une `Espece` (défaut `"humain"`). |
| `genreId` | string | Référence un `Genre` de l'espèce. |
| `dateNaissance` | string (ISO `YYYY-MM-DD`) | Jour aléatoire dans l'année de naissance. |
| `vivant` | boolean | `true` en genèse. |
| `raisonDeces` | string \| null | `null` en genèse. |
| `parents` | string[] | **Vide** en genèse (batch initial). |
| `enfants` | string[] | **Vide** en genèse. |
| `conjoints` | `{ id: string; statut: "actuel" \| "ex" }[]` | **Vide** en genèse. |
| `adn` | ADN | Triplets ; vide si sans pouvoir. |
| `pouvoirs` | Pouvoir[] | 0 ou 1 en genèse (gabarit mutation forte). |
| `notes` | string \| null | `null` par défaut. |

**Dérivé (non stocké)** : `age = anneeCourante − anneeNaissance` ; `generation = floor(anneeNaissance / 20)`.

## Parameters

| Champ | Type | Défaut | Règles |
|---|---|---|---|
| `seed` | string (BigInt 64 bits, décimal) | (tirée) | Source unique d'aléatoire. Éditable. |
| `batchSize` | integer | **100** | Effectif du batch initial (≥ 0). |
| `birthYear` | integer | **0** | Année de naissance du batch (modifiable avant genèse). |
| `powerChancePct` | number | **0** | [0..100] : chance qu'un individu ait un pouvoir. |
| `initialResilience` | number | (paramétrable) | Résilience initiale des traits d'un pouvoir de genèse. |
| `traitTypeWeights` | `Record<TraitType, number>` | (paramétrable) | Pondérations par type. |
| `templateWeights` | `{ AE; PE; PA; PR }` | AE majoritaire | Poids des gabarits (AE le plus fréquent). |

> Tout `Parameters` est exporté avec l'état (Principe VII).

## AppState (état exporté/importé)

| Champ | Type | Règles |
|---|---|---|
| `formatVersion` | integer | Version du format de fichier. |
| `kind` | `"full"` | Identifiant de type (Feature 1 : `full`). |
| `parameters` | Parameters | Inclut la seed. |
| `catalog` | Catalog | Catalogues (par défaut ou modifiés). |
| `population` | Personne[] | Individus générés. |

## Invariants (testables)

- INV-1 : pour `(seed, parameters, catalog)` identiques, `population` est **strictement identique**.
- INV-2 : chaque `Pouvoir.puissance` et `Pouvoir.maitrise` ∈ **[1,10]** entiers.
- INV-3 : `powerChancePct = 0` ⇒ aucune personne n'a de pouvoir ; `= 100` ⇒ chaque personne a exactement 1 pouvoir.
- INV-4 : un individu **sans** pouvoir a `adn.traits = []` et `pouvoirs = []`.
- INV-5 : tout `traitId` d'un pouvoir/ADN référence un trait présent dans `catalog`.
- INV-6 : `export` puis `import` redonne un `AppState` **égal** (round-trip sans perte).
- INV-7 : tous les individus de genèse ont `age = 0` et `dateNaissance` dans `birthYear`.
