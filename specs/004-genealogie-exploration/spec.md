# Feature Specification: Généalogie & exploration

**Feature Branch**: `004-genealogie-exploration`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "on va faire la feature 4 de rsrc/plangénéral.md"

> Source de vérité fonctionnelle : `rsrc/DescriptionProjet.md` §8.1–8.5 (non modifiable sans
> autorisation explicite — Principe IX). Cette feature = la couche **exploration / visualisation**
> par-dessus les données produites par les Features 1–3 (genèse, hérédité, temps/population).

## Clarifications

### Session 2026-06-10

- Q: Faut-il afficher les conjoints (actuel/ex) dans l'arbre généalogique ? → A: **Oui** — afficher
  le **conjoint actuel et les ex** d'un individu de l'arbre, **ainsi que les enfants issus de ces
  unions** ; **ne pas** afficher les enfants que ces ex/conjoints ont eus avec **d'autres**
  personnes, **ni** les **parents** des ex/conjoints.
- Q: Sémantique des filtres multi-valeurs au sein d'une dimension ? → A: **OU** entre les valeurs
  d'une **même** dimension, **ET** entre dimensions différentes.
- Q: Mode d'affichage des traits par défaut sur la fiche (§8.5) ? → A: **Mode 3** (pouvoirs +
  traits actifs + traits inactifs + résilience).
- Q: Portée du filtre « trait » (actifs / inactifs / tous) ? → A: **Au choix** de l'utilisateur —
  un sélecteur de portée (**actifs** / **inactifs** / **tous**) accompagne le filtre trait.
- Q: Fonctionnement du filtre « pouvoir » ? → A: **Présence/absence seulement** (« a un pouvoir »
  / « aucun pouvoir »), **pas** de sélection d'un pouvoir précis.
- Q: Affichage d'un individu atteignable par plusieurs chemins (consanguinité) ? → A: **Affiché à
  chaque emplacement** (répétition assumée, bornée par la profondeur) — vue arbre, **pas** de
  déduplication ni de vue graphe.
- Q: Plafond de la profondeur N (page dédiée) ? → A: **Aucun plafond** (N ≥ 1, libre).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Arbre généalogique centré sur un individu (Priority: P1) 🎯 MVP

Depuis la fiche d'un individu, l'utilisateur voit un **arbre généalogique centré sur lui** à
**profondeur fixe 2** (2 niveaux d'ancêtres au-dessus, 2 niveaux de descendants en dessous), dans
la mesure des liens disponibles. À chaque individu de l'arbre sont rattachés son **conjoint actuel
et ses ex**, ainsi que les **enfants issus de ces unions** (et **uniquement** ceux-là : pas les
enfants que ces ex/conjoints ont eus avec d'autres, ni les parents des ex/conjoints). Sur la
fiche, chaque case affiche **nom + pouvoir(s)**. Un bouton **« Explorer l'arbre »** ouvre une
**page dédiée** affichant le même arbre en grand, **sans informations latérales**, avec une
**profondeur N réglable** (≥ 1, défaut **2**) ; sur cette page, chaque case affiche **nom + âge +
pouvoir(s)**. Cliquer une case **recentre** l'arbre sur l'individu cliqué.

**Bugfix**: 2026-06-10 — BUG-001 Profondeur fixe 2 sur la fiche (bouton « Explorer l'arbre » → page
dédiée à profondeur N réglable) ; contenu des cases distinct fiche (nom + pouvoirs) / page (nom +
âge + pouvoirs).

**Why this priority** : c'est le cœur de la valeur « explorer la généalogie » et la brique la
plus visible de la feature ; elle exploite directement les liens `parents`/`enfants` déjà
produits par le moteur (F2/F3).

**Independent Test** : générer une population et avancer le temps pour créer des liens
parents/enfants, ouvrir une fiche (arbre figé à 2, cases nom + pouvoirs), cliquer « Explorer
l'arbre » (page dédiée, profondeur N réglable, cases nom + âge + pouvoirs), et vérifier que cliquer
une case recentre.

**Acceptance Scenarios** :

1. **Given** un individu ayant parents et enfants connus, **When** j'ouvre sa fiche, **Then**
   l'arbre affiche **exactement 2** niveaux d'ancêtres et 2 niveaux de descendants centrés sur lui,
   et chaque case n'affiche que **nom + pouvoir(s)**.
2. **Given** la fiche, **When** je clique **« Explorer l'arbre »**, **Then** une page dédiée
   s'ouvre avec le même arbre, **sans informations latérales**, et chaque case affiche **nom + âge
   + pouvoir(s)**.
3. **Given** la **page dédiée**, **When** je change la **profondeur N**, **Then** le nombre de
   niveaux affichés au-dessus et en dessous s'ajuste (la fiche, elle, reste figée à 2).
4. **Given** une case d'ancêtre ou de descendant (fiche ou page dédiée), **When** je clique dessus,
   **Then** l'arbre se **recentre** sur cet individu.
5. **Given** un individu sans parent connu (racine) ou sans enfant (feuille), **When** j'affiche
   l'arbre, **Then** les niveaux manquants sont simplement absents (pas d'erreur).
6. **Given** un individu de l'arbre ayant un conjoint actuel et un ex, **When** j'affiche l'arbre,
   **Then** le conjoint et l'ex apparaissent rattachés à lui, **avec** les enfants issus de ces
   unions, **sans** les enfants que ces conjoints/ex ont eus avec d'autres personnes ni leurs parents.

---

### User Story 2 — Recherche & filtres dans la liste (Priority: P2)

Sur la page **Liste des individus**, l'utilisateur **recherche** (par nom) et **filtre** la
population par : **génération** (tranches de **20 ans** d'année de naissance), **espèce**,
**trait** (avec une portée **actifs / inactifs / tous**), **pouvoir** (**présence/absence** : a un
pouvoir / aucun), et **statut** (vivant / décédé). Les filtres sont **combinables** et la
liste se met à jour pour ne montrer que les individus correspondants. **Par défaut**, la liste est
filtrée sur la **dernière génération** (la plus récente présente) ; ce défaut **se recale**
automatiquement quand le temps avance, **tant que** l'utilisateur n'a pas modifié manuellement le
filtre de génération. Les filtres sont **conservés en mémoire** : en quittant puis revenant sur la
Liste, l'utilisateur retrouve son état de filtres.

**Why this priority** : rend une population de grande taille **exploitable** ; complète la liste
existante (F1) sans la remplacer.

**Independent Test** : avec une population variée, appliquer chaque filtre isolément puis en
combinaison, et vérifier que l'ensemble affiché correspond exactement aux critères ; vérifier
qu'effacer les filtres restaure la liste complète.

**Acceptance Scenarios** :

1. **Given** une population, **When** je saisis un nom (ou fragment), **Then** seuls les
   individus dont le nom correspond restent affichés.
2. **Given** une population multi-espèces, **When** je filtre par espèce, **Then** seuls les
   individus de cette espèce s'affichent.
3. **Given** un filtre par **génération** (tranche de 20 ans), **When** je le sélectionne,
   **Then** seuls les individus dont l'année de naissance tombe dans la tranche s'affichent.
4. **Given** un filtre par **trait** avec une **portée** (actifs / inactifs / tous), **When** je le
   sélectionne, **Then** seuls les individus dont le(s) trait(s) correspond(ent) **selon la portée
   choisie** s'affichent.
4a. **Given** le filtre **pouvoir** réglé sur « **aucun pouvoir** » (resp. « a un pouvoir »),
   **When** je l'active, **Then** seuls les individus **sans aucun** pouvoir (resp. en ayant **au
   moins un**) s'affichent.
5. **Given** un filtre par **statut**, **When** je choisis « décédé », **Then** seuls les
   individus décédés s'affichent.
6. **Given** plusieurs filtres actifs, **When** ils sont combinés, **Then** seuls les individus
   satisfaisant **tous** les critères s'affichent ; **When** je réinitialise, **Then** toute la
   population réapparaît.
7. **Given** une population sur plusieurs générations, **When** j'ouvre la Liste sans avoir touché
   aux filtres, **Then** seule la **dernière génération** est affichée par défaut.
8. **Given** que je n'ai pas modifié manuellement le filtre de génération, **When** le temps avance
   et fait apparaître une génération plus récente, **Then** la Liste affiche cette **nouvelle
   dernière génération** (le défaut se recale automatiquement).
9. **Given** que j'ai appliqué des filtres (dont éventuellement une autre génération), **When** je
   navigue vers une autre page puis reviens sur la Liste, **Then** mes filtres sont **conservés**
   (et le défaut « dernière génération » ne s'impose plus).

---

### User Story 3 — Modes d'affichage des traits (Priority: P3)

Sur la fiche d'un individu, l'utilisateur choisit l'un des **trois modes d'affichage des traits**
(§8.5) : **Mode 1** = pouvoirs uniquement ; **Mode 2** = pouvoirs + traits **actifs** ; **Mode 3**
= pouvoirs + traits **actifs** + traits **inactifs** + **résilience** de chaque trait.

**Why this priority** : confort de lecture / niveau de détail ; n'affecte pas les données, seule
la présentation change.

**Independent Test** : sur un individu ayant traits actifs, inactifs et pouvoirs, basculer entre
les 3 modes et vérifier que le contenu affiché correspond exactement à chaque définition.

**Acceptance Scenarios** :

1. **Given** un individu avec pouvoirs, traits actifs et inactifs, **When** je choisis le Mode 1,
   **Then** seuls les **pouvoirs** sont affichés.
2. **Given** le même individu, **When** je choisis le Mode 2, **Then** s'affichent les **pouvoirs
   + traits actifs** (sans les inactifs).
3. **Given** le même individu, **When** je choisis le Mode 3, **Then** s'affichent **pouvoirs +
   traits actifs + traits inactifs + résilience** de chaque trait.

---

### Edge Cases

- **Cycles / parenté incomplète** : un individu peut apparaître comme ancêtre *et* descendant via
  des branches différentes (consanguinité autorisée) ; l'arbre DOIT rester fini (borné par N) et
  ne pas boucler indéfiniment. La répétition d'un même individu **à plusieurs emplacements** est
  **attendue** (pas de déduplication) ; la terminaison est garantie par la **borne N**.
- **Très grande fratrie / descendance** : l'arbre DOIT rester lisible (le rendu peut défiler ;
  aucune limite de données n'est imposée mais l'affichage ne doit pas casser).
- **Population vide ou aucun résultat de filtre** : afficher un état vide explicite, sans erreur.
- **Filtre par génération sans individu dans la tranche** : résultat vide, pas d'erreur.
- **Recherche insensible à la casse / aux accents** : « leo » trouve « Léon ».
- **Individu isolé** (ni parents ni enfants) : l'arbre se réduit à sa seule case.
- **Population sur une seule génération** : le défaut « dernière génération » affiche cette unique
  tranche (pas d'état vide trompeur).
- **Avance du temps après filtrage manuel** : le défaut dynamique **ne s'applique plus** ; les
  filtres manuels de l'utilisateur sont préservés.

## Requirements *(mandatory)*

### Functional Requirements

**Arbre généalogique (§8.2 / §8.3)**
- **FR-001** : La fiche d'un individu DOIT afficher un **arbre généalogique centré** sur lui, avec
  **N niveaux d'ancêtres** au-dessus et **N niveaux de descendants** en dessous, selon les liens
  `parents`/`enfants` disponibles.
- **FR-002** : ~~La **profondeur N** DOIT être **sélectionnable** par l'utilisateur, avec une
  valeur **par défaut de 2**, et N ≥ 1.~~ *(remplacé — BUG-001 : la profondeur est désormais figée
  sur la fiche et réglable seulement sur la page dédiée ; cf. FR-002a/FR-005.)*
- **FR-002a** : Sur la **fiche**, la profondeur de l'arbre DOIT être **fixe = 2** (2 niveaux
  d'ancêtres + 2 niveaux de descendants), **non réglable**. La fiche DOIT exposer un bouton
  **« Explorer l'arbre »** ouvrant la **page dédiée** (FR-005).
- **FR-003** : ~~Chaque **case** de l'arbre DOIT afficher **nom**, **date de naissance / âge** et
  **pouvoir(s)** de l'individu.~~ *(remplacé — BUG-001 : contenu distinct selon la page.)*
- **FR-003b** : Sur la **fiche**, chaque case d'arbre DOIT afficher **nom + pouvoir(s)** (sans
  âge/date). Sur la **page dédiée**, chaque case DOIT afficher **nom + âge + pouvoir(s)**.
- **FR-003a** : Pour chaque individu **présent dans l'arbre**, le système DOIT rattacher son
  **conjoint actuel** et ses **ex-conjoints**, ainsi que les **enfants issus de ces unions**
  (enfants ayant pour parents l'individu **et** le conjoint/ex concerné). Le système NE DOIT **pas**
  afficher les **autres enfants** de ces conjoints/ex (issus d'unions avec des tiers) **ni** les
  **parents** des conjoints/ex.
- **FR-004** : Cliquer une case DOIT **recentrer** l'arbre sur l'individu cliqué (ouverture de sa
  fiche / recentrage).
- **FR-005** : Une **page dédiée** DOIT afficher **le même arbre** (même individu, même règles de
  conjoints/unions) **sans informations latérales**, avec sa **propre profondeur N réglable**
  (N ≥ 1, **sans plafond**, défaut **2**) — indépendante de la fiche (figée à 2) ; un clic sur une
  case y **recentre** l'arbre.
- **FR-006** : Le calcul de l'arbre DOIT être **borné par N** et **terminer** même en présence de
  parentés partagées (consanguinité). Un individu **atteignable par plusieurs chemins** DOIT être
  **affiché à chaque emplacement** où il apparaît (répétition assumée, bornée par N) ; **pas** de
  déduplication ni de vue graphe. La profondeur N **n'a pas de plafond** (N ≥ 1).

**Recherche & filtres (§8.1)**
- **FR-007** : La liste des individus DOIT offrir une **recherche par nom** (insensible à la casse
  et aux accents).
- **FR-008** : La liste DOIT offrir des **filtres** par **génération** (tranches de **20 ans**
  d'année de naissance), **espèce**, **trait**, **pouvoir** et **statut** (vivant / décédé).
- **FR-008a** : Le filtre **trait** DOIT exposer un **sélecteur de portée** à 3 valeurs — **actifs**
  / **inactifs** / **tous** — déterminant si un individu correspond selon que le(s) trait(s)
  recherché(s) sont présents **actifs**, présents **inactifs**, ou **présents quel que soit l'état**
  dans son ADN.
- **FR-008b** : Le filtre **pouvoir** DOIT fonctionner en **présence/absence** uniquement
  (« **a au moins un pouvoir** » / « **aucun pouvoir** »), **sans** sélection d'un pouvoir précis.
- **FR-009** : Les filtres DOIVENT accepter **plusieurs valeurs au sein d'une même dimension**,
  combinées en **OU** (ex. trait T1 **ou** T2), tandis que **dimensions différentes** se combinent
  en **ET** (espèce **et** génération **et** trait…). La recherche par nom se combine également en
  **ET** avec les filtres ; l'affichage ne montre que les individus satisfaisant l'ensemble.
- **FR-010** : L'utilisateur DOIT pouvoir **réinitialiser** recherche et filtres pour retrouver la
  population complète.
- **FR-011** : La **génération** d'un individu DOIT être **calculée** depuis l'année de naissance
  comme une **tranche de 20 ans** (gén. 0 = [0,19], gén. 1 = [20,39], …) et **affichée sur la
  fiche** (§6.2 : la génération n'est **pas** un champ stocké de la personne).
- **FR-011a** : À l'ouverture initiale de la Liste, le filtre de génération DOIT être positionné
  par défaut sur la **dernière génération** (tranche de 20 ans la plus récente présente dans la
  population). Tant que l'utilisateur **n'a pas modifié manuellement** le filtre de génération, ce
  défaut DOIT se **recaler automatiquement** lorsque l'avance du temps fait apparaître une
  génération plus récente.
- **FR-011b** : L'état de recherche et de filtres DOIT être **conservé en mémoire** durant la
  session : après navigation vers une autre page puis retour sur la Liste, l'état est **restauré
  tel quel**. Dès qu'un filtre (notamment la génération) a été **modifié manuellement**, le choix
  de l'utilisateur **prime** sur le défaut « dernière génération » et persiste jusqu'à
  réinitialisation (FR-010).

**Bugfix**: 2026-06-10 — BUG-001 Liste : défaut « dernière génération » dynamique (FR-011a) +
persistance des filtres entre navigations (FR-011b).

**Modes d'affichage des traits (§8.5)**
- **FR-012** : La fiche DOIT proposer **trois modes d'affichage des traits** : **(1)** pouvoirs
  seuls ; **(2)** pouvoirs + traits actifs ; **(3)** pouvoirs + traits actifs + traits inactifs +
  **résilience** de chaque trait.
- **FR-013** : Le mode d'affichage actif DOIT être **modifiable** depuis la fiche et s'appliquer
  immédiatement à l'affichage des traits/pouvoirs. Le mode **par défaut** est le **Mode 3**
  (pouvoirs + traits actifs + traits inactifs + résilience).

**Déterminisme & cohérence**
- **FR-014** : Toutes ces fonctionnalités sont **en lecture seule** sur la généalogie : elles NE
  DOIVENT **pas modifier** la population, l'ADN, les pouvoirs ni l'état du RNG (exploration pure).
- **FR-015** : Le calcul de l'arbre, des générations et des filtres DOIT être **déterministe**
  (même état ⇒ même résultat) et reposer sur le **cœur pur** (`src/core`), l'UI ne faisant que
  consommer ces résultats.

### Key Entities *(include if feature involves data)*

- **Nœud d'arbre généalogique** : un individu placé à un **niveau relatif** (ancêtre +k /
  descendant −k / centre 0) avec ses liens vers parents et enfants retenus dans la limite N ;
  porte le minimum d'affichage (nom, date/âge, pouvoirs).
- **Union (dans l'arbre)** : association entre un individu de l'arbre et son **conjoint actuel ou
  un ex** ; expose les **enfants communs** (parents = les deux membres de l'union). Les autres
  enfants des conjoints/ex et les parents des conjoints/ex sont **hors périmètre** de l'arbre.
- **Génération (d'affichage)** : entier dérivé = `floor(année de naissance / 20)` (tranche de
  20 ans) ; **non stockée** sur la personne, calculée à la demande.
- **Critère de filtre** : combinaison (nom, génération, espèce, **trait + portée actifs/inactifs/
  tous**, **pouvoir présence/absence**, statut) appliquée à la population pour produire le
  sous-ensemble affiché ; OU intra-dimension, ET inter-dimensions.
- **État de filtres de la Liste** : conservé en mémoire pendant la session (recherche + filtres +
  drapeau « génération modifiée manuellement »). Sert à restaurer l'affichage au retour sur la
  Liste et à décider si le défaut « dernière génération » s'applique encore (FR-011a/FR-011b).
- **Mode d'affichage des traits** : énumération à 3 valeurs (pouvoirs / +actifs / +inactifs &
  résilience) pilotant le rendu de la fiche ; **défaut = Mode 3**.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : Depuis n'importe quelle fiche, l'utilisateur atteint un ancêtre ou un descendant
  situé à N niveaux **en un seul clic par niveau** (recentrage), sans passer par la liste.
- **SC-002** : Pour une population de **1 000 individus**, l'application d'un filtre ou d'une
  recherche met à jour la liste **en moins d'1 seconde** (ressenti instantané).
- **SC-003** : Tout individu retenu par une combinaison de filtres satisfait **100 %** des
  critères actifs (aucun faux positif / faux négatif), vérifiable sur jeux d'essai à seed fixe.
- **SC-004** : Les trois modes d'affichage produisent un contenu **exactement conforme** à leur
  définition (vérifié sur un individu de référence avec traits actifs, inactifs et pouvoirs).
- **SC-005** : L'arbre s'affiche pour tout individu sans erreur — **fiche** à profondeur fixe **2**,
  **page dédiée** à profondeur **N réglable** — y compris pour les racines, feuilles et isolés.
- **SC-006** : À l'ouverture de la Liste sans action manuelle, **100 %** des individus affichés
  appartiennent à la **dernière génération** ; après navigation aller-retour, l'état de filtres est
  **identique** à celui quitté (persistance vérifiable sur jeux d'essai à seed fixe).

## Assumptions

- L'arbre s'appuie sur les liens **`parents` / `enfants`** déjà produits par les Features 1–3 ;
  aucun nouveau lien de parenté n'est introduit ici.
- Les **conjoints** (actuel/ex) sont déjà au modèle (F1/F3) ; **clarifié** : ils sont affichés dans
  l'arbre, avec les enfants issus de ces unions uniquement (cf. Clarifications / FR-003a).
- Le tri/regroupement par **génération** réutilise la définition §6.2 (tranche de 20 ans) ; aucune
  notion de génération n'est persistée.
- La **reproduction manuelle** et l'**édition** des données ne font PAS partie de cette feature
  (sandbox = Feature 7 ; paramétrage complet = Feature 5).
- L'UI reste une **PWA statique** déployée sur GitHub Pages ; pas de backend.
- La liste existante (F1) est **étendue** (recherche/filtres) plutôt que remplacée.
