# Feature Specification: Sandbox isolée & « make it real »

**Feature Branch**: `007-sandbox-make-it-real`

**Created**: 2026-06-17

**Status**: Draft

**Input**: User description: "on va faire la feature 7 de rsrc/plangénéral … la reproduction manuelle en page
principale disparaît au profit de la sandbox … création d'individus, choix d'une année, reset, suppression …
TOUTE MODIFICATION DANS LA SANDBOX EST ISOLÉE ; elle n'affecte la population réelle qu'au clic « make it real »."

> Source de vérité fonctionnelle : `rsrc/DescriptionProjet.md` §10.2 (reproduction manuelle = sandbox
> uniquement), §10.3 (sandbox + « make it real »), §6.8 (création/édition manuelle d'individus), §8.4
> (écran sandbox), §6.6 (couples/divorce), §6.7 (mort). **NE PAS modifier sans accord explicite**
> (Constitution Principe IX). Périmètre tracé sur le plan général (Feature 7).

## User Scenarios & Testing *(mandatory)*

Jusqu'ici, la **reproduction manuelle** d'individus se déclenchait depuis la **page principale** : c'était
le seul moyen d'exercer le moteur génétique tant que la sandbox n'existait pas. Cette feature crée le
**bac à sable isolé** et **y déplace** la reproduction manuelle. Le mode principal ne propose plus que
l'**avancement du temps** (Feature 3). Dans la sandbox, l'utilisateur expérimente librement (reproduire,
créer, cloner, supprimer, naviguer dans le temps) **sans aucun effet** sur la population réelle, jusqu'à
ce qu'il valide explicitement via **« make it real »**.

### User Story 1 - Bac à sable isolé & « make it real » (Priority: P1) 🎯 MVP

En tant qu'utilisateur, je veux ouvrir un **bac à sable** qui démarre comme une **copie de la population
réelle**, y **reproduire manuellement** des individus sélectionnés (1, 2 ou plusieurs), puis soit **tout
annuler** (reset), soit **promouvoir** mes changements dans la population réelle via **« make it real »** —
en ayant la **garantie** que rien n'affecte la population réelle tant que je n'ai pas cliqué.

**Why this priority**: C'est le cœur de la feature et la tranche autoportante minimale : elle prouve
l'**isolation** (Principe d'isolement du §10.3) et la **promotion explicite**, et acte le **déplacement**
de la reproduction manuelle de la page principale vers la sandbox. Sans elle, les autres histoires n'ont
pas de contenant.

**Independent Test**: Ouvrir la sandbox sur une population existante, reproduire manuellement deux
individus → un enfant apparaît **dans la sandbox** ; vérifier que la **population principale est
inchangée** ; cliquer **« make it real »** → l'enfant est désormais présent dans la population réelle.
Vérifier aussi que la page principale **ne propose plus** de reproduction manuelle.

**Acceptance Scenarios**:

1. **Given** une population réelle générée, **When** j'ouvre la sandbox, **Then** elle affiche une **copie
   fidèle** de la population, de la généalogie, des couples et de l'année courante.
2. **Given** la sandbox ouverte, **When** je sélectionne 1, 2 ou plusieurs individus et déclenche une
   reproduction manuelle, **Then** un (ou des) enfant(s) sont créés **dans la sandbox** via le moteur
   génétique existant (déterministe), **sans** modifier la population réelle.
3. **Given** des modifications faites en sandbox, **When** je clique **« make it real »**, **Then** la
   population réelle est mise à jour pour refléter l'état du bac à sable (validation explicite).
4. **Given** des modifications faites en sandbox, **When** je clique **« reset »**, **Then** la sandbox
   est restaurée à l'**état actuel de la population réelle** (mes changements de sandbox sont abandonnés).
5. **Given** la page principale, **When** je la consulte, **Then** la **reproduction manuelle n'y est plus
   disponible** ; seul l'**avancement du temps** fait évoluer la population.

---

### User Story 2 - Création, clonage et suppression d'individus en sandbox (Priority: P2)

En tant qu'utilisateur, je veux, **dans la sandbox**, **créer un nouvel individu entièrement personnalisé**
(en choisissant tous les paramètres qui le caractérisent), **cloner** un individu existant en copie
éditable, et **supprimer** des individus — afin de construire des scénarios sur mesure.

**Why this priority**: Complète la palette d'édition du bac à sable (§6.8). Dépend du contenant (US1) mais
apporte une valeur distincte et testable indépendamment.

**Independent Test**: Dans la sandbox, créer un individu personnalisé (espèce, genre, ADN, pouvoirs,
notes) → il apparaît dans la sandbox ; cloner un individu existant et modifier la copie ; supprimer un
individu **sans descendant** → il disparaît de partout dans la sandbox et les liens de ses proches sont
correctement mis à jour. Tout cela **sans** toucher la population réelle avant « make it real ».

**Acceptance Scenarios**:

1. **Given** la sandbox ouverte, **When** je crée un nouvel individu en renseignant librement ses champs
   (espèce, genre, ADN, pouvoirs avec puissance/maîtrise, notes…), **Then** il est ajouté à la population
   de la sandbox.
2. **Given** un individu existant, **When** je le **clone**, **Then** une copie **éditable** et
   indépendante est créée dans la sandbox.
3. **Given** un individu **sans descendant**, **When** je le supprime, **Then** il **disparaît de partout**
   (population, liens des autres) dans la sandbox.
4. **Given** un individu **avec au moins un descendant**, **When** je tente de le supprimer, **Then** la
   suppression est **refusée** (message clair).
5. **Given** un individu supprimé qui avait un **conjoint**, **When** la suppression est appliquée,
   **Then** le conjoint **revient à son état antérieur** à la rencontre (célibataire ou divorcé), le lien
   vers la personne supprimée étant retiré.
6. **Given** un individu supprimé qui avait des **parents**, **When** la suppression est appliquée,
   **Then** ses parents **ne le listent plus** parmi leurs enfants.

---

### User Story 3 - Navigation temporelle dans la sandbox (Priority: P3)

En tant qu'utilisateur, je veux, **dans la sandbox**, **choisir une année** comprise entre l'**année de
départ** et l'**année courante** (incluses) pour **voir l'état de la population à cette année** ; et toute
personne née par **reproduction manuelle** doit naître à un **moment aléatoire de l'année sélectionnée**.

**Why this priority**: Confort d'exploration avancé qui enrichit la sandbox sans être indispensable au MVP.
Dépend du contenant (US1).

**Independent Test**: Dans la sandbox, sélectionner une année antérieure à l'année courante → seuls les
individus déjà nés à cette année sont visibles ; déclencher une reproduction manuelle → l'enfant reçoit
une **date de naissance tirée aléatoirement** dans l'année sélectionnée.

**Acceptance Scenarios**:

1. **Given** la sandbox ouverte, **When** je choisis une année entre l'année de départ et l'année courante
   (incluses), **Then** la sandbox affiche l'**état de la population à cette année**.
2. **Given** une année sélectionnée antérieure à l'année courante, **When** je reproduis manuellement,
   **Then** l'enfant **naît dans l'année sélectionnée** (jour précis tiré aléatoirement, cf. §6.5).
3. **Given** l'année de départ sélectionnée, **When** je consulte la population, **Then** seuls les
   individus présents à cette année (batch initial et antérieurs) sont affichés.

---

### Edge Cases

- **Reproduction manuelle à partir d'un seul individu** : autorisée (1, 2 ou plusieurs — §10.2).
- **Reproduction mêlant individus réels (copiés en sandbox) et individus temporaires** : autorisée (§10.3).
- **Suppression d'un individu engagé dans un couple ET ayant des ex** : tous les liens correspondants sont
  remis à l'état antérieur côté partenaires.
- **« Make it real » sans aucune modification** : opération sans effet (population réelle inchangée).
- **Reset alors que des modifications existent** : les modifications de sandbox sont **abandonnées** sans
  toucher la population réelle.
- **Année sélectionnée = année courante** : la sandbox montre la population courante complète.
- **Année sélectionnée = année de départ** : seul le batch initial (et antérieurs) est visible.
- **Création/clonage référençant un trait ou une espèce absent du catalogue courant** : affichage via le
  **libellé de repli** (acquis Feature 5), sans blocage.
- **Tentative de reproduction manuelle depuis la page principale** : impossible (fonction retirée).

## Requirements *(mandatory)*

### Functional Requirements

#### Déplacement de la reproduction manuelle

- **FR-001**: La **page principale** NE DOIT PLUS proposer la **reproduction manuelle** d'individus ; le
  seul levier d'évolution de la population réelle y reste l'**avancement du temps** (Feature 3).
- **FR-002**: La **reproduction manuelle** (sélection de **1, 2 ou plusieurs** individus) DOIT être
  disponible **uniquement** dans la sandbox (§10.2).

#### Bac à sable isolé

- **FR-003**: Le système DOIT proposer un **mode sandbox** dont l'état initial est une **copie** de la
  population réelle, de la généalogie, des couples et de l'année courante.
- **FR-004**: **Toute** modification effectuée dans la sandbox (reproduction, création, clonage,
  suppression, navigation temporelle) DOIT être **isolée** : elle NE DOIT PAS affecter la population
  réelle tant que **« make it real »** n'a pas été validé.
- **FR-005**: Le système DOIT fournir un bouton **« make it real »** qui **promeut** l'état du bac à sable
  dans la population réelle (validation explicite).
- **FR-006**: Le système DOIT fournir un bouton **« reset »** qui restaure la sandbox à l'**état actuel de
  la population réelle** (les modifications de sandbox sont abandonnées).

#### Reproduction manuelle (en sandbox)

- **FR-007**: Dans la sandbox, l'utilisateur DOIT pouvoir sélectionner **1, 2 ou plusieurs** individus et
  déclencher une **reproduction manuelle** produisant un ou des enfants via le **pipeline de naissance**
  et le **moteur génétique existants** (déterministe — Feature 2/§5).
- **FR-008**: Un enfant né par reproduction manuelle DOIT naître à un **moment aléatoire** (jour tiré
  aléatoirement) de l'**année sélectionnée** dans la sandbox (§6.5).
- **FR-009**: La reproduction manuelle DOIT pouvoir combiner des individus **temporaires** (créés en
  sandbox) et des individus **réels** (copiés en sandbox).

#### Création / édition manuelle d'individus (en sandbox)

- **FR-010**: Dans la sandbox, l'utilisateur DOIT pouvoir **créer un nouvel individu personnalisé** en
  renseignant librement **tous les champs qui le caractérisent** (espèce, genre, ADN, pouvoirs avec
  puissance/maîtrise, notes, etc. — §6.8).
- **FR-011**: Dans la sandbox, l'utilisateur DOIT pouvoir **cloner** un individu existant en une **copie
  éditable** et indépendante (§6.8).

#### Suppression d'individus (en sandbox)

- **FR-012**: Dans la sandbox, l'utilisateur DOIT pouvoir **supprimer** un individu **uniquement s'il n'a
  aucun descendant** ; sinon la suppression DOIT être **refusée** avec un message clair.
- **FR-013**: La suppression d'un individu DOIT le faire **disparaître de partout** (population et tous les
  liens où il apparaît) dans la sandbox.
- **FR-014**: Lorsqu'un individu supprimé avait un **conjoint** (actuel ou ex), le partenaire DOIT
  **revenir à l'état antérieur** à la rencontre (célibataire ou divorcé), le lien vers l'individu supprimé
  étant retiré.
- **FR-015**: Lorsqu'un individu supprimé avait des **parents**, ces parents NE DOIVENT PLUS le compter
  parmi leurs **enfants**.

#### Navigation temporelle (en sandbox)

- **FR-016**: Dans la sandbox, l'utilisateur DOIT pouvoir **choisir une année** comprise entre l'**année de
  départ** et l'**année courante** (bornes **incluses**).
- **FR-017**: La sélection d'une année DOIT afficher l'**état de la population à cette année** (les
  individus non encore nés à cette année ne sont pas affichés).

#### Déterminisme & persistance

- **FR-018**: Les opérations de sandbox (reproduction, créations, suppressions) DOIVENT rester
  **déterministes** (issues de la seed unique) ; l'isolation NE DOIT PAS perturber l'état aléatoire de la
  population réelle tant que « make it real » n'a pas eu lieu.
- **FR-019**: La persistance reste **exclusivement** par export/import de fichier (Principe VI) : l'entrée
  en sandbox et le « make it real » ne déclenchent **aucune** sauvegarde automatique.

### Key Entities *(include if feature involves data)*

- **État sandbox** : copie de travail **isolée** de l'état applicatif (population, généalogie, couples,
  année, position de l'état aléatoire) ; sert de brouillon jusqu'à promotion.
- **Individu temporaire** : individu créé ou cloné dans la sandbox, n'existant pas (encore) dans la
  population réelle.
- **Année sélectionnée** : repère temporel de la sandbox (entre année de départ et année courante) servant
  à la fois de **lentille d'affichage** et d'**année de naissance** des enfants issus de reproduction
  manuelle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Une modification effectuée en sandbox n'altère **jamais** la population réelle avant
  « make it real » (**0 fuite** observée sur les scénarios de test).
- **SC-002**: Après « make it real », la population réelle reflète **100 %** des changements du bac à sable.
- **SC-003**: « Reset » restaure la sandbox à l'**état réel courant à l'identique** (**100 %** des individus
  et liens correspondants).
- **SC-004**: La **reproduction manuelle** n'est plus accessible depuis la page principale (**0 point
  d'entrée** restant) et reste accessible dans la sandbox.
- **SC-005**: La suppression est **refusée** pour **100 %** des individus ayant au moins un descendant, et
  **acceptée** sinon.
- **SC-006**: Après suppression d'un individu, **aucune référence orpheline** ne subsiste (conjoints,
  enfants des parents) — **0 lien pendant**.
- **SC-007**: La sélection d'une année antérieure n'affiche **que** les individus déjà nés à cette année
  (vérifiable sur un jeu de test).
- **SC-008**: Deux sessions de sandbox identiques (même seed, mêmes actions) produisent des résultats
  **identiques** (déterminisme).

## Assumptions

- **Sémantique de « make it real »** : la promotion fait que l'**état du bac à sable devient l'état réel**
  (ajouts, suppressions et naissances inclus). L'année éventuellement sélectionnée pour l'affichage est une
  **lentille** et ne modifie pas à elle seule l'« année courante » réelle. *(À confirmer en clarification.)*
- **Isolation & RNG** : la sandbox travaille sur une **copie** de l'état (y compris la position du RNG) ;
  la décision « rejouer vs transférer » les tirages lors de « make it real » est un **détail
  d'implémentation** tranché au `/speckit-plan` (point d'attention du plan général, sans changer le
  comportement observable d'isolation).
- **État à une année** : « voir l'état à l'année *Y* » = afficher les individus **nés au plus tard en *Y***,
  âges recalculés à *Y* ; les décès (manuels, sans date — §6.7) sont affichés selon leur statut courant.
  *(À préciser en clarification si besoin.)*
- **Réutilisation de l'existant** : la reproduction manuelle réutilise le **moteur de reproduction**
  (Feature 2) ; seul son **point d'entrée UI** est déplacé de la page principale vers la sandbox. La
  suppression réutilise les règles de couples/conjoints (§6.6) et la mort manuelle (§6.7) reste inchangée.
- **Pas de nouvelle dépendance** (Principe VIII) ; **cœur pur** pour la logique sandbox (copie isolée,
  reproduction, création, suppression), **UI** pour l'écran sandbox et les boutons (make it real / reset /
  sélecteur d'année). **Anonymat** (Principe X) et **déterminisme** (Principe I) préservés.
- **Sandbox = état d'interface** : il n'est **pas** exporté en tant que tel (Principe VI) ; seul l'état
  réel (après « make it real ») entre dans le périmètre d'export de la Feature 6.
