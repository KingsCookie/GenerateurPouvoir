# Contrat — API publique du moteur génétique (`src/core`)

Le cœur reste **pur** : aucune fonction n'accède au DOM, réseau, horloge ou `Math.random`. Toute l'aléatoire
passe par le `Rng` **injecté** (Feature 1). Signatures **indicatives** (TypeScript) définissant le contrat
vérifié par les tests (`tests/unit/*.test.ts`).

## RNG — ajout

```ts
interface Rng {
  // … (existant : nextU64, nextFloat, nextInt, chance, pick, pickWeighted)
  shuffle<T>(items: readonly T[]): T[]; // Fisher–Yates déterministe (nouvelle copie)
}
```

- **Contrat** : `shuffle` est une **permutation déterministe** pilotée par la seed ; même état ⇒ même ordre.

## Hérédité (§4)

```ts
// Résultat d'hérédité pour un trait donné chez l'enfant.
interface InheritedTrait { traitId: string; active: boolean; resilience: number }

// Construit l'ADN de l'enfant par hérédité de résilience à partir des parents.
function inheritADN(parents: Personne[], params: Parameters, rng: Rng): ADN;
```

- **Contrat** : union des traits parentaux ; tirage actif/inactif par parent (résilience) ; agrégation §4.2 ;
  bonus/malus **additif** (`±points`) ; clamp `[0, resilienceMax]` ; suppression sous `disappearThreshold`
  (INV-2). Ordre de tirage **stable** (traits triés, parents dans l'ordre fourni) ⇒ déterminisme.

## Traits → pouvoirs (§6.4)

```ts
// Résultat : pouvoirs dérivés + mutations d'ADN (traits générés K à inscrire actifs).
interface DerivePowersResult { pouvoirs: Pouvoir[]; adn: ADN } // adn = ADN éventuellement enrichi (K)

function derivePowersFromTraits(adn: ADN, catalog: Catalog, params: Parameters, rng: Rng): DerivePowersResult;
```

- **Contrat** :
  - traits **actifs** uniquement ; aucun actif ⇒ `pouvoirs = []` ;
  - sous-listes (principaux = Action sinon PartieCorps sinon liste unique) ; mélange déterministe ;
    duplication proba `résilience/duplicationD` %, ≤ 1/sous-liste, **sans modifier l'ADN** (INV-5/INV-6) ;
  - libellé via l'**arbre §6.4.2 verbatim** ; génération `K…` proba `generationK` % → trait **inscrit actif**
    dans `adn` (réactivé + bonus si présent) ; échec d'un `K` requis ⇒ la sous-liste **ne produit pas** de
    pouvoir (`null`).

```ts
// Arbre de libellé §6.4.2 (faisant foi, verbatim). Pure, pilotée par la présence des types.
function powerLabelFromSublist(groups: {
  a?: string; e?: string; p?: string; aj?: string; r?: string; et?: string;
}): string | null;
```

## Héritage puissance/maîtrise (§7.2)

```ts
function inheritStats(
  childPowerIndex: number,
  parents: Personne[],
  params: Parameters,
  rng: Rng,
): { puissance: number; maitrise: number };
```

- **Contrat** : moyenne des i-ᵉ pouvoirs des parents ayant ≥ 1 pouvoir (mélange déterministe ; `i mod n`),
  arrondi `x ≥ n+0,5 ⇒ n+1` ; tirage A/B/C/B (A=100−2·B−C) ; **seul A borné [1,10]** (INV-4) ; **aucun parent
  source ⇒ cas A** (aléatoire 1-10).

## Naissance / reproduction (§5)

```ts
type BirthCase = 'forte' | 'sansPouvoir' | 'normale';

// Produit UN enfant déterministe à partir des parents sélectionnés (≥ 1).
function reproduce(
  parents: Personne[],
  params: Parameters,
  catalog: Catalog,
  rng: Rng,
  options: { childId: string; birthYear: number },
): Personne;
```

- **Contrat** (cf. data-model INV-1..9) :
  - tire `BirthCase` selon `strongMutationRatePct` / `noPowerRatePct` (sinon `normale`) ;
  - **normale** : `inheritADN` → mutation faible (gain/perte) → `derivePowersFromTraits` → `inheritStats` ;
  - **forte** : traits parentaux **inactifs** + `generateStrongMutationPower` (Feature 1) + P/M 1-10 ;
  - **sansPouvoir** : traits parentaux **inactifs**, **0** pouvoir ;
  - enfant : `id = options.childId`, `dateNaissance` ∈ `birthYear`, âge 0, `parents` renseignés ;
  - **n'effectue aucune** vérification d'appariement (espèce/couple/consanguinité — Feature 3).
- **Mise à jour de la parenté** (côté appelant/store ou helper) : ajouter `childId` aux `enfants` de chaque
  parent (INV-9).

## Garanties transverses (tests Vitest)

- Aucune importation de `svelte`, DOM, `window`, `Date`, `crypto`, `Math.random` dans `src/core`
  (hors `createSeed`). La garde de pureté de la Feature 1 couvre les nouveaux modules.
- Pour une seed fixe : enfant, ADN, pouvoirs et P/M **stables** ; exemples §6.4/§7.2 reproduits (INV-7).
