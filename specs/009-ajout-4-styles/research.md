# Research / décisions — Feature 009 (4 styles + 3 palettes)

Phase 0. Toutes les valeurs ci-dessous sont des **détails de présentation** (le WHAT est figé par la spec).
Cibles : licences **libres (SIL OFL 1.1)**, **auto-hébergement** woff2 **sous-ensemble latin**, contraste
**AA** du texte courant dans les 2 modes, **repli système** par rôle, **aucun appel tiers**.

---

## D1 — Familles de polices par nouveau style

**Décision** : un **couple titre/corps** propre à chaque style (clarification 2026-06-19) ; la **mono** est
**réutilisée** parmi les polices déjà vendorisées (JetBrains Mono, Space Mono) **sauf** pour le style
mono-centré (D), qui reçoit une mono dédiée. Toutes en **OFL**, sous-ensemble latin, woff2.

| Style | `--font` (titre/corps) | `--mono` | Nouvelles woff2 à vendoriser |
|-------|------------------------|----------|------------------------------|
| **C — Éditorial** | **Fraunces** (serif, titres) + **Inter** (sans, corps) | JetBrains Mono *(réutilisée)* | `fraunces.woff2`, `inter.woff2` |
| **D — Terminal** | **IBM Plex Mono** (tout mono) | **IBM Plex Mono** | `ibm-plex-mono-400.woff2`, `ibm-plex-mono-600.woff2` |
| **E — Néo-brutaliste** | **Archivo** (grotesque, graisses fortes) | Space Mono *(réutilisée)* | `archivo.woff2` |
| **F — Organique** | **Nunito** (humaniste arrondie) | JetBrains Mono *(réutilisée)* | `nunito.woff2` |

**Rationale** :
- **Fraunces** apporte l'élégance « magazine » (empattements à contraste) demandée pour C ; **Inter** garde
  un corps très lisible. Le contraste serif/sans **est** l'identité de C.
- **IBM Plex Mono** : esthétique console nette, distincte de JetBrains/Space Mono ; sert à la fois `--font`
  et `--mono` pour le « tout monospace » de D.
- **Archivo** : grotesque dense aux graisses lourdes, idéale pour les aplats francs / titres brutalistes (E).
- **Nunito** : sans humaniste **arrondie**, parfaite pour la rondeur/calme de F.

**Repli système** (toujours conservé dans les tokens) : `serif` (C titres), `system-ui, sans-serif`
(C/E/F corps), `monospace` (D et toutes les `--mono`).

**Maîtrise du poids** (Principe VIII / clarification « surcoût assumé mais modéré») :
- Sous-ensemble **latin** uniquement (couvre le français).
- Préférer des **woff2 variables** quand l'axe `wght` suffit (Fraunces, Inter, Archivo, Nunito) → 1 fichier
  par famille ; sinon 2 graisses statiques (cas IBM Plex Mono : 400 + 600, comme Space Mono en F008).
- **Réutiliser** les mono déjà précachées évite 3 fichiers supplémentaires.

**Alternatives écartées** :
- Réutiliser Hanken/Space Grotesk pour les corps des nouveaux styles → diluerait l'« identité propre »
  voulue par la clarification ; rejeté pour le **corps**, accepté pour la **mono** (rôle secondaire).
- Polices Google en CDN → viole hors-ligne strict + anonymat (appel tiers) ; rejeté.
- Une seule police « caméléon » variable pour tous → contredit la distinctivité demandée (FR-001/007).

---

## D2 — Couleurs d'accent des 3 nouvelles palettes

**Décision** : prolonger la roue chromatique en suivant **exactement** le schéma F008 : un `--accent` unique
(indépendant du mode) + un `--accent-fg` (texte SUR aplat d'accent) choisi clair/foncé selon la luminance de
l'accent ; tous les autres dérivés (`--accent-text`, `--chip-*`, `--tint-bg`, `--year-shadow`) restent
**calculés** par `color-mix()` via les formules existantes (sombre **et** clair), donc **rien à ajouter**
par palette hormis les 2 variables.

| Palette | `--accent` | `--accent-fg` | Caractère | Contraste texte-sur-accent |
|---------|-----------|---------------|-----------|----------------------------|
| **ambre** | `#e0a13a` | `#16170f` (foncé) | orangé chaud / doré (clair) | texte foncé sur ambre clair → AA OK |
| **rose** | `#e25d96` | `#ffffff` (clair) | magenta vif (moyen) | texte blanc sur magenta → AA OK |
| **bleu** | `#2f86cc` | `#ffffff` (clair) | azur franc (moyen) | texte blanc sur azur → ≈3.9 (≥ plancher F008, ajusté T013) |

**Rationale** :
- Le projet a déjà violet (foncé, fg blanc), cyan & vert (clairs, fg foncé). On **complète** : un chaud
  (ambre), un magenta (rose), un azur (bleu) → roue équilibrée.
- Règle de `--accent-fg` reprise de F008 : accent **clair** ⇒ fg **foncé** (ambre) ; accent **moyen/saturé**
  ⇒ fg **blanc** (rose, bleu), comme violet.
- Les dérivés `color-mix()` étant relatifs à `--accent`, ils produisent automatiquement chips/teintes/ombres
  cohérents dans les 2 modes (aucune valeur par palette à coder — non-régression du mécanisme F008).

**Vérifications de contraste (cible AA, à confirmer en quickstart)** :
- `--accent-text` (mélange accent + blanc en sombre / + noir en clair) sur `--bg`/`--bg-elev` → lisible.
- Points sensibles (spec Edge Cases) : **ambre clair** + **mode clair** (texte d'accent sur fond clair) et
  **azur** en sélection/lien. Si un cas frôle le seuil, **ajuster le `--accent`** de ±5 % de luminance
  (tâche de polish), sans toucher au mécanisme.

**Alternatives écartées** :
- Définir des dérivés par palette en dur → casse l'unicité du mécanisme color-mix, multiplie la maintenance ;
  rejeté.
- Palettes très désaturées (pastel) → faible distinctivité d'accent ; rejeté.

---

## D3 — Tokens de style (géométrie, casse, logo) par nouveau style

**Décision** : chaque style redéfinit le **même jeu de variables** que A/B
(`--font`, `--mono`, `--radius`, `--radius-sm`, `--chip-radius`, `--logo-radius`, `--label-transform`,
`--btn-transform`, `--btn-spacing`). Valeurs proposées :

| Token | A (réf.) | B (réf.) | **C Éditorial** | **D Terminal** | **E Néo-brut.** | **F Organique** |
|-------|----------|----------|-----------------|----------------|------------------|------------------|
| `--radius` | 11px | 7px | 12px | 2px | 0px | 22px |
| `--radius-sm` | 8px | 5px | 9px | 1px | 0px | 16px |
| `--chip-radius` | 20px | 5px | 14px | 0px | 0px | 999px |
| `--logo-radius` | 8px | 50% | 6px | 0px | 0px | 50% |
| `--label-transform` | uppercase | lowercase | uppercase *(petites caps via letter-spacing)* | uppercase | uppercase | lowercase |
| `--btn-transform` | none | uppercase | none | uppercase | uppercase | none |
| `--btn-spacing` | normal | 0.05em | 0.02em | 0.08em | 0.04em | normal |

**Rationale** : traduit fidèlement les identités de la spec — C généreux/raffiné, D anguleux/technique,
E coins droits/affirmé, F « pilule » arrondie. Réutiliser exactement les **mêmes noms de tokens** garantit
que toutes les vues (qui consomment déjà ces variables) héritent du style **sans modification de composant**.

**Bordures épaisses (E)** : l'épaisseur de bordure n'est pas un token F008. Décision : introduire **une**
variable optionnelle `--border-width` (défaut `1px` dans `:root`, `2px` en `:root[data-style='e']`) et
l'appliquer aux primitives clés (`.card`, `button`, `.seg`, `.chip`) via `border-width: var(--border-width)`.
Ajout **minimal**, rétro-compatible (défaut 1px ⇒ A/B/C/D/F inchangés). *(Détail d'implémentation tasks.)*

**Alternatives écartées** :
- Ajouter de nouveaux tokens par style (ombres dures E, etc.) → YAGNI ; on se limite à `--border-width`
  car explicitement cité par la spec (« bordures épaisses »). Les « ombres dures » de E seront rendues, si
  besoin, via une règle scopée `:root[data-style='e']` réutilisant `--border`/`--accent`, sans nouveau token.

---

## D4 — État actif/sélectionné par style (non-régression BUG-001)

**Décision** : conserver la règle de base F008 (`:root[data-style] .nav-item.is-active` → chip doux : fond
teinté + bordure d'accent + texte d'accent gras), qui s'applique **déjà à tous les styles**, puis ajouter
des **overrides** par style pour coller à l'identité :

- **C — Éditorial**, **F — Organique** : gardent le **chip doux** de base (élégant / calme). Aucun override.
- **B — Signal** *(existant)*, **D — Terminal**, **E — Néo-brutaliste** : **aplat d'accent plein**
  (`background: var(--accent)`, `color: var(--accent-fg)`, bordure accent) — net et affirmé.
  → généraliser l'override existant `:root[data-style='b'] .nav-item.is-active` en
  `:root[data-style='b'] …, :root[data-style='d'] …, :root[data-style='e'] …`.

**Rationale** : satisfait **FR-006** (actif nettement distinct dans **chaque** style, pas seulement en aplat)
en réutilisant le correctif de spécificité de BUG-001 (`:root[data-style…]` = 0,4,0 bat les règles scopées
des composants). A/B **inchangés** (SC-005).

**Alternatives écartées** : une apparence active unique pour les 6 styles → contredirait l'identité par style
et l'esprit de BUG-001 (l'actif doit « parler le langage » du style). Rejeté.

---

## D5 — Surface de changement minimale (où vivent les 4 axes ajoutés)

**Décision** : 4 points d'extension seulement, alignés sur F008 :

1. **`src/app.css`** : 4 `@font-face` × (nouvelles familles) ; 4 blocs `:root[data-style='c|d|e|f']` ;
   3 blocs `:root[data-palette='ambre|rose|bleu']` ; overrides `.nav-item.is-active` (D, E) ;
   `--border-width` (E).
2. **`src/ui/stores/ui.ts`** : `type Style = 'a'|'b'|'c'|'d'|'e'|'f'` ; `type Palette = …|'ambre'|'rose'|'bleu'` ;
   listes `readChoice()` élargies (repli défaut conservé pour valeurs inconnues — Edge Case).
3. **`index.html`** : listes `allowed` du script anti-FOUC élargies (mêmes valeurs), défauts inchangés.
4. **`src/ui/components/ThemeControls.svelte`** : tableau `palettes` (6 entrées, +swatches ambre/rose/bleu) ;
   tableau `styles` (6 entrées) + rendre le sélecteur de style en `{#each}` (comme palette) au lieu de 2
   boutons en dur.

**Rationale** : respecte le **contrat de thème** F008 (les vues consomment des variables de rôle) ⇒ **aucune
vue ni store de logique** à modifier. C'est la traduction directe de « ajouter des valeurs aux axes ».

---

## Synthèse des nouvelles polices à vendoriser (récap.)

`fraunces.woff2` · `inter.woff2` · `ibm-plex-mono-400.woff2` · `ibm-plex-mono-600.woff2` · `archivo.woff2` ·
`nunito.woff2` — **6 fichiers** (sous-ensemble latin, OFL), précachés via le `globPatterns` woff2 déjà
configuré. `LICENSE.md` de `public/fonts/` complété (familles + OFL, sans PII — Principe X).
