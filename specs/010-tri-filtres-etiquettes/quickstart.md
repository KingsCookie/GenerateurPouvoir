# Quickstart / Validation — Feature 010

Recette manuelle (UI) + portes automatiques. `npm run dev` pour explorer ; `npm run test` / `build` /
`lint` comme portes de qualité.

## 0. Portes automatiques

- [ ] `npm run test` — **cœur vert**, incluant les **nouveaux** tests :
      - présence de trait : `none-active` / `some-active` / `some-inactive` / `some-any` (ADN vide, tous
        actifs, tous inactifs, mixte) ;
      - `sortPopulation` : `nom`/`naissance`/`age` × `asc`/`desc`, `key=null` = ordre par défaut, stabilité
        du départage ;
      - `buildListRow` expose `puissance`/`maitrise` par pouvoir.
- [ ] `npm run build` — tsc + vite OK.
- [ ] `npm run lint` — propre.

## 1. US1 — Filtres de présence de trait (P1)

Dans **Population** puis **Sandbox** (onglet Population), section **Trait** :

- [ ] Quatre options visibles : « aucun trait actif », « au moins un trait actif », « au moins un trait
      inactif », « au moins un trait ».
- [ ] **Mono-sélection** : activer l'une désactive l'autre ; re-cliquer l'option active la désactive.
- [ ] « aucun trait actif » → uniquement les individus à 0 trait actif (inclut ADN vide et « tous inactifs »).
- [ ] « au moins un trait actif » → uniquement ≥1 trait actif.
- [ ] « au moins un trait inactif » → uniquement ≥1 trait inactif.
- [ ] « au moins un trait » → uniquement ≥1 trait (actif ou inactif).
- [ ] Combinaison avec un autre filtre (espèce/statut) → ET (sous-ensemble correct) ; le compteur
      « N / total » suit.
- [ ] Comportement **identique** en Population et Sandbox.

## 2. US2 — Tri par colonne (P2)

- [ ] Clic sur **Âge** : croissant (▲) ; re-clic : décroissant (▼) ; 3ᵉ clic : **retour au défaut**.
- [ ] **Nom** : alphabétique (casse/accents ignorés) → inverse → défaut.
- [ ] **Date de naissance** : chronologique → inverse → défaut.
- [ ] **Pouvoir(s)** : en-tête **non** cliquable (aucun tri).
- [ ] Le tri s'applique à **toute** la liste filtrée (vérifier au-delà de la 1ʳᵉ page).
- [ ] Le tri **survit** à un changement de filtre et à une avance du temps.
- [ ] Deux individus égaux sur la clé → ordre **stable** (reproductible).
- [ ] Population et Sandbox ont chacune **leur** état de tri (l'un n'affecte pas l'autre).
- [ ] Accessibilité : en-tête triable focusable + activable au clavier ; `aria-sort` correct.

## 3. US3 — Étiquettes de pouvoir enrichies (P3)

- [ ] Une étiquette de pouvoir affiche le libellé **+** « P : <puissance> » **+** « M : <maîtrise> ».
- [ ] Individu à plusieurs pouvoirs → chaque étiquette a ses propres P/M.
- [ ] Individu sans pouvoir → « — » (inchangé).
- [ ] Les valeurs coïncident avec la **fiche** détaillée du même individu.
- [ ] Visible en Population **et** en Sandbox ; mise en page des étiquettes non cassée (longues valeurs).

## 4. Réinitialiser (FR-018)

- [ ] Un filtre **et** un tri actifs, clic **« Réinitialiser »** → filtres remis au défaut **et** tri de la
      liste courante remis au défaut.
- [ ] Le tri de l'**autre** liste n'est pas affecté.

## 5. Non-régression (SC-005)

- [ ] Filtres existants (nom, génération, espèce, statut, pouvoir, traits+portée) inchangés.
- [ ] Recherche, pagination, clic vers la fiche : OK.
- [ ] Dérouler le mapping `rsrc/DefUi.md` : 0 perte.
- [ ] Export/import de l'état applicatif inchangé (filtre/tri non exportés).

## 6. Constitution

- [ ] Aucun `Math.random`/horloge introduit dans `src/core` (âge via `currentYear`).
- [ ] Logique filtre/tri dans le **cœur** (pure) ; l'UI ne fait que piloter/afficher.
- [ ] États filtre/tri = interface (session), hors export.
