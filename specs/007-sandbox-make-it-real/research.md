# Recherche & décisions — Feature 007 (Sandbox isolée & « make it real »)

Phase 0. Décisions techniques résolvant le contexte. Aucune dépendance ajoutée (Principe VIII).

## D1 — Isolation de la sandbox

- **Décision** : la sandbox est une **copie profonde** de l'`AppState` réel courant (snapshot), détenue
  par un **store UI distinct** (`sandboxStore`), avec une **instance RNG forkée**
  `createRngFromState(snapshot.rngState)`. Les opérations métier sont des **fonctions pures** du cœur
  `(AppState, …) → AppState` ; le store applique le résultat à la copie sandbox **uniquement**.
- **Rationale** : isolation stricte (FR-004) garantie par construction (les stores réels ne sont jamais
  écrits avant « make it real ») ; pureté/testabilité (Principe IV/V) ; déterminisme du RNog forké.
- **Alternatives rejetées** : muter l'état réel et « annuler » (risque de fuite, anti-Principe VI) ;
  diff/patch incrémental (complexe, inutile vu la taille).

## D2 — « Make it real » = transfert (remplacement complet)

- **Décision** : promotion = **les stores réels reçoivent l'état sandbox** (population, couples, année,
  `rngState`, `history`) ; `engineRng = createRngFromState(sandbox.rngState)`. **Aucun rejeu.**
- **Rationale** : Clarification 2026-06-17 (« l'état sandbox devient l'état réel » + « transfert ») ; ce
  qui a été observé est exactement ce qui devient réel ; déterminisme conservé (position RNG transférée).
- **Alternatives rejetées** : rejouer les actions sur l'état réel (peut diverger ; complexe) ; fusion des
  seules différences (conflits si l'état réel a changé — il ne change pas pendant la sandbox, donc inutile).

## D3 — Reset

- **Décision** : `reset` ré-initialise la sandbox depuis un **nouveau snapshot** de l'état réel courant
  (mêmes données + `rngState`), RNG re-forké.
- **Rationale** : FR-006 ; simple et sûr.

## D4 — Reproduction manuelle (mode + un appel pur)

- **Décision** : l'UI tient l'**état du mode** (actif, parents sélectionnés, nb enfants, derniers parents).
  « Valider » appelle la fonction **pure** `manualReproduce(state, parentIds, count, birthYear, rng)` qui
  produit `count` enfants via `reproduce` (Feature 2), chacun avec `dateNaissance` = jour **aléatoire** de
  `birthYear`, pose la parenté (parents.enfants += childId), émet les événements `birth`, et renvoie le
  nouvel état. Puis l'UI sort du mode + vide la sélection. « Annuler » sort sans appeler le cœur.
- **Rationale** : réutilise le moteur testé (déterminisme) ; le mode/боutons sont de l'UI (horloge/DOM
  interdits au cœur) ; le **jour aléatoire** vient du RNG forké (déterministe), pas de l'horloge.
- **Alternatives rejetées** : portée M/N/X (l'utilisateur a tranché « nombre choisi ») ; sélection hors
  mode (l'UX impose un mode explicite avec valider/annuler).

## D5 — Création / clonage / édition (individus autonomes)

- **Décision** : `createPerson(state, draft, newId)` crée un individu **autonome** (parents/enfants/
  conjoints vides) ; `clonePerson(state, srcId, newId)` reprend les **attributs** (espèce, genre, ADN,
  pouvoirs, notes, vivant) **sans** liens de parenté ; `editPerson(state, id, patch)` modifie des
  **attributs** (jamais `parents`/`enfants`/`conjoints`). La parenté ne s'obtient que par
  `manualReproduce` (Clarification : « rattachement via reproduction uniquement »).
- **Rationale** : cohérence généalogique (pas de cycles/dates incohérentes), règles de suppression fiables.
- **Alternatives rejetées** : rattachement manuel libre (risque d'incohérences ; non retenu en clarif).

## D6 — Suppression avec propagation

- **Décision** : `deletePerson(state, id): Result<AppState>` — **refus** si `enfants.length > 0`
  (a des descendants) ; sinon retrait **partout** : (a) du tableau population ; (b) chez chaque **parent**,
  retrait de `id` dans `enfants` ; (c) chez chaque **conjoint** (actuel/ex), retrait du lien vers `id` —
  le partenaire **repasse à son état antérieur** (s'il n'a plus de conjoint actuel ⇒ célibataire ; ses ex
  restants demeurent) ; (d) dans `couples`, retrait du membre / dissolution du couple si < 2 membres.
- **Rationale** : « disparaît de partout » + propagation conjoint/parents (FR-013/014/015) ; « pas de
  descendants » ⇔ « pas d'enfants directs » (sans enfant, aucun descendant transitif).
- **Note** : pur, sans aléatoire ; renvoie `Err` explicite si descendants ou individu introuvable.

## D7 — Journal d'événements daté & reconstruction

- **Décision** : ajouter `AppState.history: PopulationEvent[]` (additif). Types d'événements **datés à
  l'année** : `birth`, `death`, `couple` (formation), `divorce` (dissolution). Émis par
  `generateInitialPopulation` (births à l'année de genèse), `tick` (births/couple/divorce à `currentYear`),
  `kill` (death à `currentYear`), et `manualReproduce` (births à `birthYear`). `reconstructAtYear(state,
  year)` est une **projection pure** : individus dont `birth.year ≤ year` (vivant ⇔ pas de `death.year ≤
  year`), couples formés `≤ year` non dissous `≤ year`, conjoints/`enfants` filtrés en conséquence.
- **Rationale** : seule façon de restituer couples/divorces/décès **tels qu'à l'année** (Clarification) ;
  **additif** (la logique « état courant » de Feature 3 reste intacte, on émet en plus) ; O(événements).
- **Rétro-compatibilité** : fichiers/états sans `history` ⇒ `history = []` ; la reconstruction **dégrade**
  alors gracieusement (l'« état courant » reste exact ; les années passées ne sont pas reconstituables
  faute de données — documenté). `FORMAT_VERSION → 3`.
- **Alternatives rejetées** : **re-simulation** depuis la seed (cassée par les interventions manuelles &
  injections « make it real ») ; **champs datés sur entités** (`Couple.startYear/endYear`, `Conjoint`
  daté) — plus invasif que le journal additif.

## D8 — Retrait de la reproduction manuelle de la page principale

- **Décision** : retirer de la page principale (liste) les contrôles de **sélection multiple** et
  `reproduceSelected` (Feature 2/3) ; les déplacer dans l'écran sandbox. La page principale ne garde que
  « avancer de X années ».
- **Rationale** : §10.2 (« reproduction manuelle = sandbox uniquement ») + intention utilisateur ; la repro
  manuelle en page principale n'était qu'un accès temporaire avant l'existence de la sandbox.
- **Note** : le **cœur** `reproduce` reste inchangé (réutilisé par la sandbox) ; seule l'UI bouge.

## D9 — Persistance (Feature 6) & versionnage

- **Décision** : `history` fait partie des **données** (`data`/`full`) ; la sérialisation canonique
  l'inclut automatiquement. `parseImport`/`deserializeState` **défautent** `history → []` si absent.
  `FORMAT_VERSION` passe à **3** (cohérent avec la rétro-compat existante).
- **Rationale** : aucun nouveau type de fichier ; partage/reprise inchangés ; rétro-compat préservée.

## D10 — Aucune dépendance ajoutée

- **Décision** : tout est réalisé avec l'existant (TS, Svelte stores, `reproduce`, `kill`, sérialisation,
  rendus liste/fiche/arbre). **Aucune** dépendance (Principe VIII).
