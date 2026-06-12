# Feature Specification: Paramétrage complet & catalogues éditables

**Feature Branch**: `005-parametrage-catalogues`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "on va faire la feature 5 de plangénéral.md" (Paramétrage complet &
catalogues éditables — cf. `rsrc/plangénéral.md` Feature 5 ; source de vérité `rsrc/DescriptionProjet.md`
§9, §3.1, §3.4, §6.6.1, §6.6, §8.4)

## Contexte & objectif

L'application expose déjà une page Paramètres avec les **réglages globaux** du moteur génétique et de
la genèse (seed, résilience initiale/maximale, bonus/malus, seuils, taux de mutation, B/C, taille du
batch…). En revanche, une grande partie de ce que la description veut **paramétrable** n'est **pas
encore éditable dans l'interface** :

- les **catalogues** (traits par type, espèces, genres) ne peuvent ni être complétés ni modifiés ;
- les **paramètres de reproduction par espèce** (courbe gaussienne, portée, divorce) et leur **courbe
  affichée** sont absents de l'UI ;
- le **% de reproduction propre à un couple** n'est pas éditable ;
- les **pondérations de tirage** (poids par type de trait, poids du gabarit de mutation forte, poids
  par trait individuel) ne sont pas exposées ;
- l'**option de consanguinité** n'a pas de réglage visible.

Cette feature **consolide** le paramétrage pour rendre l'application réellement réglable de bout en
bout, sans backend et sans nouvelle dépendance.

**Décisions de cadrage retenues (cf. Clarifications) :**

- **Déclinaison « 3 niveaux »** (global → type de trait → trait individuel) appliquée aux **poids de
  tirage** **ET** à la **résilience** : résilience **initiale**, **maximale** et **seuil de
  disparition** (« minimale ») sont déclinables par type et par trait. Cette extension **modifie le
  cœur** (structure de surcharge + résolution), ce qui est **assumé**.
- **Suppression d'une entrée de catalogue** déjà utilisée : **autorisée**, elle **n'affecte que les
  tirages futurs** ; les individus existants **conservent** leurs références.

## Clarifications

### Session 2026-06-12

- Q : La « résilience minimale » déclinable par type/trait correspond-elle à quoi (le modèle n'a pas
  de champ explicite) ? → A : **Au seuil de disparition (§9.2)**. Les **3** paramètres — résilience
  **initiale**, **maximale**, **seuil de disparition** — sont déclinables **global → type → trait**
  (revient sur la décision antérieure « poids seuls » ; modification du cœur assumée).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Éditer les catalogues : traits, espèces, genres (Priority: P1)

En tant qu'utilisateur, je veux **ajouter, modifier et retirer** des entrées dans les catalogues —
les **traits** de chacun des 6 types, les **espèces**, et les **genres** de chaque espèce — afin de
façonner l'univers avant de générer une population.

**Why this priority** : c'est le cœur de « tout doit être paramétrable » et le plus gros manque
actuel. Sans catalogues éditables, l'utilisateur est enfermé dans les listes par défaut. Livrable de
valeur immédiate et indépendant.

**Independent Test** : ouvrir la page de gestion des catalogues, ajouter un trait dans un type, le
renommer, le supprimer ; ajouter une espèce et lui définir des genres ; vérifier que la genèse et les
tirages suivants tiennent compte des modifications, et que les individus déjà générés ne sont pas
cassés.

**Acceptance Scenarios** :

1. **Given** le catalogue de traits par défaut, **When** j'ajoute un trait « Cristal » au type
   « Ajouts », **Then** il apparaît dans la liste du type et devient disponible pour les tirages
   futurs.
2. **Given** un trait existant, **When** je modifie son libellé, **Then** le nouveau libellé est
   utilisé partout où ce trait est référencé.
3. **Given** un trait utilisé par au moins un individu déjà généré, **When** je le supprime du
   catalogue, **Then** la suppression est acceptée, le trait **n'est plus proposé** aux tirages
   futurs, et les individus existants **conservent** ce trait dans leur ADN.
4. **Given** le catalogue d'espèces (par défaut « humain »), **When** j'ajoute l'espèce « elfe » et
   lui définis des genres, **Then** « elfe » devient sélectionnable et porte ses propres paramètres
   de reproduction.
5. **Given** une espèce, **When** j'ouvre la gestion de ses genres, **Then** le genre spécial
   « tout » est **toujours présent** et **ne peut pas être supprimé**.
6. **Given** je tente de retirer le dernier trait d'un type, **When** je valide, **Then** le système
   se comporte de manière prévisible (type pouvant rester vide) sans erreur bloquante.

---

### User Story 2 - Régler la reproduction par espèce, courbe à l'appui (Priority: P2)

En tant qu'utilisateur, je veux **éditer les paramètres de reproduction de chaque espèce**
(gaussienne, portée, divorce, taille de groupe) avec une **courbe affichée en direct**, **activer ou
non la consanguinité**, et **ajuster le % de reproduction d'un couple donné**, afin de piloter
finement la dynamique de population.

**Why this priority** : ces réglages existent déjà dans le modèle mais sont invisibles ; les exposer
(surtout avec la **courbe gaussienne**) donne à l'utilisateur le contrôle de la simulation
temporelle. Dépend de la présence d'au moins une espèce (US1) mais reste testable seul sur l'espèce
par défaut.

**Independent Test** : ouvrir les réglages d'une espèce, déplacer les curseurs (âge de début/pic/fin,
probabilité au pic, pente) et constater que la **courbe** se met à jour ; régler portée M/N/X et %
divorce ; activer/désactiver la consanguinité ; sur la fiche d'un individu en couple, modifier le %
de reproduction de ce couple.

**Acceptance Scenarios** :

1. **Given** l'espèce « humain », **When** je modifie l'âge du pic et la pente, **Then** la **courbe
   gaussienne affichée** se met à jour immédiatement.
2. **Given** des paramètres de portée, **When** je règle M=2, N=5, X=20 %, **Then** les
   reproductions futures de cette espèce respectent ces bornes.
3. **Given** l'option consanguinité, **When** je la bascule sur « interdite », **Then** les futurs
   appariements entre proches (mêmes parents ou mêmes grands-parents) sont empêchés.
4. **Given** un couple déjà formé affiché sur une fiche, **When** je modifie son **% de reproduction
   propre**, **Then** cette valeur est utilisée pour ce couple lors des années suivantes (au lieu de
   la valeur dérivée de la gaussienne).
5. **Given** un réglage incohérent (ex. âge de fin < âge de début), **When** je valide, **Then** le
   système empêche ou corrige la saisie et explique la contrainte.

---

### User Story 3 - Décliner finement poids ET résilience (global / type / trait) (Priority: P3)

En tant qu'utilisateur, je veux **décliner sur 3 niveaux** (global → type de trait → trait
individuel) à la fois les **poids de tirage** (+ le **gabarit de mutation forte** AE/PE/PA/PR) **et**
la **résilience** (initiale, maximale, seuil de disparition), afin d'orienter finement la nature des
pouvoirs générés et le comportement héréditaire de chaque trait/type.

**Why this priority** : raffinement avancé. Les poids et la résilience globale existent déjà ; il
s'agit (a) de rendre les poids éditables et (b) d'ajouter la **surcharge par type/trait** de la
résilience — ce qui **étend le cœur** (résolution de surcharge dans le moteur d'hérédité). Indépendant
des US1/US2 (mais cohérent avec l'édition de catalogue).

**Independent Test** : régler le poids d'un type à 0 et vérifier qu'aucun trait de ce type n'est tiré ;
augmenter le poids d'un trait individuel et constater sa sur-représentation (seed fixe) ; définir une
résilience initiale par trait différente de celle de son type et du global, puis vérifier qu'une
naissance utilise bien la **valeur effective** résolue (trait → type → global).

**Acceptance Scenarios** :

1. **Given** les poids par type, **When** je mets le poids du type « Éléments » à 0, **Then** plus
   aucun trait « Élément » n'est tiré dans les générations futures.
2. **Given** les poids du gabarit de mutation forte, **When** j'augmente le poids de « PE »,
   **Then** les pouvoirs de mutation forte produisent plus souvent un gabarit Partie+État.
3. **Given** le poids d'un trait individuel, **When** je le double, **Then** ce trait est tiré plus
   fréquemment que ses pairs de même type (vérifiable à seed fixe).
4. **Given** une résilience initiale globale, une surcharge par type et une surcharge par trait,
   **When** une naissance traite un trait surchargé, **Then** la **valeur par trait** est utilisée
   (priorité trait → type → global).
5. **Given** un trait sans surcharge propre mais dont le type en a une, **When** une naissance le
   traite, **Then** la **valeur du type** s'applique (et non la globale).
6. **Given** une surcharge par trait, **When** je la supprime, **Then** le trait **réhérite** de la
   valeur de son type (ou de la globale si le type n'en a pas).

---

### Edge Cases

- **Suppression d'une entrée en cours d'usage** (trait/espèce/genre) : autorisée ; n'affecte que le
  futur ; les individus/couples existants gardent leurs références (cf. décision de cadrage).
- **Type de trait vidé** : un type peut se retrouver sans aucun trait ; les générations le sautent
  sans erreur.
- **Genre « tout »** : non supprimable, toujours présent par espèce.
- **Suppression d'une espèce utilisée** : autorisée ; les individus de cette espèce restent valides
  (l'espèce reste référencée pour eux) mais n'est plus proposée aux nouvelles créations.
- **Poids tous nuls dans un type / un gabarit** : comportement prévisible (aucun tirage possible dans
  ce sous-ensemble) sans plantage ni boucle infinie.
- **Saisies hors bornes** (pourcentages > 100, âges négatifs, M > N, pente ≤ 0, D ≤ 0) : refusées ou
  ramenées dans les bornes valides avec indication à l'utilisateur.
- **Édition après genèse** : modifier les paramètres génétiques/poids/catalogues **n'altère pas** les
  pouvoirs déjà calculés (calculés une seule fois à la naissance) ; les changements valent pour les
  **opérations futures**. Changer la **seed**, la **taille du batch** ou l'**année de naissance** du
  batch nécessite une **régénération explicite**.
- **Nom en double** dans un même type de trait / une même liste de genres : à éviter ou autoriser
  comme entrées distinctes — comportement défini et cohérent.
- **Surcharge de résilience absente** : un trait sans surcharge propre hérite de la valeur de son
  **type** ; sans surcharge de type, il hérite de la valeur **globale**. Supprimer une surcharge
  revient à réhériter du niveau supérieur (jamais d'état « indéfini »).
- **Surcharge incohérente** : une résilience initiale/maximale/seuil hors [0, 100] ou un seuil
  supérieur au plafond est refusé ou corrigé, à tous les niveaux (global/type/trait).

## Requirements *(mandatory)*

### Functional Requirements

#### Organisation & page de paramètres

- **FR-001** : Le système DOIT présenter une page de paramètres organisée par domaines (génération de
  pouvoir, hérédité/naissance, population, **espèces**, **catalogues**, **pondérations**), englobant
  les réglages globaux déjà présents.
- **FR-002** : Toute modification de paramètre DOIT être prise en compte par les **opérations
  futures** (genèse, naissances, appariements, tirages) sans recalcul rétroactif des pouvoirs déjà
  attribués.
- **FR-003** : Les paramètres restent de l'**état d'application** ; ils ne sont **pas** auto-sauvés
  (persistance par export/import uniquement, traitée en Feature 6).

#### Catalogues — traits (§3.1, §9.5)

- **FR-010** : L'utilisateur DOIT pouvoir **ajouter** un trait à l'un des **6 types fixes**
  (Remplacements, Parties du corps, États, Éléments, Ajouts, Actions).
- **FR-011** : L'utilisateur DOIT pouvoir **renommer** un trait existant ; le nouveau libellé DOIT
  être reflété partout où le trait est référencé.
- **FR-012** : L'utilisateur DOIT pouvoir **supprimer** un trait ; la suppression est **autorisée
  même s'il est utilisé** et **n'affecte que les tirages futurs** (les individus existants conservent
  le trait dans leur ADN).
- **FR-013** : Un même libellé PEUT exister dans **plusieurs types** comme entrées **distinctes et
  indépendantes**.
- **FR-014** : Les **6 types de traits** DOIVENT rester **fixes** (non ajoutables/supprimables).

#### Catalogues — espèces & genres (§3.4, §9.4, §9.5)

- **FR-020** : L'utilisateur DOIT pouvoir **ajouter, renommer et supprimer** des espèces ; « humain »
  est l'espèce par défaut.
- **FR-021** : Chaque espèce DOIT porter sa propre **liste de genres** éditable (ajout / renommage /
  suppression).
- **FR-022** : Le genre spécial **« tout »** DOIT être **toujours présent** dans chaque espèce et
  **non supprimable**.
- **FR-023** : La suppression d'une espèce utilisée est **autorisée** et **n'affecte que les
  créations futures** ; les individus existants de cette espèce restent valides.

#### Paramètres d'espèce & reproduction (§9.4, §6.6)

- **FR-030** : Pour chaque espèce, l'utilisateur DOIT pouvoir éditer la **gaussienne de
  reproduction** : âge de début, âge du pic, âge de fin, probabilité au pic, pente (écart-type).
- **FR-031** : Le système DOIT **afficher la courbe** de la gaussienne et la **mettre à jour en
  direct** lorsque ses paramètres changent.
- **FR-032** : Pour chaque espèce, l'utilisateur DOIT pouvoir éditer la **portée** : **M** (minimum),
  **N** (maximum), **X %** (chance d'enfant supplémentaire), et la **taille de groupe** de
  reproduction.
- **FR-033** : Pour chaque espèce, l'utilisateur DOIT pouvoir éditer le **% de divorce par an**.
- **FR-034** : Le système DOIT empêcher (ou corriger) les **configurations incohérentes** : âge de
  fin ≥ âge de début, pic dans l'intervalle, M ≤ N, pourcentages dans [0, 100], pente > 0, taille de
  groupe ≥ 1.
- **FR-035** : L'utilisateur DOIT pouvoir **régler la consanguinité** (autorisée / interdite ; défaut
  **interdite**) ; le réglage s'applique aux appariements futurs (§6.6.1).

#### Reproduction par couple (§6.6, §9.4)

- **FR-040** : L'utilisateur DOIT pouvoir **éditer le % de reproduction propre à un couple** existant ;
  cette valeur **prime** sur la valeur dérivée de la gaussienne pour ce couple lors des années
  suivantes.
- **FR-041** : Le réglage du % d'un couple DOIT être accessible depuis le **contexte du couple** (par
  défaut la **fiche** d'un de ses membres, section conjoints).

#### Pondérations de tirage (§9.1)

- **FR-050** : L'utilisateur DOIT pouvoir éditer les **poids par type de trait** utilisés dans les
  tirages.
- **FR-051** : L'utilisateur DOIT pouvoir éditer les **poids du gabarit de mutation forte**
  (AE / PE / PA / PR).
- **FR-052** : L'utilisateur DOIT pouvoir éditer le **poids individuel** de chaque trait ; le poids
  effectif d'un trait dans un tirage combine son **poids de type** et son **poids individuel**.

#### Déclinaison de la résilience par type/trait (§9.2)

- **FR-053** : L'utilisateur DOIT pouvoir décliner sur **3 niveaux** (global / par type de trait /
  par trait individuel) la **résilience initiale**, la **résilience maximale** et le **seuil de
  disparition** (« résilience minimale », §9.2).
- **FR-054** : La **valeur effective** de chacun de ces paramètres pour un trait donné DOIT être
  résolue par **surcharge** : la valeur **par trait** prime sur la valeur **par type**, qui prime sur
  la valeur **globale** ; en l'absence de surcharge, la valeur du niveau supérieur s'applique.
  Supprimer une surcharge fait **réhériter** le niveau supérieur.
- **FR-055** : Le **moteur d'hérédité** (§4) et la genèse DOIVENT utiliser la **valeur effective
  résolue** (et non la seule valeur globale) pour la résilience initiale, le plafond (maximale) et le
  seuil de disparition.
- **FR-056** : Cette déclinaison PEUT nécessiter une **extension du cœur** (structure de surcharge +
  fonction de résolution) ; elle DOIT rester **pure et déterministe** (Principes IV/I) et être
  couverte par des **tests à seed fixe**.

#### Déterminisme & intégrité (Principes I/IV/V)

- **FR-060** : Tous les réglages DOIVENT conserver le **déterminisme** : à seed fixe et séquence
  d'actions identiques, les résultats restent strictement reproductibles ; aucune source d'aléatoire
  hors RNG seedé.
- **FR-061** : L'édition des catalogues/paramètres NE DOIT **pas** muter les données déjà générées
  (population, ADN, pouvoirs) au-delà des références conservées.

### Key Entities *(include if feature involves data)*

- **Trait** : entrée d'un type (libellé + poids individuel). Identité par (type, libellé).
- **Type de trait** : l'un des **6 types fixes**.
- **Catalogue de traits** : ensemble des traits regroupés par type ; éditable.
- **Espèce** : libellé + liste de **genres** + paramètres de reproduction (gaussienne, portée M/N/X,
  taille de groupe, % divorce).
- **Genre** : libellé propre à une espèce ; « tout » toujours présent.
- **Paramètres globaux** : seed, génération de pouvoir, hérédité, population, poids de type/gabarit,
  résilience (initiale, maximale, seuil de disparition), option consanguinité (existants, complétés
  ici).
- **Surcharges par type / par trait** : valeurs optionnelles de **poids** et de **résilience**
  (initiale, maximale, seuil de disparition) au niveau d'un **type** ou d'un **trait individuel**,
  résolues par priorité **trait → type → global**.
- **Couple** : porte un **% de reproduction propre** optionnel surchargeant la gaussienne.
- **Courbe gaussienne** : représentation visuelle dérivée des paramètres de reproduction d'une espèce
  (lecture seule, recalculée à l'affichage).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : Un utilisateur peut **ajouter un trait** dans n'importe lequel des 6 types et le voir
  apparaître dans les tirages futurs, en moins de **30 secondes** sans documentation.
- **SC-002** : Un utilisateur peut **créer une nouvelle espèce** complète (genres + paramètres de
  reproduction) et la rendre sélectionnable pour la population.
- **SC-003** : **100 %** des paramètres décrits au §9 de la description sont **éditables** depuis
  l'interface, **y compris la déclinaison par type/trait** des poids **et** de la résilience
  (initiale, maximale, seuil de disparition).
- **SC-008** : La **résolution de surcharge** (trait → type → global) de la résilience est
  **déterministe** et vérifiée par **test à seed fixe** : le moteur d'hérédité utilise bien la valeur
  effective résolue.
- **SC-004** : La **courbe gaussienne** reflète tout changement de ses paramètres en **moins d'une
  seconde** (mise à jour perçue comme immédiate).
- **SC-005** : Après modification d'un paramètre, une **nouvelle genèse à seed identique** produit un
  résultat **strictement reproductible** (déterminisme vérifié par test à seed fixe).
- **SC-006** : Supprimer une entrée de catalogue utilisée **ne casse aucun individu existant** (0
  erreur d'affichage / 0 perte de données sur les individus déjà générés).
- **SC-007** : Une saisie invalide (hors bornes, incohérente) est **toujours** signalée ou corrigée,
  jamais acceptée silencieusement.

## Assumptions

- **Déclinaison 3 niveaux** : s'applique aux **poids** (type + trait) **et** à la **résilience**
  (initiale, maximale, seuil de disparition), résolues par surcharge **trait → type → global**. Cette
  extension **modifie le cœur** (structure de surcharge + résolution, pure et déterministe) — assumé
  par l'utilisateur (Clarification 2026-06-12).
- **Suppression d'entrées de catalogue** : **autorisée**, **effet futur seulement** ; pas de
  suppression en cascade dans les ADN existants (décision de cadrage).
- **Recalcul** : les pouvoirs sont calculés **une seule fois à la naissance** (§3.3) ; les
  changements de paramètres n'affectent que les **naissances/tirages futurs**. Seed, taille du batch
  et année de naissance du batch nécessitent une **régénération explicite** pour prendre effet.
- **% de reproduction par couple** : édité depuis la **fiche** d'un membre (section conjoints), par
  défaut ; pas de page « couples » dédiée dans cette feature.
- **Persistance** : l'export/import complet (config incluant catalogues, espèces, poids…) relève de
  la **Feature 6** ; ici, les réglages vivent dans l'état d'application de la session.
- **Aucune nouvelle dépendance** (Constitution VIII) : la courbe gaussienne est rendue avec les
  moyens déjà en place (pas de librairie de graphes).
- **Réutilisation du modèle existant** : `Trait.weight`, `Espece` (params de reproduction, genres) et
  `Parameters` (poids de type/gabarit, résilience globale, consanguinité) existent déjà ; la feature
  les **expose** et les rend éditables. **Seule addition au cœur** : une structure de **surcharges
  par type/trait** de la résilience + sa **résolution** dans le moteur d'hérédité (pure, déterministe,
  testée). Pas d'autre refonte.
- **Cœur pur** : toute logique métier (résolution de poids, validation) reste dans `src/core` pur,
  l'UI ne fait que consommer (Principe IV).
