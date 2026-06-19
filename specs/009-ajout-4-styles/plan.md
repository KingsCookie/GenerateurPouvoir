# Implementation Plan: 4 nouveaux styles + 3 nouvelles palettes de couleurs

**Branch**: `009-ajout-4-styles` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-ajout-4-styles/spec.md`

## Summary

Étendre le **système de thème à 3 axes** posé en Feature 008 (sur `<html>` : `data-mode`, `data-palette`,
`data-style`) en **ajoutant des valeurs** aux deux axes d'apparence :

- `data-style` : **+4** styles (`c` Éditorial, `d` Terminal, `e` Néo-brutaliste, `f` Organique) → 6 au total.
- `data-palette` : **+3** palettes (`ambre`, `rose`, `bleu`) → 6 au total.

Aucune mécanique nouvelle : on ajoute des **blocs de tokens CSS** (`:root[data-style='…']`,
`:root[data-palette='…']`), des **valeurs aux listes autorisées** (`ui.ts` + script anti-FOUC), des
**entrées aux sélecteurs** (`ThemeControls.svelte`), et **par style** un **couple de polices** auto-hébergé
(woff2 latin, précaché) — décidé en clarification 2026-06-19. Le cœur `src/core` reste **intouché**
(Principe IV) ; les préférences restent en `localStorage` **hors** export/import (Principe VI).
Refonte **purement présentationnelle** ; non-régression `rsrc/DefUi.md` à 100 %.

## Technical Context

**Language/Version** : TypeScript 5.x (UI uniquement) ; CSS (custom properties + `color-mix()`).

**Primary Dependencies** : Aucune **nouvelle** dépendance npm (Principe VIII). Réutilise Vite, Svelte,
vite-plugin-pwa (Workbox) déjà en place. Les polices sont des **assets** (woff2), pas des paquets.

**Storage** : `localStorage` pour les 3 préférences d'apparence (clés `ui.mode`/`ui.palette`/`ui.style`,
inchangées). **Aucun** changement à l'export/import de l'état applicatif (Principe VI).

**Testing** : Vitest. Les tests **du cœur** restent la porte de qualité (Principe V) et NE changent pas.
Ajout d'un test d'**interface pur** facultatif vérifiant que les listes de valeurs autorisées contiennent
les 6 styles / 6 palettes (garde-fou de non-régression des défauts/repli). `npm run build` (tsc + vite)
et `npm run lint` restent les portes effectives.

**Target Platform** : Navigateurs modernes (PWA installable Windows/macOS/Linux/iOS/Android), hors-ligne
strict après 1er chargement. `color-mix(in srgb, …)` et polices variables woff2 supposés disponibles
(déjà requis par Feature 008).

**Project Type** : Application web statique mono-projet (PWA), déployée sur GitHub Pages.

**Performance Goals** : Changement d'axe appliqué **< 1 s** sans rechargement (SC-001) — déjà garanti par
le simple basculement d'attribut sur `<html>`. Surcoût de **précache** des nouvelles polices **assumé**
(clarification) ; on privilégie des woff2 **sous-ensemble latin** légers et la réutilisation des polices
mono déjà vendorisées quand un style n'a pas besoin d'une mono propre.

**Constraints** : 100 % statique / hors-ligne ; déterminisme (aucun aléatoire/horloge ajouté) ; français ;
anonymat (licences OFL, aucune PII) ; accessibilité (contraste cible AA texte courant dans les 2 modes,
clavier, ARIA) ; responsive/tactile (cibles ≥ ~44 px). Chemins `/fonts/…` réécrits par Vite selon le
base path (compatibles sous-répertoire Pages).

**Scale/Scope** : 6 styles × 6 palettes × 2 modes = **72 combinaisons**. Périmètre fichiers : `src/app.css`,
`src/ui/stores/ui.ts`, `src/ui/components/ThemeControls.svelte`, `index.html` (anti-FOUC), `public/fonts/`
(+ `LICENSE.md`). Aucune vue métier, aucun store de logique touchés.

## Constitution Check

*GATE : doit passer avant Phase 0. Re-vérifié après Phase 1.*

| Principe | Statut | Justification |
|----------|--------|---------------|
| I. Déterminisme (seed unique) | ✅ PASS | Aucune logique aléatoire/horloge introduite ; CSS + assets uniquement. `src/core` intouché. |
| II. 100 % statique / client-side | ✅ PASS | Tokens CSS + woff2 locaux ; aucun backend, aucun appel tiers. |
| III. PWA multiplateforme / hors-ligne | ✅ PASS | Nouvelles woff2 **précachées** (globPattern `woff2` déjà en place) ; repli système garanti. |
| IV. Cœur pur, isolé, testable | ✅ PASS | Modifs limitées à `src/ui/**`, `src/app.css`, `index.html`, `public/fonts/`. Cœur intouché. |
| V. Tests déterministes du cœur | ✅ PASS | Aucun changement de logique → tests cœur inchangés et verts. Ajout test d'interface pur optionnel. |
| VI. Persistance par fichiers | ✅ PASS | Préférences d'apparence en `localStorage` (interface), **hors** `AppState`/export. |
| VII. Tout est paramétrable | ✅ N/A | Pas de constante métier ; valeurs d'apparence exposées via les sélecteurs. |
| VIII. Simplicité / YAGNI | ✅ PASS | Aucune dépendance npm ajoutée ; on étend des axes existants. Surcoût polices maîtrisé (sous-ensemble latin, mono réutilisée si possible). |
| IX. Spéc fonctionnelle = vérité | ✅ PASS | `rsrc/DescriptionProjet.md` intouché ; non-régression `rsrc/DefUi.md` à 100 % (SC-005). |
| X. Anonymat de l'auteur | ✅ PASS | Polices sous licence libre (OFL) ; `LICENSE.md` sans PII ; commits `KingsCookie` sans email. |

**Résultat** : aucune violation. **Complexity Tracking** non requis.

## Project Structure

### Documentation (this feature)

```text
specs/009-ajout-4-styles/
├── plan.md              # Ce fichier (/speckit-plan)
├── research.md          # Phase 0 — choix polices/couleurs/tokens (/speckit-plan)
├── data-model.md        # Phase 1 — énumérations Style/Palette étendues (/speckit-plan)
├── quickstart.md        # Phase 1 — check-list de validation des combinaisons (/speckit-plan)
├── contracts/
│   └── ui-contract.md   # Phase 1 — contrat thème étendu (tokens, store, non-régression)
├── checklists/
│   └── requirements.md  # 16/16 (déjà validé)
└── tasks.md             # Phase 2 — /speckit-tasks (NON créé ici)
```

### Source Code (repository root)

```text
src/
├── app.css                              # + @font-face (nouvelles polices) ; + blocs :root[data-style='c|d|e|f']
│                                        #   et :root[data-palette='ambre|rose|bleu'] ; + overrides .nav-item.is-active
└── ui/
    ├── stores/ui.ts                     # types Style/Palette étendus ; listes readChoice() élargies
    └── components/ThemeControls.svelte  # tableaux `styles` et `palettes` étendus (6 + 6) ; sélecteur style en #each

index.html                               # anti-FOUC : listes `allowed` élargies (style/palette)

public/fonts/                            # nouvelles woff2 (sous-ensemble latin) + LICENSE.md mis à jour
```

**Structure Decision** : mono-projet statique existant. La feature **n'ajoute aucun répertoire** ; elle
étend des fichiers d'apparence déjà identifiés en Feature 008. Le découplage cœur/UI (Principe IV) est
préservé : strictement `src/ui/**`, `src/app.css`, `index.html`, `public/fonts/`.

## Complexity Tracking

> Aucune violation de la Constitution → section vide (sans objet).
