# Quickstart — validation manuelle 011-corrections-bugs-ui

Prérequis : `npm run dev`. Portes automatiques : `npm run test`, `npm run build`, `npm run lint`.

## US1 — Consanguinité lignée directe
1. Genèse d'une petite population, consanguinité **interdite** (défaut).
2. Avancer plusieurs générations.
3. Vérifier qu'aucun couple ne réunit un individu et son parent ou grand-parent.
4. Repasser consanguinité **autorisée** → les appariements lignée directe redeviennent possibles.

## US2 — Date de portée
1. Faire reproduire un couple produisant ≥ 2 enfants (portée).
2. Ouvrir les fiches des enfants → **même date de naissance** pour toute la portée.
3. Une autre portée (autre couple/année) a sa propre date.

## US3 — Génération 0
1. Genèse avec année de départ **1900**.
2. Liste/fiche : la population initiale est en **génération 0**.
3. Avancer 20+ ans → nouveaux individus en génération 1, etc.
4. Filtrer « génération 0 » → sélectionne la population initiale.
5. Exporter (`data`/`full`), ré-importer → générations identiques.
6. Importer un **ancien** fichier (v3) → générations cohérentes (fallback naissance la plus ancienne).

## US4 — Étiquettes P/M
1. Afficher une liste (Population et Sandbox) avec des pouvoirs.
2. Les étiquettes lisent « P 12 » / « M 3 » (sans « : »).

## US5 — Filtres de trait à la ligne
1. Ouvrir la barre de filtres (Population et Sandbox).
2. La section des filtres de trait occupe **sa propre ligne**, à différentes largeurs d'écran.

## US6 — Nom de fichier exporté
1. Exporter config, data, full.
2. Les noms commencent par **`PowerGenerator_`** (underscores).
3. Ré-importer un ancien `royalcookie-…` → import OK.

## US7 — Aperçu de pouvoir temps réel (formulaire de création)
1. Sandbox → « Créer un individu ».
2. Activer/désactiver des traits, changer la résilience → l'**aperçu du pouvoir se met à jour
   immédiatement** (sans clic).
3. Retirer puis réactiver un trait pour revenir au même état → **aperçu identique** (déterministe).
4. Enregistrer → les pouvoirs et l'ADN correspondent à l'aperçu affiché.

## US8 — Formule de duplication `D`
1. Paramètres → `D` par défaut = **0.25**.
2. Mettre la résilience d'un trait secondaire élevée et régénérer/reproduire massivement → duplication
   plus fréquente qu'avant (≈ `min(100, résilience·0.25) %`).
3. `D = 0` → aucune duplication.

## US9 — Bouton « Régénérer »
1. Sandbox → sur une ligne d'individu, cliquer **« Régénérer »** (à côté d'Éditer/Cloner/Supprimer).
2. Les pouvoirs sont recalculés depuis les **traits actifs** (algorithme §6.4 : duplications + K).
3. Individu **avec parents** → P/M suivent §7.2 ; **sans parents** → P/M ∈ [1,10].
4. Cliquer plusieurs fois → résultats potentiellement différents (tir réel).
5. Individu **sans trait actif** → reste sans pouvoir, sans erreur.

## US10 — P/M non bornées (saisie)
1. Sandbox → éditer un individu.
2. Saisir une puissance **5000** et une maîtrise **−34** → acceptées telles quelles (pas de clamp).
3. Enregistrer, rouvrir la fiche → valeurs conservées ; affichées « P 5000 » / « M -34 ».
4. Un enfant de parents à puissance moyenne 10 peut afficher « P 11 » (cas §7.2 non borné).
