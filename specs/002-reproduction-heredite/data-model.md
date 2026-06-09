# Phase 1 — Modèle de données

Portée : entités/champs nécessaires au **moteur génétique** (Feature 2). Étend le modèle de la Feature 1
(`specs/001-fondations-genese/data-model.md`) **sans le casser**. Les champs déjà présents (parenté, ADN,
pouvoirs) sont **réutilisés**.

## Entités réutilisées (Feature 1, rappel)

- **Trait / Catalog**, **TraitType** (6 types), **ResilientTrait** `(traitId, active, resilience)`, **ADN**,
  **Pouvoir** `(id, label, template, traitIds, puissance, maitrise)`, **Personne** (dont `parents[]`,
  `enfants[]`, `adn`, `pouvoirs[]`), **Espece/Genre**, **AppState** (`kind:"full"`).

> La Feature 2 **n'ajoute aucune entité de stockage** : elle produit des `Personne` (enfants) via le moteur
> et remplit les champs `parents`/`enfants`/`adn`/`pouvoirs` déjà définis.

## Parameters — champs ajoutés (moteur génétique)

| Champ | Type | Défaut | Règles |
|---|---|---|---|
| `duplicationD` | number | **20** | Diviseur `D` (§6.4.1) : proba duplication = `résilience/D` % (> 0). |
| `generationK` | number | **10** | `K` % (§6.4.2) : proba de génération d'un trait `K…` [0..100]. |
| `resilienceMax` | number | **95** | Plafond de résilience [0..100] (bonus inopérant au-dessus). |
| `bonusPoints` | number | **5** | Bonus **additif** (points) si trait tiré actif (clarification). |
| `malusPoints` | number | **5** | Malus **additif** (points) si trait tiré inactif. |
| `disappearThreshold` | number | **2** | Seuil de disparition (%) ; sous ce seuil le trait quitte l'ADN. |
| `strongMutationRatePct` | number | **0** | Taux de mutation forte par naissance [0..100]. |
| `noPowerRatePct` | number | **0** | Taux de naissance sans pouvoir [0..100]. |
| `weakMutationGainPct` | number | **0** | Taux de mutation faible — gain d'un trait [0..100]. |
| `weakMutationLossPct` | number | **0** | Taux de mutation faible — perte d'un trait [0..100]. |
| `genomeMalusEnabled` | boolean | **false** | Option « malus sur le génome » (cas spéciaux). |
| `statB` | number | **10** | Probabilité `B` (%) pour `moyenne∓1` (§7.2). |
| `statC` | number | **30** | Probabilité `C` (%) pour `moyenne` ; `A = 100 − 2·B − C` (ici 50). |

> `initialResilience`, `traitTypeWeights`, `templateWeights`, `seed`, `batchSize`, `birthYear`,
> `powerChancePct` restent ceux de la Feature 1. Tout `Parameters` est exporté (Principe VII).
> **Validation** : `100 − 2·statB − statC ≥ 0` (sinon `A` négatif) — vérifié/clampé à l'usage.

## Règles métier (moteur)

### Hérédité d'un trait (§4.2)
- Ensemble des traits = **union** des traits de tous les parents (actifs ou inactifs).
- Par parent porteur : tirage `actif` avec proba = résilience de **ce parent** pour le trait.
- Agrégation :
  - **1 porteur** : actif/inactif selon son tirage ; résilience initiale = celle du parent ; ±bonus/malus.
  - **≥ 2 porteurs** : `nbActifs = 0` ⇒ inactif, résilience = **max** des porteurs, **−malus** ;
    `nbActifs = 1` ⇒ actif, résilience = celle du tirage actif, **+bonus** ;
    `nbActifs ≥ 2` ⇒ actif, résilience = **max** des porteurs, **+bonus × nbActifs**.
- Clamp : `resilience ∈ [0, resilienceMax]` ; si `resilience < disappearThreshold` ⇒ **trait retiré**.

### Sous-listes & pouvoirs (§6.4)
- Principaux = Actions si ≥ 1, sinon Parties du corps, sinon liste unique de tous les traits actifs.
- Une sous-liste par principal ; secondaires répartis après mélange déterministe, parcours cyclique.
- Duplication d'un secondaire : proba `résilience/D` % vers une autre sous-liste, ≤ 1 occurrence/sous-liste,
  **n'altère pas l'ADN**.
- Pouvoir : libellé via l'**arbre §6.4.2** (verbatim) ; génération `K…` (proba `K` %) → trait **inscrit actif**
  dans l'ADN (ou réactivé + bonus) ; échec d'un `K` requis ⇒ `pouvoir = null` (sous-liste sans pouvoir).

### Puissance/maîtrise (§7.2)
- i-ᵉ pouvoir : moyenne des i-ᵉ pouvoirs des parents ayant ≥ 1 pouvoir (mélange déterministe ; `i mod n`),
  arrondie (`x ≥ n+0,5 ⇒ n+1`). Tirage : A% aléatoire 1-10 (borné) / B% moy−1 / C% moy / B% moy+1.
- **Aucun parent source** ⇒ cas A (aléatoire 1-10, borné).
- Bornage **uniquement** cas A & mutation forte ; moyennes non bornées (peuvent sortir de [1,10]).

### Pipeline de naissance (§5)
1. cas = mutation forte (`strongMutationRatePct`) | sans pouvoir (`noPowerRatePct`) | normale (défaut) ;
2. ADN : hérédité §4 (normale) | tous parentaux inactifs (cas spéciaux) ;
3. mutation faible (normale) : gain puis perte (taux indépendants) ;
4. pouvoirs : §6.4 (normale) | gabarit (forte) | aucun (sans pouvoir) ;
5. P/M : §7.2 (normale) | aléatoire 1-10 (forte).

### Enfant produit
- `id` séquentiel déterministe ; `dateNaissance` = jour aléatoire dans l'année courante (an 0 en F2), âge 0 ;
- `parents` = ids des sélectionnés ; chaque parent reçoit l'id de l'enfant dans `enfants`.

## Invariants (testables)

- **INV-1** : reproduction déterministe — `(seed, parents, params, catalog)` identiques ⇒ enfant **identique**.
- **INV-2** : héritage total — en naissance normale, tout trait d'un parent est présent dans l'ADN de l'enfant
  **sauf** s'il tombe sous `disappearThreshold`.
- **INV-3** : cas spéciaux — mutation forte ⇒ traits parentaux **inactifs** + 1 pouvoir gabarit (P/M 1-10) ;
  sans pouvoir ⇒ traits parentaux inactifs + **0** pouvoir.
- **INV-4** : bornage — P/M issues du **cas A** et de la **mutation forte** ∈ [1,10] ; les valeurs dérivées de
  moyenne **peuvent** sortir de [1,10].
- **INV-5** : duplication — un trait dupliqué n'apparaît jamais deux fois dans la **même** sous-liste.
- **INV-6** : ADN vs duplication — la duplication **ne modifie pas** l'ADN ; seuls les traits **générés `K`**
  (et gain de mutation faible) modifient l'ADN.
- **INV-7** : exemples chiffrés — §6.4.1 (ex.1 sans duplication, ex.2 avec duplication) et §7.2 (ex.1/ex.2)
  reproduits exactement.
- **INV-8** : référentiel — tout `traitId` d'un pouvoir/ADN de l'enfant référence un trait connu du catalogue.
- **INV-9** : parenté symétrique — `enfant.parents` ⊇ {sélectionnés} et chaque parent contient `enfant.id`.
- **INV-10** : round-trip — export → import après reproductions ⇒ état **égal** (parenté incluse).
