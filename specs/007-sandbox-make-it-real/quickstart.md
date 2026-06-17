# Quickstart — Validation manuelle Feature 007 (Sandbox & « make it real »)

Prérequis : `npm run dev`. Couvre US1 (sandbox + repro manuelle + make it real), US2 (création/clonage/
édition/suppression), US3 (navigation temporelle). Cocher chaque attendu.

## Préalable — retrait page principale

1. Générer une population, aller à la **liste principale**.
   - [ ] **Aucun** contrôle de reproduction manuelle n'est présent (plus de sélection multiple / bouton
         « reproduire »). Seul **« avancer de X années »** fait évoluer la population.

## US1 — Sandbox isolé, reproduction manuelle, make it real

1. Ouvrir la **sandbox**.
   - [ ] Elle affiche une **copie** de la population/généalogie/couples/année réelles.
2. Cliquer le bouton **mode reproduction manuelle** ; cliquer 2 individus (ils se **sélectionnent**),
   choisir un **nombre d'enfants** (ex. 2), cliquer **« valider »**.
   - [ ] 2 enfants apparaissent **dans la sandbox**, rattachés aux 2 parents.
   - [ ] On **sort** du mode et la **sélection est vidée**.
   - [ ] La **population principale est inchangée**.
3. Re-entrer en mode repro, cliquer le bouton **« re-sélectionner les derniers parents »**.
   - [ ] Les 2 parents de l'étape 2 sont re-sélectionnés (ceux supprimés entre-temps seraient ignorés).
4. Cliquer **« annuler »**.
   - [ ] La sélection est vidée, on sort du mode, **aucun** enfant créé.
5. Cliquer **« make it real »**.
   - [ ] La population réelle reflète désormais l'état de la sandbox (les 2 enfants y sont).
6. Ré-ouvrir la sandbox, faire une modif, cliquer **« reset »**.
   - [ ] La sandbox est restaurée à l'**état réel courant** (la modif est abandonnée).

## US2 — Création, clonage, édition, suppression

1. Dans la sandbox, **créer** un nouvel individu (espèce, genre, ADN, pouvoirs, notes).
   - [ ] Il apparaît, **autonome** (aucun parent/enfant/conjoint).
2. **Cloner** un individu existant ; éditer la copie.
   - [ ] La copie reprend les attributs **sans** liens de parenté (autonome) ; l'original est intact.
3. **Éditer directement** les attributs d'un individu (réel copié ou temporaire).
   - [ ] Les modifications s'appliquent **dans la sandbox** ; les liens de parenté ne sont pas éditables.
4. **Supprimer** un individu **sans descendant**.
   - [ ] Il disparaît **de partout** ; son conjoint éventuel **redevient célibataire/divorcé** ; ses
         parents ne le listent plus dans leurs enfants.
5. Tenter de **supprimer** un individu **avec au moins un enfant**.
   - [ ] **Refusé** avec un message clair.
6. Cliquer **« make it real »**.
   - [ ] Les créations/éditions/suppressions sont reflétées dans la population réelle.

## US3 — Navigation temporelle (reconstruction historique)

1. Dans la sandbox, choisir une **année antérieure** à l'année courante.
   - [ ] Seuls les individus **déjà nés** à cette année sont affichés.
   - [ ] Les **couples/divorces/décès** correspondent à l'état **de cette année** (un individu mort plus
         tard apparaît **vivant** ; un couple formé plus tard n'apparaît **pas**).
2. En année antérieure sélectionnée, faire une **reproduction manuelle**.
   - [ ] Les enfants **naissent dans l'année sélectionnée** (date = jour aléatoire de l'année).
3. Choisir l'**année de départ**.
   - [ ] Seul le batch initial (et antérieurs) est visible.
4. Choisir l'**année courante**.
   - [ ] La population courante complète s'affiche.

## Déterminisme & isolation (transverse)

1. Refaire exactement les mêmes actions sandbox à seed fixe.
   - [ ] Résultats **identiques** (déterminisme).
2. Pendant toute manipulation sandbox **avant** « make it real ».
   - [ ] La population réelle n'a **jamais** changé (isolation).
3. Exporter un `full` après « make it real ».
   - [ ] Le fichier inclut l'**historique** (journal d'événements) ; un import le restaure (rétro-compat :
         un ancien fichier sans historique s'importe avec un journal vide).
