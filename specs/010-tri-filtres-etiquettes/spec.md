# Feature Specification: Filtres de trait, tri par colonne & étiquettes de pouvoir enrichies

**Feature Branch**: `010-tri-filtres-etiquettes`

**Created**: 2026-07-06

**Status**: Draft

**Input**: User description : « Dans les filtres (page Population **et** Sandbox), section trait :
ajouter "aucun trait actif", "au moins un trait actif", "au moins un trait". Pouvoir cliquer sur les
noms de colonnes pour trier la liste (ex. clic sur "âge" → croissant ; reclic → décroissant ; reclic →
tri par défaut). Nom = alphabétique / inverse / défaut. Date de naissance = chronologique / inverse /
défaut. Pouvoir(s) = non triable. Sur les étiquettes de pouvoir affichées dans les listes, afficher la
puissance et la maîtrise sous la forme "P : 10" et "M : 5". »

> **Contexte** : trois améliorations d'exploration de la population, appliquées aux **listes** existantes
> (vue **Population** et onglet **Population** de la **Sandbox**, qui partagent la barre de filtres et le
> moteur de filtrage). Elles **complètent** le système de filtres (Feature 004) et la refonte des listes
> (Feature 008), sans rien retirer.

## Clarifications

### Session 2026-07-06

- Q: Comportement du réglage « présence de trait » à la sélection ? → A: **Mono-sélection** — au plus une
  des trois options active à la fois, re-clic pour la désactiver (ergonomie du filtre « Pouvoir » existant).
- Q: « au moins un trait » compte-t-il les traits inactifs ? → A: **Oui** — ≥1 trait dans l'ADN, **actif ou
  inactif** (distinct de « au moins un trait actif »).
- Q: « Réinitialiser » remet-il aussi le tri des colonnes à l'état par défaut ? → A: **Oui** —
  « Réinitialiser » remet à l'état par défaut **filtres ET tri** de la liste concernée.
- Q: Ajouter une 4ᵉ option de présence de trait ? → A: **Oui** — ajouter **« au moins un trait inactif »**
  (≥1 trait inactif dans l'ADN) au même endroit et de même nature que les trois autres (mono-sélection).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filtrer par présence de trait (Priority: P1)

En tant qu'utilisateur, dans la **section Trait** de la barre de filtres (Population **et** Sandbox), je
veux **quatre** filtres de **présence** indépendants du choix de traits précis : **« aucun trait actif »**,
**« au moins un trait actif »**, **« au moins un trait inactif »**, **« au moins un trait »**, afin d'isoler
rapidement les individus selon qu'ils portent ou non des traits (actifs ou en sommeil).

**Why this priority**: C'est l'ajout le plus structurant (nouvelle dimension de filtre partagée par les
deux vues) et le plus demandé pour explorer la population ; il apporte de la valeur seul.

**Independent Test**: Sur une population générée, activer chaque filtre de présence et vérifier que la
liste ne contient que les individus correspondants ; le compteur « N / total » reflète le sous-ensemble ;
le même filtre fonctionne à l'identique en Population et en Sandbox.

**Acceptance Scenarios**:

1. **Given** une population mixte, **When** je choisis « aucun trait actif », **Then** seuls les individus
   ayant **0 trait actif** dans leur ADN restent affichés.
2. **Given** une population mixte, **When** je choisis « au moins un trait actif », **Then** seuls les
   individus ayant **≥ 1 trait actif** restent affichés.
3. **Given** une population mixte, **When** je choisis « au moins un trait inactif », **Then** seuls les
   individus ayant **≥ 1 trait inactif** restent affichés.
4. **Given** une population mixte, **When** je choisis « au moins un trait », **Then** seuls les individus
   ayant **≥ 1 trait** dans leur ADN (actif **ou** inactif) restent affichés.
5. **Given** un filtre de présence actif, **When** je le re-clique (ou clique « Réinitialiser »), **Then**
   le filtre de présence est **désactivé** et n'a plus d'effet.
6. **Given** un filtre de présence **et** un autre filtre renseignés (espèce, statut, traits précis…),
   **When** j'affiche la liste, **Then** les critères se **combinent** (ET entre dimensions), cohérents
   avec le comportement de filtrage existant.
7. **Given** la Sandbox, **When** j'utilise ces filtres, **Then** le comportement est **identique** à la
   Population.

---

### User Story 2 - Trier la liste en cliquant sur les en-têtes de colonnes (Priority: P2)

En tant qu'utilisateur, je veux **cliquer sur l'intitulé d'une colonne** pour trier la liste, avec un
cycle à **trois états** : **défaut → croissant → décroissant → défaut**, afin d'ordonner les individus
selon la dimension qui m'intéresse.

**Why this priority**: Améliore nettement la lisibilité de grandes populations ; indépendant des filtres,
testable seul.

**Independent Test**: Cliquer successivement sur une colonne triable et vérifier la rotation des 3 états
et l'ordre obtenu ; vérifier que « Pouvoir(s) » n'est pas cliquable ; vérifier en Population **et** Sandbox.

**Acceptance Scenarios**:

1. **Given** la liste au tri **par défaut**, **When** je clique sur **« Âge »**, **Then** la liste est
   triée par âge **croissant** ; un indicateur visuel signale la colonne et le sens du tri.
2. **Given** la liste triée par âge croissant, **When** je re-clique sur « Âge », **Then** elle passe en
   **décroissant** ; **When** je clique une 3ᵉ fois, **Then** elle revient au **tri par défaut**.
3. **Given** la colonne **« Nom »**, **When** je la clique, **Then** le tri est **alphabétique** (puis
   inverse, puis défaut) — insensible à la casse et aux accents, cohérent avec la recherche par nom.
4. **Given** la colonne **« Date de naissance »**, **When** je la clique, **Then** le tri est
   **chronologique** (puis inverse, puis défaut).
5. **Given** la colonne **« Pouvoir(s) »**, **When** je la clique, **Then** **rien ne se passe** (colonne
   non triable, non présentée comme cliquable).
6. **Given** un tri actif **When** je change un filtre ou avance le temps, **Then** le tri **reste
   appliqué** sur la liste filtrée résultante.
7. **Given** deux individus **égaux** sur la clé de tri, **Then** leur ordre relatif reste **déterministe
   et stable** (départage constant).

---

### User Story 3 - Étiquettes de pouvoir enrichies (puissance & maîtrise) dans les listes (Priority: P3)

En tant qu'utilisateur, sur chaque **étiquette de pouvoir** affichée **dans les listes**, je veux voir la
**puissance** et la **maîtrise** de ce pouvoir sous la forme **« P : 10 »** et **« M : 5 »**, afin de
comparer les individus sans ouvrir chaque fiche.

**Why this priority**: Enrichissement d'affichage utile mais autonome ; n'impacte ni le filtrage ni le tri.

**Independent Test**: Générer une population, repérer un individu à pouvoir connu, vérifier que son
étiquette affiche le libellé du pouvoir **plus** « P : <puissance> » et « M : <maîtrise> » correspondant
aux valeurs de la fiche.

**Acceptance Scenarios**:

1. **Given** un individu ayant un pouvoir de puissance 10 et maîtrise 5, **When** j'affiche la liste,
   **Then** son étiquette montre le libellé **et** « P : 10 » et « M : 5 ».
2. **Given** un individu à **plusieurs** pouvoirs, **When** j'affiche la liste, **Then** **chaque**
   étiquette porte ses **propres** valeurs P et M.
3. **Given** un individu **sans** pouvoir, **Then** l'affichage reste inchangé (« — »).
4. **Given** les valeurs affichées, **When** je compare à la fiche détaillée, **Then** puissance et
   maîtrise **coïncident**.
5. **Given** l'enrichissement, **When** j'affiche les listes, **Then** il apparaît **aussi bien** en
   Population qu'en Sandbox.

---

### Edge Cases

- **ADN vide** (aucun trait) : « aucun trait actif » **inclut** l'individu ; « au moins un trait actif »,
  « au moins un trait inactif » et « au moins un trait » l'**excluent**.
- **Traits tous inactifs** : « aucun trait actif » inclut ; « au moins un trait inactif » inclut ; « au
  moins un trait » inclut ; « au moins un trait actif » exclut.
- **Traits tous actifs** : « au moins un trait actif » inclut ; « au moins un trait » inclut ; « au moins un
  trait inactif » exclut ; « aucun trait actif » exclut.
- **Filtre de présence vs filtre de traits précis** : ce sont deux réglages **distincts** de la section
  Trait ; ils se combinent (ET) sans se remplacer.
- **Tri + pagination** : le tri s'applique à l'**ensemble filtré** avant la pagination (pas seulement à la
  page courante).
- **Tri + changement de population** (avance du temps, make it real, génération) : le tri en cours reste
  valide et se ré-applique au nouvel ensemble.
- **Colonnes masquées en très petit écran** : l'accès au tri d'une colonne masquée n'est pas requis
  (dégradation acceptable), sans blocage.
- **Étiquette P/M longue** : l'ajout de « P : x » / « M : y » ne doit pas casser la mise en page des
  étiquettes (retour à la ligne / troncature maîtrisée).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La section **Trait** de la barre de filtres DOIT proposer un réglage de **présence de trait**
  à **quatre options** : « aucun trait actif », « au moins un trait actif », « au moins un trait inactif »,
  « au moins un trait ».
- **FR-002**: Le réglage de présence DOIT être en **mono-sélection** : **au plus une** option active à la
  fois et **désactivable** par re-clic (aucune option sélectionnée = sans effet) — clarification 2026-07-06.
- **FR-003**: « aucun trait actif » DOIT retenir les individus à **0 trait actif** ; « au moins un trait
  actif » ceux à **≥ 1 trait actif** ; « au moins un trait inactif » ceux à **≥ 1 trait inactif** ; « au
  moins un trait » ceux à **≥ 1 trait** (actif ou inactif).
- **FR-004**: Le réglage de présence DOIT **se combiner** (ET) avec les autres dimensions de filtre et
  **coexister** avec le filtre de traits précis (portée actifs/inactifs/tous) sans le remplacer.
- **FR-005**: Les filtres de présence DOIVENT être disponibles et se comporter **à l'identique** dans la
  vue **Population** et dans l'onglet **Population** de la **Sandbox**.
- **FR-006**: Les en-têtes des colonnes **Nom**, **Date de naissance** et **Âge** DOIVENT être
  **cliquables** pour trier, avec un cycle **défaut → croissant → décroissant → défaut**.
- **FR-007**: La colonne **Pouvoir(s)** NE DOIT PAS être triable et NE DOIT PAS être présentée comme
  cliquable.
- **FR-008**: Le tri **Nom** DOIT être **alphabétique** insensible casse/accents ; le tri **Date de
  naissance** DOIT être **chronologique** ; le tri **Âge** DOIT être **numérique**. Chaque sens inverse
  est l'ordre opposé ; l'état « défaut » rétablit l'**ordre naturel existant** de la liste.
- **FR-009**: Le tri DOIT être **déterministe et stable** : à clé de tri égale, un **départage constant**
  fixe l'ordre ; le résultat est reproductible.
- **FR-010**: L'état de tri (colonne + sens) DOIT être **indiqué visuellement** sur l'en-tête concerné.
- **FR-011**: Le tri DOIT s'appliquer à l'**ensemble filtré** puis alimenter la **pagination** ; il DOIT
  survivre aux changements de filtres et d'année (sauf action explicite « Réinitialiser », cf. FR-018).
- **FR-012**: Le tri DOIT être disponible et cohérent dans la **Population** et dans la **Sandbox**, chaque
  liste gardant son **propre** état de tri.
- **FR-013**: Chaque **étiquette de pouvoir** affichée **dans les listes** DOIT afficher, en plus du
  libellé, la **puissance** et la **maîtrise** du pouvoir sous la forme **« P : <puissance> »** et
  **« M : <maîtrise> »**.
- **FR-014**: Les valeurs P/M affichées DOIVENT **correspondre** à celles de la fiche détaillée de
  l'individu pour le même pouvoir.
- **FR-015**: Un individu **sans pouvoir** DOIT conserver l'affichage neutre existant (« — »).
- **FR-016**: Ces ajouts NE DOIVENT entraîner **aucune régression** : filtres, recherche, pagination,
  navigation vers la fiche, et l'ensemble des fonctionnalités de `rsrc/DefUi.md` restent opérants.
- **FR-018**: Le bouton **« Réinitialiser »** DOIT remettre à l'état par défaut **à la fois** les filtres
  (y compris le réglage de présence) **et** le tri de la liste concernée (clarification 2026-07-06).
- **FR-017**: Les contraintes du projet DOIVENT être respectées : **déterminisme** (aucun aléatoire/horloge
  introduit), **cœur pur** (toute nouvelle logique de filtrage/tri reste dans le cœur, sans dépendance
  UI), **persistance applicative par fichier uniquement** (les états de filtre/tri sont de l'**interface**,
  non exportés), **français**, **accessibilité** (en-têtes triables actionnables au clavier + ARIA) et
  **100 % statique/hors-ligne**.

### Key Entities *(include if feature involves data)*

- **Réglage de présence de trait** (dimension de filtre) : valeur parmi { *aucun trait actif*, *au moins un
  trait actif*, *au moins un trait inactif*, *au moins un trait*, *aucun (désactivé)* } — état
  d'**interface** (session), mono-sélection, combiné aux autres critères.
- **État de tri de liste** (interface, par liste) : colonne triée (nom | date | âge | *aucune*) + sens
  (croissant | décroissant | *défaut*). Non exporté, non persistant au-delà de la session.
- **Étiquette de pouvoir (vue liste)** : libellé du pouvoir **+** puissance **+** maîtrise (données déjà
  présentes sur l'individu ; ici **exposées** dans la vue liste).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les 4 filtres de présence produisent le **bon sous-ensemble** dans **100 %** des cas testés
  (y compris ADN vide, traits tous inactifs, traits tous actifs), identiquement en Population et Sandbox.
- **SC-002**: Le clic sur une colonne triable parcourt les **3 états** dans l'ordre attendu et l'ordre
  affiché est **correct et stable** dans **100 %** des cas ; « Pouvoir(s) » ne trie jamais.
- **SC-003**: Filtre et tri sont appliqués et rendus en **moins d'1 seconde** sur une population de taille
  courante, **sans rechargement**.
- **SC-004**: **100 %** des étiquettes de pouvoir en liste affichent des valeurs P/M **égales** à la fiche
  correspondante ; les individus sans pouvoir gardent « — ».
- **SC-005**: **0 régression** sur les filtres/recherche/pagination/navigation existants et sur
  `rsrc/DefUi.md`.
- **SC-006**: Le déterminisme est préservé : à seed et actions identiques, l'ordre trié et les sous-
  ensembles filtrés sont **strictement reproductibles**.

## Assumptions

- **« au moins un trait »** désigne la présence d'**au moins un trait dans l'ADN**, qu'il soit **actif ou
  inactif** (l'ADN stocke les deux) — confirmé (clarification 2026-07-06).
- **Présentation du réglage de présence** : **mono-sélection** — au plus une option active, désactivable
  par re-clic (même ergonomie que le filtre « Pouvoir » existant *A un pouvoir / Aucun pouvoir*) — confirmé
  (clarification 2026-07-06).
- **« Tri par défaut »** = l'**ordre naturel actuel** de la liste (chronologique par date de naissance puis
  départage stable), inchangé par rapport à l'existant.
- **Portée des « listes » pour l'enrichissement P/M** : les **listes tabulaires** de Population et de
  Sandbox (onglet Population). L'arbre généalogique et la fiche détaillée sont **hors périmètre** (la fiche
  affiche déjà puissance/maîtrise autrement).
- **États de filtre/tri** : de l'**interface** (session), non inclus dans l'export/import de l'état
  applicatif ; chaque liste conserve son propre état de tri. Le bouton « Réinitialiser » remet filtres
  **et** tri à l'état par défaut (clarification 2026-07-06).
- **Cœur intouché côté logique métier** : la génétique, l'hérédité et la simulation ne changent pas ; seule
  s'ajoute de la **logique de filtrage/tri en lecture seule** (déjà localisée dans le cœur généalogie) et
  de l'**exposition de données** existantes (puissance/maîtrise) dans la vue liste.
