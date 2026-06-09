<!--
SYNC IMPACT REPORT
==================
Version change: (template non initialisé) → 1.0.0
Type de bump: ratification initiale (MINOR-equivalent — première définition concrète)

Principes définis (9, depuis rsrc/PromptConstit.md + demande explicite de l'auteur pour IX):
  I.    Déterminisme par seed unique (NON NÉGOCIABLE)
  II.   Application 100 % statique et client-side (NON NÉGOCIABLE)
  III.  PWA multiplateforme et hors-ligne
  IV.   Cœur métier pur, isolé et testable (NON NÉGOCIABLE)
  V.    Tests déterministes du cœur
  VI.   Persistance explicite par fichiers (NON NÉGOCIABLE)
  VII.  Tout est paramétrable
  VIII. Simplicité et YAGNI
  IX.   Spécification fonctionnelle comme source de vérité (NON NÉGOCIABLE)

Sections ajoutées:
  - Contraintes techniques & déploiement (GitHub Pages)
  - Workflow de développement & portes de qualité
  - Gouvernance

Sections retirées: aucune (remplacement des placeholders du gabarit)

Cohérence des gabarits dépendants:
  ✅ .specify/templates/plan-template.md  — « Constitution Check » référence dynamiquement ce fichier ; aucun gate codé en dur à modifier.
  ✅ .specify/templates/spec-template.md  — générique, aucun conflit ; la spec fonctionnelle fait foi via rsrc/DescriptionProjet.md.
  ✅ .specify/templates/tasks-template.md — générique ; les tests du cœur deviennent obligatoires au titre du Principe V (le /speckit-tasks devra les inclure, pas « optionnels » pour le cœur).
  ✅ CLAUDE.md — guidance générique (pointe vers le plan courant) ; aucune référence de principe à mettre à jour.
  ⚠  README / docs/quickstart — absents ; à créer ultérieurement (cf. TODO).

TODO de suivi:
  - TODO(README): créer un README documentant build/déploiement GitHub Pages une fois la stack choisie (/speckit-plan).
-->

# Constitution — Générateur de Pouvoir

> Document de gouvernance du projet. Il pose les garde-fous non négociables que tout
> contributeur (humain ou agent) DOIT respecter durant la spécification, la planification,
> l'implémentation et la revue. Il **référence** la spécification fonctionnelle et ne la
> duplique pas. Langue du projet : **français**.

## Principes fondamentaux

### I. Déterminisme par seed unique (NON NÉGOCIABLE)

- Toute l'aléatoire du programme DOIT provenir d'**une seule** seed (entier 64 bits),
  via un **unique** générateur pseudo-aléatoire propagé explicitement aux fonctions qui en ont besoin.
- La logique métier NE DOIT PAS utiliser de source d'aléatoire non seedée :
  `Math.random()`, horloge système, identifiants aléatoires, ordre d'itération non déterministe, etc.
- À seed identique et séquence d'actions identique, le résultat DOIT être strictement reproductible.
- **Rationale** : reproductibilité des bugs et des scénarios, partage d'états vérifiables,
  exploitation directe par les tests (Principe V).

### II. Application 100 % statique et client-side (NON NÉGOCIABLE)

- L'application DOIT s'exécuter entièrement côté navigateur et se construire en un
  **bundle de fichiers statiques** déployable tel quel sur **GitHub Pages**.
- Le projet NE DOIT PAS dépendre d'un backend, d'un service serveur, d'une base de données
  distante ou d'un secret côté serveur pour fonctionner en V1.
- Toute technologie retenue DOIT produire une sortie statique (pas de rendu serveur requis à l'exécution).
- **Rationale** : hébergement GitHub Pages, coût nul, portabilité, simplicité opérationnelle.

### III. PWA multiplateforme et hors-ligne

- L'application DOIT être une PWA installable (manifeste + service worker) fonctionnant sur
  **Windows, macOS, Linux, iOS, Android**.
- Elle DOIT rester utilisable **hors-ligne** après le premier chargement et proposer un design
  **responsive** (du mobile au desktop).
- **Rationale** : un seul code pour toutes les plateformes, sans installation obligatoire.

### IV. Cœur métier pur, isolé et testable (NON NÉGOCIABLE)

- La logique métier (génétique/ADN, hérédité, algorithme traits→pouvoirs, puissance/maîtrise,
  simulation temporelle) DOIT être **pure**, **sans dépendance au framework UI** ni aux API
  navigateur, et DOIT recevoir le générateur aléatoire en paramètre.
- La séparation **logique ↔ présentation** DOIT être stricte : l'UI consomme le cœur, jamais l'inverse.
- **Rationale** : testabilité, longévité, indépendance vis-à-vis des choix d'UI.

### V. Tests déterministes du cœur

- La logique métier DOIT être couverte par des **tests automatisés à seed fixe** ; le déterminisme
  (Principe I) rend les sorties exactement vérifiables.
- Les algorithmes documentés dans la spécification DEVRAIENT avoir des tests dérivés de leurs exemples.
- Tout bug corrigé DOIT être accompagné d'un test de non-régression reproduisant la seed/scénario.
- **Rationale** : confiance, non-régression, exploitation directe du déterminisme.

### VI. Persistance explicite par fichiers, jamais implicite (NON NÉGOCIABLE)

- Il NE DOIT PAS y avoir de sauvegarde automatique ni d'état caché du navigateur faisant autorité.
- La persistance DOIT se faire uniquement par **export/import de fichiers JSON typés**
  (`kind: config | data | full`), la seed étant incluse dans la configuration.
- Le format DOIT être **versionné** et conçu pour le partage entre appareils/utilisateurs.
- **Rationale** : contrôle total de l'utilisateur sur ses données, portabilité, transparence.

### VII. Tout est paramétrable

- Les comportements chiffrés (poids, taux, facteurs, seuils, constantes `D`/`K`, paramètres
  d'espèce, etc.) DOIVENT être exposés en paramètres et exportables ; ils NE DOIVENT PAS être
  codés en dur de manière cachée.
- Des valeurs par défaut raisonnables DOIVENT exister tout en restant modifiables.
- **Rationale** : c'est un outil d'expérimentation ; la flexibilité est une fonctionnalité centrale.

### VIII. Simplicité et YAGNI

- Le développement DOIT démarrer simple ; la complexité (dépendance, abstraction, technologie)
  NE DOIT être ajoutée que lorsqu'un besoin réel et présent le justifie.
- Toute complexité ou dépendance lourde DOIT être justifiée explicitement (cf. « Complexity Tracking » du plan).
- **Rationale** : projet maintenable par une personne, dette technique minimale.

### IX. Spécification fonctionnelle comme source de vérité (NON NÉGOCIABLE)

- `rsrc/DescriptionProjet.md` est la **source de vérité fonctionnelle unique** du domaine.
- Ce fichier NE DOIT PAS être modifié — par quiconque, humain ou agent — sans **autorisation
  explicite de l'auteur**.
- Toute divergence entre le code (ou les artefacts Spec Kit) et ce document se résout ainsi :
  demander l'autorisation, puis mettre à jour la spécification **avant** le code. Il est interdit de
  modifier la spécification en douce, comme de coder à l'encontre de la spécification.
- **Rationale** : préserver l'intention de conception, éviter la dérive silencieuse, garantir une
  référence stable et fiable pour toutes les phases.

## Contraintes techniques & déploiement

- **Sortie de build** : artefacts statiques (HTML/CSS/JS + assets PWA) publiables sur GitHub Pages.
- **Chemins compatibles sous-répertoire** : le site est servi sous `https://<user>.github.io/<repo>/` ;
  les chemins DOIVENT être relatifs ou s'appuyer sur un base path configurable, jamais absolus depuis
  la racine du domaine.
- **Routing** : en cas de navigation côté client, prévoir le repli GitHub Pages (`404.html`) pour le
  rafraîchissement d'URL profondes.
- **Aucun secret** dans le dépôt ni dans le bundle (cohérent avec « aucun backend »).
- **Déploiement automatisé** via **GitHub Actions** (build → publication sur Pages) ; `main` reste déployable.
- **Choix du framework** laissé à l'étape `/speckit-plan`, sous réserve de respecter les Principes II, III
  et IV (statique, PWA, cœur découplé). Une stack légère est préférée (Principe VIII).
- **Accessibilité & performance** : viser un fonctionnement fluide sur mobile ; la généalogie pouvant
  devenir volumineuse, le coût des arbres et listes DOIT être pris en compte.

## Workflow de développement & portes de qualité

- Le développement suit le flux **Spec Kit** : `constitution` → `specify` → `plan` → `tasks` →
  `implement`. La constitution prime et précède tout.
- `rsrc/DescriptionProjet.md` est la **source de vérité fonctionnelle** (cf. Principe IX). Toute
  divergence se résout en mettant à jour la spécification **avant** le code, après autorisation explicite.
- **Portes de qualité avant fusion sur `main`** : le build statique passe ; les tests déterministes du
  cœur (Principe V) passent ; le lint passe ; le bundle reste déployable sur GitHub Pages (Principe II).
- Toute modification structurante DOIT faire l'objet d'une revue de cohérence avec cette constitution ;
  toute entorse DOIT être justifiée et documentée.

## Gouvernance

- Cette constitution **prime** sur les autres pratiques ; en cas de conflit, elle l'emporte.
- **Amendements** : documentés, datés et **versionnés en sémantique** :
  - **MAJEUR** : retrait ou refonte incompatible d'un principe/d'une règle de gouvernance.
  - **MINEUR** : ajout d'un principe/section ou extension matérielle de la guidance.
  - **CORRECTIF** : clarification, reformulation, correction non sémantique.
- Les revues et PR DOIVENT vérifier la conformité aux principes ; toute violation nécessite une
  justification explicite ou un amendement.
- `rsrc/DescriptionProjet.md` fait autorité sur le domaine fonctionnel ; cette constitution fait autorité
  sur les principes d'ingénierie, de déploiement et de gouvernance.

**Version**: 1.0.0 | **Ratifiée le**: 2026-06-09 | **Dernier amendement**: 2026-06-09
