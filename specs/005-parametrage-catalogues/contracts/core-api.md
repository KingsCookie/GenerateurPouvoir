# Contrats — API cœur Feature 005 (Paramétrage & catalogues)

API **pure** (`src/core`, sans Svelte/DOM/horloge/`Math.random`). Toutes les fonctions renvoient de
**nouveaux** objets (immutabilité) et sont **déterministes**. L'UI (`src/ui`) consomme ces fonctions
et détient les stores réactifs.

## 1. Résolution de la résilience

```ts
interface ResiliencePatch { initial?: number; max?: number; disappearThreshold?: number }
interface ResilienceOverrides {
  byType: Partial<Record<TraitType, ResiliencePatch>>;
  byTrait: Record<string, ResiliencePatch>;
}
interface EffectiveResilience { initial: number; max: number; disappearThreshold: number }

// Résout la valeur effective pour un trait (par champ : byTrait → byType → global).
function resolveResilience(params: Parameters, traitId: string): EffectiveResilience;
```

**Contrat** :
- Renvoie toujours 3 nombres définis (INV-P1).
- Résolution **indépendante par champ** (INV-P2).
- `typeOf(traitId)` = préfixe avant `:` si ∈ `TRAIT_TYPES`, sinon niveau type ignoré (INV-P3).
- Pure ; ne consomme pas le RNG.

### Helpers d'édition de surcharge (purs)

```ts
type Scope = { level: 'global' } | { level: 'type'; type: TraitType } | { level: 'trait'; traitId: string };

// Renvoie un nouveau Parameters avec le patch posé/mis à jour au niveau visé.
function setResiliencePatch(params: Parameters, scope: Scope, patch: ResiliencePatch): Parameters;

// Renvoie un nouveau Parameters avec le patch retiré (réhéritage du niveau supérieur).
function clearResiliencePatch(params: Parameters, scope: Scope): Parameters;
```
- Le niveau `global` écrit `initialResilience`/`resilienceMax`/`disappearThreshold` (base).
- Valide les bornes (cf. §4) ; lève/renvoie une erreur si incohérent.

## 2. Moteur — utilisation de la valeur effective

Signatures **étendues a minima** ; comportement identique quand aucune surcharge n'est posée.

```ts
// AVANT : inheritADN(parents, params, rng)
// APRÈS : le moteur résout la résilience par trait hérité.
function inheritADN(parents: Personne[], params: Parameters, rng: Rng): ADN;
//   → en interne, pour chaque traitId : resolveResilience(params, traitId)
//     remplace les lectures directes de params.resilienceMax / params.disappearThreshold.
```

**Contrat** :
- Le **plafond** appliqué après bonus/malus = `resolveResilience(params, traitId).max`.
- Le **seuil de disparition** comparé = `resolveResilience(params, traitId).disappearThreshold`.
- Les **bonus/malus en points** restent **globaux** (hors périmètre clarification).
- `reproduce`, `genesis`, `traitsToPowers` : la **résilience initiale** d'un trait **nouvellement
  créé** (mutation faible gain, trait `K…` généré, trait du pouvoir de genèse) =
  `resolveResilience(params, traitId).initial` (plafonnée à `.max`).
- Déterminisme strictement préservé (mêmes tirages RNG dans le même ordre).

## 3. Mutations de catalogue (pures)

```ts
// Ajoute un trait à un type ; id stable/unique (type:slug-n). Renvoie un nouveau Catalog.
function addTrait(cat: Catalog, type: TraitType, label: string): Catalog;

// Renomme un trait (id inchangé). Renvoie un nouveau Catalog.
function renameTrait(cat: Catalog, traitId: string, label: string): Catalog;

// Retire un trait du catalogue (FUTUR SEULEMENT : ne touche aucun ADN). Renvoie un nouveau Catalog.
function removeTrait(cat: Catalog, traitId: string): Catalog;

// Surcharge le poids d'un trait (le distingue du défaut de son type). Renvoie un nouveau Catalog.
function setTraitWeight(cat: Catalog, traitId: string, weight: number): Catalog;

// « Propager » : applique le poids du type à tous ses traits en EFFAÇANT leurs surcharges. Renvoie
// un nouveau Catalog.
function propagateTypeWeight(cat: Catalog, type: TraitType): Catalog;
```

**Contrat** :
- INV-C1 (jamais de mutation d'ADN), INV-C2 (id unique), INV-C3 (types fixes).
- `removeTrait` d'un id absent : no-op sûr (renvoie un catalogue équivalent).
- Poids : surcharge `≥ 0` (validée) ; **héritage type→trait** (INV-W1) — un trait sans surcharge a
  pour poids effectif `traitTypeWeights[type]`. `propagateTypeWeight` efface les surcharges du type.

## 4. Mutations d'espèces & genres (pures)

```ts
function addEspece(list: Espece[], label: string): Espece[];        // params de reproduction par défaut + genre « tout »
function renameEspece(list: Espece[], especeId: string, label: string): Espece[];
function removeEspece(list: Espece[], especeId: string): Espece[];  // FUTUR SEULEMENT

function setEspeceParam<K extends keyof Espece>(list: Espece[], especeId: string, key: K, value: Espece[K]): Espece[];

function addGenre(list: Espece[], especeId: string, label: string): Espece[];
function renameGenre(list: Espece[], especeId: string, genreId: string, label: string): Espece[];
function removeGenre(list: Espece[], especeId: string, genreId: string): Espece[]; // refuse « tout »
```

**Contrat** :
- INV-E1 (« tout » toujours présent, non supprimable, jamais dupliqué) : `removeGenre` sur « tout »
  est un **no-op** (ou erreur explicite) ; `addEspece` inclut « tout ».
- INV-E2 (futur seulement) : `removeEspece` n'invalide pas les individus existants.
- `setEspeceParam` passe par la **validation** (§5) pour les champs de reproduction.

## 5. Validation (pure)

```ts
function clampPct(v: number): number; // borne dans [0,100]

interface ValidationResult { ok: true } | { ok: false; error: string }

function validateEspece(e: Espece): ValidationResult;          // INV-E3
function validateResiliencePatch(p: ResiliencePatch): ValidationResult; // bornes + seuil ≤ max
```

**Contrat** : aucune saisie invalide acceptée silencieusement (SC-007) ; messages en **français**.

## 6. Pondérations (héritage type → trait) + tirage tolérant

```ts
// Poids effectif d'un trait : surcharge du trait sinon poids du type (résolution trait ?? type).
function resolveWeight(traitId: string, override: number | null, traitTypeWeights: Record<TraitType, number>): number;

// Tirage pondéré TOLÉRANT : renvoie null si aucun candidat de poids > 0 (au lieu de jeter).
function pickWeightedOrNull<T>(items: readonly T[], weightOf: (t: T) => number): T | null;
```

**Contrat** :
- `traitTypeWeights[type]` = **poids par défaut** des traits du type ; un trait peut **surcharger**.
  Poids effectif = `surcharge ?? traitTypeWeights[type]` (INV-W1). `templateWeights` (gabarit) édité
  séparément.
- **Type à poids effectif nul** : `pickWeightedOrNull` renvoie `null` ⇒ l'appelant **n'ajoute aucun
  trait** ; le **pouvoir concerné n'est pas produit** (`pouvoir = null`) et les **traits déjà tirés
  restent actifs** dans l'ADN (FR-052b / INV-W2). Calque la règle d'échec `K` (§6.4.2).
- `pickWeighted` **existant inchangé** (jette toujours sur total nul) ; seuls les nouveaux points
  d'appel sensibles aux poids-0 utilisent `pickWeightedOrNull`.
- **Principe IX** : ce comportement (poids de type 0) est **documenté au §9.1 de
  `DescriptionProjet.md`** (modifié sur **autorisation explicite** 2026-06-12), cohérent avec §6.4.2.

## 7. Invariants transverses

- **Pur & déterministe** : aucune fonction n'utilise `Math.random`/horloge/DOM ; à seed fixe, mêmes
  entrées ⇒ mêmes sorties (INV-D1).
- **Immutabilité** : toutes les mutations renvoient de nouveaux objets ; pas d'effet de bord sur les
  entrées.
- **Lecture seule sur l'existant** : aucune fonction ne recalcule des pouvoirs déjà attribués
  (INV-D2 / §3.3).
- **Sérialisation** : `resilienceOverrides` est porté par `Parameters` ⇒ inclus dans l'export config
  (Feature 6) sans changement de forme de `AppState`.
