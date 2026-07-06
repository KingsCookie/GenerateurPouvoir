# Research / décisions — Feature 010 (filtres de trait, tri, étiquettes P/M)

Phase 0. Décisions techniques ancrées sur l'existant (Feature 004 `filterPopulation`, Feature 008 listes +
`buildListRow`). Contraintes : cœur **pur/déterministe/testé** (FR-017, Principes I/IV/V), états
filtre/tri = interface **hors export** (Principe VI), non-régression `DefUi.md` (SC-005).

---

## D1 — Filtre de présence de trait (nouveau critère cœur)

**Décision** : ajouter un critère **`traitPresence`** à `FilterCriteria` (dans `genealogy/filter.ts`),
type `TraitPresence = 'none-active' | 'some-active' | 'some-inactive' | 'some-any' | null`, et un prédicat
pur `matchTraitPresence(p, presence)`. `null` ⇒ dimension ignorée (comme `powerPresence`).

| Valeur | Libellé UI | Prédicat sur `p.adn.traits` |
|--------|-----------|-----------------------------|
| `none-active` | aucun trait actif | **aucun** trait `active === true` |
| `some-active` | au moins un trait actif | **≥1** trait `active === true` |
| `some-inactive` | au moins un trait inactif | **≥1** trait `active === false` |
| `some-any` | au moins un trait | `p.adn.traits.length > 0` |

Intégration dans `filterPopulation` : un test supplémentaire `if (criteria.traitPresence && !match…) return
false;`, **combiné en ET** avec les autres dimensions (INV-G4). **Indépendant** du filtre de traits précis
(`traitIds` + `traitScope`), qui reste tel quel.

**Rationale** : reprend exactement le patron `powerPresence` (mono-valeur nullable) → cohérence, testabilité,
UI mono-sélection triviale. Les 4 libellés couvrent les intentions de l'utilisateur (clarifications
2026-07-06).

**Alternatives écartées** :
- Réutiliser `traitScope` pour exprimer la présence → mélange deux intentions (quels traits vs combien) ;
  rejeté (spec : dimensions distinctes).
- 4 booléens indépendants (multi-sélection) → combinaisons vides/contradictoires ; rejeté (clarification :
  mono-sélection).

**Impact consommateurs** : `FilterCriteria` gagne un champ requis ⇒ mettre à jour les 2 constructeurs
(`emptyCriteria` dans `stores/filters.ts` et le helper de `genealogy-filter.test.ts`) avec
`traitPresence: null`.

---

## D2 — Tri par colonne (comparateur cœur + état de session)

**Décision** : comparateur **pur** `sortPopulation(pop, key, dir, ctx)` dans `genealogy/filter.ts`
(réutilise `normalize` et `byBirthThenId`), et **état de tri de session par liste** dans `stores/ui.ts`.

- `SortKey = 'nom' | 'naissance' | 'age'` ; `SortDir = 'asc' | 'desc'` ; état = `{ key: SortKey | null; dir:
  SortDir }` (`key: null` ⇒ **tri par défaut**).
- Cycle au clic sur un en-tête : **défaut → `asc` → `desc` → défaut** (fonction `cycleSort(list, key)`).
  Cliquer une **autre** colonne repart en `asc` sur cette colonne.
- Deux états indépendants : `listeSort` (Population) et `sbSort` (Sandbox) — FR-012.
- `sortPopulation` reçoit l'ensemble **déjà filtré** (issu de `filterPopulation`, donc en ordre par défaut)
  et renvoie un **nouveau** tableau ; `key: null` ⇒ renvoie l'ordre reçu **inchangé** (le « défaut »).
- Comparateurs : `nom` via `normalize(nom)` (casse/accents), `naissance` via année puis départage stable,
  `age` numérique (dérivé de `ctx.currentYear`). **Départage stable** final par `byBirthThenId` puis `id`
  pour garantir le déterminisme (FR-009).

**Où appliquer** : dans `ListeView`/`SandboxView`, après `filterPopulation` et **avant** `paginate`
(`rows = sortPopulation(filtered, sort.key, sort.dir, ctx).map(buildListRow)`), pour trier l'**ensemble**
(FR-011).

**Colonne « Pouvoir(s) »** : non triable → en-tête **non** cliquable, sans `aria-sort` actionnable
(FR-007).

**Accessibilité** : en-têtes triables rendus comme `button`/`th` cliquables + `aria-sort="ascending |
descending | none"` + indicateur visuel (▲/▼) ; actionnables au clavier.

**Rationale** : garder le tri **dans le cœur** (FR-017) le rend déterministe et testable ; l'UI ne fait que
stocker l'état de session et afficher. Trier sur `Personne[]` (pas sur les lignes) évite de dépendre du
view-model et réutilise `normalize`/`byBirthThenId` existants.

**Alternatives écartées** :
- Tri dans un helper UI (`src/ui/lib`) → contredit FR-017 (« logique de tri dans le cœur ») ; rejeté.
- Trier la seule page courante → faux résultats ; rejeté (FR-011 : ensemble filtré).
- Persister le tri en `localStorage` → non demandé ; l'état de session suffit (YAGNI, Principe VI).

---

## D3 — Étiquettes de pouvoir enrichies (P/M)

**Décision** : `buildListRow` renvoie `pouvoirs: { label: string; puissance: number; maitrise: number }[]`
(au lieu de `string[]`). Le **format d'affichage** « P : x » / « M : y » est **présentation** (dans
`ListeView`/`SandboxView`).

- Source : `person.pouvoirs[i]` porte déjà `puissance` et `maitrise` ; `powerLabel(p, catalog)` fournit le
  libellé. Aucun accès catalogue supplémentaire.
- Rendu chip : `{label}` + deux petites mentions mono « P : {puissance} » et « M : {maitrise} » (retour à la
  ligne / troncature maîtrisés — édge case étiquette longue).
- Cohérence : mêmes valeurs que la fiche (`PouvoirView.puissance/maitrise`), FR-014.

**Rationale** : données déjà disponibles ; on **expose** sans recalcul. Le view-model reste pur et testable.

**Impact consommateurs** : `ListeView` et `SandboxView` itèrent désormais sur des **objets** (au lieu de
chaînes) ; `fiche-vm.test.ts` met à jour l'assertion sur la forme de `pouvoirs`.

**Alternatives écartées** :
- Composant `PowerChip` dédié → utile mais non requis ; on garde le `<span class="chip">` existant enrichi
  (YAGNI). Peut être factorisé en tâche de polish si duplication gênante.

---

## D4 — « Réinitialiser » remet filtres ET tri (FR-018)

**Décision** : `FilterBar` reçoit un prop **`list: 'population' | 'sandbox'`** ; son bouton
« Réinitialiser » appelle `resetFilters()` (critères partagés, existant) **puis** `resetSort(list)` (remet
l'état de tri de la liste concernée à `{ key: null, dir: 'asc' }`).

**Rationale** : les **filtres** (`criteria`) sont **partagés** Population↔Sandbox (déjà le cas) ; le **tri**
est **par liste** (FR-012). Le prop `list` permet de ne réinitialiser que le tri de la vue courante
(FR-018) sans coupler `filters.ts` au store de tri.

**Alternatives écartées** :
- Réinitialiser les deux tris → contredit « la liste concernée » (FR-018) ; rejeté.
- Émettre un événement `reset` capté par la vue → plus verbeux ; le prop `list` + appel direct est plus
  simple (Svelte, imports partagés).

---

## Synthèse des points de changement

- **Cœur** : `genealogy/filter.ts` (+ `TraitPresence`, `matchTraitPresence`, champ `traitPresence` ;
  + `SortKey`/`SortDir`/`sortPopulation`), `genealogy/index.ts` + `core/index.ts` (ré-exports).
- **Store interface** : `stores/filters.ts` (`emptyCriteria` + `setTraitPresence`) ; `stores/ui.ts`
  (`listeSort`/`sbSort` + `cycleSort`/`resetSort`, session, non persistés).
- **UI** : `FilterBar.svelte` (contrôle présence 4 options mono + prop `list` + reset tri),
  `ListeView.svelte` & `SandboxView.svelte` (en-têtes triables `aria-sort` + application `sortPopulation` +
  chips P/M), `lib/ficheViewModel.ts` (`buildListRow` P/M).
- **Tests** : `genealogy-filter.test.ts` (présence), `genealogy-sort.test.ts` (NEW), `fiche-vm.test.ts` (P/M).
