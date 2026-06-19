# Feature Specification: 4 nouveaux styles + 3 nouvelles palettes de couleurs

**Feature Branch**: `009-ajout-4-styles`

**Created**: 2026-06-19

**Status**: Draft

**Input**: User description: « on va créer 4 nouveaux styles et 3 nouvelles palettes de couleurs. tu es
libre sur ce que tu mets en style et palettes. »

> **Contexte** : la Feature 008 a posé un **système de thème à 3 axes** sur `<html>` — `data-mode`
> (sombre/clair), `data-palette` (violet/cyan/vert) et `data-style` (A « Atelier » / B « Signal ») —
> mémorisé en `localStorage`, dérivés via `color-mix()`. Cette feature **étend** deux de ces axes :
> +4 styles et +3 palettes. **Aucune** nouvelle mécanique n'est introduite : on **ajoute des valeurs**
> aux axes existants. Refonte **purement visuelle** ; le contrat fonctionnel `rsrc/DefUi.md` reste intact.

## Proposition de design (l'auteur a laissé le choix libre)

### 4 nouveaux styles (axe `data-style`, en plus de A — Atelier et B — Signal)

Chaque style est une **identité visuelle complète** : ressenti typographique (familles titre + corps/mono),
géométrie (rayons, forme du logo, des chips), casse des libellés et des boutons, densité.

- **C — Éditorial** : élégance « magazine ». Titres à **empattements** (serif) raffinés, corps sans-serif
  très lisible ; rayons **moyens** et généreux ; libellés en petites capitales ; boutons sans transformation.
- **D — Terminal** : esthétique **console/technique**. **Tout en monospace**, angles **vifs** (rayons ~0),
  libellés et boutons en **MAJUSCULES**, accents nets, logo carré.
- **E — Néo-brutaliste** : contrastes **francs**. Grotesque **grasse**, coins **droits**, **bordures
  épaisses**, libellés majuscules, boutons en aplats marqués, ombres dures.
- **F — Organique** : **rondeur** et calme. Typo humaniste arrondie, **très grands rayons** (formes
  « pilule »), logo circulaire, libellés en minuscules, transitions douces.

### 3 nouvelles palettes (axe `data-palette`, en plus de violet, cyan, vert)

Chaque palette définit une **couleur d'accent** et ses dérivés (texte d'accent, chip, teinte, ombre),
calculés comme les palettes existantes ; complète la roue chromatique.

- **ambre** : orangé **chaud** / doré.
- **rose** : **magenta** vif.
- **bleu** : **azur** franc.

Combinatoire totale après cette feature : **6 styles × 6 palettes × 2 modes = 72 combinaisons**.

## Clarifications

### Session 2026-06-19

- Q: Stratégie de polices pour les 4 nouveaux styles (impact poids hors-ligne) ? → A: **Une nouvelle
  police (couple titre/corps + mono au besoin) par style**, **auto-hébergée** et **précachée** comme en
  Feature 008 — distinctivité typographique maximale ; surcoût de précache assumé (sous-ensemble latin,
  woff2 optimisés). Repli système conservé.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choisir parmi les nouveaux styles et palettes (Priority: P1)

En tant qu'utilisateur, je veux disposer de **plus de styles graphiques (6 au total)** et de **plus de
palettes d'accent (6 au total)**, sélectionnables et mémorisés exactement comme les choix existants, afin
de personnaliser davantage l'apparence de l'application.

**Why this priority**: C'est la demande explicite. C'est aussi le **cœur livrable** : sans les nouvelles
valeurs sélectionnables et appliquées, la feature n'apporte rien.

**Independent Test**: Dans « Paramètres → Paramètres graphiques », les sélecteurs proposent **6 styles** et
**6 palettes** ; choisir un **nouveau** style (ex. « D — Terminal ») et une **nouvelle** palette (ex.
« ambre ») met à jour toute l'interface **immédiatement** (< 1 s, sans rechargement) ; après
**rechargement**, ces choix sont **restaurés**.

**Acceptance Scenarios**:

1. **Given** la section « Paramètres graphiques », **When** j'ouvre le sélecteur de style, **Then** il
   propose **6 options** (A, B + les 4 nouveaux) ; idem **6 palettes** pour le sélecteur de couleur.
2. **Given** un nouveau style sélectionné, **When** je parcours les 5 vues, **Then** toute l'UI adopte sa
   typographie, ses rayons et sa casse, de façon cohérente.
3. **Given** une nouvelle palette sélectionnée, **When** je l'applique, **Then** l'accent et tous ses
   dérivés (texte d'accent, chips, sélections, courbe, arbre) changent en direct.
4. **Given** un nouveau style **et** une nouvelle palette choisis, **When** je recharge la page, **Then**
   les **3 axes** sont restaurés (le mode aussi).
5. **Given** une première visite sans préférence, **When** l'app se charge, **Then** les **défauts**
   restent **sombre / violet / A** (inchangés).

---

### User Story 2 - Lisibilité et non-régression sur toutes les combinaisons (Priority: P2)

En tant qu'utilisateur, je veux que **toutes** les combinaisons (anciennes et nouvelles) restent
**lisibles et contrastées**, sans rien casser de l'existant.

**Why this priority**: L'ajout de valeurs ne vaut que si chaque combinaison est utilisable ; et la
non-régression (DefUi + styles/palettes existants) est une contrainte absolue.

**Independent Test**: Parcourir un **échantillon représentatif** des **72 combinaisons** (au moins chaque
nouveau style avec chaque palette, dans les 2 modes) sur les 5 vues : texte, badges, tableaux, **arbre
SVG**, **courbe gaussienne**, **état actif/sélectionné**, erreurs restent lisibles. Dérouler `DefUi.md` :
0 perte.

**Acceptance Scenarios**:

1. **Given** n'importe laquelle des 72 combinaisons, **When** j'affiche une vue, **Then** le texte courant
   présente un **contraste suffisant** (cible AA) et aucun élément n'est illisible.
2. **Given** un **nouveau style**, **When** un élément est **sélectionné/actif** (nav, segments, onglets,
   pagination, chips de filtre, lignes), **Then** il est **nettement distinct** de l'inactif (non-régression
   BUG-001) — pas seulement en aplat.
3. **Given** les styles/palettes **existants** (A, B, violet, cyan, vert), **When** je les utilise, **Then**
   leur rendu est **inchangé**.
4. **Given** l'app installée hors-ligne, **When** un **nouveau style** requiert une police, **Then** elle
   est disponible **hors-ligne** (auto-hébergée/précachée) ou retombe **proprement** sur une police système.

---

### Edge Cases

- **Valeur de préférence inconnue/obsolète** en `localStorage` (ex. ancien export, valeur retirée) ⇒ repli
  sur le **défaut** de l'axe concerné (sombre / violet / A), sans casse.
- **Police d'un nouveau style indisponible** (pas encore chargée / fichier manquant) ⇒ repli **système**
  (`system-ui` / `serif` / `monospace` selon le rôle), sans perte de fonctionnalité.
- **Combinaisons sensibles** : styles à coins droits/bordures épaisses (D, E) et palettes claires (ambre,
  vert) ⇒ vérifier le contraste du **texte sur accent** et des **liens/sélections**.
- **Mouvement réduit** (`prefers-reduced-motion`) : les transitions des styles « doux » (F) restent
  désactivées.
- **Petits écrans** : les grands rayons (F) et bordures épaisses (E) ne doivent pas rogner le contenu ni
  réduire les cibles tactiles (≥ ~44 px).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: L'axe **style** DOIT proposer **6 valeurs** : les 2 existantes (A — Atelier, B — Signal) **+
  4 nouvelles** (C — Éditorial, D — Terminal, E — Néo-brutaliste, F — Organique), chacune avec une
  **identité visuelle distincte** (familles typographiques, rayons, forme de logo/chips, casse des libellés
  et boutons).
- **FR-002**: L'axe **palette** DOIT proposer **6 valeurs** : les 3 existantes (violet, cyan, vert) **+ 3
  nouvelles** (ambre, rose, bleu), chacune définissant une **couleur d'accent** et ses **dérivés** (texte
  d'accent, chip, bordure de chip, teinte de fond, ombre) cohérents dans les **2 modes**.
- **FR-003**: Les nouvelles valeurs DOIVENT être **sélectionnables** via les **mêmes contrôles** que les
  existantes (section « Paramètres graphiques » + tout contrôle d'apparence), sans parcours distinct.
- **FR-004**: Les **3 axes** DOIVENT rester **indépendants** et combinables ; les **défauts** DOIVENT
  rester **sombre / violet / A** en l'absence de préférence.
- **FR-005**: Les choix (style, palette, mode) DOIVENT être **mémorisés** localement et **restaurés** au
  rechargement ; ils NE DOIVENT PAS entrer dans l'export/import de l'état applicatif.
- **FR-006**: Dans **chaque** style, l'**état actif/sélectionné** DOIT rester **nettement distinct** de
  l'inactif (non-régression BUG-001) sur tous les sélecteurs (navigation, segments, onglets, pagination,
  chips de filtre, lignes sélectionnées).
- **FR-007**: **Chaque** nouveau style DOIT introduire **son propre couple de polices** (titre/corps, +
  mono si pertinent), **auto-hébergé** (fichiers locaux `woff2`, sous-ensemble latin) et **précaché** pour
  fonctionner **hors-ligne**, avec **repli système** par rôle (`serif`/`sans`/`monospace`) ; **aucun appel
  tiers** (clarification 2026-06-19).
- **FR-008**: La feature NE DOIT entraîner **aucune régression** : styles/palettes existants (A, B, violet,
  cyan, vert) et **100 %** des fonctionnalités de `rsrc/DefUi.md` restent identiques et opérants.
- **FR-009**: Les contraintes du projet DOIVENT être préservées : **100 % statique / hors-ligne**,
  **déterminisme** (aucun aléatoire/horloge introduit dans la logique), **persistance applicative par
  fichier uniquement**, **français**, **anonymat**, **accessibilité** (clavier, ARIA, contraste 2 modes) et
  **responsive/tactile**.
- **FR-010**: La feature reste **purement présentationnelle** : le **cœur** (`src/core`) et les **stores de
  logique** NE DOIVENT PAS changer de logique ; seuls l'**état/les valeurs d'interface** (apparence)
  évoluent.

### Key Entities *(include if feature involves data)*

> États d'**interface** uniquement (préférences d'apparence locales — non exportées).

- **Style** (axe `data-style`) : énumération portée de **2 à 6** valeurs — `a`, `b`, **`c`, `d`, `e`,
  `f`** ; chacune mappe une identité visuelle (typo, rayons, casse, logo/chips).
- **Palette** (axe `data-palette`) : énumération portée de **3 à 6** valeurs — `violet`, `cyan`, `vert`,
  **`ambre`, `rose`, `bleu`** ; chacune mappe une couleur d'accent + dérivés.
- **Préférences d'apparence** : (`mode`, `palette`, `style`) mémorisées localement, appliquées en attributs
  sur `<html>` (inchangé depuis Feature 008).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les **72 combinaisons** (6 styles × 6 palettes × 2 modes) sont **sélectionnables** et
  appliquées en **moins d'1 seconde**, **sans rechargement**.
- **SC-002**: **100 %** des 72 combinaisons présentent un **contraste suffisant** (cible AA pour le texte
  courant) et restent lisibles sur les 5 vues, y compris **arbre SVG**, **courbe**, **état sélectionné** et
  messages d'erreur.
- **SC-003**: À la première visite (aucune préférence), l'app s'affiche en **sombre / violet / A** dans
  **100 %** des cas (inchangé).
- **SC-004**: Les **3 préférences** sont **restaurées** après rechargement dans **100 %** des cas où
  `localStorage` est disponible.
- **SC-005**: **0 régression** : les styles/palettes existants et l'ensemble de `rsrc/DefUi.md` restent
  identiques et opérants.
- **SC-006**: L'application reste **pleinement utilisable hors-ligne, polices comprises** ; un **repli
  système** garantit **zéro casse** si une police d'un nouveau style venait à manquer.

## Assumptions

- **Liberté de design** assumée par l'auteur : les **noms et caractéristiques** des 4 styles (C — Éditorial,
  D — Terminal, E — Néo-brutaliste, F — Organique) et des 3 palettes (ambre, rose, bleu) sont proposés ici ;
  ils restent ajustables en `/clarify` ou `/plan`.
- **Valeurs exactes** (codes couleur d'accent, familles de polices précises, rayons en px, casses)
  relèvent du **plan** (présentation) ; la spec fixe le **WHAT** (axes étendus, identités distinctes,
  lisibilité).
- **Polices** (tranché 2026-06-19) : **chaque** nouveau style introduit **son propre couple de polices**
  (ex. serif pour C, mono pour D, grotesque grasse pour E, humaniste arrondie pour F), **auto-hébergées**
  (woff2 locaux, sous-ensemble latin, licences libres type OFL) et **précachées** comme en Feature 008.
  Le **surcoût de précache** est assumé ; on privilégie des woff2 légers (sous-ensemble latin) et le
  **repli système** par rôle reste garanti.
- **Mécanique inchangée** : on **ajoute des valeurs** aux axes `data-style`/`data-palette` et aux
  sélecteurs ; aucun nouvel axe, aucune nouvelle dépendance, cœur `src/core` intouché.
- **Défauts inchangés** (sombre / violet / A) pour ne pas surprendre les utilisateurs existants.
