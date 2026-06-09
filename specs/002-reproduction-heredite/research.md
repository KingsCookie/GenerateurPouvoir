# Phase 0 — Recherche & décisions techniques

Feature : Reproduction & hérédité (`002-reproduction-heredite`).
Décisions respectant la constitution et la spec (clarifications du 2026-06-09 incluses).
Réutilise les acquis de la Feature 1 (D1–D11 de `specs/001-fondations-genese/research.md`).

## R1 — Réutilisation du socle Feature 1

- **Décision** : aucun nouveau choix de stack ; on étend `src/core` (TypeScript pur) et `src/ui` (Svelte).
  Le `Rng` seedé (SplitMix64 + xoshiro256\*\*), le modèle, les catalogues, le gabarit de mutation forte,
  l'export/import `full` et la liste/fiche sont **réutilisés**.
- **Rationale** : Principe VIII (simplicité) ; le moteur génétique est une **logique pure** additionnelle.
- **Alternatives** : refonte du modèle (rejeté : inutile, risqué).

## R2 — Mélange déterministe (shuffle)

- **Décision** : ajouter un **`shuffle(items)` déterministe** au `Rng` (Fisher–Yates utilisant `nextInt`).
  Utilisé pour : mélange des secondaires/principaux (§6.4.1) et mélange des pouvoirs de chaque parent (§7.2).
- **Rationale** : le déterminisme exige un mélange piloté par la seed (Principe I) ; Fisher–Yates non biaisé
  via `nextInt` (déjà sans biais).
- **Alternatives** : `sort` avec comparateur aléatoire (rejeté : biais + non portable).

## R3 — Hérédité par résilience (§4) : bonus/malus **additif**

- **Décision** : pour chaque (parent, trait porté), tirage actif/inactif via `rng.chance(résilience)`.
  Agrégation §4.2 (Cas 1 / Cas 2). Le bonus/malus est **additif** (clarification) : `+bonus` points si le
  trait est retenu **actif**, `−malus` si **inactif** ; en cas de ≥ 2 tirages actifs, **bonus appliqué autant
  de fois**. Résilience **plafonnée** à la résilience max et **plancher au seuil** ; sous le seuil → trait
  **supprimé** de l'ADN de l'enfant.
- **Ordre des tirages** (déterminisme) : itérer les traits dans un **ordre stable** (clé de trait triée),
  puis pour chaque trait, itérer les parents porteurs dans l'**ordre des parents sélectionnés**.
- **Rationale** : conforme §4 + clarification ; ordre stable ⇒ reproductibilité (SC-001).
- **Alternatives** : multiplicatif (rejeté par la clarification).

## R4 — Algorithme traits→pouvoirs (§6.4)

- **Décision** : implémenter en deux étapes.
  1. **Constitution des sous-listes** (§6.4.1) : principaux = Actions si présentes, sinon Parties du corps,
     sinon une seule sous-liste ; mélange déterministe (R2) des principaux et des secondaires ; assignation
     cyclique ; **duplication** d'un secondaire avec proba `résilience/D` % vers **une autre** sous-liste,
     bornée à une occurrence par sous-liste, **sans modifier l'ADN**.
  2. **Transformation en pouvoir** (§6.4.2) : regroupement des traits de même type (« , … et », « ou » pour
     états) ; libellé via l'**arbre verbatim** (faisant foi) ; génération `K…` avec proba `K` par occurrence,
     traits générés **inscrits actifs dans l'ADN** (ou réactivés + bonus) ; échec `K` requis ⇒ `pouvoir = null`.
- **Implémentation de l'arbre** : fonction pure pilotée par les booléens de présence `a/e/p/aj/r/et`,
  reproduisant **exactement** la structure `if/else` du §6.4.2 (y compris les « incohérences » volontaires).
- **Rationale** : fidélité à la source (Principe IX) ; testable par les exemples chiffrés.
- **Alternatives** : table de correspondance condensée (rejeté : risque d'écart avec l'arbre faisant foi).

## R5 — Constantes D et K distinctes

- **Décision** : deux champs de `Parameters` séparés. `D` = **diviseur** (proba duplication = `résilience/D` %).
  `K` = **pourcentage** (proba de génération). Défauts : `D=20`, `K=10 %` (cf. plan).
- **Rationale** : exigence FR-023 / Principe VII ; sémantiques différentes (diviseur vs probabilité).

## R6 — Héritage puissance/maîtrise (§7.2)

- **Décision** : pour le i-ᵉ pouvoir de l'enfant, moyenne (puissance puis maîtrise) des i-ᵉ pouvoirs des
  **parents ayant ≥ 1 pouvoir** (après **mélange déterministe** des pouvoirs de chaque parent ; recours à
  `i mod nb_pouvoirs`). **Arrondi** : `x ≥ n+0,5 ⇒ n+1`, sinon `n`. Tirage final indépendant pour puissance
  et maîtrise : **A %** nouvelle valeur **1-10** (**bornée**), **B %** moyenne−1, **C %** moyenne, **B %**
  moyenne+1. `A = 100 − 2·B − C`. **Seul A est borné [1,10]** ; les autres **non bornés**.
- **Cas sans pouvoir source** (clarification) : si **aucun** parent ne fournit de i-ᵉ pouvoir, la valeur est
  tirée comme **cas A** (aléatoire **1-10**, bornée).
- **Rationale** : conforme §7 + clarification.
- **Alternatives** : borner toutes les valeurs (rejeté : contredit §7) ; base 1 / pouvoir abandonné (rejetés
  par la clarification).

## R7 — Pipeline de naissance (§5) & cas spéciaux (§6.1/§6.3)

- **Décision** : `reproduce(parents, params, catalog, rng)` orchestre, dans l'ordre :
  1. tirage du **cas** (mutation forte / sans pouvoir / normale) selon les taux (tirages successifs avec le `Rng`) ;
  2. **ADN** : hérédité §4 (normale) **ou** tous traits parentaux **inactifs** (forte/sans pouvoir) ;
  3. **mutation faible** (normale uniquement) : gain puis perte, tirages indépendants ;
  4. **pouvoirs** : traits→pouvoirs §6.4 (normale) / gabarit (forte, réutilise Feature 1) / aucun (sans pouvoir) ;
  5. **puissance/maîtrise** : §7.2 (normale) / aléatoire 1-10 (forte).
- **Ordre des tirages fixé** ⇒ déterminisme strict (SC-001).
- **Option « malus génome »** (off par défaut) : applique/omet un malus aux traits hérités inactifs des cas
  spéciaux ; partage entre parents ⇒ résilience la plus élevée.
- **Rationale** : reflète exactement §5.
- **Alternatives** : ordre différent (rejeté : changerait les séquences et romprait la reproductibilité).

## R8 — Reproduction manuelle : déclencheur & enfant

- **Décision** : l'UI permet de **sélectionner ≥ 1 individus** dans la liste et de cliquer **« Reproduire »**.
  Le cœur produit **un** enfant (clarification), ajouté à la population ; **id séquentiel déterministe**
  (suite des ids existants) ; **date de naissance** = jour aléatoire dans l'**année courante** (an 0 en F2) ;
  liens `parents`/`enfants` posés des deux côtés.
- **Hors règles d'appariement** : pas de contrôle espèce/couple/consanguinité/gaussienne (Feature 3).
- **Rationale** : moyen le plus simple d'exercer le moteur (plan général) ; conforme aux Assumptions.
- **Alternatives** : portées (reporté F3) ; reproduction automatique par le temps (Feature 3).

## R9 — Persistance & UI d'inspection

- **Décision** : aucun changement de format — l'`AppState` `full` sérialise déjà `population` (avec
  `parents/enfants/adn/pouvoirs`). On vérifie le **round-trip** après reproductions. La **fiche** est enrichie
  pour montrer l'**ADN complet** (actifs + inactifs + résilience) en plus des pouvoirs.
- **Rationale** : Principe VI ; FR-028/FR-029.
- **Alternatives** : nouveau `kind` (reporté Feature 6).

## Points explicitement reportés (hors Feature 2)

- Tick annuel, couples, divorces, portées (M/N/X), gaussienne, consanguinité — **Feature 3**.
- Arbre généalogique, filtres, **3 modes d'affichage** des traits (§8.5) — **Feature 4**.
- Page de paramétrage complète (3 niveaux) + courbes — **Feature 5** (les paramètres existent dès ici).
- Déclinaison `config|data|full` & partage avancé — **Feature 6**.
- Sandbox / « make it real » — **Feature 7**.
