# Feature Specification: Reproduction & hérédité (moteur génétique)

**Feature Branch**: `002-reproduction-heredite`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "on va faire la feature 2 de rsrc/plangénéral.md" — Reproduction & hérédité : moteur génétique (hérédité par résilience §4, pipeline de naissance §5, algorithme traits→pouvoirs §6.4 avec constantes D/K, puissance/maîtrise héritées §7.2, mutation forte/sans pouvoir §6.1 et mutation faible §6.3), exercé via la **reproduction manuelle** d'individus sélectionnés.

> Source de vérité fonctionnelle : `rsrc/DescriptionProjet.md` (notamment §3.5 ADN, §4 hérédité, §5 pipeline de naissance, §6.1 mutation forte / sans pouvoir, §6.3 mutation faible, §6.4 algorithme traits→pouvoirs et constantes D/K, §7 puissance/maîtrise, §9.1/§9.2 paramètres). Gouvernance : `.specify/memory/constitution.md`. S'appuie sur la Feature 1 (seed/RNG, modèle, genèse, fiche/liste).

## Clarifications

### Session 2026-06-09

- Q: Comment le bonus/malus de résilience (§4) s'applique-t-il à la valeur de résilience ? → A: **Additif (±points)** — résilience + N points (actif) / − M points (inactif), N/M paramétrables, plafonné à la résilience max et plancher au seuil de disparition.
- Q: Combien d'enfants une reproduction manuelle produit-elle en Feature 2 ? → A: **Un seul enfant** par déclenchement (les portées M/N/X restent en Feature 3).
- Q: Héritage puissance/maîtrise (§7.2) si aucun parent n'a de pouvoir source pour le i-ᵉ pouvoir dérivé ? → A: **Nouvelle valeur aléatoire 1-10** (cas A, bornée [1,10]).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reproduction normale : hérédité + pouvoirs dérivés (Priority: P1)

L'utilisateur **sélectionne un ou plusieurs individus** existants et déclenche une **reproduction manuelle**. Un **enfant** naît : son **ADN** est constitué par **hérédité de résilience** à partir de tous les parents (§4), puis ses **pouvoirs** sont **dérivés de ses traits actifs** par l'algorithme traits→pouvoirs (§6.4), et chaque pouvoir reçoit une **puissance** et une **maîtrise** héritées des parents (§7.2). À seed et paramètres identiques, l'enfant produit est **strictement reproductible**.

**Why this priority**: C'est le **cœur génétique** du projet et la partie la plus risquée (hérédité, duplication, génération de traits, héritage des stats). La prouver tôt et la couvrir par les exemples chiffrés de la spec sécurise tout le reste. C'est un MVP autonome : on peut reproduire deux individus de la genèse et observer un descendant cohérent et déterministe.

**Independent Test**: Sur une population générée (Feature 1) à seed fixe, sélectionner 2 individus dotés de traits actifs, lancer la reproduction → un enfant apparaît avec un ADN et des pouvoirs déterministes ; relancer avec la même seed/les mêmes parents/paramètres → enfant identique ; les exemples §6.4 et §7.2 se reproduisent à l'identique.

**Acceptance Scenarios**:

1. **Given** deux parents portant chacun des traits de résilience connue et une seed S, **When** l'utilisateur déclenche la reproduction, **Then** l'enfant **hérite de la totalité des traits de tous les parents** (chacun actif ou inactif selon les tirages de résilience), avec une **résilience initiale** ajustée d'un **bonus** (tirage actif) ou d'un **malus** (tirage inactif).
2. **Given** un trait porté par plusieurs parents, **When** l'enfant est constitué, **Then** la règle d'agrégation (§4.2) s'applique : aucun tirage actif ⇒ trait inactif (résilience = la plus haute, malus) ; un tirage actif ⇒ actif (résilience du parent dont le tirage est actif, bonus) ; plusieurs tirages actifs ⇒ actif (résilience la plus haute, bonus appliqué autant de fois qu'il y a de tirages actifs).
3. **Given** un enfant dont la résilience d'un trait tombe sous le **seuil de disparition** (défaut 2 %), **When** l'ADN est finalisé, **Then** ce trait **disparaît** de l'ADN de l'enfant.
4. **Given** un enfant possédant des **traits actifs**, **When** ses pouvoirs sont calculés, **Then** ils sont produits par l'algorithme traits→pouvoirs (§6.4) : constitution de sous-listes (principaux = Actions, sinon Parties du corps, sinon liste unique), répartition mélangée des secondaires, **duplication** au taux `résilience/D`, **génération** de traits au taux `K` (inscrits actifs dans l'ADN), libellé selon l'arbre §6.4.2.
5. **Given** les pouvoirs dérivés de l'enfant, **When** on leur attribue puissance/maîtrise (§7.2), **Then** chaque i-ᵉ pouvoir reçoit la **moyenne arrondie** des i-ᵉ pouvoirs des parents, puis un tirage **A %** (nouvelle valeur 1-10, **bornée**), **B %** (moyenne−1), **C %** (moyenne), **B %** (moyenne+1), seul le cas A étant **borné à [1,10]**.
6. **Given** la même seed, les mêmes parents et les mêmes paramètres, **When** l'utilisateur relance la reproduction, **Then** l'enfant obtenu est **identique** (ADN, pouvoirs, puissance/maîtrise) ; **les liens de parenté** sont posés (l'enfant référence ses parents, chaque parent référence l'enfant).

---

### User Story 2 - Cas spéciaux de naissance : mutation forte, sans pouvoir, mutation faible (Priority: P2)

Selon des **taux paramétrables**, une naissance peut être une **mutation forte**, une **naissance sans pouvoir**, ou une **naissance normale** (cas par défaut). Sur les naissances normales s'appliquent en plus des **mutations faibles** (gain et/ou perte d'un trait). Le **pipeline de naissance** (§5) oriente chaque enfant vers le bon traitement.

**Why this priority**: Complète le moteur avec les chemins alternatifs documentés (§5, §6.1, §6.3). Indispensable à la fidélité du modèle, mais la reproduction normale (US1) délivre déjà la valeur centrale et reste testable seule.

**Independent Test**: Régler le taux de mutation forte à 100 % → l'enfant obtient un unique pouvoir issu du gabarit (AE/PE/PA/PR) et hérite tous les traits parentaux **inactifs** ; régler le taux « sans pouvoir » à 100 % → enfant sans pouvoir, ADN tout inactif ; activer la mutation faible → gain/perte de trait observables sur un grand échantillon.

**Acceptance Scenarios**:

1. **Given** un taux de **mutation forte** > 0, **When** une naissance est tirée comme mutation forte, **Then** tous les traits parentaux sont hérités **inactifs**, un **nouveau pouvoir** est tiré via le gabarit (§6.1, réutilise la Feature 1) avec ses traits constitutifs **actifs** à la résilience initiale, et puissance/maîtrise = aléatoires **1-10**.
2. **Given** un taux de **naissance sans pouvoir** > 0, **When** une naissance est tirée comme « sans pouvoir », **Then** tous les traits parentaux sont hérités **inactifs**, **aucun pouvoir** n'est attribué, et la descendance peut quand même réactiver les traits ultérieurement.
3. **Given** une **naissance normale** et des taux de mutation faible > 0, **When** l'enfant est constitué, **Then** deux tirages **indépendants** s'appliquent : **gain** d'un trait (mis actif + bonus s'il est déjà présent ; sinon ajouté actif à la résilience initiale, sans bonus) et **perte** d'un trait (un trait, actif ou inactif, retiré).
4. **Given** l'**option « malus sur le génome »** (désactivée par défaut), **When** elle est désactivée lors d'une mutation forte / naissance sans pouvoir, **Then** les traits inactifs sont hérités **sans pénalité** de résilience (et en cas de partage entre parents, on conserve la résilience la plus élevée).
5. **Given** un taux à **0 %** ou **100 %**, **When** des naissances sont produites, **Then** le comportement est respectivement **jamais** / **toujours** déclenché pour ce cas.

---

### User Story 3 - Inspection génétique de l'enfant (Priority: P3)

L'utilisateur ouvre la **fiche** d'un individu et inspecte son **détail génétique complet** : pouvoirs dérivés, **traits actifs**, **traits inactifs**, et **résilience** de chaque trait, afin de comprendre et valider ce que le moteur a produit.

**Why this priority**: Confort de validation/exploration. Le moteur (US1/US2) délivre déjà sa valeur et est vérifiable par les tests ; l'inspection enrichie aide l'utilisateur mais ne bloque pas le moteur.

**Independent Test**: Après une reproduction, ouvrir la fiche de l'enfant et vérifier que l'ADN complet (actifs + inactifs + résilience) et les pouvoirs dérivés correspondent au résultat du moteur.

**Acceptance Scenarios**:

1. **Given** un enfant issu d'une reproduction, **When** sa fiche est ouverte, **Then** elle affiche ses **pouvoirs** (avec puissance/maîtrise), ses **traits actifs** et ses **traits inactifs** avec leur **résilience** respective.
2. **Given** un individu sélectionné pour reproduction, **When** l'utilisateur le consulte, **Then** son ADN/ses pouvoirs sont présentés de manière cohérente avec le moteur (mêmes libellés, mêmes valeurs).

---

### Edge Cases

- **Un seul parent sélectionné** : la reproduction est possible (hérédité « Cas 1 », §4.2, un seul tirage par trait) ; l'enfant hérite des traits du parent unique.
- **Aucun trait actif chez l'enfant** (naissance normale) : l'enfant est **sans pouvoir** (§6.4) ; son ADN peut tout de même contenir des traits inactifs.
- **Parents sans aucun pouvoir** : l'enfant peut néanmoins dériver des pouvoirs de ses traits actifs ; faute de pouvoir source parental, leur puissance/maîtrise est tirée comme une **nouvelle valeur aléatoire 1-10** (cas A, bornée — clarification 2026-06-09, FR-024).
- **Type de trait requis vide / génération `K` échoue** : la sous-liste concernée ne produit **aucun pouvoir** (`null`), sans erreur ; les traits générés éventuels restent inscrits actifs dans l'ADN.
- **Duplication saturée** : un trait dupliqué ne peut pas apparaître deux fois dans une même sous-liste (donc au plus autant de fois qu'il y a de sous-listes).
- **Résilience hors bornes** : la résilience reste dans [0, 100] (plafonnée à la résilience maximale ; supprimée sous le seuil de disparition).
- **Nombre de pouvoirs différent entre parents** (§7.2) : recours au `i modulo (nb de pouvoirs du parent)`-ᵉ pouvoir.

## Requirements *(mandatory)*

### Functional Requirements

**Déclencheur — reproduction manuelle**
- **FR-001** : L'utilisateur DOIT pouvoir **sélectionner un ou plusieurs individus** existants et **déclencher une reproduction**.
- **FR-002** : Une reproduction DOIT produire **un enfant** ajouté à la population, avec un **identifiant déterministe**, une **date de naissance** dans l'année courante (âge 0), et les **liens de parenté** posés des deux côtés (enfant→parents, parents→enfant).
- **FR-003** : Toute l'aléatoire de la reproduction DOIT découler **exclusivement de la seed** (Principe I) ; mêmes parents + mêmes paramètres + même seed ⇒ enfant **strictement identique**.

**Pipeline de naissance (§5)**
- **FR-004** : À chaque naissance, le système DOIT **tirer le cas spécial** parmi **mutation forte**, **naissance sans pouvoir**, ou **naissance normale** (défaut), selon leurs **taux paramétrables**.
- **FR-005** : Le système DOIT exécuter le pipeline dans l'ordre : (1) tirage du cas, (2) constitution de l'ADN, (3) mutation faible (naissances normales uniquement), (4) calcul des pouvoirs, (5) calcul de puissance/maîtrise.

**Hérédité par résilience (§4)**
- **FR-006** : En naissance normale, l'enfant DOIT **hériter de la totalité des traits de tous les parents** ; pour chaque parent porteur d'un trait, un **tirage actif/inactif** est effectué selon **la résilience de ce parent pour ce trait**.
- **FR-007** : L'agrégation multi-parents DOIT suivre §4.2 : (a) un seul porteur → un tirage ; (b) plusieurs porteurs → selon le **nombre de tirages actifs** (0 → inactif, résilience la plus haute, malus ; 1 → actif, résilience du tirage actif, bonus ; ≥2 → actif, résilience la plus haute, **bonus appliqué autant de fois** qu'il y a de tirages actifs).
- **FR-008** : Un **bonus** de résilience DOIT être appliqué lorsqu'un trait est tiré **actif**, un **malus** lorsqu'il est tiré **inactif** ; le bonus/malus est **additif** (résilience **+ N points** si actif, **− M points** si inactif), `N`/`M` étant **paramétrables** (en points de pourcentage).
- **FR-009** : La résilience DOIT être **plafonnée à une résilience maximale** (paramétrable) au-dessus de laquelle le bonus ne s'applique plus.
- **FR-010** : Si la résilience d'un trait passe **sous le seuil de disparition** (défaut **2 %**), le trait DOIT **disparaître** de l'ADN de l'enfant (seule cause de disparition définitive d'une lignée).
- **FR-011** : Les traits **inactifs** DOIVENT être **transmis** à la descendance (même logique de tirage), permettant un « réveil » ultérieur.

**Cas spéciaux (§6.1)**
- **FR-012** : En **mutation forte** ou **naissance sans pouvoir**, tous les traits parentaux DOIVENT être hérités **inactifs**.
- **FR-013** : En **mutation forte**, le système DOIT tirer **un** pouvoir via le **gabarit de mutation forte** (AE/PE/PA/PR, réutilise la Feature 1), inscrire ses traits constitutifs **actifs** à la **résilience initiale paramétrable**, et tirer **puissance/maîtrise aléatoires 1-10**.
- **FR-014** : En **naissance sans pouvoir**, **aucun** pouvoir n'est attribué.
- **FR-015** : Une **option globale** « malus sur le génome » (activable, **désactivée par défaut**) DOIT régir l'application d'un malus aux traits inactifs hérités en mutation forte / sans pouvoir ; désactivée, ces traits sont hérités sans pénalité, et en cas de partage la **résilience la plus élevée** est conservée.

**Mutation faible (§6.3) — naissances normales uniquement**
- **FR-016** : Avec un **taux de gain** paramétrable, l'enfant DOIT **gagner un trait** tiré au hasard : s'il le possède déjà, le mettre **actif** + **bonus** ; sinon l'**ajouter actif** à la **résilience initiale**, **sans** bonus.
- **FR-017** : Avec un **taux de perte** paramétrable (indépendant du gain), l'enfant DOIT **perdre un trait** tiré au hasard parmi **ses** traits (actif ou inactif).

**Algorithme traits→pouvoirs (§6.4)**
- **FR-018** : Les pouvoirs d'une naissance normale DOIVENT être construits à partir des **traits actifs** de l'ADN ; s'il n'y a **aucun trait actif**, l'individu est **sans pouvoir**.
- **FR-019** : Le système DOIT constituer les **sous-listes** : principaux = **Actions** si présentes, sinon **Parties du corps**, sinon **une seule** sous-liste ; puis répartir les **secondaires** après **mélange déterministe** (seed), en parcours cyclique des principaux.
- **FR-020** : Lors de l'assignation d'un secondaire, le système DOIT appliquer une **duplication** avec une probabilité `résilience_du_trait / D` (copie dans **une autre** sous-liste), **sans** dépasser une occurrence par sous-liste et **sans modifier l'ADN**.
- **FR-021** : Chaque sous-liste DOIT être transformée en libellé de pouvoir selon l'**arbre §6.4.2** (faisant foi, verbatim) ; plusieurs traits d'un même type sont regroupés (« , » + « et », ou « ou » pour les états).
- **FR-022** : La **génération de traits** `K…` DOIT se déclencher avec une probabilité **`K`** par occurrence dans le pouvoir choisi ; les traits générés sont **inscrits actifs dans l'ADN** (ou réactivés + bonus s'ils existent). Si un tirage `K` requis **échoue**, la sous-liste **ne produit aucun pouvoir** (`null`).
- **FR-023** : Les constantes **`D` (duplication)** et **`K` (génération)** DOIVENT être **deux paramètres distincts**.

**Puissance & maîtrise (§7)**
- **FR-024** : En naissance normale, pour le **i-ᵉ pouvoir** de l'enfant, le système DOIT calculer la **moyenne** (puissance, puis maîtrise) des **i-ᵉ pouvoirs des parents qui ont au moins un pouvoir** (après **mélange déterministe** des pouvoirs de chaque parent ; recours au `i modulo nb_pouvoirs` si nécessaire), puis **arrondir** (`x ≥ n+0,5 ⇒ n+1`, sinon `n`). Si **aucun** parent ne fournit de pouvoir source, la valeur DOIT être tirée comme une **nouvelle valeur aléatoire 1-10** (cas A, bornée [1,10]).
- **FR-025** : La valeur finale DOIT être tirée parmi : **A %** = nouvelle valeur aléatoire **1-10**, **B %** = moyenne−1, **C %** = moyenne, **B %** = moyenne+1 ; **B** et **C** sont **paramétrables** et **A = 100 − 2·B − C**.
- **FR-026** : Seul le cas **A** (nouvelle valeur aléatoire) DOIT être **borné à [1,10]** ; les cas moyenne−1 / moyenne / moyenne+1 **ne sont pas bornés** (peuvent sortir de [1,10]).

**Paramétrage (§9.1/§9.2)**
- **FR-027** : Le système DOIT exposer en **paramètres** (avec valeurs par défaut modifiables) : `D`, `K`, résilience initiale, résilience maximale, **bonus (points)**, **malus (points)**, seuil de disparition (défaut 2 %), taux de mutation forte, taux de naissance sans pouvoir, taux de mutation faible (gain), taux de mutation faible (perte), option « malus génome » (défaut off), probabilités `B` et `C`.
- **FR-030** : **Tous** ces paramètres (FR-027) DOIVENT être **éditables dans l'écran des paramètres**, à la **seule exception de `A`** qui est **calculée** (`A = 100 − 2·B − C`) et **affichée en lecture seule**. *(L'organisation avancée à 3 niveaux global/type/trait et les courbes relèvent de la Feature 5 ; la Feature 2 fournit l'édition à plat de ces paramètres.)*
- **FR-031** : L'écran des paramètres DOIT **regrouper** les paramètres en **sections thématiques** reflétant leur rôle (au minimum : **Génération de pouvoir** [§9.1], **Hérédité & naissance** [§9.2], **Population** [§9.3]) et DOIT afficher, pour **chaque** paramètre, une **brève description fonctionnelle** (ce à quoi il sert, son effet concret) à proximité immédiate de son champ — pas uniquement pour `A`. *(L'organisation **à 3 niveaux** global/type/trait et les courbes restent en Feature 5 ; ici, regroupement **à plat en sections** + descriptions.)*

**Bugfix**: 2026-06-09 — BUG-001 Ajout de FR-031 (regroupement en sections thématiques + description par paramètre dans l'écran des paramètres).

**Inspection (US3)**
- **FR-028** : La **fiche** d'un individu DOIT pouvoir afficher l'**ADN complet** : traits **actifs** et **inactifs** avec leur **résilience**, en plus des pouvoirs (puissance/maîtrise).

**Persistance**
- **FR-029** : Les individus issus de reproduction et leurs liens de parenté DOIVENT être inclus dans l'**export/import** d'état (cohérent avec la Feature 1, round-trip sans perte).

### Key Entities *(include if feature involves data)*

- **Parent / Enfant (liens de parenté)** : références reliant un enfant à ses parents et inversement.
- **Tirage d'hérédité** : pour un (parent, trait), résultat actif/inactif issu de la résilience.
- **Sous-liste de traits** : regroupement transitoire de traits actifs servant à construire **un** pouvoir (n'altère pas l'ADN, sauf traits générés `K`).
- **Cas de naissance** : mutation forte | naissance sans pouvoir | naissance normale.
- **Paramètres du moteur** : `D`, `K`, résiliences (initiale/max), bonus, malus, seuil, taux (forte/sans pouvoir/gain/perte), option malus génome, `B`/`C`.
- **ADN enrichi (vue)** : traits actifs + inactifs + résilience, pour l'inspection (FR-028).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : Pour une seed, des parents et des paramètres donnés, deux reproductions successives produisent un **enfant 100 % identique** (ADN, pouvoirs, puissance/maîtrise).
- **SC-002** : En naissance normale, **100 %** des traits portés par les parents se retrouvent dans l'ADN de l'enfant (actifs ou inactifs), **sauf** ceux tombés sous le seuil de disparition.
- **SC-003** : Les **exemples chiffrés** de la source de vérité se reproduisent à l'identique : répartition/duplication des sous-listes (§6.4 exemples 1 et 2) et héritage de puissance/maîtrise (§7.2 exemples 1 et 2).
- **SC-004** : Les valeurs de puissance/maîtrise issues du **cas A** et de la **mutation forte** sont **toujours** des entiers ∈ [1,10] ; les valeurs dérivées de moyenne **peuvent** sortir de [1,10] (non bornées), conformément à §7.
- **SC-005** : Avec un taux de cas spécial à **0 %** (resp. **100 %**), ce cas ne se produit **jamais** (resp. **toujours**) ; sur un grand échantillon (≥ 1 000 naissances), la proportion observée d'un cas s'écarte de **moins de 5 points** de son taux configuré.
- **SC-006** : Un trait dont la résilience passe sous le **seuil** disparaît de l'ADN de l'enfant dans **100 %** des cas.
- **SC-007** : Un cycle **export → import** après reproductions restaure un état **identique** (liens de parenté inclus).

## Assumptions

- **Un enfant par reproduction** (clarifié 2026-06-09) : la Feature 2 produit **un seul** enfant par déclenchement manuel (exercice du moteur). Les **portées** (M/N/X) et la formation de couples relèvent de la **Feature 3** (tick annuel).
- **Reproduction manuelle hors règles d'appariement** : la sélection manuelle de parents **n'applique pas** les contraintes d'espèce, de couple, de consanguinité ni de gaussienne (reportées en Feature 3) ; elle sert à **exercer le moteur génétique**. La cohérence inter-espèces n'est pas vérifiée à ce stade.
- **Date de naissance de l'enfant** : sans avancement du temps en Feature 2, l'enfant naît dans l'**année courante** (par défaut l'an 0, comme le batch initial), âge 0.
- **Parents ≥ 1** : la reproduction accepte **un** parent (hérédité « Cas 1 ») ou **plusieurs**.
- **Valeurs par défaut des paramètres** (`D`, `K`, bonus/malus en points, résiliences, taux, `B`/`C`) : des défauts raisonnables seront fixés au `/speckit-plan` et restent modifiables (Principe VII).
- **Affichage 3 modes** : les **modes d'affichage configurables** des traits (§8.5) relèvent de la Feature 4 ; la Feature 2 se limite à une fiche enrichie montrant ADN complet + pouvoirs (FR-028).
- **Réutilisation Feature 1** : seed/RNG, modèle de données, gabarit de mutation forte, catalogues, liste/fiche et export/import sont **réutilisés** et étendus, non réécrits.
