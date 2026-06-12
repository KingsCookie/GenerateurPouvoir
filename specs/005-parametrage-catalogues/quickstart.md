# Quickstart — validation manuelle Feature 005 (Paramétrage & catalogues)

Prérequis : `npm run dev`. Tous les libellés en **français**. À seed fixe, les comportements sont
reproductibles (Principe I).

## US1 — Catalogues éditables

1. **Ajouter un trait** : Paramètres → Catalogues → type « Ajouts » → ajouter « Cristal ».
   → Il apparaît dans la liste ; une genèse/naissance ultérieure peut le tirer.
2. **Renommer** : renommer un trait existant → le nouveau libellé s'affiche partout où il est
   référencé (fiches, arbre, liste).
3. **Supprimer un trait utilisé** : générer une population, repérer un trait porté par un individu,
   puis le supprimer du catalogue.
   → Suppression acceptée ; l'individu **garde** ce trait (toujours affiché) ; il **n'est plus tiré**
   pour les naissances futures. **Aucune erreur**, aucune perte de données.
4. **Espèces** : Catalogues → Espèces → ajouter « elfe », lui définir des genres.
   → « elfe » devient sélectionnable ; elle porte ses propres paramètres de reproduction.
5. **Genre « tout »** : ouvrir les genres d'une espèce → « tout » est présent et **non supprimable**.
6. **Type vidé** : retirer tous les traits d'un type → aucune erreur ; les générations sautent ce
   type.

## US2 — Reproduction par espèce + courbe

1. **Courbe gaussienne** : Paramètres → Espèces → « humain » → modifier l'âge du pic et la pente.
   → La **courbe** se met à jour immédiatement (< 1 s).
2. **Portée** : régler M=2, N=5, X=20 % → les futures reproductions respectent ces bornes.
3. **Consanguinité** : basculer sur « interdite » → les appariements entre proches (mêmes parents ou
   grands-parents) sont empêchés lors des avancements de temps suivants.
4. **% par couple** : ouvrir la **fiche** d'un individu en couple → modifier le % de reproduction du
   couple → cette valeur prime sur la gaussienne pour ce couple ; la réinitialiser (vide) rétablit la
   valeur dérivée.
5. **Saisie incohérente** : entrer un âge de fin < âge de début → refus/correction avec explication.

## US3 — Pondérations & déclinaison de la résilience

1. **Poids de type** : mettre le poids du type « Éléments » à 0 → plus aucun trait « Élément » tiré
   (dans un contexte de tirage multi-types ; sinon facteur inerte, cf. research D8).
2. **Poids de gabarit** : augmenter « PE » → plus de pouvoirs de mutation forte en Partie+État.
3. **Poids individuel** : doubler le poids d'un trait → sur-représentation à seed fixe.
4. **Résilience par trait** : Paramètres → Résilience → définir une **résilience initiale par trait**
   différente du type et du global → une naissance créant ce trait utilise la valeur **par trait**.
5. **Héritage de niveau** : poser une surcharge **par type**, aucune par trait → un trait de ce type
   sans surcharge propre utilise la valeur **du type** ; supprimer la surcharge type → il réhérite du
   **global**.
6. **Seuil de disparition par type** : régler un seuil plus haut pour un type → les traits de ce type
   disparaissent plus tôt de l'ADN sur les naissances futures.

## Déterminisme (porte de qualité)

1. Noter la seed, régler des paramètres, **générer**.
2. Re-saisir la même seed et les mêmes réglages, **régénérer** → population **strictement
   identique** (SC-005).
3. `npm run test` (cœur à seed fixe) + `npm run lint` + `npm run build` → tout vert.

## Contrôles de constitution

- Aucune nouvelle dépendance (`package.json` inchangé) — Principe VIII.
- `core-purity.test.ts` couvre les nouveaux modules `params`/`catalog`/`species` (aucun
  `Math.random`/`Date`/DOM) — Principe IV.
- Pas d'auto-save ; réglages dans l'état de session (export = Feature 6) — Principe VI.
