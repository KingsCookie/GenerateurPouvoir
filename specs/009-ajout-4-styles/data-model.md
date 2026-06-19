# Modèle de données — Feature 009 (états d'**interface** uniquement)

> Comme la Feature 008, **aucune** entité métier n'est touchée. Le « modèle » se limite aux **énumérations
> d'apparence** (préférences locales, **non** exportées — Principe VI). Le cœur `src/core` et `AppState`
> restent inchangés.

## Énumérations étendues

### Style (axe `data-style`)

Portée **2 → 6** valeurs.

| Valeur | Nom | Identité (résumé) |
|--------|-----|-------------------|
| `a` *(défaut, existant)* | Atelier | doux, chips arrondis, Hanken Grotesk |
| `b` *(existant)* | Signal | net, aplats, Space Grotesk |
| `c` | Éditorial | serif titres (Fraunces) + sans corps (Inter), rayons généreux, petites caps |
| `d` | Terminal | tout monospace (IBM Plex Mono), coins vifs, MAJUSCULES |
| `e` | Néo-brutaliste | Archivo grasse, coins droits, **bordures épaisses**, aplats |
| `f` | Organique | Nunito arrondie, très grands rayons (« pilule »), minuscules |

**Type TS** : `export type Style = 'a' | 'b' | 'c' | 'd' | 'e' | 'f';`
**Défaut** : `'a'`. **Valeur inconnue en `localStorage`** ⇒ repli `'a'` (via `readChoice`).

### Palette (axe `data-palette`)

Portée **3 → 6** valeurs.

| Valeur | Nom | `--accent` | `--accent-fg` |
|--------|-----|-----------|---------------|
| `violet` *(défaut, existant)* | Violet | `#9b7fe6` | `#ffffff` |
| `cyan` *(existant)* | Cyan | `#2fcdbb` | `#16170f` |
| `vert` *(existant)* | Vert | `#86c057` | `#16170f` |
| `ambre` | Ambre | `#e0a13a` | `#16170f` |
| `rose` | Rose | `#e25d96` | `#ffffff` |
| `bleu` | Bleu | `#2f86cc` | `#ffffff` |

**Type TS** : `export type Palette = 'violet' | 'cyan' | 'vert' | 'ambre' | 'rose' | 'bleu';`
**Défaut** : `'violet'`. **Valeur inconnue** ⇒ repli `'violet'`.

### Mode (axe `data-mode`) — **inchangé**

`'dark' | 'light'`, défaut `'dark'`. Aucune modification.

## Préférences d'apparence (inchangé structurellement)

Triplet `(mode, palette, style)` :
- mémorisé en `localStorage` (`ui.mode`, `ui.palette`, `ui.style`) ;
- appliqué en attributs sur `document.documentElement` (`data-mode`, `data-palette`, `data-style`) ;
- **hors** `AppState` / export-import (Principe VI) ;
- les 3 axes restent **indépendants** et combinables → **72** combinaisons (6 × 6 × 2).

## Tokens dérivés (rappel — mécanisme inchangé)

Par palette, seuls `--accent` et `--accent-fg` sont posés ; tous les autres dérivés
(`--accent-text`, `--chip-bg`, `--chip-border`, `--chip-text`, `--tint-bg`, `--year-shadow`) sont
**calculés** par `color-mix()` (formules F008, sombre + clair). Par style, le jeu de tokens géométriques/
typographiques (`--font`, `--mono`, `--radius`, `--radius-sm`, `--chip-radius`, `--logo-radius`,
`--label-transform`, `--btn-transform`, `--btn-spacing`) est redéfini ; ajout **minimal** `--border-width`
(défaut `1px`, `2px` pour `e`).

## Transitions d'état

Aucune machine à états. Sélectionner une valeur ⇒ application immédiate de l'attribut + persistance
(< 1 s, sans rechargement). Au chargement : hydratation depuis `localStorage` (sinon défauts).
