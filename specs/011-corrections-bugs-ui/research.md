# Recherche & décisions — 011-corrections-bugs-ui

Phase 0. Chaque item lève les inconnues techniques d'une (ou plusieurs) user story. Aucune
dépendance nouvelle ; tout reste TypeScript + Svelte + Vitest.

## R1 — Consanguinité lignée directe (US1)

- **Décision** : ajouter un prédicat `isDirectLineage(a, b, byId)` (2 niveaux) vérifiant que `a` est
  parent **ou** grand-parent de `b`, ou l'inverse, en réutilisant `parentsOf`/`grandparentsOf`
  existants de `pairing.ts`. L'intégrer dans `formCouples` **en plus** de `areConsanguine`, sous la
  même garde `if (!params.consanguinityAllowed && …)`, pour **chaque** paire du groupe.
- **Rationale** : `areConsanguine` ne couvre que le partage d'ascendant (frères/cousins), jamais la
  lignée directe. Limiter à 2 niveaux respecte la symétrie décidée (clarification) et reste O(1) par paire.
- **Alternatives rejetées** : parcours d'ascendance complète (plus strict) — rejeté par la
  clarification (2 niveaux) et coût inutile.
- **Doc (IX)** : met à jour `§6.6.1` de `rsrc/DescriptionProjet.md` (ajout du blocage lignée directe).

## R2 — Date de naissance partagée d'une portée (US2)

- **Décision** : tirer le **jour de l'année une seule fois par portée** dans `tick.ts`
  (`reproduceCouple`), avant la boucle `for i < litterSize`, puis le passer à `reproduce` via une
  nouvelle option `birthDayOfYear`. `reproduce` n'effectue le tirage `rng.nextInt(365)` que si l'option
  est absente (rétro-compat des appels hors portée).
- **Rationale** : garantit une date identique pour tous les enfants d'un même événement de
  reproduction, avec **un seul** tirage `rng` par portée.
- **Impact déterminisme (I)** : la séquence de tirages change (un tirage de jour par portée au lieu
  d'un par enfant, et déplacé hors de `reproduce`). Changement de sortie **assumé** (US2) ; les tests à
  seed fixe touchant naissances seront mis à jour. L'ordre reste strictement déterministe.
- **Alternatives rejetées** : garder le tirage par enfant puis forcer la date du premier — introduit
  des tirages inutiles et un couplage fragile.
- **Doc (IX)** : précise `§6.6.2` (portée) : même date de naissance pour une portée.

## R3 — Génération 0 ancrée à l'année de genèse (US3)

- **Décision** : ajouter `genesisYear: number` à `AppState`, fixé à `parameters.birthYear` lors de la
  genèse initiale. `computeGeneration(birthYear, genesisYear)` renvoie
  `Math.floor((birthYear − genesisYear) / 20)`. Les appelants (`ficheViewModel`, `genealogy/filter`)
  reçoivent `genesisYear` via leur contexte.
- **Sérialisation (VI)** : **bump `FORMAT_VERSION` 3 → 4**. `genesisYear` inclus dans les exports
  `data` et `full`. À l'import d'un fichier **v3 (ou sans `genesisYear`)** : fallback = **année de
  naissance la plus ancienne** de la population (à défaut de population, `parameters.birthYear ?? 0`).
- **Rationale** : la clarification impose une origine **persistée** ; le fallback couvre la
  rétro-compatibilité sans casser les anciens fichiers.
- **Alternatives rejetées** : origine = min(birthYear) comme **source primaire** — faussée si un
  individu plus ancien est ajouté en sandbox ; conservée seulement en fallback.
- **Doc (IX)** : met à jour la définition « génération d'affichage » (tranche de 20 ans **relative à la
  genèse**).

## R4 — Étiquettes P/M sans deux-points (US4)

- **Décision** : dans `ListeView.svelte` et `SandboxView.svelte`, remplacer les libellés
  `P : {puissance}` / `M : {maitrise}` par `P {puissance}` / `M {maitrise}` (retrait du « : »).
- **Rationale** : pur affichage ; aucune logique. Cohérent Population/Sandbox.

## R5 — Section traits des filtres sur sa propre ligne (US5)

- **Décision** : dans `FilterBar.svelte`, forcer la section de trait sur une ligne dédiée
  (conteneur flex avec `flex-basis: 100%` / rupture de ligne) ; vérifier aux largeurs usuelles.
- **Rationale** : correction CSS localisée, sans impact fonctionnel.

## R6 — Nom de fichier exporté (US6)

- **Décision** : dans `StateIO.svelte`, `download(...)` nomme
  `PowerGenerator_${kind}_${timestamp()}.json` (préfixe + **underscores**). L'import reste inchangé
  (basé sur le contenu, pas le nom) ⇒ anciens fichiers `royalcookie-…` toujours importables.
- **Rationale** : cohérence de nom + anonymat (Principe X).

## R7 — Aperçu de pouvoir temps réel (US7)

- **Décision** : bloc réactif Svelte recalculant l'aperçu à chaque changement de `fAdn`. Le calcul
  passe par une **seed d'aperçu stable** : dériver un `Rng` d'un seed déterministe = fonction de
  (seed de session courante + liste **triée** des `(traitId, active, resilience)`). Ainsi, mêmes traits
  actifs ⇒ même aperçu, sans consommer le RNG de session et sans `Math.random` (Principe I).
- **P/M de l'aperçu** : cohérentes avec l'enregistrement (FR-017) — tirées via la même logique que la
  personne éditée (cas A si sans parents). Le recalcul part **toujours des traits actifs courants** et
  ne réinjecte pas les traits K d'un recalcul précédent (pas d'accumulation).
- **Rationale** : réactivité + déterminisme. La seed stable évite l'instabilité d'un reseed à chaque frappe.
- **Alternatives rejetées** : (a) aperçu structurel sans K/P/M — écarté (clarification : aperçu complet) ;
  (b) reseed session à chaque frappe — non déterministe (écarté).
- **Note** : fonction pure de dérivation déjà disponible (`derivePowersFromTraits`) ; l'UI fournit le
  `Rng` dérivé.

## R8 — Formule de la constante de duplication `D` (US8)

- **Décision** : dans `traitsToPowers.ts`, remplacer `rng.chance(ref.resilience / params.duplicationD)`
  par `rng.chance(clamp(ref.resilience * params.duplicationD, 0, 100))`. Dans `parameters.ts`,
  `duplicationD` devient un **multiplicateur** ≥ 0, **défaut 0.25** ; mettre à jour le commentaire.
- **Rationale** : applique la formule décidée `résilience · D`, bornée [0,100].
- **Impact déterminisme (I)** : change les sorties à seed fixe (probabilité de duplication différente) ;
  tests mis à jour.
- **Doc (IX)** : met à jour `§6.4.1` (formule de duplication + rôle/def de `D`) et le glossaire `D`.

## R9 — Bouton « Régénérer » (US9)

- **Décision** : `sbRegeneratePowers(id)` dans `sandboxStore.ts` :
  1. récupérer l'individu et son ADN ; 2. `derivePowersFromTraits(adn, catalog, params, sbRng)`
  (§6.4 seul : duplications §6.4.1 + K §6.4.2, **sans** tirage de cas « sans pouvoir »/« mutation
  forte ») ; 3. P/M via `inheritStats` en passant les **parents** de l'individu (issus de l'état) —
  `inheritStats` applique déjà §7.2 si des parents ont des pouvoirs, sinon **cas A** (1–10) ; 4.
  écrire les pouvoirs **et** l'ADN enrichi (K) sur l'individu. Consomme `sbRng` (tir réel).
- **UI** : bouton « Régénérer » dans les lignes de `SandboxView.svelte`, à côté d'Éditer/Cloner/Supprimer.
- **Rationale** : réutilise le moteur existant ; contraste voulu avec l'aperçu (US7, seed stable).
- **Alternatives rejetées** : passer par `reproduce` (inclut le tirage de cas) — écarté par la clarification.

## R10 — P/M non bornées sauf tirage aléatoire (US10)

- **Décision** : dans `SandboxPersonForm.svelte`, `setPuissance`/`setMaitrise` **suppriment le clamp**
  `Math.min(10, Math.max(1, …))` ; conserver l'entier (`Math.floor`) et le repli sûr (0 si vide/NaN).
- **Cœur déjà conforme** : `inheritStats` ne borne que le **cas A** (§7.2) ; les cas moyenne±1/moyenne
  ne sont pas bornés. Aucune modification cœur nécessaire pour §7.2.
- **Rationale** : la seule source de bornage indue est la saisie manuelle.
- **Tests** : ajouter/adapter un test confirmant qu'une moyenne parentale peut produire > 10 (déjà le
  comportement) et que la saisie manuelle n'est plus clampée (test UI/logique d'assainissement).

## Synthèse des mises à jour de `rsrc/DescriptionProjet.md` (Principe IX)

À faire **avant** le code, avec l'autorisation de l'auteur (fournie via ce workflow), puis régénérer
`rsrc/DescriptionProjet.adoc` (restauration git + patch ciblé, sans outil externe) :

| Section doc | Changement |
|---|---|
| §6.4.1 | Formule de duplication `résilience · D` (bornée [0,100]) ; `D` = multiplicateur, défaut 0.25 |
| §6.6.1 | Consanguinité : bloquer aussi la **lignée directe** (parent↔enfant, grand-parent↔petit-enfant) |
| §6.6.2 | Portée : tous les enfants d'une portée partagent la **même date de naissance** |
| Génération d'affichage | Tranche de 20 ans **relative à l'année de genèse** (genèse = génération 0) |

US10 est **déjà** décrit conformément (§7) ; aucun changement doc. US4/US5/US6/US7/US9 relèvent de
l'UI/sandbox et non du domaine fonctionnel documenté.
