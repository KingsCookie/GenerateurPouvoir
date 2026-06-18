# Modèle de données — Feature 008 (Refonte UI)

Refonte **présentation seulement** : **aucune** entité métier ni `AppState` n'est ajouté/modifié. Les seules
« données » nouvelles sont des **états d'interface** détenus par le store `src/ui/stores/ui.ts` — **non**
inclus dans `AppState`, **non** sérialisés en export/import (Principe VI). Seules les **préférences
d'apparence** (+ `traitMode`) sont persistées en `localStorage`.

## Entités d'état d'interface (store `ui.ts`)

### Préférences d'apparence (persistées `localStorage`)

```ts
type Mode    = 'dark' | 'light';            // défaut 'dark'
type Palette = 'violet' | 'cyan' | 'vert';  // défaut 'violet'
type Style   = 'a' | 'b';                    // défaut 'a' (A = Atelier, B = Signal)
// + traitMode: 1 | 2 | 3  (existant, défaut 3)
```

- Appliquées en attributs sur `<html>` : `data-mode`, `data-palette`, `data-style`.
- Chargées au démarrage depuis `localStorage` (script anti-FOUC + hydratation du store) ; persistées à
  chaque changement.

### Pagination (session)

```ts
type PageSize = 50 | 100 | 250 | 1000 | 'all';   // défaut 50
// Liste :   listePageSize, listePage (1-based)
// Sandbox : sbPageSize,    sbPage    (1-based)
```

### Sandbox — onglet (session)

```ts
type SandboxTab = 'population' | 'couples';      // défaut 'population'
// sbTab
```

### Vue d'arbre (session)

```ts
// arbreScale (0.2..4), arbreTx, arbreTy, arbreRootId (string|null), arbreDepth (>=1)
```

### Chrome (session)

```ts
// showScrollTop: boolean  (vrai quand scrollY > ~300)
```

## Données dérivées (view-models purs, `src/ui/lib`)

> Calculées à partir de données **déjà présentes** dans le modèle (aucune logique métier ajoutée).

- **Fiche — enfants** : `enfants: { id: string; nom: string }[]` dérivé de `Personne.enfants` (résolution
  id → nom dans la population courante), cliquables vers la fiche.
- **Fiche — type de trait** : pour chaque trait affiché, son **type** (`Remplacement` | `PartieCorps` |
  `Etat` | `Element` | `Ajout` | `Action`), dérivé du préfixe d'id (`traitTypeOf`, cœur) ou du catalogue.
- **Pagination** : `pageItems = items.slice((page-1)*size, page*size)` (ou tout si `'all'`) ; `page` est
  borné à `[1, ceil(total/size)]`.

## Invariants (état d'interface)

- **INV-UI1 (isolation)** : aucun état d'interface n'entre dans `AppState` ni dans l'export/import
  (Principe VI). `appState.ts`, `sandboxStore.ts`, `filters.ts` conservent leur **logique inchangée**.
- **INV-UI2 (apparence)** : à tout instant, les 3 attributs `data-mode`/`data-palette`/`data-style` sur
  `<html>` reflètent l'état du store ; au démarrage sans préférence ⇒ `dark`/`violet`/`a`.
- **INV-UI3 (persistance limitée)** : seules `mode`, `palette`, `style`, `traitMode` survivent au
  rechargement ; pagination, onglet, vue d'arbre, `showScrollTop` sont **éphémères** (session).
- **INV-UI4 (pagination)** : changer `pageSize` ⇒ `page = 1` ; `page` toujours dans `[1, nbPages]` ;
  `'all'` affiche tout. La pagination n'altère **jamais** la population sous-jacente.
- **INV-UI5 (sélection repro indépendante)** : la sélection de parents (sandbox) est un ensemble d'ids
  **découplé** des lignes visibles (filtre/pagination) ⇒ une sélection masquée **persiste**.
- **INV-UI6 (cœur intact)** : `src/core/**` n'est pas modifié ; les tests cœur à seed fixe restent verts.
- **INV-UI7 (non-régression)** : l'ensemble des fonctionnalités de `rsrc/DefUi.md` reste disponible et
  opérant après refonte (SC-001).
