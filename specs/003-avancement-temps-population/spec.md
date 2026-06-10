# Feature Specification: Avancement du temps & dynamique de population

**Feature Branch**: `003-avancement-temps-population`
**Created**: 2026-06-10
**Status**: Draft
**Input**: `rsrc/plangénéral.md` (Feature 3) ; source de vérité `rsrc/DescriptionProjet.md` §6.5, §6.6 (+6.6.1, 6.6.2), §6.7, §9.4, §3.4.

## Résumé

Ajouter la **couche de simulation temporelle** par-dessus le moteur génétique (Feature 2). L'utilisateur
**avance le temps de X années** ; chaque année applique un **tick annuel** déterministe : divorces
éventuels, formation de couples parmi les candidats (selon une **gaussienne de reproduction** par espèce,
en respectant **consanguinité** et **non-inter-espèces**), reproduction des couples, et **portées**
(M/N/X). Les individus **vieillissent** (âge = année courante − année de naissance), une **date courante**
progresse, et l'utilisateur peut **tuer manuellement** un individu (cause obligatoire). Tout reste
**pur, déterministe, testé à seed fixe** : même seed + même séquence d'avancements ⇒ population identique.

Cette feature **ne traite pas** : arbre généalogique / filtres (Feature 4), page de paramètres avancée à
3 niveaux & courbes affichées (Feature 5 ; les paramètres d'espèce **existent** ici avec des défauts),
création/édition manuelle d'individus (§6.8, Feature ultérieure).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Avancer le temps : reproduction automatique annuelle (Priority: P1) 🎯 MVP

En tant qu'utilisateur, je veux **avancer la simulation de X années** pour voir la population évoluer
naturellement : des couples se forment selon l'âge (gaussienne de reproduction), se reproduisent et
donnent des **portées** d'enfants, et tout le monde **vieillit**.

**Why this priority** : c'est la raison d'être de la feature — la dynamique de population. Sans elle, la
reproduction reste manuelle (Feature 2). Indépendamment testable : avancer d'1 an sur une population
génère des naissances déterministes.

**Independent Test** : sur une population de genèse à seed fixe, cliquer « avancer de 1 an » ⇒ certains
célibataires en âge de se reproduire forment des couples et produisent des portées (enfants reliés à
leurs parents, nés dans l'année) ; rejouer avec la même seed ⇒ résultat **identique** ; l'âge de chacun
augmente d'1 ; la date courante avance d'1 an.

**Acceptance Scenarios** :

1. **Given** une population avec des individus en âge de reproduction, **When** j'avance de 1 an,
   **Then** des couples se forment parmi les candidats (taille requise par l'espèce), produisent des
   portées (taille M..N), et l'année courante augmente de 1.
2. **Given** la même seed et la même population de départ, **When** j'avance de N années deux fois
   (depuis le même état), **Then** les deux populations résultantes sont **strictement identiques**.
3. **Given** un individu né en année Y, **When** la date courante est Y+k, **Then** son âge affiché est k.
4. **Given** un individu **plus âgé que l'âge maximal de reproduction** de son espèce, **When** j'avance
   le temps, **Then** il ne candidate pas à la reproduction.
5. **Given** la consanguinité **interdite** (défaut), **When** des couples se forment, **Then** deux
   individus partageant les **mêmes parents ou grands-parents** ne forment jamais de couple ensemble.

---

### User Story 2 — Cycle de vie des couples : divorces & reproduction des couples (Priority: P2)

En tant qu'utilisateur, je veux que les **couples déjà formés** puissent **se reproduire** d'année en
année et puissent **divorcer** (selon le taux de l'espèce), les anciens conjoints devenant des **« ex »**.

**Why this priority** : enrichit la dynamique (couples durables vs ruptures) ; dépend de la formation de
couples (US1). Testable seule via les taux (divorce 0 %/100 %).

**Independent Test** : avec un taux de divorce à 100 %, avancer d'1 an ⇒ tous les couples se dissolvent,
les membres redeviennent célibataires et se référencent mutuellement comme **ex-conjoints**. Avec un taux
de reproduction de couple élevé, un couple existant produit une portée chaque année.

**Acceptance Scenarios** :

1. **Given** un couple existant et un taux de divorce de 100 %, **When** j'avance de 1 an, **Then** le
   couple est dissous : chaque membre redevient célibataire et conserve l'autre dans ses **ex-conjoints**.
2. **Given** un couple existant non dissous, **When** j'avance de 1 an, **Then** il a une chance de
   produire une portée selon le pourcentage (issu de la gaussienne, **éditable couple par couple**).
3. **Given** un couple, **When** ses deux membres sont **conjoints actuels**, **Then** ils ne se
   reproduisent **qu'au sein de ce couple** tant qu'il n'y a pas divorce.

---

### User Story 3 — Mort manuelle (Priority: P3)

En tant qu'utilisateur, je veux pouvoir **tuer manuellement** un individu (à tout âge) en indiquant une
**cause obligatoire** ; il reste dans la population marqué **décédé** et ne se reproduit plus.

**Why this priority** : il n'y a plus de mort naturelle ; la mort est un acte utilisateur, utile mais non
bloquant pour la simulation. Indépendamment testable depuis la fiche d'un individu.

**Independent Test** : depuis la fiche d'un individu vivant, déclencher « tuer », saisir une cause ⇒
l'individu devient décédé (cause stockée), n'apparaît plus comme candidat ni conjoint actif lors des
avancements suivants.

**Acceptance Scenarios** :

1. **Given** un individu vivant, **When** je le tue avec la cause « accident », **Then** il est marqué
   décédé, sa **raison du décès** vaut « accident », et il reste présent dans la population.
2. **Given** un individu décédé, **When** j'avance le temps, **Then** il ne candidate jamais à la
   reproduction et n'est jamais retenu dans un nouveau couple.
3. **Given** la tentative de tuer sans saisir de cause, **When** je valide, **Then** l'action est refusée
   (cause obligatoire).

---

### Edge Cases

- **Aucun candidat / candidats en nombre insuffisant** : les candidats n'ayant pas trouvé assez de
  partenaires (taille de groupe non atteinte) sont **notés** et **re-candidatent l'année suivante** ; aucun
  couple partiel n'est formé.
- **Population sans individu en âge de reproduction** : avancer le temps ne produit aucune naissance, mais
  l'âge et la date courante avancent normalement.
- **Genre** : en Feature 3, le genre **n'a aucun effet** sur l'appariement — tout candidat peut se grouper
  avec tout autre candidat de la **même espèce** ; les contraintes de genre (dont le genre `"tout"`) sont
  **reportées** à une feature ultérieure. La règle **jamais inter-espèces** s'applique, et seuls les
  individus **seuls** (célibataires/divorcés) forment un **nouveau** couple.
- **Avancer de plusieurs années** : appliquer le tick **année par année**, dans l'ordre, X fois (un X ≥ 1).
- **Un individu décédé** : exclu des candidats et des couples ; un couple dont un membre meurt n'est plus
  reproductif (le membre survivant peut re-candidater).
- **Portée bornée** : le nombre d'enfants est borné à `[M, N]` ; au moins **M** enfants par reproduction.
- **Reproduction = moteur Feature 2** : chaque enfant d'une portée est produit par le pipeline §5
  (hérédité, traits→pouvoirs, P/M, cas spéciaux) à partir des **membres du couple** comme parents.

## Requirements *(mandatory)*

### Functional Requirements

**Avancement du temps & vieillissement (§6.5)**
- **FR-001** : Le système DOIT fournir une action « **avancer de X années** » avec **X réglable ≥ 1** ;
  avancer applique le **tick annuel** (FR-004) **année par année**, X fois.
- **FR-002** : Le système DOIT maintenir une **date/année courante** (toujours au **1ᵉʳ janvier**) qui
  progresse d'1 an par tick.
- **FR-003** : L'**âge** d'un individu DOIT être calculé comme `année courante − année de naissance` ;
  il n'y a **aucune mort naturelle** (pas d'âge de mort, pas d'option immortel).

**Tick annuel (§6.6)**
- **FR-004** : Chaque tick annuel DOIT s'appliquer dans l'**ordre fixe** : (1) **divorces potentiels**,
  (2) **mises en couple & naissances** (candidats célibataires/divorcés puis couples existants).
- **FR-005** : (Divorces) Pour chaque couple, le système DOIT tester, **à chaque année**, le **% de
  divorce de l'espèce** ; en cas de divorce, les membres **redeviennent célibataires** et se référencent
  mutuellement comme **ex-conjoints**.
- **FR-006** : (Candidats) Chaque individu **célibataire ou divorcé**, **vivant**, et **pas plus âgé que
  l'âge maximal de reproduction** de son espèce DOIT tirer, selon la **gaussienne de reproduction** (§9.4)
  évaluée à son âge, le **% de chance de vouloir se reproduire** cette année.
- **FR-007** : (Formation de couples) Le système DOIT constituer la **liste des candidats** et former des
  **groupes** de la **taille de reproduction de l'espèce**, par **tirage déterministe**, en respectant :
  **pas d'inter-espèces** et règles de **consanguinité** (FR-010). *(En Feature 3, le **genre n'impacte pas**
  la capacité à se reproduire ; toute contrainte de compatibilité de genre — y compris le genre `"tout"` —
  relève d'une **feature ultérieure**.)*
- **FR-008** : (Candidats non appariés) Les candidats n'ayant **pas** trouvé assez de partenaires NE
  DOIVENT **pas** former de couple cette année ; ils sont **notés** et **re-candidatent l'année suivante**.
- **FR-009** : (Couples formés) Un groupe formé devient un **couple** : ses membres deviennent **conjoints
  actuels** les uns des autres et ne peuvent se reproduire **qu'au sein de ce couple** jusqu'au divorce.
- **FR-010** : (Consanguinité) Un **paramètre** autorise/interdit la consanguinité (**défaut : interdite**).
  Si interdite, deux individus partageant **les mêmes parents OU les mêmes grands-parents** NE DOIVENT
  **pas** former de couple ensemble.
- **FR-011** : (Reproduction des couples) Chaque couple déjà formé DOIT avoir, chaque année, un **% de
  chance de se reproduire** **issu de la même gaussienne** (§9.4) évaluée selon l'âge de ses membres ; ce
  pourcentage DOIT rester **éditable couple par couple**.
- **FR-012** : Toute reproduction (nouveau couple **ou** couple existant) DOIT produire **une portée**
  (FR-013), chaque enfant étant généré par le **moteur de reproduction de la Feature 2** à partir des
  membres du couple comme parents (liens de parenté posés des deux côtés). Un **nouveau couple** formé au
  tick produit une portée **dès l'année de formation** (clarification).
- **FR-013** : (Portée §6.6.2) Le nombre d'enfants DOIT partir de **M** garantis, puis tirer à **X %**
  « un enfant de plus ? » de façon répétée **jusqu'à un échec ou jusqu'à N** ; résultat borné `[M, N]`.

**Mort (§6.7)**
- **FR-014** : L'utilisateur DOIT pouvoir **tuer** manuellement un individu **à tout âge**, en saisissant
  une **cause obligatoire** (texte libre) stockée dans la **raison du décès**.
- **FR-015** : Un individu **décédé** DOIT rester dans la population, marqué « décédé », et NE DOIT plus
  être **candidat** ni retenu dans un **nouveau couple** ni se reproduire.

**Conjoints**
- **FR-016** : Le système DOIT distinguer les conjoints **actuels** des **ex-conjoints** et tenir ces
  listes à jour lors des mises en couple (FR-009) et des divorces (FR-005).

**Paramètres d'espèce (§9.4)**
- **FR-017** : Chaque **espèce** DOIT exposer (avec défauts modifiables) : la **portée** `M`/`N`/`X %`, la
  **gaussienne de reproduction** (âge de début, âge de fin/maximal, âge du pic, probabilité au pic, pente/
  écart-type), le **% de divorce** par an, et la **taille du groupe de reproduction** (défaut **2**). Le **%
  de reproduction d'un couple** dérive de cette gaussienne (pas de paramètre séparé) mais reste éditable
  par couple (FR-011). Défauts **humain** : gaussienne **début 18 / pic 25 / fin 50**, **probabilité au
  pic 40 %**, pente modérée (clarification, ajusté).
- **FR-018** : Le paramètre global **consanguinité** (FR-010) DOIT être exposé (défaut interdite) au niveau
  **modèle & export/import** en Feature 3 ; son **édition dans l'écran des paramètres** relève de la
  **Feature 5** (page de paramètres complète).

**Déterminisme & persistance**
- **FR-019** : Tout l'aléatoire du tick (divorces, volonté de reproduction, formation des groupes, portées,
  reproduction Feature 2) DOIT passer par le **RNG seedé** ; à seed et séquence d'actions identiques, le
  résultat DOIT être **strictement reproductible**.
- **FR-020** : L'**état** étendu (date courante, couples/conjoints, statut vivant/décédé + cause, nouveaux
  individus & parenté) DOIT être inclus dans l'**export/import** existant (round-trip sans perte).
- **FR-021** : L'**état du RNG** DOIT être inclus dans l'export ; après un import, **avancer le temps**
  produit la **même suite** que si l'on n'avait pas sauvegardé/rechargé (continuation strictement
  déterministe, clarification — tranche le point en suspens §13 sur la persistance du RNG).

**Affichage (liste)**
- **FR-022** : Dans l'écran **Liste**, lorsqu'une personne possède **plusieurs pouvoirs**, ceux-ci
  DOIVENT être séparés par un **délimiteur lisible distinct des virgules internes aux libellés** —
  en l'occurrence ` || ` (double barre verticale) — et non par une simple virgule.

**Bugfix**: 2026-06-10 — BUG-001 Ajout de FR-022 (séparateur ` || ` des pouvoirs multiples dans la liste).

### Key Entities *(include if feature involves data)*

- **Date / année courante** : entier d'année (au 1ᵉʳ janvier) qui progresse à chaque tick.
- **Couple** : groupe de conjoints actuels (taille = taille de reproduction de l'espèce) ; porte un **%
  de reproduction** éditable ; peut être dissous (divorce).
- **Conjoint (actuel / ex)** : référence entre individus, avec statut `actuel | ex` (déjà au modèle F1).
- **Candidat à la reproduction** : individu éligible une année donnée (vivant, célibataire/divorcé, âge ≤
  âge max), avec sa probabilité issue de la gaussienne.
- **Paramètres d'espèce** : portée `M/N/X`, gaussienne (début, fin, pic, proba pic, pente), % divorce,
  taille de groupe de reproduction, genres.
- **Statut de vie** : `vivant` + `raison du décès` (déjà au modèle F1), renseignés par la mort manuelle.
- **État du RNG (sérialisé)** : capture de l'état courant du générateur, inclus dans l'export pour
  permettre une **continuation déterministe** de la simulation après import (FR-021).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** : **Déterminisme** — à seed fixe, avancer de N années depuis un même état produit une
  population **strictement identique** à chaque exécution (100 % reproductible).
- **SC-002** : **Vieillissement** — après avoir avancé de k années, l'âge de tout individu vivant a
  augmenté d'exactement k, et la date courante a avancé de k.
- **SC-003** : **Portées bornées** — sur un grand nombre de reproductions, le nombre d'enfants par portée
  est toujours dans `[M, N]`, avec au moins M.
- **SC-004** : **Consanguinité** — consanguinité interdite ⇒ **0 couple** formé entre individus partageant
  parents ou grands-parents (vérifiable sur une population générée).
- **SC-005** : **Taux** — divorce à 0 % ⇒ aucun divorce ; à 100 % ⇒ tous les couples dissous en 1 an ;
  les proportions intermédiaires respectent le taux paramétré à ±5 points sur un grand échantillon.
- **SC-006** : **Non-inter-espèces** — aucun couple n'est formé entre individus d'espèces différentes.
- **SC-007** : **Mort** — un individu tué (cause obligatoire) est marqué décédé, conserve sa cause, et
  n'apparaît plus dans aucune reproduction ultérieure ; tuer sans cause est refusé.
- **SC-008** : **Round-trip & continuation** — export puis import après plusieurs avancements restaure un
  état **égal** (date, couples, conjoints, statuts, parenté **et état du RNG** inclus) ; **avancer après
  import** produit la **même population** qu'une session non interrompue (FR-021).
- **SC-009** : **Performance** — avancer d'1 an sur une population de ~1 000 individus reste fluide
  (< ~1 s en pratique).

## Assumptions

- **Taille de groupe de reproduction** : §9.4 ne nomme pas explicitement ce paramètre ; on l'expose par
  espèce avec **défaut 2** (couple classique — confirmé en clarification). La formation forme des groupes
  de cette taille.
- **Gaussienne → probabilité** : la « gaussienne de reproduction » fournit, pour un âge donné, un **%** de
  volonté de reproduction, à partir de (âge début, âge fin, âge pic, proba au pic, pente). Défauts humain
  fixés (clarification) : **18 / 25 / 50**, **pic 40 %** ; hors de la plage [début, fin] la probabilité est
  nulle. La **formule exacte** de la courbe (normale tronquée) est un détail d'implémentation (`/speckit-plan`).
- **Couple = parents d'une portée** : la reproduction d'un couple utilise **tous** ses membres comme
  parents via le moteur Feature 2 (≥ 1 parent ; généralement 2).
- **Nouveaux couples se reproduisent l'année de formation** : un groupe formé au tick produit **une portée**
  ce même tick (les candidats voulaient se reproduire).
- **Date sans mois/jour pour le temps courant** : le temps courant est l'**année** (1ᵉʳ janvier) ; les
  enfants reçoivent un **jour aléatoire** dans l'année (comme en genèse/Feature 2).
- **Une seule espèce par défaut** (`humain`) ; l'édition du catalogue d'espèces complet relève de Feature 5,
  mais les **paramètres d'espèce** nécessaires au tick existent dès ici (défauts modifiables).
- **Pas d'arbre généalogique visuel ici** (Feature 4) ; l'Ui se limite au bouton d'avancement, à
  l'affichage de la date/âge, et à l'action « tuer ».

## Clarifications

### Session 2026-06-10
- Q: Taille du groupe de reproduction (« couple ») ? → A: **Paramétrable par espèce, défaut 2** (autorise > 2 ultérieurement ; le moteur F2 gère déjà plusieurs parents).
- Q: Un nouveau couple produit-il une portée dès l'année de sa formation ? → A: **Oui**, dès le tick de formation.
- Q: Déterminisme après export/import puis avancement ? → A: **Inclure l'état du RNG dans l'export** (continuation strictement déterministe après import).
- Q: Profil de gaussienne de reproduction par défaut (humain) ? → A: **16 / 25 / 50** (début / pic / fin), **probabilité au pic 60 %**, pente modérée. _(Ajusté ensuite : début **16 → 18**, pic **60 % → 40 %** ; portée X de 40 % → **15 %**.)_
- Q: (analyse C1) Édition du paramètre **consanguinité** dans l'UI ? → A: **Reportée à la Feature 5** ; en F3, exposé au niveau modèle & export/import uniquement.
- Q: (analyse A1) Le **genre** contraint-il l'appariement en F3 ? → A: **Non** — le genre n'a aucun effet sur la reproduction pour l'instant ; contraintes de genre reportées à une feature ultérieure.
