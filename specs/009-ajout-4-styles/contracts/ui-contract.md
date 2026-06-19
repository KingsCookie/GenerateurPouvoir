# Contrats — UI Feature 009 (extension thème : +4 styles, +3 palettes)

Extension **présentation seulement** du contrat de thème posé en Feature 008
(`specs/008-refonte-ui/contracts/ui-contract.md`, qui reste la base). Pas d'API métier nouvelle ; le cœur
`src/core` est inchangé. On **ajoute des valeurs** aux axes existants — rien n'est retiré.

## 1. Contrat de thème étendu (attributs sur `<html>`)

```text
<html data-mode="dark|light"
      data-palette="violet|cyan|vert|ambre|rose|bleu"
      data-style="a|b|c|d|e|f">
```

- **Défauts inchangés** : `data-mode="dark"`, `data-palette="violet"`, `data-style="a"`.
- **Valeur inconnue/obsolète** sur un axe ⇒ repli sur **son** défaut (sans casse) — via `readChoice()`
  (`ui.ts`) et la liste `allowed` du script anti-FOUC (`index.html`).
- Tout composant continue de consommer **exclusivement** les variables de rôle (mêmes noms qu'en F008).
  **Aucune** vue ni store de logique ne doit être modifié pour cette feature.

### 1.1 Nouveaux blocs de tokens (dans `src/app.css`)

**Palettes** — chacune pose **uniquement** `--accent` + `--accent-fg` (dérivés via `color-mix()` existant) :

```css
:root[data-palette='ambre'] { --accent: #e0a13a; --accent-fg: #16170f; }
:root[data-palette='rose']  { --accent: #e25d96; --accent-fg: #ffffff; }
:root[data-palette='bleu']  { --accent: #2f86cc; --accent-fg: #ffffff; }
```

**Styles** — chacun redéfinit le **jeu complet** de tokens (cf. data-model D3) :
`--font`, `--mono`, `--radius`, `--radius-sm`, `--chip-radius`, `--logo-radius`, `--label-transform`,
`--btn-transform`, `--btn-spacing` pour `c`, `d`, `e`, `f`.

**Bordures (E)** : variable optionnelle `--border-width` (défaut `1px` dans `:root` ;
`:root[data-style='e'] { --border-width: 2px; }`) appliquée aux primitives clés
(`.card`, `button`, `.seg`, `.chip`). Rétro-compatible : A/B/C/D/F voient `1px` ⇒ rendu inchangé.

### 1.2 État actif/sélectionné (non-régression BUG-001 — FR-006)

- Règle de base F008 conservée : `:root[data-style] .nav-item.is-active` → **chip doux** (s'applique à tous,
  donc C et F en héritent).
- Override **aplat plein** étendu aux styles affirmés :
  ```css
  :root[data-style='b'] .nav-item.is-active,
  :root[data-style='d'] .nav-item.is-active,
  :root[data-style='e'] .nav-item.is-active { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); font-weight: 600; }
  ```
- Garantie : dans **chaque** style, l'actif reste **nettement distinct** de l'inactif sur nav, segments,
  onglets, pagination, chips de filtre, lignes.

### 1.3 Polices auto-hébergées (FR-007)

- Nouveaux `@font-face` dans `src/app.css`, fichiers `public/fonts/*.woff2` (sous-ensemble latin, OFL),
  **précachés** via `globPatterns` woff2 (inchangé). **Aucun appel tiers**.
- Familles (cf. research D1) : Fraunces, Inter (style C) ; IBM Plex Mono (style D) ; Archivo (style E) ;
  Nunito (style F). Mono réutilisées : JetBrains Mono (C, F), Space Mono (E).
- **Repli système par rôle** toujours présent dans `--font`/`--mono` (`serif`/`system-ui`/`monospace`).

## 2. Contrat du store d'interface (`src/ui/stores/ui.ts`) — **types élargis uniquement**

```ts
export type Style   = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';          // 2 → 6
export type Palette = 'violet' | 'cyan' | 'vert' | 'ambre' | 'rose' | 'bleu'; // 3 → 6

// readChoice() : listes autorisées élargies, mêmes défauts ('a' / 'violet').
style   = writable(readChoice<Style>('ui.style',   ['a','b','c','d','e','f'], 'a'));
palette = writable(readChoice<Palette>('ui.palette',['violet','cyan','vert','ambre','rose','bleu'], 'violet'));
```

**Contrats inchangés** : `setStyle/setPalette/setMode/toggleMode` appliquent l'attribut **immédiatement** et
persistent (< 1 s, sans rechargement) ; aucune de ces valeurs n'entre dans `AppState`/export ; l'app
fonctionne sans `localStorage` (défauts). **Aucune** autre signature du store ne change.

## 3. Contrat des sélecteurs (`src/ui/components/ThemeControls.svelte`)

- Tableau `palettes` : **6** entrées `{ id, label, swatch }` (ajout ambre `#e0a13a`, rose `#e25d96`,
  bleu `#2f86cc`).
- Tableau `styles` : **6** entrées `{ id, label }` (A — Atelier … F — Organique) ; le sélecteur de style est
  rendu en `{#each styles}` (au lieu de 2 boutons en dur), classes `seg nav-item` + `is-active` inchangées.
- Variante `toggle` (en-tête, mode clair/sombre) **inchangée**.
- Accessibilité conservée : `role="group"`, `aria-label`, `field-label`, focus visible.

## 4. Contrat de non-régression (FR-008 / SC-005)

| Doit rester identique | Vérification |
|-----------------------|--------------|
| Styles `a`/`b` et palettes `violet`/`cyan`/`vert` | rendu **pixel-équivalent** (aucune valeur existante modifiée) |
| 100 % des fonctionnalités `rsrc/DefUi.md` | dérouler le mapping DefUi (quickstart) : 0 perte |
| Défauts sombre / violet / A | première visite sans préférence (SC-003) |
| Restauration des 3 axes au rechargement | SC-004 |
| Hors-ligne (polices comprises) | SC-006 — précache + repli système |

**Règle** : on **ajoute** des valeurs ; toute modification d'une valeur **existante** (token A/B,
accent violet/cyan/vert, défauts) est **interdite** (régression).
