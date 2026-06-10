# Research — Généalogie & exploration (Feature 4)

Toutes les décisions découlent de la spec (§8.1–8.5) et des clarifications (3 sessions). Aucun
`NEEDS CLARIFICATION` résiduel. Aucune nouvelle dépendance.

## R1 — Construction de l'arbre généalogique

- **Décision** : fonction pure récursive `buildGenealogyTree(rootId, byId, depth, opts)` qui
  descend **séparément** vers les **ancêtres** (champ `parents`) et les **descendants** (champ
  `enfants`), en décrémentant `depth` à chaque niveau ; arrêt à `depth === 0` ou lien absent.
- **Répétition assumée** (clarification) : un individu atteint par plusieurs chemins est
  **reconstruit à chaque emplacement** (pas de mémoïsation de présence) ; la terminaison est
  garantie par la **borne de profondeur**, pas par un ensemble « déjà vu ». Pas de vue graphe.
- **Rationale** : vue arbre simple, déterministe, facile à rendre et à tester ; conforme au choix
  utilisateur.
- **Alternatives rejetées** : déduplication / DAG (rendu et tests nettement plus complexes ;
  rejeté explicitement).

## R2 — Conjoints & unions dans l'arbre

- **Décision** : chaque nœud porte ses **unions** = (conjoint **actuel** ou **ex**) + **enfants
  communs** (individus dont l'ensemble `parents` contient **le nœud et ce conjoint**). On
  **n'inclut pas** les autres enfants du conjoint (avec des tiers) ni les **parents** du conjoint.
- **Rationale** : clarification explicite ; garde l'arbre centré sur la lignée de l'individu.
- **Note** : les enfants des unions **sont** les descendants de niveau −1 (mêmes individus que via
  `enfants`) ; l'union sert à les **regrouper par conjoint** pour l'affichage. Le conjoint lui-même
  est un **nœud latéral** (même niveau), **non** déplié vers ses ancêtres.

## R3 — Profondeur (fiche vs page dédiée)

- **Décision** : fiche **figée à 2** (FR-002a) ; page dédiée **N réglable ≥ 1, sans plafond**
  (FR-005, clarification). La garde de performance pour de grands N est **UI** (zone défilante),
  pas une limite du cœur.
- **Rationale** : lecture rapide sur la fiche, exploration libre sur la page dédiée.
- **Alternatives rejetées** : plafond fixe (5/10) — rejeté par l'utilisateur.

## R4 — Contenu des cases selon la page

- **Décision** : le cœur renvoie des **nœuds complets** (id, nom, âge, libellés de pouvoirs +
  références) ; le **choix des champs affichés** est une responsabilité **UI** : fiche = nom +
  pouvoir(s) (FR-003b), page dédiée = nom + âge + pouvoir(s).
- **Rationale** : cœur uniforme et réutilisable ; pas de duplication de logique.

## R5 — Moteur de filtres

- **Décision** : fonction pure `filterPopulation(pop, criteria, ctx)` ; **OU** au sein d'une
  dimension (plusieurs valeurs), **ET** entre dimensions (clarification). Critères : `nameQuery`,
  `generations:Set`, `especeIds:Set`, `traitIds:Set` + `traitScope: 'actifs'|'inactifs'|'tous'`,
  `powerPresence: 'any'|'none'|null`, `statuses:Set<'vivant'|'décédé'>`.
- **Nom** : comparaison **normalisée** (minuscule + suppression des diacritiques via
  `normalize('NFD')`/regex, déjà utilisé dans le cœur) en **sous-chaîne**.
- **Rationale** : aligne sur les scénarios d'acceptation ; pur et testable.
- **Alternatives rejetées** : moteur d'expression générique (sur-ingénierie, YAGNI).

## R6 — Filtre trait (portée) & filtre pouvoir (présence)

- **Décision** : trait → portée **actifs / inactifs / tous** ; un individu correspond si **au moins
  un** trait recherché est présent **selon la portée** (OU intra-dimension). Pouvoir → **présence
  /absence** seulement (`any` = ≥ 1 pouvoir, `none` = 0).
- **Rationale** : clarifications explicites ; cas de test simples et déterministes.

## R7 — Dernière génération & défaut dynamique

- **Décision** : `lastGeneration(pop)` = max `computeGeneration(birthYear)` parmi les individus
  (vivants ou non). La Liste applique ce filtre **par défaut** ; tant que l'utilisateur n'a pas
  modifié le filtre génération (`generationTouched === false`), le défaut se **recale** à chaque
  rendu/avance du temps. Dès modification manuelle, le choix utilisateur prime.
- **Rationale** : « voir d'abord les derniers nés » sans empêcher l'exploration ; FR-011a/b.
- **Réutilise** `computeGeneration` (existant, tranche 20 ans).

## R8 — Persistance des filtres (session)

- **Décision** : store Svelte **au niveau module** (`src/ui/stores/filters.ts`) ⇒ vit toute la
  session quel que soit le montage/démontage des vues ; restauré au retour sur la Liste. **Non**
  inclus dans l'export/import (état d'**interface**, pas donnée — Principe VI).
- **Rationale** : confort de navigation sans polluer le format de données.
- **Alternatives rejetées** : localStorage (état caché faisant autorité — contraire au Principe VI) ;
  inclusion dans l'export (mélange UI/données).

## R9 — Mode d'affichage des traits

- **Décision** : énumération `1|2|3`, **défaut 3** (clarification) ; store UI ; pilote le rendu de
  la fiche (Mode 1 pouvoirs ; 2 +actifs ; 3 +inactifs & résilience). `buildFicheView` fournit déjà
  `traitsActifs`/`traitsInactifs`/`pouvoirs` → le mode **filtre l'affichage**, sans recalcul cœur.
- **Rationale** : présentation seule ; réutilise le VM existant.

## R10 — Navigation vers la page dédiée

- **Décision** : étendre le **routage interne** existant (sélection de vue via store) avec une vue
  `arbre` portant `rootId` + `depth` ; bouton « Explorer l'arbre » depuis la fiche. Clic sur une
  case = recentrage (`rootId := cliqué`) ; sur la fiche, le clic ouvre la **fiche** de l'individu.
- **Rationale** : cohérent avec l'architecture UI actuelle (pas de routeur ajouté — YAGNI).

## R11 — Déterminisme de l'ordre

- **Décision** : tout ordre exposé (frères/sœurs, enfants d'une union, résultats de filtre) est
  **trié** par **date de naissance puis id** (stable). Aucune dépendance à l'ordre d'itération
  d'objets.
- **Rationale** : Principe I ; tests exactement vérifiables.

## R12 — Performance

- **Décision** : filtres en **O(n)** sur la population (indexation simple des traits/pouvoirs par
  individu) ⇒ < 1 s pour 1 000 (SC-002). Arbre : coût borné par N à la fiche (2) ; sur la page
  dédiée, N libre ⇒ rendu en **zone défilante**, construction paresseuse possible si besoin
  (optimisation différée, YAGNI tant que non nécessaire).
- **Rationale** : objectifs de perf atteints sans complexité prématurée.
