# Feature Specification: Persistance complète & partage

**Feature Branch**: `006-persistance-compl-partage`

**Created**: 2026-06-17

**Status**: Draft

**Input**: User description: "on va faire la feature 6 de rsrc/plangénéral.md"

> Source de vérité fonctionnelle : `rsrc/DescriptionProjet.md` §11 (persistance), §12 (cible PWA),
> §13.1/§13.4 (points en suspens : état RNG, format d'export). **NE PAS modifier sans accord
> explicite** (Constitution Principe IX). Périmètre tracé sur le plan général (Feature 6).

## Clarifications

### Session 2026-06-17

- Q: À l'import d'une **config seule** alors qu'une population existe, que deviennent les individus
  déjà générés ? → A: **Conserver la population** (l'import de config remplace seulement les
  réglages ; données intactes, libellé de repli pour les traits absents du nouveau catalogue).
- Q: Que contient un export `data`/`full` pour la reprise (§13.1) ? → A: **Position complète du
  RNG** (état exact sérialisé, déjà fait en Feature 3) ⇒ reprise **au tirage près**.

## User Scenarios & Testing *(mandatory)*

L'application ne fait **aucune sauvegarde automatique** (Principe VI). Tout l'état vit en mémoire et
n'est conservé que si l'utilisateur **exporte un fichier**. Aujourd'hui, seul un export/import
« complet » minimal existe (amorcé en Feature 1, état RNG sérialisé en Feature 3). Cette feature
**finalise les trois types de fichiers** (`config`, `data`, `full`), la **détection automatique du
type à l'import**, le **versionnage rétro-compatible**, et le **partage** d'un état entre appareils
ou utilisateurs.

### User Story 1 - Exporter et importer la configuration seule (Priority: P1) 🎯 MVP

En tant qu'utilisateur ayant réglé ses catalogues et paramètres, je veux **exporter ma configuration
seule** (sans les individus générés) dans un fichier, et pouvoir la **réimporter** (ici ou sur un
autre appareil) pour **retrouver exactement mes réglages** sans toucher à une éventuelle population
déjà présente.

**Why this priority**: C'est la tranche la plus réutilisable et la plus sûre (aucune donnée
personnelle de simulation), elle débloque le partage de « presets » et constitue un livrable
autonome. Elle prouve le mécanisme `kind` + détection à l'import sur le cas le plus simple.

**Independent Test**: Régler quelques paramètres et éditer un catalogue, exporter un fichier
`config`, recharger l'application (état par défaut), importer le fichier, et vérifier que **tous les
réglages sont restaurés** alors qu'**aucune population** n'a été créée.

**Acceptance Scenarios**:

1. **Given** des paramètres et catalogues personnalisés, **When** j'exporte une configuration,
   **Then** un fichier est téléchargé, contenant un en-tête de type `config` et une version de
   format.
2. **Given** une application fraîchement chargée, **When** j'importe un fichier de configuration,
   **Then** la seed, les catalogues de traits, le catalogue d'espèces/genres, les pondérations, les
   surcharges de résilience et toutes les options sont restaurés à l'identique.
3. **Given** une population déjà générée, **When** j'importe une configuration seule, **Then** les
   réglages sont remplacés mais la **population existante est conservée** (l'import de config ne
   régénère ni n'efface les individus).

---

### User Story 2 - Exporter et importer les données générées seules (Priority: P2)

En tant qu'utilisateur ayant généré une population et fait avancer le temps, je veux **exporter mes
données seules** (individus, ADN, pouvoirs, généalogie, couples, année courante, position du tirage
aléatoire) et pouvoir les **réimporter** pour **reprendre la simulation au tirage près**, sur la
configuration courante.

**Why this priority**: Permet de sauvegarder/partager un « monde » sans réexpédier toute la config,
et fige le point en suspens §13.1 (persistance de l'état du RNG). Dépend du même mécanisme `kind`.

**Independent Test**: Générer une population, avancer de quelques années, exporter un fichier `data`,
recharger l'application, importer le fichier, et vérifier que **la population, la généalogie et les
couples sont restaurés** et qu'une nouvelle avancée du temps produit **exactement** les mêmes
résultats qu'avant l'export (déterminisme).

**Acceptance Scenarios**:

1. **Given** une population générée et vieillie, **When** j'exporte les données, **Then** un fichier
   est téléchargé avec un en-tête de type `data`, incluant la **position de l'état aléatoire**.
2. **Given** une configuration courante, **When** j'importe un fichier de données, **Then** les
   individus, l'ADN, les pouvoirs, la généalogie, les couples (actuels/ex) et l'année courante sont
   restaurés, et la **configuration courante est conservée**.
3. **Given** des données importées, **When** je fais avancer le temps ou je reproduis, **Then** la
   suite des tirages est **identique** à ce qu'elle aurait été sans l'export/import (continuation
   strictement déterministe).

---

### User Story 3 - Fichier complet, détection automatique & versionnage (Priority: P3)

En tant qu'utilisateur, je veux un **export complet** (config + données) en un seul fichier, et un
**import unique** qui **reconnaît automatiquement** le type de fichier (`config`, `data` ou `full`)
et applique le bon traitement, avec un **refus propre** des fichiers non reconnus ou d'une version
trop récente, afin de partager et restaurer un état entier sans me soucier du type.

**Why this priority**: C'est la finition qui unifie US1/US2 et sécurise le partage (versionnage,
rétro-compatibilité, messages d'erreur). Le cas `full` existe déjà partiellement ; il s'agit de le
consolider et d'ajouter la détection + le versionnage.

**Independent Test**: Exporter un fichier `full`, puis importer successivement un `config`, un `data`
et un `full` via **le même bouton d'import** ; vérifier que chaque type est détecté et appliqué
correctement, et qu'un fichier corrompu ou d'une version supérieure est **refusé sans altérer**
l'état courant.

**Acceptance Scenarios**:

1. **Given** une configuration et des données, **When** j'exporte un fichier complet, **Then** un
   fichier de type `full` contenant config + données + version est téléchargé.
2. **Given** un fichier quelconque parmi les trois types, **When** je l'importe via l'import unique,
   **Then** son type est **détecté automatiquement** et le traitement correspondant (config seule /
   données seules / les deux) est appliqué.
3. **Given** un fichier illisible, d'un type inconnu, ou d'une version de format **supérieure** à
   celle supportée, **When** je l'importe, **Then** l'import est **refusé** avec un message clair en
   français et **l'état courant n'est pas modifié**.
4. **Given** un fichier exporté par une version antérieure de l'application (champs récents absents),
   **When** je l'importe, **Then** l'import **réussit** en complétant les champs manquants par des
   valeurs par défaut sûres (rétro-compatibilité).

---

### Edge Cases

- **Import de config avec population existante** : la population est **conservée**. Les traits des
  individus qui ne figurent plus dans le nouveau catalogue restent affichés via un **libellé de
  repli** (déjà garanti en Feature 5) ; aucun individu n'est cassé.
- **Import de data référençant une espèce/un trait absent de la config courante** : les données sont
  chargées telles quelles ; les références inconnues s'affichent via le libellé de repli, sans
  blocage.
- **Fichier `data` sans position d'état aléatoire** (fichier antérieur) : importé en reconstruisant
  un état aléatoire par défaut à partir de la seed (rétro-compatibilité).
- **Fichier JSON syntaxiquement invalide** ou tronqué : refus propre, message en français, état
  courant intact.
- **Fichier dont l'en-tête `kind` est absent ou inconnu** : refus propre (type non reconnu).
- **Version de format supérieure** à la version supportée : refus propre (« version non prise en
  charge »).
- **Annulation de la sélection de fichier** par l'utilisateur : aucune action, aucun message d'erreur.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre l'**export** de trois types de fichiers, chacun portant un
  **en-tête de type** (`kind` = `config`, `data` ou `full`) et une **version de format**.
- **FR-002**: L'export **`config`** DOIT contenir l'intégralité des **paramètres** : la **seed**, les
  catalogues de traits (6 types), le catalogue d'espèces et leurs genres, les pondérations
  (type/trait/gabarit), les facteurs de bonus/malus, les seuils, les surcharges de résilience
  (global/type/trait), les constantes de duplication/génération, les probabilités B/C, les
  paramètres de reproduction par espèce (portées, gaussiennes) et l'option de consanguinité.
- **FR-003**: L'export **`data`** DOIT contenir l'intégralité des **données générées** : les
  individus, leur ADN, leurs pouvoirs (puissance/maîtrise), la généalogie (parents/enfants), les
  couples (actuels et ex), l'année courante et la **position de l'état aléatoire** (pour une reprise
  au tirage près).
- **FR-004**: L'export **`full`** DOIT contenir **config + data** dans un seul fichier.
- **FR-005**: À l'**import**, le système DOIT **détecter automatiquement** le type du fichier via son
  en-tête `kind` et appliquer le **traitement correspondant** (charger uniquement la config,
  uniquement les données, ou les deux).
- **FR-006**: L'import d'un fichier **`config`** DOIT remplacer **uniquement** la configuration et
  **conserver** la population, les couples, l'année courante et l'état aléatoire courants ; il ne
  régénère ni n'efface les individus existants.
- **FR-007**: L'import d'un fichier **`data`** DOIT remplacer **uniquement** les données générées
  (population, généalogie, couples, année, état aléatoire) et **conserver** la configuration
  courante.
- **FR-008**: L'import d'un fichier **`full`** DOIT remplacer **à la fois** la configuration et les
  données.
- **FR-009**: Chaque fichier DOIT être **versionné** (`formatVersion`) ; l'import d'un fichier dont
  la version est **supérieure** à la version supportée DOIT être **refusé** avec un message clair.
- **FR-010**: Tout import d'un fichier **illisible**, de **type inconnu**, ou de **structure
  invalide** DOIT être **refusé proprement** (message en français) **sans altérer** l'état courant.
- **FR-011**: L'import DOIT être **rétro-compatible** : un fichier produit par une version antérieure
  (champs récents absents) DOIT être accepté en complétant les champs manquants par des valeurs par
  défaut sûres.
- **FR-012**: Après import d'un fichier `data` ou `full`, la **seed** et l'**état aléatoire** restaurés
  DOIVENT permettre une **continuation strictement déterministe** (mêmes tirages que sans
  export/import).
- **FR-013**: L'export DOIT produire un **fichier téléchargeable** et l'import DOIT passer par une
  **sélection de fichier** ; aucune sauvegarde automatique ni stockage navigateur (Principe VI).
- **FR-014**: Les fichiers exportés DOIVENT porter un **nom explicite** indiquant leur type (et de
  préférence un horodatage) pour faciliter le tri et le partage.
- **FR-015**: Le format DOIT permettre le **partage** d'un état (entier ou partiel) entre appareils
  ou utilisateurs : un fichier exporté sur un appareil DOIT être importable sur un autre et y
  reproduire le même état.
- **FR-016**: Les trois types d'export DOIVENT être **accessibles depuis l'UI** (boutons distincts
  ou choix de type), et l'import unique DOIT être accessible depuis un **seul point d'entrée**.

### Key Entities *(include if feature involves data)*

- **Fichier d'export** : document JSON typé, porteur d'un en-tête `kind` (`config` | `data` | `full`)
  et d'une `formatVersion` ; contient selon le type une section configuration, une section données,
  ou les deux.
- **Configuration** : ensemble des paramètres et catalogues (seed, traits, espèces/genres,
  pondérations, surcharges de résilience, seuils, options) — ce qui définit *comment* la simulation
  se comporte.
- **Données générées** : ensemble des individus et de leur histoire (ADN, pouvoirs, généalogie,
  couples, année courante, état aléatoire) — ce qui a été *produit* par la simulation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un aller-retour **export `full` → import `full`** restitue un état **strictement
  identique** (mêmes individus, même généalogie, mêmes paramètres, même position aléatoire) dans
  100 % des cas.
- **SC-002**: Importer une **`config`** sur un monde existant modifie **100 %** des paramètres ciblés
  et laisse la population **inchangée** (même nombre d'individus, mêmes ids).
- **SC-003**: Importer des **`data`** restaure la population, la généalogie et les couples sans
  modifier la configuration courante, vérifiable sur un jeu de test.
- **SC-004**: La **détection automatique** du type à l'import est correcte pour les **trois** types
  sans intervention de l'utilisateur.
- **SC-005**: Un fichier **invalide** (corrompu, type inconnu, version supérieure) est refusé avec un
  message clair et **0 corruption** de l'état courant.
- **SC-006**: Après import d'un fichier `data`/`full`, une avancée du temps produit des résultats
  **identiques** à la même avancée effectuée avant l'export (déterminisme au tirage près).
- **SC-007**: Un fichier exporté sur un appareil et importé sur un autre **reproduit le même état**
  (partage fiable).

## Assumptions

- **Format JSON** : le format d'export reste du **JSON typé** (conseillé par §11), versionné via
  `formatVersion` ; la sérialisation canonique déterministe existante (clés triées) est conservée.
- **État aléatoire** : la position du RNG est **incluse dans `data` et `full`** (et non dans
  `config`), figeant le point en suspens §13.1 dans le sens « reprise au tirage près »
  (Clarification 2026-06-17) ; elle est déjà sérialisée depuis la Feature 3.
- **Import de config seule** : **conserve** la population existante (Clarification 2026-06-17) ;
  l'utilisateur peut régénérer manuellement s'il le souhaite.
- **Références croisées** : un import partiel peut produire des références (traits/espèces) absentes
  de l'autre moitié de l'état ; ces cas s'appuient sur le **libellé de repli** déjà livré en
  Feature 5 et ne bloquent pas l'import.
- **Réutilisation de l'existant** : `formatVersion`, la sérialisation canonique, l'état RNG
  sérialisé et le rejet propre des imports invalides existent déjà (Features 1 & 3) ; cette feature
  **étend** ces mécanismes aux types `config`/`data` et à la détection, sans refonte.
- **Pas de backend** : tout reste 100 % statique côté client (Principe II), via téléchargement et
  sélection de fichier ; aucune dépendance ajoutée n'est attendue (Principe VIII).
- **Anonymat** : aucun nom/identité personnelle n'est inscrit dans les fichiers exportés (Principe X).
