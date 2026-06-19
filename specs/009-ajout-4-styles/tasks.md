# Tasks: 4 nouveaux styles + 3 nouvelles palettes de couleurs

**Feature** : `009-ajout-4-styles` | **Spec** : [spec.md](./spec.md) | **Plan** : [plan.md](./plan.md)

**Input** : plan.md, spec.md (US1 P1, US2 P2), research.md (D1–D5), data-model.md, contracts/ui-contract.md,
quickstart.md.

**Périmètre** : extension **purement présentationnelle** du thème 3 axes F008 — +4 styles
(`c`/`d`/`e`/`f`), +3 palettes (`ambre`/`rose`/`bleu`). Aucune dépendance npm, cœur `src/core` intouché,
rien dans `AppState`/export.

**Fichiers concernés** (tous existants, on étend) :
`src/app.css` · `src/ui/stores/ui.ts` · `src/ui/components/ThemeControls.svelte` · `index.html` ·
`public/fonts/*` (+ `LICENSE.md`) · `tests/unit/` (test d'interface pur).

**Convention** : `[P]` = parallélisable (fichiers distincts, aucune dépendance bloquante). Les tâches qui
touchent **le même fichier** (`src/app.css`, `ui.ts`, `ThemeControls.svelte`) sont **séquentielles** entre
elles.

---

## Phase 1 — Setup (préparation des assets)

- [x] T001 Vérifier le pipeline d'assets polices : confirmer que `globPatterns` de `vite.config.ts` inclut
  `woff2` (déjà présent) et que les `/fonts/*.woff2` sont réécrits selon le base path ; noter la convention
  de nommage `public/fonts/<famille>[-<graisse>].woff2` (cf. existants) — aucun changement de code attendu.

- [x] T002 [P] Vendoriser les woff2 **sous-ensemble latin** (OFL) dans `public/fonts/` selon research D1 :
  `fraunces.woff2`, `inter.woff2`, `ibm-plex-mono-400.woff2`, `ibm-plex-mono-600.woff2`, `archivo.woff2`,
  `nunito.woff2` (variables `wght` quand possible ; sinon graisses statiques comme IBM Plex Mono 400/600).

- [x] T003 [P] Mettre à jour `public/fonts/LICENSE.md` : ajouter Fraunces, Inter, IBM Plex Mono, Archivo,
  Nunito (familles + SIL OFL 1.1 + source), **sans aucune PII** (Principe X).

**Checkpoint Phase 1** : 6 woff2 présents dans `public/fonts/`, licences documentées.

---

## Phase 2 — Foundational (modèle d'interface : énumérations + repli)

> Bloquant pour US1 et US2 : sans les types/valeurs autorisés, les nouvelles valeurs ne sont ni
> sélectionnables ni restaurées, et le repli des valeurs inconnues n'est pas garanti.

- [x] T004 Étendre les types et listes autorisées dans `src/ui/stores/ui.ts` :
  `type Style = 'a'|'b'|'c'|'d'|'e'|'f'` ; `type Palette = 'violet'|'cyan'|'vert'|'ambre'|'rose'|'bleu'` ;
  élargir les `readChoice<Style>`/`readChoice<Palette>` aux 6 valeurs en **conservant** les défauts `'a'` /
  `'violet'` (repli des valeurs inconnues — Edge Case spec). Ne rien changer d'autre au store.

- [x] T005 Élargir les listes `allowed` du script anti-FOUC dans `index.html` :
  `data-style` → `['a','b','c','d','e','f']`, `data-palette` → `['violet','cyan','vert','ambre','rose','bleu']`,
  défauts inchangés (`dark`/`violet`/`a`). Garder le bloc `catch` de repli.

**Checkpoint Phase 2** : les 3 axes acceptent 6/6/2 valeurs ; valeur inconnue ⇒ défaut ; build TS vert.

---

## Phase 3 — User Story 1 : Choisir parmi les nouveaux styles et palettes (P1) 🎯 MVP

**Goal** : rendre les **6 styles** et **6 palettes** sélectionnables, appliqués en direct (< 1 s) et
restaurés au rechargement.

**Independent Test** : dans Paramètres → Paramètres graphiques, les sélecteurs proposent 6 styles + 6
palettes ; choisir un nouveau style + une nouvelle palette met à jour l'UI immédiatement ; après
rechargement, les 3 axes sont restaurés ; sans préférence ⇒ sombre/violet/A.

### Tokens CSS (src/app.css — séquentiel : même fichier)

- [x] T006 [US1] Ajouter les 4 `@font-face` des nouvelles familles dans `src/app.css` (sous le bloc polices
  existant) : Fraunces, Inter, IBM Plex Mono (400+600), Archivo, Nunito — `src: url('/fonts/…woff2')`,
  `font-display: swap`, plages `font-weight` adaptées (variable ou statiques).

- [x] T007 [US1] Ajouter les 3 blocs palette dans `src/app.css` (après `cyan`/`vert`), **uniquement**
  `--accent` + `--accent-fg` (dérivés via `color-mix()` existant) : `ambre #e0a13a/#16170f`,
  `rose #e25d96/#ffffff`, `bleu #2f86cc/#ffffff` (research D2 / data-model).

- [x] T008 [US1] Ajouter les 4 blocs style dans `src/app.css` (après `:root[data-style='b']`) pour
  `c`/`d`/`e`/`f` : redéfinir `--font`, `--mono`, `--radius`, `--radius-sm`, `--chip-radius`,
  `--logo-radius`, `--label-transform`, `--btn-transform`, `--btn-spacing` selon le tableau research D3,
  avec replis système par rôle (`serif`/`system-ui`/`monospace`).

### Sélecteurs (src/ui/components/ThemeControls.svelte)

- [x] T009 [US1] Étendre le tableau `palettes` dans `src/ui/components/ThemeControls.svelte` à 6 entrées
  (ajouter ambre `#e0a13a`, rose `#e25d96`, bleu `#2f86cc` avec leur `label`/`swatch`).

- [x] T010 [US1] Remplacer les 2 boutons de style en dur par un tableau `styles` (6 entrées
  `{ id, label }` : A — Atelier … F — Organique) rendu en `{#each}` dans
  `src/ui/components/ThemeControls.svelte`, classes `seg nav-item` + `class:is-active` inchangées,
  `aria-label`/`role="group"` conservés.

**Checkpoint US1** : sélecteurs à 6+6 ; sélection d'un nouveau style/palette appliquée en direct ;
rechargement restaure les 3 axes ; défauts sombre/violet/A à la première visite. **MVP livrable.**

---

## Phase 4 — User Story 2 : Lisibilité et non-régression sur toutes les combinaisons (P2)

**Goal** : garantir lisibilité (AA), état actif distinct par style, hors-ligne polices, et 0 régression.

**Independent Test** : parcourir un échantillon représentatif des 72 combinaisons sur les 5 vues
(texte, badges, tableaux, arbre SVG, courbe, état sélectionné, erreurs) ; dérouler DefUi : 0 perte.

### État actif/sélectionné distinct par style (FR-006 / BUG-001)

- [x] T011 [US2] Étendre l'override « aplat plein » de l'état actif dans `src/app.css` aux styles affirmés :
  ajouter `:root[data-style='d'] .nav-item.is-active` et `:root[data-style='e'] .nav-item.is-active` au
  sélecteur existant `:root[data-style='b'] .nav-item.is-active` (research D4). C et F héritent du chip doux
  de base (aucune règle à ajouter).

### Bordures épaisses du style E (research D3)

- [x] T012 [US2] Introduire `--border-width` dans `src/app.css` : `1px` par défaut dans `:root`, `2px` dans
  `:root[data-style='e']` ; appliquer `border-width: var(--border-width)` aux primitives clés
  (`.card`, `button`, `.seg`, `.chip`). Rétro-compatible (A/B/C/D/F restent à 1px).

### Lisibilité / contraste (vérification + ajustements)

- [x] T013 [US2] Vérifier le contraste **AA** du texte courant et des dérivés sur un échantillon des 72
  combinaisons (priorité aux points sensibles : ambre + mode clair, bleu en sélection/lien, D/E coins
  droits) ; si un cas frôle le seuil, ajuster **uniquement** le `--accent` concerné de ±5 % de luminance
  dans `src/app.css` (sans toucher au mécanisme `color-mix()` ni aux valeurs existantes).

**Checkpoint US2** : actif distinct dans les 6 styles ; E à bordures épaisses sans rognage ; contraste AA
sur l'échantillon ; styles/palettes existants inchangés.

---

## Phase 5 — Polish & non-régression transverse

- [x] T014 [P] Ajouter un test d'interface **pur** dans `tests/unit/ui-theme-choices.test.ts` : vérifier que
  les listes autorisées de `ui.ts` contiennent les 6 styles et 6 palettes et que `readChoice` replie une
  valeur inconnue sur `'a'` / `'violet'` (sans accès DOM ; cœur intouché — Principe V/IV).

- [x] T015 [P] Dérouler la check-list hors-ligne de `quickstart.md` §2.4 : `npm run build` + `npm run preview`,
  charger, couper le réseau, recharger, vérifier qu'un nouveau style charge sa police (précache) et que la
  suppression d'un woff2 retombe **proprement** sur le repli système.

- [x] T016 [P] Dérouler la non-régression `rsrc/DefUi.md` (mapping contrat F008 §4) et confirmer que les
  styles `a`/`b` + palettes `violet`/`cyan`/`vert` restent **inchangés** (SC-005) ; consigner le résultat.

- [x] T017 Portes de qualité finales : `npm run test` (cœur vert), `npm run build` (tsc+vite, précache
  inclut les nouvelles woff2), `npm run lint` (propre). Corriger toute régression avant clôture.

---

## Dependencies & ordre d'exécution

```
Phase 1 (T001 ; T002, T003 [P])
        ↓
Phase 2 (T004 → T005)                    ← bloquant pour US1/US2
        ↓
Phase 3 — US1 (P1) : T006 → T007 → T008  (séquentiel, src/app.css)
                     T009 → T010         (séquentiel, ThemeControls.svelte ; peut chevaucher le bloc CSS)
        ↓
Phase 4 — US2 (P2) : T011 → T012 → T013  (séquentiel, src/app.css)
        ↓
Phase 5 — Polish   : T014, T015, T016 [P] → T017 (porte finale)
```

- **US1 ne dépend que de** Phase 2 (types/listes) + Phase 1 (polices pour le rendu complet).
- **US2 dépend de** US1 (les styles/palettes doivent exister pour vérifier lisibilité/actif).
- T006/T007/T008/T011/T012/T013 partagent `src/app.css` ⇒ **séquentiels**.
- T009/T010 partagent `ThemeControls.svelte` ⇒ **séquentiels**, mais **parallèles** au bloc CSS (fichiers
  distincts).

## Exemples d'exécution parallèle

- **Phase 1** : `T002` (vendoriser woff2) ∥ `T003` (LICENSE.md).
- **US1** : bloc CSS (`T006→T008`) ∥ bloc sélecteurs (`T009→T010`).
- **Phase 5** : `T014` (test) ∥ `T015` (hors-ligne) ∥ `T016` (DefUi), puis `T017`.

## Implementation strategy

- **MVP = US1** (Phases 1→3) : 6 styles + 6 palettes sélectionnables, appliqués et restaurés. Livrable seul.
- **Incrément US2** (Phase 4) : qualité visuelle (actif distinct, bordures E, contraste AA).
- **Clôture** (Phase 5) : tests/hors-ligne/non-régression + portes de qualité.
- Toute valeur **existante** (tokens A/B, accents violet/cyan/vert, défauts) est **intouchable** (régression).
