# Quickstart / Validation — Feature 009 (4 styles + 3 palettes)

Check-list de recette **manuelle** (présentation) + portes automatiques. Cible : prouver les 6 critères de
succès (SC-001…006) et la non-régression. `npm run dev` pour l'exploration, `npm run build` + `npm run test`
+ `npm run lint` comme portes de qualité.

## 0. Portes automatiques (avant recette visuelle)

- [ ] `npm run test` — **tous** les tests du cœur verts (Principe V) ; aucun changement de logique attendu.
- [ ] `npm run build` — tsc + vite OK ; précache PWA inclut les **nouvelles woff2**.
- [ ] `npm run lint` — propre.
- [ ] (Optionnel) test d'interface pur : les listes autorisées contiennent bien 6 styles / 6 palettes et
      replient les valeurs inconnues sur `a` / `violet`.

## 1. US1 — Sélection des nouvelles valeurs (P1)

Dans **Paramètres → Paramètres graphiques** :

- [ ] Le sélecteur **Style** propose **6 options** : A — Atelier, B — Signal, C — Éditorial, D — Terminal,
      E — Néo-brutaliste, F — Organique.
- [ ] Le sélecteur **Thème de couleur** propose **6 palettes** : Violet, Cyan, Vert, Ambre, Rose, Bleu
      (chacune avec sa pastille).
- [ ] Choisir **D — Terminal** : toute l'UI passe en monospace, coins vifs, libellés/boutons MAJUSCULES
      — **< 1 s, sans rechargement** (SC-001).
- [ ] Choisir **ambre** : accent + chips + sélections + courbe + arbre changent **en direct** (SC-001).
- [ ] Parcourir les **5 vues** (Paramètres, Liste, Fiche, Arbre, Sandbox) avec un nouveau style : typo,
      rayons, casse **cohérents** partout.
- [ ] **Recharger** la page : style **et** palette **et** mode restaurés (SC-004).
- [ ] Vider `localStorage` puis recharger : retour à **sombre / violet / A** (SC-003).

## 2. US2 — Lisibilité & non-régression (P2)

### 2.1 Contraste / lisibilité (SC-002) — échantillon représentatif des 72 combinaisons

Pour **chaque nouveau style** (C, D, E, F) × **chaque palette** (les 6) × **2 modes**, vérifier sur au moins
Liste + Fiche + Arbre + (Sandbox courbe) :

- [ ] Texte courant **lisible**, contraste cible **AA**.
- [ ] **Arbre SVG** : nœuds, liens, racine, défunts (pointillés) lisibles.
- [ ] **Courbe gaussienne** (Paramètres/espèces) lisible.
- [ ] **État sélectionné/actif** nettement distinct (voir 2.2).
- [ ] Messages d'**erreur** (`.error-msg`) lisibles.

Points sensibles (Edge Cases) à scruter :
- [ ] **ambre** + **mode clair** (texte d'accent / liens sur fond clair).
- [ ] **bleu** (azur) en **sélection** et **liens**.
- [ ] **D/E** (coins droits, bordures épaisses) : pas de rognage du contenu.

### 2.2 État actif distinct par style (FR-006 / BUG-001)

Pour A, B, **C, D, E, F**, vérifier que l'élément actif/sélectionné est **clairement** différent de
l'inactif sur : nav d'en-tête, segments (ThemeControls, traits), onglets Sandbox, pagination, chips de
filtre, ligne sélectionnée :

- [ ] **C, F** : chip doux (fond teinté + bordure accent + texte accent gras) — visible.
- [ ] **B, D, E** : aplat d'accent plein (texte `--accent-fg`) — visible.

### 2.3 Non-régression de l'existant (SC-005)

- [ ] Styles **A** et **B** : rendu **inchangé** vs avant la feature.
- [ ] Palettes **violet / cyan / vert** : rendu **inchangé**.
- [ ] Dérouler le **mapping `rsrc/DefUi.md`** (cf. contrat F008 §4) : **0 perte** de fonctionnalité.

### 2.4 Hors-ligne & polices (SC-006)

- [ ] Build + `npm run preview`, charger une fois, **couper le réseau**, recharger : app utilisable.
- [ ] Sélectionner un nouveau style : sa police s'affiche **hors-ligne** (précache).
- [ ] Simuler une police manquante (renommer un woff2) : **repli système** propre par rôle
      (`serif`/`sans`/`monospace`), **aucune** casse fonctionnelle.

## 3. Accessibilité & responsive

- [ ] Navigation **clavier** des nouveaux sélecteurs ; `:focus-visible` visible dans les 2 modes.
- [ ] `prefers-reduced-motion` : transitions douces (F) désactivées.
- [ ] Petits écrans (≤ 640px) : grands rayons (F) et bordures épaisses (E) ne rognent pas ; cibles
      tactiles ≥ ~44 px.

## 4. Constitution / anonymat

- [ ] `public/fonts/LICENSE.md` complété (familles + OFL) **sans PII**.
- [ ] Aucun appel réseau tiers (polices toutes locales).
- [ ] Aucune modification de `src/core`, `AppState`, export/import.
