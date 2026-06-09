# Feature Specification: Fondations & Genèse de la population

**Feature Branch**: `001-fondations-genese`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "on va faire la Feature 1 de rsrc/plangénéral.md" — Fondations + Genèse de la population : socle déterministe (seed), modèle de données (Trait, ADN, Personne, Pouvoir, Espèce), catalogues par défaut, génération du batch initial, UI liste + fiche en lecture seule.

> Source de vérité fonctionnelle : `rsrc/DescriptionProjet.md` (notamment §2 seed, §3 concepts, §5/§6.1 genèse & gabarit de mutation forte, §7 puissance/maîtrise, §8.1/§8.2 UI, §9 paramètres, §11 persistance). Gouvernance : `.specify/memory/constitution.md`.

## Clarifications

### Session 2026-06-09

- Q: Effectif par défaut du batch initial ? → A: **100** individus.
- Q: Pourcentage par défaut de chance qu'un individu du batch possède un pouvoir ? → A: **0 %**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Générer une population initiale déterministe et la consulter (Priority: P1)

L'utilisateur paramètre une **graine (seed)**, un **nombre d'individus** et un **pourcentage de chance qu'un individu possède un pouvoir**, puis lance la **génération**. L'application crée la population initiale et l'affiche sous forme de **liste**. Relancer la génération avec la **même seed** et les **mêmes paramètres** produit une population **strictement identique**.

**Why this priority**: C'est le cœur livrable du MVP : il prouve le **déterminisme** (Principe I) et le **modèle de données**, et donne immédiatement quelque chose d'utilisable et de vérifiable. Tout le reste du projet s'appuie dessus.

**Independent Test**: Régler une seed, un effectif et un pourcentage de pouvoir, générer, observer la liste ; régénérer avec la même seed → résultat identique ; changer la seed → résultat différent.

**Acceptance Scenarios**:

1. **Given** une seed S, un effectif N et 0 % de chance de pouvoir, **When** l'utilisateur génère la population, **Then** N individus apparaissent dans la liste, tous âgés de **0 an**, nés dans l'**année de naissance configurée**, et **aucun** ne possède de pouvoir.
2. **Given** une seed S et des paramètres identiques, **When** l'utilisateur régénère, **Then** la population produite est **identique** (mêmes noms, mêmes dates de naissance, mêmes pouvoirs et valeurs).
3. **Given** deux seeds différentes et par ailleurs les mêmes paramètres, **When** l'utilisateur génère, **Then** les deux populations diffèrent.
4. **Given** un pourcentage de pouvoir P > 0, **When** l'utilisateur génère un grand effectif, **Then** une proportion d'environ P % des individus possède **exactement un** pouvoir, chacun doté d'une **puissance** et d'une **maîtrise** entières comprises entre 1 et 10 inclus.
5. **Given** la seed affichée, **When** l'utilisateur clique sur le bouton de régénération de seed, **Then** une nouvelle seed est tirée et affichée, et la génération suivante l'utilise.
6. **Given** la liste générée, **When** l'utilisateur la consulte, **Then** chaque ligne affiche au minimum **nom**, **date de naissance**, **âge** et **pouvoir(s)** éventuels.

---

### User Story 2 - Consulter la fiche détaillée d'un individu (Priority: P2)

Depuis la liste, l'utilisateur ouvre la **fiche** d'un individu (lecture seule) et voit ses informations globales et son ou ses pouvoirs.

**Why this priority**: Indispensable pour inspecter/valider ce que la génération produit, mais sans bloquer la génération elle-même (US1 livre déjà de la valeur).

**Independent Test**: Depuis une population générée, ouvrir une fiche et vérifier que les informations affichées correspondent à l'individu sélectionné ; revenir à la liste.

**Acceptance Scenarios**:

1. **Given** une population générée, **When** l'utilisateur sélectionne un individu dans la liste, **Then** sa fiche s'ouvre et affiche : nom, date de naissance, âge, **génération** (tranche de 20 ans), espèce, genre, statut vivant/décédé, et son ou ses pouvoirs avec puissance et maîtrise.
2. **Given** un individu **sans pouvoir**, **When** sa fiche est ouverte, **Then** elle indique clairement l'absence de pouvoir.
3. **Given** un individu **avec** un pouvoir, **When** sa fiche est ouverte, **Then** le libellé du pouvoir et ses traits actifs constitutifs sont affichés.
4. **Given** une fiche ouverte, **When** l'utilisateur revient en arrière, **Then** il retrouve la liste dans son état précédent.

---

### User Story 3 - Sauvegarder et recharger l'état par fichier (Priority: P3)

Comme l'application ne sauvegarde **rien automatiquement**, l'utilisateur peut **exporter** l'état courant (paramètres + seed + population générée) dans un fichier, et le **réimporter** plus tard pour retrouver exactement le même état.

**Why this priority**: Sans cela, toute population générée est perdue au rechargement de la page (Principe VI : aucune sauvegarde automatique). C'est un confort essentiel mais non bloquant pour démontrer la génération.

**Independent Test**: Générer une population, exporter dans un fichier, recharger l'application (état vide), réimporter le fichier, vérifier que l'état restauré est identique.

**Acceptance Scenarios**:

1. **Given** une population générée, **When** l'utilisateur exporte, **Then** un fichier est produit contenant les paramètres, la seed et la population, avec un **identifiant de type** permettant de le reconnaître à l'import.
2. **Given** un fichier précédemment exporté, **When** l'utilisateur l'importe, **Then** l'état (paramètres, seed, population) est restauré **à l'identique**.
3. **Given** un fichier dont le type n'est pas reconnu ou est corrompu, **When** l'utilisateur tente de l'importer, **Then** l'application refuse l'import et affiche un message d'erreur compréhensible, sans altérer l'état courant.

---

### Edge Cases

- **Effectif nul** : générer avec N = 0 produit une population vide, sans erreur.
- **Pourcentage extrêmes** : 0 % → aucun pouvoir ; 100 % → chaque individu a exactement un pouvoir.
- **Catalogue de traits incomplet** : si un type de trait nécessaire au pouvoir tiré est vide, le comportement est défini et ne provoque pas d'erreur (cf. Hypothèses).
- **Seed éditée manuellement** : toute valeur entière 64 bits saisie est acceptée et utilisée telle quelle ; deux sessions partant de la même seed + mêmes actions produisent le même résultat.
- **Année de naissance** : valeur par défaut (an 0), modifiable **avant** la génération du batch.
- **Grand effectif** : la génération d'un effectif important reste utilisable (réactivité préservée, cf. Critères de succès).
- **Import d'un fichier d'une version différente** : détecté et traité proprement (message clair plutôt qu'un état incohérent).

## Requirements *(mandatory)*

### Functional Requirements

**Déterminisme & seed**
- **FR-001** : Le système DOIT exposer une **seed** unique (entier 64 bits), **affichée en clair** dans les paramètres, **éditable** par l'utilisateur.
- **FR-002** : Le système DOIT fournir un **bouton de régénération** de la seed, qui tire et affiche une nouvelle seed.
- **FR-003** : Toute l'aléatoire de la génération DOIT découler **exclusivement** de la seed courante ; à seed et paramètres identiques, la population générée DOIT être **strictement identique**.

**Paramètres de population**
- **FR-004** : L'utilisateur DOIT pouvoir définir le **nombre d'individus** du batch initial (valeur par défaut : **100**).
- **FR-005** : L'utilisateur DOIT pouvoir définir l'**année de naissance** du batch initial (défaut : an 0).
- **FR-006** : L'utilisateur DOIT pouvoir définir le **pourcentage de chance** qu'un individu du batch possède un pouvoir (défaut : 0 %).

**Catalogues & modèle de données**
- **FR-007** : Le système DOIT charger les **catalogues de traits par défaut** pour les 6 types de traits (Remplacements, Parties du corps, États, Éléments, Ajouts, Actions), à partir des listes de référence du projet.
- **FR-008** : Le système DOIT représenter une **personne** avec au minimum : identifiant, nom, genre, espèce, date de naissance, âge, statut vivant/décédé, ADN, pouvoir(s), et liens de parenté (vides à la genèse).
- **FR-009** : Le système DOIT représenter l'**ADN** d'une personne comme une liste de triplets `(trait, état actif/inactif, résilience)`.
- **FR-010** : Le système DOIT représenter un **pouvoir** avec son libellé, ses traits constitutifs, une **puissance** et une **maîtrise**.
- **FR-011** : Le système DOIT fournir l'espèce **« humain »** par défaut, avec un ensemble de genres incluant le genre spécial **« tout »**.

**Genèse du batch initial**
- **FR-012** : Pour chaque individu généré, le système DOIT fixer l'**âge à 0 an** et attribuer une **date de naissance** correspondant à un **jour tiré aléatoirement** dans l'année de naissance configurée.
- **FR-013** : Pour chaque individu, le système DOIT d'abord **tirer s'il possède un pouvoir** selon le pourcentage configuré.
- **FR-014** : Si l'individu possède un pouvoir, le système DOIT le générer selon le **gabarit de mutation forte** : tirage d'un type parmi **AE** (Action + Élément, le plus fréquent), **PE** (Partie du corps + État), **PA** (Partie du corps + Ajout), **PR** (Partie du corps + Remplacement), puis tirage des traits constitutifs **selon les pondérations**.
- **FR-015** : Les traits constitutifs d'un pouvoir de genèse DOIVENT être **actifs** avec une **résilience initiale** paramétrable, et inscrits dans l'ADN de l'individu.
- **FR-016** : Pour un pouvoir de genèse, la **puissance** et la **maîtrise** DOIVENT être deux entiers aléatoires entre **1 et 10** inclus.
- **FR-017** : Un individu généré **sans** pouvoir DOIT naître sans pouvoir et avec un ADN vide.

**Visualisation**
- **FR-018** : Le système DOIT afficher la **liste** de tous les individus, chaque entrée montrant au minimum **nom**, **date de naissance**, **âge** et **pouvoir(s)**.
- **FR-019** : Le système DOIT permettre d'ouvrir la **fiche en lecture seule** d'un individu depuis la liste, affichant ses informations globales (dont la **génération** = tranche de 20 ans de l'année de naissance), son ou ses pouvoirs (avec puissance/maîtrise) et ses traits actifs.
- **FR-020** : Le système DOIT calculer la **génération d'affichage** d'un individu comme la tranche de **20 ans** de son année de naissance, à des fins d'affichage et de tri/filtre ultérieurs.

**Persistance (no auto-save)**
- **FR-021** : Le système NE DOIT PAS sauvegarder automatiquement l'état ; aucune persistance implicite ne fait autorité.
- **FR-022** : Le système DOIT permettre d'**exporter** l'état (paramètres + seed + population) dans un **fichier** porteur d'un **identifiant de type**.
- **FR-023** : Le système DOIT permettre d'**importer** un fichier précédemment exporté pour **restaurer l'état à l'identique**, et DOIT **rejeter proprement** un fichier non reconnu ou corrompu sans altérer l'état courant.

### Key Entities

- **Seed / Générateur aléatoire** : entier 64 bits unique d'où dérive toute l'aléatoire ; source du déterminisme.
- **Trait** : unité élémentaire typée (un des 6 types) ; appartient à un catalogue éditable.
- **Catalogue de traits** : liste des traits disponibles par type, initialisée aux valeurs par défaut.
- **Espèce** : catégorie d'individu (défaut « humain ») portant son ensemble de **genres** (dont « tout »).
- **Personne** : individu de la population (identité, espèce, genre, date de naissance, âge, statut, ADN, pouvoir(s), parenté).
- **ADN** : liste de triplets `(trait, actif/inactif, résilience)` décrivant la génétique d'une personne.
- **Pouvoir** : combinaison de traits assortie d'une **puissance** et d'une **maîtrise**.
- **Population / État** : ensemble des individus générés + paramètres + seed, sérialisable en fichier d'export/import.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : Pour une seed et des paramètres donnés, deux générations successives produisent une population **100 % identique** (l'export des deux est rigoureusement le même).
- **SC-002** : Avec 0 % de chance de pouvoir, **0 %** des individus générés possèdent un pouvoir ; avec 100 %, **100 %** en possèdent exactement un.
- **SC-003** : Sur un grand effectif (≥ 1 000), la proportion d'individus dotés d'un pouvoir s'écarte de moins de **5 points** du pourcentage configuré.
- **SC-004** : Toutes les valeurs de **puissance** et de **maîtrise** des pouvoirs générés sont des entiers compris entre **1 et 10** inclus (100 % des cas).
- **SC-005** : La génération d'une population de **1 000 individus** s'effectue en **moins de 2 secondes** et l'interface reste réactive, y compris sur mobile.
- **SC-006** : Un cycle **export → rechargement → import** restaure un état **identique** à l'original (aucune perte ni altération de données), vérifiable par comparaison.
- **SC-007** : Un nouvel utilisateur parvient à générer et visualiser une population en **moins de 1 minute** sans aide.

## Assumptions

- **Effectif par défaut** : **100** individus (clarification 2026-06-09), modifiable par l'utilisateur.
- **Fiche en lecture seule** : la Feature 1 n'inclut **pas** l'édition d'individus ni les 3 modes d'affichage configurables des traits (reportés à une feature ultérieure) ; la fiche montre les informations globales, les pouvoirs et les traits actifs.
- **Pouvoir unique en genèse** : un individu du batch initial possède **au plus un** pouvoir (issu du gabarit de mutation forte), conformément à la source de vérité ; l'algorithme traits→pouvoirs (naissances normales) n'est **pas** sollicité dans cette feature.
- **Catalogue incomplet** : si un type de trait requis par le type de pouvoir tiré est vide, l'individu est généré **sans** ce pouvoir (pas d'erreur) ; ce cas est marginal puisque les catalogues par défaut couvrent les 6 types.
- **Export/import** : la Feature 1 fournit une version **minimale** (état complet : paramètres + seed + population) ; la déclinaison fine `config | data | full` et le partage avancé sont finalisés dans une feature ultérieure.
- **Hébergement / PWA / déploiement GitHub Pages** : ce sont des **contraintes d'infrastructure** (constitution, Principes II/III) traitées comme tâches de mise en place au `/speckit-plan`, et non comme exigences fonctionnelles de cette spec.
- **Anonymat** : aucune donnée personnelle de l'auteur n'apparaît dans le produit ni les artefacts (constitution, Principe X).
