# Feature Specification: Lot de corrections (bugs & ajustements UI)

**Feature Branch**: `011-corrections-bugs-ui`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "lis le fichier rsrc/BugReport.txt"

Ce lot regroupe dix corrections/améliorations : les six signalées dans `rsrc/BugReport.txt` (bugs de
reproduction & généalogie, ajustements visuels, renommage de fichier exporté) plus quatre items
supplémentaires (aperçu de pouvoir en temps réel sur le formulaire de création ; nouvelle formule de
la constante de duplication ; bouton « Régénérer » dans la sandbox ; Puissance/Maîtrise non bornées
sauf tirage aléatoire). Chaque correction est indépendante et testable séparément.

## Clarifications

### Session 2026-07-08

- Q: Comment ancrer la « génération 0 » ? → A: Année de genèse **persistée** dans l'état
  sauvegardé/exporté (avec fallback pour les fichiers antérieurs et versionnage).
- Q: Jusqu'où bloquer la lignée directe pour la consanguinité ? → A: **2 niveaux** — bloquer
  enfant↔parent et petit-enfant↔grand-parent (symétrie avec la règle existante).
- Q: Séparateur du nom de fichier exporté ? → A: **Underscore** partout — `PowerGenerator_config_…`.
- Q: Rétro-compatibilité des anciens fichiers d'export/import après ajout de l'année de genèse ? → A:
  Les anciens fichiers restent interprétables ; **si le fichier ne contient pas l'année de genèse,
  celle-ci vaut l'année de naissance la plus ancienne** de la population importée.
- Q: Comportement de l'aperçu de pouvoir « en temps réel » sur le formulaire de création (dérivation
  aléatoire K + P/M) ? → A: Dérivation **complète** (K + P/M) recalculée à chaque changement via une
  **seed d'aperçu stable** (mêmes traits actifs ⇒ même aperçu, déterministe) ; l'aperçu affiché est
  exactement ce qui sera enregistré ; pas d'accumulation dans l'ADN entre deux recalculs.
- Q: Nouvelle formule de la constante de duplication `D` et son défaut ? → A: Probabilité de
  duplication = **`résilience · D`** (le `/2` initialement évoqué est retiré), **bornée à [0, 100] %
  inclus** ; nouveau défaut **D = 0.25** (`D` devient un **multiplicateur**).
- Q: Tirage de la Puissance/Maîtrise pour le bouton « Régénérer » (individu potentiellement sans
  parents) ? → A: **Réutiliser la loi d'héritage §7.2 si l'individu a des parents ; sinon tirage
  uniforme aléatoire dans [1, 10] inclus.**
- Q: Bornage de la Puissance/Maîtrise ? → A: **Non bornées en saisie manuelle** (édition sandbox : on
  peut mettre p. ex. 5000 ou −34) ; le bornage [1, 10] ne s'applique **qu'aux tirages aléatoires**
  (genèse, mutation forte, héritage §7.2, régénération sans parents).
- Q: Précision du bornage P/M — quels cas exactement ? → A: P/M ne sont bornées **NULLE PART** sauf
  quand une **nouvelle valeur est tirée aléatoirement** : **mutation forte (§7.1)**, **cas A du §7.2**,
  et **régénération d'un individu sans parents** (⇒ cas A). Les cas « moyenne−1 / moyenne / moyenne+1 »
  du §7.2 **ne sont pas bornés** (déjà conforme dans le cœur). La saisie manuelle n'est jamais bornée.
- Q: Algorithme exact de la régénération (US9) ? → A: On **ignore les tests « sans pouvoir » et
  « mutation forte »** ; on applique **uniquement l'algorithme §6.4** (dérivation depuis les traits
  actifs) **avec les duplications de trait (§6.4.1, constante `D`) et les générations `K` (§6.4.2)**
  nécessaires, puis le tirage P/M (§7.2 si parents, sinon cas A).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Empêcher la reproduction entre un enfant et ses parents (Priority: P1)

Aujourd'hui, alors que la consanguinité est censée être interdite par défaut, un individu peut
former un couple avec l'un de ses propres parents (lignée directe). C'est le cas de consanguinité le
plus grave et il doit être bloqué.

**Why this priority**: Violation directe d'une règle métier annoncée (« consanguinité interdite »).
Produit des généalogies aberrantes (un parent conjoint de son enfant) qui décrédibilisent toute la
simulation. Correctness la plus critique du lot.

**Independent Test**: Lancer une simulation multi-générations avec consanguinité interdite et
vérifier qu'aucun couple formé ne contient un individu et l'un de ses ascendants directs
(parent, grand-parent).

**Acceptance Scenarios**:

1. **Given** la consanguinité est interdite, **When** on forme les couples d'une année,
   **Then** aucun couple ne réunit un individu et l'un de ses parents.
2. **Given** la consanguinité est interdite, **When** on forme les couples d'une année,
   **Then** aucun couple ne réunit un individu et l'un de ses grands-parents.
3. **Given** la consanguinité est interdite, **When** on parcourt toute la population sur plusieurs
   générations, **Then** on ne trouve jamais deux membres d'un même couple liés par une relation
   d'ascendance/descendance directe.
4. **Given** la consanguinité est **autorisée** (paramètre), **When** on forme les couples,
   **Then** les appariements enfant-parent redeviennent possibles (le blocage ne s'applique que
   lorsque la consanguinité est interdite).

---

### User Story 2 - Les enfants d'une même portée naissent le même jour (Priority: P1)

Les membres d'une même portée (jumeaux, triplés, etc.) issus d'un même événement de reproduction
reçoivent actuellement des dates de naissance différentes. Ils doivent partager exactement la même
date de naissance.

**Why this priority**: Incohérence factuelle visible immédiatement dans les fiches et l'arbre
(« jumeaux » nés à des jours différents). Correctness de réalisme, faible risque de régression.

**Independent Test**: Faire reproduire un couple produisant une portée de taille ≥ 2 et vérifier que
tous les enfants de cette portée ont une date de naissance identique.

**Acceptance Scenarios**:

1. **Given** un couple qui engendre une portée de 3 enfants une année donnée, **When** la portée est
   générée, **Then** les 3 enfants ont la même date de naissance (même année **et** même jour).
2. **Given** deux portées distinctes (couples ou années différents), **When** elles sont générées,
   **Then** chaque portée a sa propre date, mais les enfants d'une même portée restent groupés sur
   la même date.
3. **Given** une portée d'un seul enfant, **When** elle est générée, **Then** le comportement reste
   inchangé (une date pour l'unique enfant).

---

### User Story 3 - La génération initiale est la génération 0 (Priority: P2)

Le numéro de génération affiché est calculé sur l'année de naissance absolue. En démarrant une
simulation en l'an 1900, la population initiale n'est pas affichée comme « génération 0 ». La
population issue de la genèse doit toujours être la génération 0, quelle que soit l'année de départ.

**Why this priority**: Fausse l'information de génération affichée (listes, filtres, fiche) mais
n'altère pas la simulation elle-même. Important pour la lisibilité, moins critique que les bugs de
reproduction.

**Independent Test**: Générer une population initiale à une année de départ arbitraire (ex. 1900) et
vérifier que tous ses individus sont en génération 0, puis que chaque tranche de 20 ans suivante
incrémente le numéro de génération.

**Acceptance Scenarios**:

1. **Given** une genèse démarrée en l'an 1900, **When** on consulte la population initiale,
   **Then** tous ses individus sont en génération 0.
2. **Given** une genèse démarrée en l'an 0, **When** on consulte la population initiale,
   **Then** tous ses individus sont en génération 0 (comportement historique préservé).
3. **Given** une genèse démarrée en l'an 1900, **When** des individus naissent 20 à 39 ans plus tard,
   **Then** ils sont affichés en génération 1 ; 40 à 59 ans plus tard, en génération 2 ; etc.
4. **Given** le filtre par génération, **When** on filtre sur « génération 0 », **Then** il
   sélectionne bien la population initiale, quelle que soit l'année de départ.
5. **Given** une simulation démarrée en 1900 puis exportée et ré-importée, **When** on consulte les
   générations, **Then** la numérotation est identique avant/après (l'année de genèse est persistée).
6. **Given** un fichier de données antérieur (sans année de genèse), **When** on l'importe, **Then**
   la numérotation reste cohérente via le fallback (naissance la plus ancienne = génération 0).

---

### User Story 4 - Étiquettes de pouvoir « P 12 » / « M 3 » sans deux-points (Priority: P2)

Les étiquettes de pouvoir dans les listes affichent la puissance et la maîtrise sous la forme
« P : 12 » et « M : 3 ». Le format souhaité retire le deux-points : « P 12 » et « M 3 ».

**Why this priority**: Ajustement de présentation simple, sans impact fonctionnel, mais visible sur
toutes les listes.

**Independent Test**: Afficher une liste contenant un individu ayant un pouvoir de puissance 12 et
maîtrise 3, et vérifier que l'étiquette lit « P 12 » et « M 3 ».

**Acceptance Scenarios**:

1. **Given** un pouvoir de puissance 12 et maîtrise 3, **When** son étiquette est affichée dans une
   liste, **Then** elle montre « P 12 » et « M 3 » (sans deux-points).
2. **Given** cette modification, **When** on consulte les listes Population et Sandbox, **Then** le
   nouveau format s'applique de manière identique aux deux.

---

### User Story 5 - La section « traits » des filtres passe à la ligne (Priority: P3)

Dans la barre de filtres, la section des filtres de trait ne se place pas correctement : elle doit
être forcée sur sa propre ligne pour rester lisible.

**Why this priority**: Défaut d'agencement visuel ; n'empêche pas l'usage mais nuit à la clarté.

**Independent Test**: Ouvrir la barre de filtres (Population et Sandbox) et vérifier que la section
des filtres de trait occupe sa propre ligne, distincte des autres contrôles de filtre.

**Acceptance Scenarios**:

1. **Given** la barre de filtres affichée, **When** on la consulte, **Then** la section des filtres
   de trait apparaît sur une ligne dédiée, séparée des autres champs de filtre.
2. **Given** différentes largeurs d'écran usuelles, **When** on redimensionne la fenêtre, **Then**
   la section des filtres de trait reste sur sa propre ligne.

---

### User Story 6 - Renommer le fichier exporté en « PowerGenerator_… » (Priority: P3)

Les fichiers exportés (configuration / données / complet) sont nommés avec le préfixe
« royalcookie- ». Ce préfixe doit devenir « PowerGenerator ».

**Why this priority**: Cohérence de nom de produit et anonymat ; n'affecte pas le contenu exporté ni
la ré-importation.

**Independent Test**: Exporter chacun des trois types de fichier et vérifier que le nom téléchargé
commence par « PowerGenerator » au lieu de « royalcookie ».

**Acceptance Scenarios**:

1. **Given** un export de configuration, **When** le fichier est téléchargé, **Then** son nom
   commence par « PowerGenerator » et non « royalcookie », séparateurs underscore
   (`PowerGenerator_config_…`).
2. **Given** un export de données et un export complet, **When** ils sont téléchargés, **Then** leurs
   noms suivent le même schéma « PowerGenerator_{type}_… » avec underscores.
3. **Given** un fichier précédemment exporté sous « royalcookie-… », **When** on le ré-importe,
   **Then** l'import fonctionne toujours (le renommage ne casse pas la compatibilité ascendante).

---

### User Story 7 - Aperçu de pouvoir en temps réel sur le formulaire de création (Priority: P2)

Sur le formulaire de création / édition d'un individu, on peut cocher chaque trait, le rendre
actif ou inactif et régler sa résilience — **et cette manipulation par trait (activer/désactiver +
résilience) DOIT être disponible aussi bien en création qu'en édition** (parité stricte des deux
modes ; cf. BUG-001). Il manque un **aperçu du (des) pouvoir(s) généré(s) en temps réel** à partir des
traits actifs, affiché directement sur le formulaire et mis à jour à chaque modification. Aujourd'hui
les pouvoirs ne se (re)calculent qu'au clic manuel sur « Mutation normale ».

**Bugfix**: 2026-07-08 — [BUG-001] Explicitation de l'exigence de **parité création/édition** pour la
manipulation actif/résilience par trait (prémisse d'US7 fausse en création : contrôles non rendus).

**Why this priority**: Rend la création manuelle réellement utilisable (on voit l'effet des traits
immédiatement) ; améliore fortement l'ergonomie sans toucher à la simulation. Prioritaire mais moins
critique que les bugs de reproduction.

**Independent Test**: Ouvrir le formulaire de création, cocher/activer quelques traits et faire varier
leur résilience, puis vérifier que l'aperçu du pouvoir se met à jour immédiatement et que, à traits
actifs identiques, l'aperçu est stable (déterministe).

**Acceptance Scenarios**:

1. **Given** le formulaire de création ouvert, **When** on active un trait, **Then** l'aperçu du (des)
   pouvoir(s) dérivé(s) des traits actifs s'affiche/s'actualise immédiatement, sans clic manuel.
2. **Given** un trait rendu inactif, **When** on décoche « actif », **Then** l'aperçu se recalcule
   pour ne tenir compte que des traits restés actifs.
3. **Given** un même ensemble de traits actifs, **When** on retire puis réactive un trait pour revenir
   au même état, **Then** l'aperçu affiché est identique (déterministe, seed d'aperçu stable).
4. **Given** un aperçu affiché, **When** on enregistre l'individu, **Then** les pouvoirs (et l'ADN
   enrichi par la génération K) enregistrés correspondent exactement à l'aperçu montré.
5. **Given** aucun trait actif (ou aucun pouvoir dérivable), **When** on consulte l'aperçu, **Then**
   il indique clairement l'absence de pouvoir.
6. **Given** le formulaire de **création** ouvert (ADN vide au départ), **When** on coche un trait,
   **Then** les contrôles « actif » et « résilience » de ce trait s'affichent immédiatement et sont
   modifiables — exactement comme en édition (BUG-001).

---

### User Story 8 - Nouvelle formule de la constante de duplication (Priority: P2)

La probabilité de duplication d'un trait secondaire (§6.4.1) est actuellement `résilience / D %`. Elle
doit devenir `résilience · D %`, avec `D` réinterprété comme un **multiplicateur** de défaut **0.25**,
la probabilité restant bornée à [0, 100] %.

**Why this priority**: Corrige/ajuste une règle génétique cœur ; impacte la génération des pouvoirs de
toute la population. Déterministe et testable ; à traiter avant les livraisons de simulation.

**Independent Test**: Régler la résilience d'un trait secondaire et vérifier, sur un grand nombre de
tirages à seed fixe, que la fréquence de duplication observée correspond à `min(100, résilience · D)`.

**Acceptance Scenarios**:

1. **Given** `D = 0.25` et un trait secondaire de résilience 50, **When** on assigne ce trait,
   **Then** la probabilité de duplication est 12,5 % (`50 · 0.25`).
2. **Given** `D = 0.25` et une résilience de 100, **When** on assigne le trait, **Then** la
   probabilité de duplication est 25 %.
3. **Given** une combinaison telle que `résilience · D > 100`, **When** on calcule la probabilité,
   **Then** elle est bornée à 100 %.
4. **Given** `D = 0`, **When** on assigne un trait secondaire, **Then** aucune duplication ne se
   produit (probabilité 0 %).
5. **Given** la valeur par défaut, **When** on inspecte les paramètres, **Then** `D` vaut 0.25.

---

### User Story 9 - Bouton « Régénérer » les pouvoirs dans la sandbox (Priority: P2)

Dans la sandbox, à côté des actions « Éditer », « Cloner » et « Supprimer » de chaque individu, un
bouton **« Régénérer »** doit permettre de **retirer à neuf les pouvoirs** de la personne à partir de
ses **traits actifs**. La régénération **n'effectue aucun tirage de cas** (pas de test « sans
pouvoir », pas de « mutation forte ») : elle applique **uniquement l'algorithme §6.4** (dérivation des
pouvoirs depuis les traits actifs), en appliquant les **duplications de trait** (§6.4.1, constante
`D`) et les **générations `K`** (§6.4.2) nécessaires, puis le tirage Puissance/Maîtrise.

**Why this priority**: Outil d'expérimentation clé de la sandbox : permet d'explorer les pouvoirs
possibles d'un individu donné sans le recréer. Ergonomie forte, s'appuie sur le moteur existant.

**Independent Test**: Dans la sandbox, cliquer « Régénérer » sur un individu et vérifier que ses
pouvoirs sont recalculés à partir de ses traits actifs, avec de nouveaux tirages (K, P, M), et que des
clics successifs peuvent produire des résultats différents (consommation du RNG sandbox).

**Acceptance Scenarios**:

1. **Given** un individu de la sandbox avec des traits actifs, **When** on clique « Régénérer »,
   **Then** ses pouvoirs sont remplacés par un nouveau tirage dérivé de ses traits actifs via
   **l'algorithme §6.4 seul** (duplications §6.4.1 et générations K §6.4.2 comprises), **sans** aucun
   test « sans pouvoir » ni « mutation forte ».
2. **Given** un individu **avec des parents**, **When** on régénère, **Then** la Puissance et la
   Maîtrise sont tirées via la loi d'héritage §7.2 (depuis les pouvoirs des parents).
3. **Given** un individu **sans parents**, **When** on régénère, **Then** la Puissance et la Maîtrise
   sont tirées uniformément dans [1, 10] inclus.
4. **Given** deux clics successifs sur « Régénérer », **When** le RNG sandbox avance, **Then** le
   second tirage peut différer du premier (nouveau tir réel).
5. **Given** un individu **sans trait actif**, **When** on régénère, **Then** il se retrouve sans
   pouvoir (aucun pouvoir dérivable), sans erreur.
6. **Given** la génération K enrichit l'ADN, **When** on régénère, **Then** les traits générés par K
   sont inscrits dans l'ADN de l'individu (actifs), conformément au moteur existant.

---

### User Story 10 - Puissance/Maîtrise non bornées sauf tirage aléatoire (Priority: P2)

La Puissance et la Maîtrise ne doivent être bornées **nulle part**, sauf lorsqu'une **nouvelle valeur
est tirée aléatoirement** (mutation forte §7.1, cas A du §7.2, régénération sans parents, genèse). En
particulier, la saisie manuelle (sandbox) doit être **libre** (par ex. 5000 ou −34), et les valeurs
dérivées de la moyenne des parents (§7.2 : `moyenne−1`/`moyenne`/`moyenne+1`) ne sont pas bornées non
plus (déjà conforme dans le cœur ; le seul défaut restant est le clamp de saisie manuelle).

**Why this priority**: Débloque l'usage expérimental de la sandbox (scénarios extrêmes, tests) ;
correction ciblée et à faible risque. Cohérente avec les autres améliorations sandbox de ce lot.

**Independent Test**: Éditer un individu en sandbox, saisir une puissance de 5000 et une maîtrise de
−34, enregistrer, puis rouvrir la fiche et vérifier que ces valeurs sont conservées telles quelles.

**Acceptance Scenarios**:

1. **Given** l'édition manuelle d'un pouvoir en sandbox, **When** on saisit une puissance de 5000,
   **Then** la valeur 5000 est acceptée et conservée (pas de clamp à 10).
2. **Given** l'édition manuelle d'un pouvoir, **When** on saisit une maîtrise de −34, **Then** la
   valeur −34 est acceptée et conservée (pas de clamp à 1).
3. **Given** un tirage **purement aléatoire** de P/M (mutation forte, cas A du §7.2, régénération sans
   parents, genèse), **When** les valeurs sont tirées, **Then** elles restent dans [1, 10].
4. **Given** un enfant dont les deux parents ont une puissance moyenne de 10, **When** le §7.2 tombe
   sur le cas `moyenne+1`, **Then** l'enfant peut avoir une puissance de 11 (cas dérivé non borné).
5. **Given** des valeurs hors [1, 10] (manuelles ou dérivées), **When** elles sont affichées dans les
   listes/fiche, **Then** elles s'affichent telles quelles (« P 5000 », « M -34 », « P 11 »).

---

### Edge Cases

- **Consanguinité & groupes > 2** : le blocage lignée directe doit s'appliquer à **chaque** paire de
  membres d'un groupe reproducteur, pas seulement au premier.
- **Consanguinité indisponible** : si l'anti-consanguinité empêche tout appariement d'un candidat,
  celui-ci reste non apparié et re-candidate l'année suivante (comportement existant conservé).
- **Portée & déterminisme** : regrouper la date des enfants d'une portée ne doit pas modifier l'ordre
  des autres tirages aléatoires (déterminisme à seed fixe préservé).
- **Génération négative** : une naissance antérieure à l'année de genèse (cas résiduel) doit produire
  un numéro de génération négatif cohérent (< 0), sans erreur.
- **P/M absents** : un pouvoir sans valeur de puissance/maîtrise ne doit pas afficher d'étiquette
  « P »/« M » vide ou erronée (comportement existant conservé).
- **Aperçu & génération K** : l'aperçu temps réel peut enrichir l'ADN via la génération K ; ce
  recalcul MUST partir des traits actifs courants **sans accumuler** les traits générés d'un recalcul
  au suivant (pas de boucle de rétroaction).
- **Aperçu déterministe** : deux affichages successifs du même ensemble de traits actifs MUST produire
  le même aperçu (seed d'aperçu stable), indépendamment de l'ordre des manipulations.
- **Duplication bornée** : `résilience · D` MUST être bornée à [0, 100] % ; `D` MUST être ≥ 0
  (multiplicateur), `D = 0` ⇒ aucune duplication.
- **Régénérer sans trait actif** : « Régénérer » sur un individu sans trait actif MUST le laisser sans
  pouvoir, sans erreur.
- **Régénérer & RNG sandbox** : « Régénérer » consomme le RNG de la sandbox (comme les autres
  générations sandbox) ; des clics successifs peuvent donc produire des résultats différents, tout en
  restant déterministes pour une même séquence de seed.
- **P/M manuelles extrêmes** : une valeur manuelle vide ou non numérique retombe sur une valeur par
  défaut sûre (0), mais toute valeur entière (négative, nulle ou très grande) MUST être acceptée sans
  clamp ; seul le tirage aléatoire borne à [1, 10].

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Lorsque la consanguinité est interdite, le système MUST empêcher la formation d'un
  couple réunissant un individu et l'un de ses ascendants directs (parent, grand-parent) ou
  descendants directs (enfant, petit-enfant). Le blocage de lignée directe est **limité à 2 niveaux**
  (parent/grand-parent et enfant/petit-enfant), en symétrie avec la règle existante ; les ascendants
  plus lointains (arrière-grands-parents et au-delà) ne sont pas concernés.
- **FR-002**: Le blocage de lignée directe MUST s'ajouter aux règles existantes (partage de parent /
  grand-parent) sans les supprimer, et MUST s'appliquer à chaque paire de membres d'un groupe.
- **FR-003**: Lorsque la consanguinité est autorisée, le système MUST permettre à nouveau les
  appariements de lignée directe (le blocage est conditionné au paramètre d'interdiction).
- **FR-004**: Tous les enfants issus d'une même portée (même événement de reproduction) MUST recevoir
  une date de naissance identique (même année et même jour de l'année).
- **FR-005**: Le regroupement de la date de portée MUST préserver le déterminisme à seed fixe.
- **FR-006**: Le numéro de génération MUST être calculé relativement à une **année de genèse
  persistée** dans l'état sauvegardé/exporté, de sorte que la population initiale soit toujours la
  génération 0. L'année de genèse est fixée lors de la genèse initiale et conservée à travers
  l'avancement du temps, l'export et l'import.
- **FR-007**: Chaque tranche de 20 ans écoulée après l'année de genèse MUST incrémenter le numéro de
  génération de 1 (génération 1 = 20–39 ans après la genèse, etc.).
- **FR-008**: Le filtre et l'affichage par génération MUST utiliser cette numérotation relative de
  manière cohérente (listes, filtres, fiche).
- **FR-008a**: L'ajout de l'année de genèse à l'état persistant MUST être versionné et rétro-compatible :
  à l'import d'un fichier antérieur ne contenant pas cette valeur, le système MUST appliquer un
  fallback déterministe (année de naissance la plus ancienne présente dans la population) afin que la
  numérotation reste cohérente.
- **FR-009**: Les étiquettes de pouvoir dans les listes MUST afficher la puissance et la maîtrise sous
  la forme « P {valeur} » et « M {valeur} », sans deux-points.
- **FR-010**: Ce format d'étiquette MUST s'appliquer de façon identique aux listes Population et
  Sandbox.
- **FR-011**: La section des filtres de trait MUST être disposée sur sa propre ligne dans la barre de
  filtres, séparée des autres contrôles.
- **FR-012**: Les fichiers exportés (configuration, données, complet) MUST être nommés avec le préfixe
  « PowerGenerator » au lieu de « royalcookie », en utilisant l'underscore comme séparateur
  (`PowerGenerator_{type}_{horodatage}.json`).
- **FR-013**: Le renommage des fichiers exportés MUST NOT casser la ré-importation de fichiers
  existants nommés avec l'ancien préfixe.
- **FR-014**: Le formulaire de création / édition d'un individu MUST permettre, pour chaque trait
  sélectionné, de définir s'il est actif ou inactif et de régler son pourcentage de résilience
  (0–100) — fonctionnalité existante à conserver.
- **FR-015**: Le formulaire MUST afficher un **aperçu du (des) pouvoir(s)** dérivé(s) des traits
  actifs, **mis à jour en temps réel** à chaque changement (ajout/retrait de trait, bascule
  actif/inactif, modification de résilience), sans clic manuel.
- **FR-016**: L'aperçu MUST être **déterministe** : à ensemble de traits actifs identique, il produit
  le même résultat (seed d'aperçu stable) ; le recalcul part des traits actifs courants sans
  accumuler les traits générés (K) d'un recalcul au suivant.
- **FR-017**: À l'enregistrement de l'individu, les pouvoirs et l'ADN (y compris l'enrichissement par
  génération K) persistés MUST correspondre exactement à l'aperçu affiché.
- **FR-018**: La probabilité de duplication d'un trait secondaire (§6.4.1) MUST être calculée comme
  `min(100, max(0, résilience · D))`, où `D` (« constante de duplication ») est un **multiplicateur**
  de valeur par défaut **0.25** et MUST être ≥ 0.
- **FR-019**: `D` MUST rester réglable dans les paramètres et exporté avec l'état (comportement
  existant du paramètre conservé).
- **FR-020**: La sandbox MUST offrir, pour chaque individu, une action **« Régénérer »** (aux côtés de
  « Éditer », « Cloner », « Supprimer ») qui recalcule ses pouvoirs à partir de ses **traits actifs**
  en appliquant **uniquement l'algorithme §6.4** — avec duplications (§6.4.1) et générations `K`
  (§6.4.2), les traits générés étant inscrits dans l'ADN. La régénération MUST NOT effectuer de tirage
  de cas (aucun test « sans pouvoir » ni « mutation forte »).
- **FR-021**: Lors d'une régénération, la Puissance et la Maîtrise de chaque pouvoir MUST être tirées
  via la loi d'héritage §7.2 si l'individu a des parents, sinon uniformément dans [1, 10] inclus.
- **FR-022**: « Régénérer » MUST consommer le RNG de la sandbox (tir réel) ; le résultat MUST rester
  déterministe pour une même séquence de seed, mais des clics successifs peuvent différer.
- **FR-023**: La Puissance et la Maîtrise MUST NOT être bornées **nulle part** en dehors des tirages
  purement aléatoires : la saisie manuelle (édition sandbox) accepte et conserve toute valeur entière
  (négative, nulle, ou supérieure à 10) telle quelle.
- **FR-024**: Le bornage à [1, 10] MUST s'appliquer **uniquement** aux cas où une **nouvelle valeur
  est tirée aléatoirement** : **mutation forte (§7.1)**, **cas A du §7.2**, **régénération d'un individu
  sans parents** (⇒ cas A), et **genèse**. Les cas dérivés de la moyenne des parents du §7.2
  (`moyenne−1` / `moyenne` / `moyenne+1`) MUST NOT être bornés (comportement déjà conforme dans le
  cœur, `inheritStats`).

### Key Entities *(include if feature involves data)*

- **Individu (Personne)** : possède des liens de parenté (parents, enfants) servant à déterminer la
  consanguinité et la lignée directe, ainsi qu'une date de naissance et une génération dérivée.
- **Couple** : groupe reproducteur formé de membres de même espèce et non consanguins (si interdit).
- **Portée** : ensemble d'enfants issus d'un même événement de reproduction d'un couple sur une année.
- **Année de genèse** : année de référence de la simulation, fixée à la genèse initiale et persistée
  dans l'état ; sert d'origine au calcul du numéro de génération (génération 0 = année de genèse).
- **Fichier exporté** : artefact téléchargé (config / données / complet), identifié par un nom de
  fichier préfixé.
- **Trait d'un individu (ADN)** : porte un état actif/inactif et une résilience (0–100), éditables sur
  le formulaire de création ; les traits actifs alimentent la dérivation des pouvoirs.
- **Aperçu de pouvoir** : représentation en temps réel, sur le formulaire, des pouvoirs dérivés des
  traits actifs (déterministe via seed d'aperçu stable) ; devient le résultat enregistré.
- **Constante de duplication `D`** : paramètre réglable, multiplicateur de la probabilité de
  duplication des traits secondaires (`résilience · D`, bornée [0,100] %), défaut 0.25.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sur une simulation de plusieurs générations avec consanguinité interdite, 0 couple
  réunit un individu et l'un de ses ascendants/descendants directs.
- **SC-002**: 100 % des enfants d'une même portée partagent une date de naissance identique.
- **SC-003**: Pour toute année de départ, 100 % des individus de la population initiale sont en
  génération 0.
- **SC-004**: 100 % des étiquettes de pouvoir affichées suivent le format « P {valeur} » / « M
  {valeur} » sans deux-points.
- **SC-005**: La section des filtres de trait occupe une ligne dédiée à toutes les largeurs d'écran
  usuelles testées.
- **SC-006**: 100 % des fichiers exportés portent le préfixe « PowerGenerator » avec séparateurs
  underscore, et les fichiers « royalcookie-… » restent ré-importables.
- **SC-008**: Un export puis ré-import préserve la numérotation de génération à 100 % ; un fichier
  antérieur sans année de genèse s'importe sans erreur avec une numérotation cohérente (fallback).
- **SC-009**: Sur le formulaire de création, l'aperçu du pouvoir se met à jour à chaque modification
  de trait, et 100 % des recalculs à traits actifs identiques produisent le même aperçu.
- **SC-010**: Les pouvoirs enregistrés correspondent à l'aperçu affiché dans 100 % des cas.
- **SC-011**: Sur un échantillon à seed fixe, la fréquence de duplication observée d'un trait
  secondaire correspond à `min(100, résilience · D)` (avec D = 0.25 par défaut), à la marge
  statistique près.
- **SC-012**: Le bouton « Régénérer » recalcule les pouvoirs à partir des seuls traits actifs dans
  100 % des cas ; P/M suivent la loi §7.2 (avec parents) ou [1,10] uniforme (sans parents) ; à seed
  fixe, la régénération est reproductible.
- **SC-013**: Une puissance ou maîtrise hors [1, 10] — saisie manuellement (ex. 5000, −34) **ou**
  dérivée de la moyenne des parents (§7.2, ex. 11) — est conservée à l'identique, tandis que les seuls
  tirages purement aléatoires (mutation forte, cas A du §7.2, régénération sans parents, genèse)
  restent dans [1, 10].
- **SC-007**: Toutes les corrections préservent le déterminisme : à seed identique, la simulation
  reste reproductible (les suites de tests à seed fixe passent).

## Assumptions

- **Portée = même événement de reproduction** : « jumeaux » désigne les enfants produits par un même
  couple lors d'une même année/appariement ; ils partagent la date. Des enfants du même couple nés
  des années différentes ne sont pas concernés.
- **Année de genèse comme origine des générations** : la génération 0 est ancrée sur l'année de la
  genèse initiale, **persistée dans l'état sauvegardé/exporté** (décision de clarification). Un
  fallback (naissance la plus ancienne) couvre les fichiers antérieurs sans cette valeur.
- **Lignée directe = ascendance/descendance sur 2 niveaux** : parent↔enfant et grand-parent↔petit-enfant
  sont bloqués (décision de clarification) ; les règles existantes (frères/sœurs via parent partagé,
  cousins via grand-parent partagé) restent en vigueur. Les ascendants plus lointains ne sont pas visés.
- **Nom de fichier** : le préfixe passe de « royalcookie » à « PowerGenerator » **avec underscores**
  comme séparateurs (décision de clarification) : `PowerGenerator_{type}_{horodatage}.json`.
- **Format P/M** : seul le séparateur change (retrait du « : ») ; les libellés « P » et « M » et les
  valeurs restent identiques.
- Ces corrections touchent du code cœur en lecture seule/pur (consanguinité, portée, génération) et
  de l'UI (étiquettes, filtres, export) ; aucune nouvelle dépendance n'est introduite.
- **Formulaire de création** : la sélection actif/inactif et le réglage de résilience par trait
  existent déjà (`SandboxPersonForm`) ; US7 ajoute l'aperçu **temps réel** et le remplacement du
  déclenchement manuel par un recalcul automatique (le résultat enregistré = l'aperçu).
- **Aperçu temps réel & déterminisme** : l'aperçu s'appuie sur une **seed d'aperçu stable** dérivée
  de l'ensemble des traits actifs, afin de respecter le Principe I (aucun `Math.random`/horloge) tout
  en restant réactif.
- **Changement de formule `D`** : passer de `résilience / D` à `résilience · D` avec défaut 0.25
  **modifie le comportement génétique** (plus de duplication qu'avant à résilience égale) et change
  les sorties déterministes ; les tests Vitest à seed fixe seront mis à jour en conséquence.
- **Impact Constitution (Principe IV/V)** : US7 (aperçu), US8 (formule D) et US9 (régénérer) touchent
  la logique cœur de dérivation des pouvoirs → **tests Vitest obligatoires** ; la dérivation reste
  pure et pilotée par la seed.
- **Régénérer (US9)** : réutilise le moteur existant (`derivePowersFromTraits` + tirage P/M) et le RNG
  de la sandbox (déjà en place, Feature 007) ; action **destructive immédiate** (remplace les pouvoirs
  courants) sans confirmation, cohérente avec le caractère expérimental de la sandbox.
- **P/M non bornées (US10)** : les valeurs restent des **entiers** (comme le modèle actuel), mais sans
  bornes hors tirage purement aléatoire. Le cœur est **déjà conforme** pour l'héritage §7.2 (seul le
  cas A est borné, cf. `inheritStats`) ; le **seul défaut à corriger** est le clamp `[1,10]` de la
  saisie manuelle du formulaire (édition/création). L'affichage (US4) montre la valeur brute (négative,
  nulle, ou > 10).
- **Impact Constitution (Principe VI)** : la persistance de l'année de genèse (FR-006/FR-008a) ajoute
  un champ à l'état exporté ; cet écart au « rien dans AppState/export » est assumé et sera justifié
  dans le Constitution Check du plan (bump de version de format + rétro-compat requis).
