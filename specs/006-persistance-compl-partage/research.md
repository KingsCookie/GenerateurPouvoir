# Recherche / décisions — Feature 006 (Persistance complète & partage)

Toutes les inconnues techniques sont résolues (spec clarifiée le 2026-06-17 ; pas de
`NEEDS CLARIFICATION`). Décisions consignées ci-dessous.

## D1 — Trois types de fichiers (`kind`)

- **Décision** : trois formes JSON typées partageant un en-tête commun `{ kind, formatVersion }` :
  - `config` : `parameters`, `catalog`, `especes`.
  - `data` : `population`, `currentYear`, `couples`, `rngState`.
  - `full` : tous les champs de `AppState` (forme actuelle, inchangée).
- **Rationale** : §11 demande explicitement ces trois exports + un identifiant de type en tête pour
  la détection à l'import. `full` réutilise tel quel `AppState` ⇒ rétro-compatibilité immédiate des
  fichiers déjà produits (Features 1-5).
- **Alternatives rejetées** : un seul fichier « full » avec champs optionnels (perd la sémantique
  « config seule » / « data seule » et complexifie l'application partielle) ; trois `formatVersion`
  distincts (inutile : la version d'enveloppe suffit, cf. D5).

## D2 — Extraction pure des sous-états

- **Décision** : `extractConfig(state): ConfigState` et `extractData(state): DataState` sélectionnent
  les champs depuis un `AppState` complet, de façon **pure et immutable**.
- **Rationale** : un seul endroit (cœur) décide *quel champ appartient à quoi* ; l'UI ne fait que
  fournir l'instantané courant. Garantit la cohérence entre `config`/`data` et `full`.

## D3 — Sérialisation canonique réutilisée

- **Décision** : `serializeConfig`/`serializeData`/`serializeFull` réutilisent la fonction de
  **canonicalisation** existante (clés triées récursivement) ⇒ deux états égaux produisent un fichier
  **identique** (support SC-001 et déterminisme du partage).
- **Rationale** : déjà éprouvé en Feature 1-3 ; aucun coût ajouté ; cohérent.

## D4 — Détection du type à l'import (`parseImport`)

- **Décision** : une fonction **pure** `parseImport(json): Result<ParsedImport>` :
  1. parse le JSON (échec ⇒ erreur « JSON invalide ») ;
  2. lit l'en-tête `kind` ∈ {`config`,`data`,`full`} (sinon « type non reconnu ») ;
  3. vérifie `formatVersion ≤` version supportée (sinon « version non prise en charge ») ;
  4. valide la **structure attendue pour ce type** et **défaut** les champs récents absents ;
  5. renvoie une **union étiquetée** : `{kind:'config', config}` | `{kind:'data', data}` |
     `{kind:'full', state}`.
- **Rationale** : la détection vit dans le cœur (pure, testable à seed fixe) ; l'UI n'a qu'à
  dispatcher le résultat. `deserializeState` (full) est **conservé** pour les usages/tests existants.
- **Alternatives rejetées** : détecter le type côté UI (logique métier hors du cœur, non testée) ;
  deviner le type par présence de champs (fragile vs. en-tête `kind` explicite voulu par §11).

## D5 — Versionnage unique partagé

- **Décision** : conserver **une seule** constante `formatVersion` (valeur courante inchangée),
  écrite dans les trois types. L'import refuse proprement une version **supérieure**.
- **Rationale** : la capacité « multi-kind » n'change pas la forme des données déjà versionnées ; un
  fichier `full` antérieur reste valide. Inutile de bumper.
- **Alternatives rejetées** : versionner chaque `kind` séparément (surcoût sans bénéfice présent —
  YAGNI).

## D6 — Application partielle côté store

- **Décision** (conforme aux clarifications 2026-06-17) :
  - import `config` ⇒ remplace `parameters`/`catalog`/`especes` ; **conserve** population, couples,
    année et **état RNG** courants ;
  - import `data` ⇒ remplace population/couples/année + **restaure l'état RNG** ; **conserve** la
    config courante ;
  - import `full` ⇒ remplace **tout** (comportement actuel d'`applyImport`).
- **Rationale** : sémantique attendue (presets vs. mondes) ; non destructif pour la config ;
  l'utilisateur garde le contrôle.
- **Conséquence** : des références croisées (traits/espèces absents) peuvent apparaître ; gérées par
  le **libellé de repli** déjà livré en Feature 5 (aucun blocage).

## D7 — État RNG dans `data`/`full` (point en suspens §13.1)

- **Décision** : la **position exacte** du RNG (`rngState`, 4 mots xoshiro déjà sérialisés en
  Feature 3) est incluse dans `data` et `full`, **pas** dans `config`. Reprise **au tirage près**.
- **Rationale** : tranché en clarification ; cohérent avec l'existant (`createRngFromState`).
  Permet SC-006 (continuation identique).

## D8 — Rétro-compatibilité

- **Décision** : `parseImport` **défaut** les champs récents absents, comme déjà fait par
  `deserializeState` (Feature 5, M1) : `resilienceOverrides → {byType:{},byTrait:{}}`,
  `Trait.weight` absent → `null`, `rngState` absent → reconstruit depuis la seed, `couples → []`,
  `especes` vide → défaut, `currentYear` → `birthYear`.
- **Rationale** : un fichier antérieur doit s'importer sans exception (FR-011, SC-005).

## D9 — Nom de fichier horodaté (côté UI uniquement)

- **Décision** : l'UI nomme les fichiers `royalcookie-<kind>-YYYYMMDD-HHMMSS.json`. L'horodatage
  emploie l'**horloge**, **interdite dans le cœur** (Principes I/IV) ⇒ génération **dans `src/ui`**.
- **Rationale** : facilite le tri/partage (FR-014) sans polluer le cœur pur. Le contenu du fichier
  reste déterministe (l'horodatage n'est que dans le **nom**, pas dans les données).

## D10 — Aucune dépendance ajoutée

- **Décision** : `JSON`, `Blob`, `URL.createObjectURL`, `<input type="file">` — tous déjà utilisés
  par `StateIO.svelte`. Rien à installer (Principe VIII).
