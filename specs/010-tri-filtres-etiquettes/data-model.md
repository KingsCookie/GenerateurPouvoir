# Modèle de données — Feature 010

> Ajouts **en lecture seule** : un critère de filtre (cœur), un état de tri (interface), un enrichissement
> de view-model. **Aucun** changement au modèle métier (`Personne`, ADN, pouvoirs) ni à `AppState`/export
> (Principe VI). La génétique/hérédité/simulation sont intouchées.

## 1. Critère de filtre — `TraitPresence` (cœur, `genealogy/filter.ts`)

Nouveau champ de `FilterCriteria` :

```ts
export type TraitPresence =
  | 'none-active'    // aucun trait actif
  | 'some-active'    // au moins un trait actif
  | 'some-inactive'  // au moins un trait inactif
  | 'some-any'       // au moins un trait (actif ou inactif)
  | null;            // ignoré

interface FilterCriteria {
  // …existant…
  traitPresence: TraitPresence; // défaut null (ignoré)
}
```

Prédicat (pur) sur `p.adn.traits` :

| Valeur | Retenu si |
|--------|-----------|
| `none-active` | `traits.every(t => !t.active)` (y compris ADN vide) |
| `some-active` | `traits.some(t => t.active)` |
| `some-inactive` | `traits.some(t => !t.active)` |
| `some-any` | `traits.length > 0` |
| `null` | (dimension ignorée) |

**Combinaison** : ET avec les autres dimensions (INV-G4) ; **indépendant** de `traitIds`/`traitScope`.
**Défaut** : `null`. **Mono-sélection** côté UI (au plus une valeur ≠ null).

## 2. État de tri de liste (interface, session, par liste) — `stores/ui.ts`

```ts
export type SortKey = 'nom' | 'naissance' | 'age';
export type SortDir = 'asc' | 'desc';
export interface ListSort { key: SortKey | null; dir: SortDir } // key null ⇒ tri par défaut

export const listeSort: Writable<ListSort>; // Population
export const sbSort: Writable<ListSort>;    // Sandbox
```

- **Cycle** au clic sur une colonne triable : `défaut(null) → asc → desc → défaut`. Colonne différente ⇒
  repart en `asc`.
- **Non persistant** (session), **non exporté**. Un état **par liste** (FR-012).
- Défaut initial : `{ key: null, dir: 'asc' }` (= ordre naturel de `filterPopulation`).

## 3. Comparateur de tri (cœur) — `sortPopulation`

```ts
export function sortPopulation(
  pop: readonly Personne[],
  key: SortKey | null,
  dir: SortDir,
  ctx: FilterContext,          // currentYear pour l'âge
): Personne[];
```

- `key === null` ⇒ **copie inchangée** (préserve l'ordre par défaut reçu).
- `nom` : comparaison **normalisée** (casse/accents) ; `naissance` : année puis mois/jour ; `age` :
  numérique (via `ctx.currentYear`).
- `dir === 'desc'` inverse l'ordre de la clé.
- **Départage stable** final déterministe (`byBirthThenId` puis `id`) → FR-009.
- **Pur**, ne mute pas `pop` (nouveau tableau).

## 4. Ligne de liste enrichie — `buildListRow` (`lib/ficheViewModel.ts`)

Avant : `pouvoirs: string[]`. Après :

```ts
pouvoirs: { label: string; puissance: number; maitrise: number }[];
```

Valeurs issues de `person.pouvoirs` (déjà présentes) + `powerLabel`. **Affichage** (présentation) :
`« <label> · P : <puissance> · M : <maitrise> »`. Individu sans pouvoir ⇒ liste vide ⇒ « — » (inchangé).

## 5. Transitions d'état

- **Filtre présence** : sélection/désélection immédiate → re-filtrage (< 1 s), sans rechargement.
- **Tri** : clic en-tête → `cycleSort` → re-tri de l'ensemble filtré puis pagination.
- **Réinitialiser** : `resetFilters()` (critères, dont `traitPresence`) **+** `resetSort(list)` (tri de la
  liste concernée) → FR-018.
