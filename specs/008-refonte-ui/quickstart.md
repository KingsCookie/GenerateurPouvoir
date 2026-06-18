# Quickstart — Validation manuelle Feature 008 (Refonte UI)

Prérequis : `npm run dev`. Objectif : valider la **refonte visuelle** (fidélité maquette) **et** la
**non-régression fonctionnelle** (`rsrc/DefUi.md`). Cocher chaque attendu. Garder `design_handoff_refonte_ui/
maquette.html` ouverte comme référence.

## US1 — Thématisation (3 axes)

1. **Première visite** (vider `localStorage`) puis recharger.
   - [ ] L'app s'affiche en **sombre / violet / style A**.
2. **Toggle de thème** (en-tête).
   - [ ] Bascule **clair ⇄ sombre** instantanément (< 1 s), **sans rechargement**.
3. **Paramètres → « Paramètres graphiques »** : changer palette (violet/cyan/vert) et style (A/B).
   - [ ] Toute l'UI se met à jour en direct (accent, rayons, typo).
4. **Recharger** après avoir choisi (ex. clair / cyan / B).
   - [ ] Les **3 choix** sont restaurés.
5. Parcourir les **12 combinaisons** (2×3×2) sur chaque vue.
   - [ ] Texte, badges, tableaux, **arbre SVG**, **courbe gaussienne**, sélections et erreurs restent
         **lisibles/contrastés**.

## US2 — Refonte hi-fi & chrome global

1. **En-tête** : logo + titre + nav (Paramètres/Population/Sandbox) + toggle.
   - [ ] Sticky ; nav actif distinct ; Population/Sandbox **désactivés** sans population.
2. **Barre import/export** présente et fonctionnelle (3 exports + import auto-détecté).
   - [ ] OK (cf. non-régression §4.2 DefUi).
3. **Pied de page de version** présent sur **toutes** les vues.
   - [ ] Affiche nom + version (+ « hors-ligne »).
4. **Bouton remonter-en-haut** : défiler > ~300 px.
   - [ ] Apparaît ; clic ⇒ retour en haut ; **sans animation** si `prefers-reduced-motion`.
5. **Comparaison maquette** pour chaque vue (Paramètres, Population, Fiche, Arbre, Sandbox).
   - [ ] Rendu fidèle (couleurs, espacements, typographies, chips, cartes).
6. **Fiche** enrichie.
   - [ ] **Liste des enfants** affichée (chips/boutons cliquables → leur fiche).
   - [ ] Chaque trait affiche son **type**.

## US3 — Pagination & organisation

1. Générer une grande population (ex. 1000+), ouvrir **Population**.
   - [ ] Pagination présente : tailles **50/100/250/1000/Tous** (**défaut 50**), « début–fin / total »,
         flèches **bornées**.
2. Changer la taille de page.
   - [ ] Retour à la **page 1**.
3. **Sandbox** : basculer **Population** ⇄ **Couples & cycle de vie conjugal**.
   - [ ] Chaque onglet conserve ses contrôles ; barre d'actions + **lentille** communes.
4. **Lentille temporelle** : modifier l'année via le **champ** puis via le **curseur**.
   - [ ] Les deux restent **synchronisés** sur la même année (bornée).
5. **Mode reproduction** : sélectionner des parents, puis appliquer un **filtre**/changer de **page** qui
   les masque.
   - [ ] Les parents masqués **restent sélectionnés** ; « Valider » les inclut.

## Non-régression fonctionnelle (DefUi.md)

> Dérouler intégralement `rsrc/DefUi.md` — **0 perte**.

1. Navigation, temps, import/export, filtres (+ défaut dernière génération), modes de traits.
   - [ ] Tous opérants.
2. Paramètres : toutes les sections éditent bien (génération, hérédité, population, espèces + **courbe**,
   catalogues, pondérations, résilience) ; **Générer** fonctionne.
   - [ ] OK.
3. Fiche : cycle de vie (conjoints, % repro couple, **tuer** avec cause obligatoire), traits/pouvoirs par
   mode.
   - [ ] OK.
4. Arbre : zoom (molette/pincement), pan, clic (recentrer/ouvrir), profondeur, légende.
   - [ ] OK.
5. Sandbox : make it real / reset / quitter ; repro manuelle (mode/valider/annuler/re-sélection) ; créer/
   cloner/**éditer (formulaire complet ADN/pouvoirs/raisonDeces)**/supprimer ; couples (former/divorcer/
   dissoudre) ; navigation temporelle.
   - [ ] OK.

## Hors-ligne, polices & qualité

1. Build + `preview`, puis **couper le réseau** et recharger (PWA installée).
   - [ ] L'app se charge **hors-ligne**, **polices comprises** (auto-hébergées / précachées).
2. Forcer l'absence d'une police.
   - [ ] Repli sur police système, **sans casse**.
3. **Portes de qualité** : `npm run test` (cœur **inchangé** ⇒ vert), `npm run lint`, `npm run build` verts.
   - [ ] OK ; bundle statique déployable (Principe II).
4. Accessibilité : navigation **clavier** complète ; contraste correct dans les **2 modes**.
   - [ ] OK.
