# Quickstart — Généalogie & exploration (Feature 4)

Smoke test manuel (et repère pour les tests à seed fixe). Prérequis : Features 1–3 livrées.

## Mise en place

1. `npm run dev`, **générer une population** (quelques dizaines d'individus, `% pouvoir` élevé pour
   voir des pouvoirs).
2. **Avancer le temps** de plusieurs décennies (≥ 40 ans) pour créer des liens parents/enfants,
   des couples et plusieurs **générations** (tranches de 20 ans).

## Arbre généalogique (US1)

3. Ouvrir une **fiche** d'individu ayant parents, enfants et au moins un conjoint :
   - L'arbre est centré sur lui, **profondeur fixe 2** (2 niveaux d'ancêtres, 2 de descendants) ;
   - chaque case affiche **nom + pouvoir(s)** (pas d'âge) ;
   - le **conjoint actuel et les ex** apparaissent, avec les **enfants issus de ces unions**
     uniquement (pas les enfants des conjoints avec des tiers, pas les parents des conjoints).
4. Cliquer **« Explorer l'arbre »** → **page dédiée** :
   - même arbre, **sans informations latérales** ;
   - chaque case affiche **nom + âge + pouvoir(s)** ;
   - régler la **profondeur N** (≥ 1, sans plafond) ⇒ plus/moins de niveaux ;
   - cliquer une case **recentre** l'arbre.
5. Sur un cas de **consanguinité** (ancêtre commun), vérifier qu'un même individu **apparaît à
   chaque emplacement** (répétition attendue) et que l'arbre **reste fini**.

## Recherche & filtres (US2)

6. Revenir sur la **Liste** : par défaut, seule la **dernière génération** est affichée.
7. **Avancer le temps** encore (nouvelle génération) sans toucher aux filtres ⇒ la Liste se
   **recale** sur la nouvelle dernière génération.
8. Appliquer des filtres :
   - **génération** (autre tranche), **espèce**, **statut** (décédé) ;
   - **trait** avec **portée** actifs / inactifs / tous ;
   - **pouvoir** : « a un pouvoir » puis « aucun pouvoir » ;
   - plusieurs valeurs dans une dimension ⇒ **OU** ; plusieurs dimensions ⇒ **ET**.
9. Naviguer vers une fiche puis **revenir** sur la Liste ⇒ les filtres sont **conservés** (et le
   défaut « dernière génération » ne se réimpose plus tant qu'on n'a pas **réinitialisé**).
10. **Réinitialiser** ⇒ toute la population réapparaît et le défaut « dernière génération » reprend.

## Modes d'affichage des traits (US3)

11. Sur une fiche, le mode par **défaut** est **Mode 3** (pouvoirs + traits actifs + inactifs +
    résilience). Basculer :
    - **Mode 1** ⇒ pouvoirs seuls ;
    - **Mode 2** ⇒ pouvoirs + traits actifs ;
    - **Mode 3** ⇒ tout + résilience.

## Vérifications transverses

- **Lecture seule** : aucune de ces actions ne modifie la population, l'ADN, les pouvoirs ni la
  seed/RNG (un export avant/après est identique).
- **Déterminisme** : à seed et scénario identiques, arbre et résultats de filtres sont **identiques**
  (ordre par date puis id).
- **Portes** : `npm run test` (cœur `genealogy/` à seed fixe) + `npm run build` verts ;
  `core-purity.test.ts` couvre `src/core/genealogy/`.
