# Quickstart — Validation manuelle Feature 006 (Persistance & partage)

Prérequis : `npm run dev`. Les scénarios couvrent US1 (config), US2 (data) et US3 (full +
détection + versionnage). Cocher chaque attendu.

## US1 — Configuration seule

1. Dans **Paramètres**, modifier quelques réglages (seed, un poids de type, un seuil) et éditer un
   catalogue (ajouter/renommer un trait, ajouter une espèce).
2. Cliquer **Exporter la configuration**.
   - [ ] Un fichier `royalcookie-config-<horodatage>.json` est téléchargé.
   - [ ] Son contenu commence par `"kind": "config"` et contient `parameters`, `catalog`, `especes`,
         **sans** `population`.
3. Recharger l'application (état par défaut). **Importer** le fichier de config.
   - [ ] Tous les réglages et catalogues sont restaurés à l'identique.
   - [ ] Aucune population n'a été créée.
4. **Générer** une population, puis réimporter le **même** fichier de config.
   - [ ] Les réglages sont réappliqués **mais la population reste inchangée** (même nombre, mêmes ids).

## US2 — Données seules

1. Générer une population, **avancer** de quelques années (couples/naissances).
2. Cliquer **Exporter les données**.
   - [ ] Un fichier `royalcookie-data-<horodatage>.json` est téléchargé.
   - [ ] Son contenu commence par `"kind": "data"` et contient `population`, `couples`,
         `currentYear`, `rngState`, **sans** `parameters`/`catalog`.
3. Recharger l'application, **régler une config différente**, puis **importer** le fichier de données.
   - [ ] La population, la généalogie et les couples sont restaurés.
   - [ ] La **configuration courante est conservée** (pas écrasée par l'import data).
4. Noter l'état, **avancer** d'une année ; recharger, réimporter le même `data`, **avancer** d'une
   année à nouveau.
   - [ ] Les naissances/identités produites sont **identiques** aux deux essais (reprise au tirage
         près — déterminisme).

## US3 — Complet, détection & versionnage

1. Cliquer **Exporter tout (complet)**.
   - [ ] Fichier `royalcookie-full-<horodatage>.json`, `"kind": "full"`, config + data.
2. Recharger, **importer** ce fichier via le **bouton d'import unique**.
   - [ ] Détecté comme `full` ; config **et** données restaurées (état identique à l'export).
3. Importer successivement, via **le même bouton**, un `config`, un `data` puis un `full`.
   - [ ] Chaque type est **détecté automatiquement** et appliqué correctement.
4. Éditer un fichier exporté pour mettre `"formatVersion"` à une valeur **supérieure**, puis
   l'importer.
   - [ ] Import **refusé**, message clair (« version non prise en charge »), **état courant intact**.
5. Importer un fichier **non-JSON** (ou un JSON sans `kind`).
   - [ ] Import **refusé**, message clair, **état courant intact**.
6. Importer un ancien fichier `full` (ex. export d'une version antérieure, sans `resilienceOverrides`).
   - [ ] Import **réussi** (champs manquants défautés), aucune erreur.

## Déterminisme & partage (transverse)

1. Exporter un `full`, l'importer sur un **autre navigateur/appareil**.
   - [ ] L'état reproduit est **identique** ; une avancée du temps y donne les mêmes résultats.
2. Exporter deux fois le **même** état non modifié.
   - [ ] Les deux fichiers sont **octet pour octet identiques** (sérialisation canonique).
