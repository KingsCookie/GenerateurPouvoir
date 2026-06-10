# Phase 0 — Recherche & décisions techniques

Feature : Avancement du temps & dynamique de population (`003-avancement-temps-population`).
Décisions conformes à la constitution, à la spec (clarifications du 2026-06-10) et à la source de vérité
(§6.5, §6.6, §6.7, §9.4). Réutilise les acquis des Features 1 & 2.

## R1 — Réutilisation du socle (F1/F2)

- **Décision** : aucun nouveau choix de stack ; on étend `src/core` (TS pur) et `src/ui` (Svelte). Le `Rng`
  seedé, le modèle (`Personne`, `Conjoint` actuel/ex, `Espece`, `ADN`, `Pouvoir`), le moteur `reproduce`
  (F2) et l'export/import `full` sont **réutilisés**.
- **Rationale** : Principe VIII ; la simulation temporelle est une logique pure additionnelle.
- **Alternatives** : refonte du modèle (rejeté : inutile).

## R2 — Sérialisation de l'état du RNG (FR-021)

- **Décision** : exposer `rng.getState(): string[]` (les 4 mots d'état xoshiro256\*\* en décimal) et une
  fabrique `createRngFromState(state: string[]): Rng`. L'export `full` stocke `rngState`. À l'import, le RNG
  est **restitué** à l'état exact ; avancer le temps poursuit la **même séquence** qu'une session continue.
- **Rationale** : tranche le point en suspens §13 ; déterminisme bout-en-bout, y compris après save/load
  (SC-008). xoshiro256\*\* a un état fini (4×64 bits) trivialement sérialisable.
- **Alternatives** : ré-amorcer depuis la seed (rejeté par clarification : l'avance post-import différerait) ;
  rejouer le journal d'actions (rejeté : complexité, pas de journal en F3).
- **Note pureté** : `getState`/`createRngFromState` ne touchent ni `Date` ni `crypto` ; la garde de pureté
  reste verte.

## R3 — Gaussienne de reproduction (§9.4)

- **Décision** : probabilité **pure** d'un âge `a` :
  `p(a) = 0` si `a < début` ou `a > fin` ; sinon `p(a) = probaPic × exp(−((a − pic)²) / (2 × pente²))`.
  `p` est un **pourcentage** (0..probaPic) utilisé par `rng.chance(p)`. `pente` = écart-type (années).
- **Rationale** : cloche classique tronquée à la fenêtre [début, fin], maximum `probaPic` à l'âge `pic`,
  conforme à §9.4 (début/fin/pic/proba/pente). `Math.exp` est pur et déterministe.
- **Alternatives** : table d'âges (rejeté : moins lisible) ; gaussienne non tronquée (rejeté : reproduction
  hors fenêtre).

## R4 — Candidats : éligibilité & volonté

- **Décision** : un individu est **candidat** une année donnée s'il est **vivant**, **célibataire ou
  divorcé** (aucun conjoint *actuel*), et `âge ≤ âge de fin` de son espèce. Pour chaque candidat (parcouru
  dans l'**ordre stable** de la population), on tire `rng.chance(p(âge))` (R3) : succès ⇒ il **veut** se
  reproduire cette année.
- **Rationale** : reflète §6.6 pt 2 ; ordre stable ⇒ déterminisme (SC-001).
- **Alternatives** : inclure les déjà-couplés (rejeté : les couples ont leur propre voie, §6.6).

## R5 — Formation déterministe des groupes (appariement)

- **Décision** : à partir de la liste des candidats *voulant* se reproduire, former des **groupes de taille
  `groupSize` de l'espèce** par tirage déterministe :
  1. **mélange déterministe** des candidats (`rng.shuffle`) ;
  2. parcours du mélange ; pour chaque candidat non encore groupé, chercher dans l'ordre du mélange les
     `groupSize − 1` partenaires **compatibles** restants : **même espèce** et **non consanguins** (R6)
     **entre eux et avec le candidat**. *(Le **genre n'intervient pas** en F3 — décision d'analyse A1,
     reporté à une feature ultérieure.)*
  3. si un groupe complet est trouvé ⇒ **couple** (R8), retiré des disponibles ; sinon le candidat reste
     **non apparié** : il est **noté** et **re-candidatera l'année suivante** (FR-008), aucun couple partiel.
- **Rationale** : §6.6 (« tirer aléatoirement des groupes de la taille requise »), déterministe via shuffle ;
  pas d'inter-espèces ni de bris de couple (seuls les individus **seuls** sont candidats). Le **genre** est
  ignoré en F3 (reporté).
- **Alternatives** : appariement optimal/glouton pondéré (rejeté : YAGNI, non requis par la spec).

## R6 — Consanguinité (§6.6.1)

- **Décision** : paramètre **global** `consanguinityAllowed` (défaut **false**). Si interdite, deux individus
  sont **incompatibles** s'ils partagent **au moins un parent** OU **au moins un grand-parent**. Les
  grands-parents se calculent via `parents(parents(x))` sur la population. Comparaison sur ensembles d'ids.
- **Rationale** : reflète §6.6.1 exactement.
- **Alternatives** : profondeur paramétrable (reporté ; la spec fixe parents OU grands-parents).

## R7 — Portée (§6.6.2)

- **Décision** : `litterSize` = part de **M** enfants garantis ; puis, tant que `n < N`, tirer `rng.chance(X)`
  « un enfant de plus ? » ; on s'arrête au **premier échec** ou à **N**. Résultat ∈ `[M, N]`.
- **Rationale** : procédure littérale de §6.6.2.
- **Alternatives** : loi binomiale directe (rejeté : la spec décrit la procédure séquentielle, qui fixe aussi
  la consommation du RNG).

## R8 — Couples & reproduction des couples (§6.6, §9.4)

- **Décision** : entité **`Couple { id, memberIds[], reproPct: number | null }`** stockée dans l'état.
  Formation (R5) ⇒ les membres deviennent **conjoints *actuels*** mutuels et un `Couple` est créé
  (`reproPct = null` ⇒ dérivé de la gaussienne). **Reproduction** : un nouveau couple produit **une portée
  dès l'année de formation** (clarification) ; un couple **existant** tire chaque année `chance(pctEffectif)`
  où `pctEffectif = reproPct ?? p(âge moyen des membres)` (R3). Toute reproduction ⇒ portée (R7) via
  `reproduce` (F2) avec les membres comme parents.
- **Rationale** : §6.6 (« % issu de la même gaussienne », « éditable couple par couple »).
- **Alternatives** : dériver les couples des seuls `conjoints` (rejeté : pas de point d'ancrage pour
  `reproPct` éditable).

## R9 — Divorce & mort (§6.6, §6.7)

- **Décision (divorce)** : en début de tick, pour chaque couple, tirer `rng.chance(divorcePct)` (espèce) ;
  succès ⇒ couple supprimé, ses membres passent leurs conjoints *actuels* mutuels en **`ex`** et
  redeviennent célibataires.
- **Décision (mort)** : `kill(personne, cause)` exige une **cause non vide** ; sinon refus. L'individu
  passe `vivant=false`, `raisonDeces=cause`, reste dans la population. Un mort est **exclu** des candidats
  (R4) et des couples ; si un membre d'un couple meurt, le couple est dissous (membre survivant ⇒ célibataire,
  l'autre référencé en `ex`).
- **Rationale** : §6.6 pt 1 et §6.7.
- **Alternatives** : mort automatique (rejeté : §6.5 supprime la mort naturelle).

## R10 — Avance du temps & persistance (§6.5, FR-020/021)

- **Décision** : `currentYear` ajouté à l'état (défaut = `birthYear` de genèse). `advanceYears(state, X)`
  applique `tick` **X fois** (X ≥ 1), incrémentant `currentYear` à chaque passage. L'âge se calcule déjà
  `currentYear − année de naissance` (réutilise `computeAge`). Les enfants reçoivent un **jour aléatoire**
  dans `currentYear` (réutilise la logique F2). L'export `full` ajoute `currentYear`, `couples`, `rngState`.
- **Ordre des tirages du tick (fixé)** : (1) divorces (couples dans l'ordre stable) → (2) candidats &
  volonté (population dans l'ordre stable) → mélange & appariement → reproduction des **nouveaux** couples
  (ordre de formation) → reproduction des **couples existants** (ordre stable) ; chaque portée consomme le
  RNG via `litter` puis `reproduce` par enfant.
- **Rationale** : un ordre fixe garantit SC-001 ; la sérialisation du RNG (R2) garantit SC-008.
- **Alternatives** : ordre dépendant de structures non triées (rejeté : romprait le déterminisme).

## Points explicitement reportés (hors Feature 3)

- Arbre généalogique, filtres, 3 modes d'affichage des traits — **Feature 4**.
- Page de paramètres à 3 niveaux + **courbes gaussiennes affichées**, édition complète des catalogues
  d'espèces/genres — **Feature 5** (les paramètres existent dès ici).
- Déclinaison d'export `config|data|full` & partage avancé — **Feature 6**.
- Création / édition manuelle d'individus (§6.8), sandbox & « make it real » — **Features ultérieures**.
