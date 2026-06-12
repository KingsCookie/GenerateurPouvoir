# Research & décisions — Feature 005 (Paramétrage & catalogues)

Toutes les inconnues techniques sont résolues ci-dessous. Aucune `NEEDS CLARIFICATION` ne subsiste
(les deux décisions de cadrage ont été tranchées dans le spec ; clarification 2026-06-12).

## D1 — Structure de surcharge de la résilience

- **Décision** : ajouter à `Parameters` un champ
  `resilienceOverrides: { byType: Partial<Record<TraitType, ResiliencePatch>>; byTrait: Record<string, ResiliencePatch> }`
  avec `ResiliencePatch = { initial?: number; max?: number; disappearThreshold?: number }`. Les 3
  valeurs **globales** existantes (`initialResilience`, `resilienceMax`, `disappearThreshold`)
  restent la **base** (niveau 0).
- **Rationale** : structure additive, rétro-compatible, **exportée avec la config** (déjà dans
  `AppState.parameters`). Patch **partiel par champ** ⇒ on peut surcharger seulement `initial` au
  niveau trait tout en héritant `max`/`seuil` du type ou du global (FR-054). `byTrait` indexé par
  `traitId` ⇒ résolution O(1).
- **Alternatives rejetées** :
  - Surcharge stockée **dans le `Trait`** (catalogue) : mélange données de référence et réglages ;
    complique l'export config/data ; perdue si le trait est supprimé. Rejeté.
  - 4ᵉ valeur « résilience minimale » distincte : la clarification a tranché **min = seuil de
    disparition** (pas de nouveau concept).

## D2 — Résolution de la valeur effective

- **Décision** : fonction **pure** `resolveResilience(params, traitId): { initial, max, disappearThreshold }`.
  Pour **chaque champ** indépendamment : `byTrait[traitId]?.champ ?? byType[type]?.champ ?? global.champ`.
  Le **type** est dérivé du **préfixe de l'id** du trait (`"Action:brule-14"` → `Action`), via un
  parsing trivial validé contre `TRAIT_TYPES`.
- **Rationale** : l'id de trait **encode déjà le type** (`defaultCatalog` : `` `${type}:${slug}-${i}` ``),
  donc la résolution fonctionne **même si le trait a été retiré du catalogue** (suppression =
  futur seulement, mais un individu existant garde le `traitId` ⇒ on retrouve son type). Évite de
  passer le catalogue partout. Résolution **par champ** ⇒ « supprimer une surcharge fait réhériter le
  niveau supérieur » (FR-054) est automatique.
- **Garde** : si le préfixe n'est pas un `TraitType` connu (id legacy), on **saute le niveau type**
  (byTrait puis global). Jamais d'état indéfini.
- **Alternatives rejetées** : passer un `Map<traitId,type>` construit du catalogue (fragile si trait
  supprimé) ; recalcul à chaque appel sans index (perf).

## D3 — Threading dans le moteur (points d'usage existants)

Points où la résilience globale est lue aujourd'hui (à router vers la valeur effective) :

| Fichier | Usage actuel | Après |
|---------|--------------|-------|
| `heredity/inherit.ts` | `resilienceMax`, `disappearThreshold` (plafond + seuil par trait hérité) | résolus **par `traitId`** |
| `birth/reproduce.ts` | `initialResilience` (mutation faible gain, trait généré), `resilienceMax`, `disappearThreshold` | résolus par `traitId` |
| `genesis/genesis.ts` | `initialResilience` (trait du pouvoir de genèse) | résolu par `traitId` |
| `powers/traitsToPowers.ts` | `initialResilience`, `resilienceMax` (trait `K…` généré) | résolus par `traitId` |

- **Décision** : `inheritADN` reçoit en paramètre un **resolver** `(traitId) => EffectiveResilience`
  (ou `params` + appel à `resolveResilience`). Les fonctions appelantes (`reproduce`, `genesis`) qui
  ont déjà `params` construisent/transmettent le resolver. **Signatures étendues a minima** ; aucune
  dépendance au catalogue ajoutée (type via préfixe d'id, cf. D2).
- **Rationale** : changement chirurgical, pur, déterministe ; les bonus/malus (points) restent
  **globaux** (non visés par la clarification).
- **Note** : bonus/malus **non déclinés** (hors périmètre ; la clarification ne vise que initiale /
  maximale / seuil).

## D4 — Catalogue éditable (réactivité + mutations pures)

- **Décision** : le catalogue, aujourd'hui **constante de module** dans `appState.ts`
  (`const catalog = defaultCatalog()`), devient un **store** `writable<Catalog>`. Les mutations sont
  des **fonctions pures du cœur** (`src/core/catalog/editCatalog.ts`) renvoyant un **nouveau**
  `Catalog` : `addTrait(cat, type, label)`, `renameTrait(cat, traitId, label)`,
  `removeTrait(cat, traitId)`.
- **Suppression = futur seulement** : `removeTrait` retire l'entrée du catalogue **sans toucher aux
  ADN existants** ; les `traitId` déjà présents sur des individus restent valides (libellé d'origine
  conservé via une résolution d'affichage tolérante : si l'id n'est plus au catalogue, on retombe sur
  le libellé stocké/segment d'id).
- **Rationale** : respecte Principe IV (logique pure) + IV/I (déterminisme) ; le store n'est qu'un
  conteneur réactif côté UI. Les tirages futurs lisent le **catalogue courant**.
- **Affichage des libellés** : pour ne pas casser l'affichage d'un trait supprimé, prévoir un
  **libellé de repli** (le catalogue reste la source ; si absent, afficher le slug de l'id). À
  préciser au design UI (data-model INV).

## D5 — Espèces & genres éditables

- **Décision** : `especes` (aujourd'hui `let especesRef` non réactif) devient un **store** ; mutations
  pures dans `src/core/species/editEspeces.ts` : `addEspece`, `renameEspece`, `removeEspece`,
  `addGenre`, `renameGenre`, `removeGenre`, plus `setEspeceParam` (gaussienne/portée/divorce/groupe).
- **Invariants** : « tout » **toujours présent et non supprimable** (`GENRE_TOUT`) ; suppression
  d'espèce **futur seulement** (individus existants conservés). Validation des paramètres (D7).
- **Rationale** : structure `Espece` **déjà complète** (gaussienne, portée, divorce, genres) ; il ne
  manque que l'édition. Réutilisation maximale.

## D6 — Courbe gaussienne (sans dépendance)

- **Décision** : composant `GaussianCurve.svelte` traçant en **SVG sur-mesure** la densité de
  reproduction d'une espèce, en réutilisant la **fonction déjà employée par le tick** (module
  `repro/gaussian`). Échantillonnage sur l'intervalle [début, fin] ; `<polyline>`/`<path>`.
- **Rationale** : Principe VIII (aucune librairie de graphes) ; même approche que l'arbre SVG
  (Feature 4) ; recalcul réactif < 1 s (SC-004).
- **Alternatives rejetées** : Chart.js/d3 (dépendance lourde, Principe VIII).

## D7 — Validation des saisies

- **Décision** : fonctions **pures** de validation/normalisation côté cœur, renvoyant soit une valeur
  bornée, soit une erreur explicite :
  - pourcentages ∈ [0, 100] ; `D > 0` ; pente > 0 ; `groupSize ≥ 1` ;
  - portée : `M ≥ 0`, `N ≥ M` ;
  - gaussienne : `début ≤ pic ≤ fin`, `début ≥ 0` ;
  - résilience (tous niveaux) : initiale/max/seuil ∈ [0, 100], `seuil ≤ max` (cohérence).
- **Rationale** : SC-007 (aucune saisie invalide silencieuse) ; testable à seed fixe ; l'UI affiche/
  corrige.

## D8 — Pondérations de tirage (modèle héritage type → trait) — *révisé (clarif. 2026-06-12)*

- **Constat** : `templateWeights` est **utilisé** (`strongMutation`) ; `Trait.weight` est **utilisé**
  (tirages dans une liste de type) ; **`traitTypeWeights` est défini mais inexploité** dans le moteur.
- **Décision (sémantique fixée par l'auteur)** : le **poids d'un type** est le **poids par défaut de
  tous ses traits**. Le **poids effectif** d'un trait = **surcharge du trait** sinon **poids du type**
  (`trait ?? type`, **2 niveaux** — pas de scalaire global pour le poids). Ce n'est **pas** une
  multiplication `type × individuel` (rejetée : inerte en mono-type, cf. ancienne note).
  - Représentation : le **poids d'un trait** devient une **surcharge optionnelle** (présente
    seulement si modifiée) ; sinon il **hérite** du poids du type.
  - **Bouton « Propager »** (par type) : **efface les surcharges** des traits du type → réhéritage du
    poids du type.
  - Exposer à l'édition : `templateWeights` (gabarit AE/PE/PA/PR), `traitTypeWeights` (défaut par
    type) et la **surcharge** de poids par trait.
- **Effet « poids de type 0 »** : tous les traits (non surchargés) du type ont un poids effectif nul ⇒
  **jamais tirés** (US3 AS#1 devient **vrai**). Le cas « liste de candidats toute à 0 » est géré par
  D11 (tirage tolérant), pas par un plantage.
- **Rationale** : sémantique intuitive et réellement active (Principe VII) ; **même modèle que la
  résilience** (type-défaut → surcharge → propagation) ⇒ cohérence et code partageable ; ne touche
  pas à l'algorithme figé (§6.1/§6.4, Principe IX), seul le **poids des candidats** change.

## D11 — Tirage tolérant aux poids nuls (`pickWeighted`) — *ajouté (clarif. 2026-06-12)*

- **Constat** : `rng.pickWeighted` **jette** `« poids total nul »` si tous les poids sont ≤ 0
  (`src/core/rng/rng.ts`). Avec D8, un poids de type 0 rend une liste entière non tirable.
- **Décision** : introduire une variante **tolérante** (ex. `pickWeightedOrNull(items, weightOf): T |
  null`) **sans modifier** le comportement de `pickWeighted` existant (déterminisme des features
  livrées préservé). Les appelants gèrent le `null` :
  - **Mutation forte** (`strongMutation`) : si un trait requis par le gabarit ne peut être tiré
    (liste à 0) ⇒ **`pouvoir = null`** ; les traits déjà tirés du gabarit (ex. l'Action d'un AE) sont
    **ajoutés actifs** à l'ADN (FR-052b).
  - **Génération `K`** (`traitsToPowers`) : déjà un cas « K échoue ⇒ pouvoir null » ; un pool à 0 suit
    la même issue.
  - **Mutation faible — gain** (`reproduce`) : si aucun trait tirable (tout à 0) ⇒ **pas de gain**
    (no-op), sans erreur.
- **Rationale** : comportement **défini et déterministe** au lieu d'une exception (FR-052b, edge
  case) ; calque la règle d'échec `K` déjà documentée (§6.4.2) ; n'altère pas le RNG en cas d'échec
  au-delà du tirage déjà consommé.
- **Note Principe IX** : le comportement « type à 0 ⇒ pouvoir null + traits déjà tirés actifs » est
  désormais **documenté au §9.1 de `rsrc/DescriptionProjet.md`** (modifié sur **autorisation
  explicite** de l'auteur, 2026-06-12). Il est cohérent avec la règle d'échec `K` (§6.4.2) et **sans
  contradiction** avec l'algorithme figé (§6.1).

## D9 — % de reproduction par couple

- **Constat** : `Couple.reproPct` (null ⇒ dérivé de la gaussienne) et `setCoupleReproPct` **existent
  déjà** (Feature 3). 
- **Décision** : aucune nouveauté cœur ; **brancher l'UI** sur la **fiche** d'un membre (section
  conjoints) pour éditer/réinitialiser ce pourcentage (FR-040/FR-041).

## D10 — Application des changements (recalcul)

- **Décision** : conforme §3.3 — les pouvoirs sont calculés **une seule fois à la naissance**. Les
  changements de paramètres/poids/catalogue/résilience valent pour les **opérations futures**
  (genèse à venir, naissances, appariements). **Seed / taille de batch / année de naissance**
  nécessitent une **régénération explicite** (déjà le cas via `generate()`).
- **Rationale** : pas de recalcul rétroactif (déterminisme + intention de conception) ; cohérent avec
  l'existant.
