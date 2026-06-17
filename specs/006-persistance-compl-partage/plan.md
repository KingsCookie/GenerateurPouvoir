# Implementation Plan: Persistance complète & partage

**Branch**: `006-persistance-compl-partage` | **Date**: 2026-06-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-persistance-compl-partage/spec.md`

## Summary

Finaliser la persistance par fichier (Principe VI) en passant de l'unique export/import « complet »
actuel aux **trois types de fichiers JSON typés** prévus par §11 : **`config`** (paramètres + seed +
catalogues), **`data`** (population + généalogie + couples + année + **état RNG**), **`full`**
(les deux). À l'import, **détecter automatiquement** le `kind` et appliquer le bon traitement
(config seule / data seule / full), avec **versionnage** (`formatVersion`), **rétro-compatibilité**
et **refus propre** des fichiers invalides.

L'essentiel existe déjà : `AppState` (kind `full`), `serializeState`/`deserializeState`, la
sérialisation canonique déterministe, l'**état RNG sérialisé** (Feature 3) et le rejet propre des
imports invalides (Features 1 & 3). Cette feature **étend** ces mécanismes : extraction pure des
sous-états `config`/`data`, sérialiseurs par type, **dispatcher de désérialisation** à la détection
du `kind`, application **partielle** côté store, et UI à 3 exports + 1 import auto-détecté.
**Aucune dépendance ajoutée** ; aucune modification du moteur génétique.

## Technical Context

**Language/Version** : TypeScript 5.x (ESM, `strict`).

**Primary Dependencies** : Svelte + Vite ; `vite-plugin-pwa`. **Aucune dépendance ajoutée**
(Principe VIII) — sérialisation JSON native, téléchargement via `Blob`/`URL.createObjectURL` et
import via `<input type="file">` (déjà en place dans `StateIO.svelte`).

**Storage** : aucun backend ; persistance **exclusivement** par export/import de fichier JSON
(Principe VI). Aucun `localStorage`/auto-save.

**Testing** : Vitest à **seed fixe** sur le cœur (sérialiseurs/désérialiseur purs : round-trips
config/data/full, détection du `kind`, application partielle, rétro-compatibilité, refus propre).

**Target Platform** : navigateurs desktop + mobiles (PWA), build statique GitHub Pages
(domaine `royalcookie.fr`, base à la racine).

**Project Type** : application web statique (cœur pur `src/core` ↔ UI `src/ui`).

**Performance Goals** : export/import perçus instantanés sur des populations de ~1 000+ individus ;
sérialisation O(n) sur la population, pas de coût ajouté au moteur.

**Constraints** : 100 % statique, hors-ligne, déterministe (Principe I : restauration exacte de
l'état RNG), cœur pur (Principe IV), français, anonymat dans les fichiers (Principe X).

**Scale/Scope** : 3 types de fichiers ; un dispatcher d'import ; ~quelques fonctions pures + 3
boutons UI. Population jusqu'à ~1 000+ individus dans `data`/`full`.

## Constitution Check

*GATE : doit passer avant Phase 0 ; re-vérifié après Phase 1.*

| Principe | Impact & conformité |
|----------|---------------------|
| **I. Déterminisme** | ✅ `data`/`full` embarquent la **position exacte du RNG** (Clarification 2026-06-17) ⇒ reprise au tirage près. Sérialiseurs/désérialiseur **purs**, aucun aléatoire. |
| **II. 100 % statique** | ✅ Aucun service ; export/import 100 % côté client (Blob + input file). |
| **III. PWA / responsive** | ✅ UI des 3 exports + 1 import responsive ; aucun I/O réseau. |
| **IV. Cœur pur, isolé** | ✅ Extraction/sérialisation/désérialisation/validation **pures** dans `src/core/state` ; l'UI (stores, téléchargement, sélection de fichier, **horodatage du nom**) reste dans `src/ui`. |
| **V. Tests déterministes** | ✅ Tests cœur à seed fixe : round-trip des 3 types, détection du `kind`, application partielle, rétro-compat, refus propre. |
| **VI. Persistance explicite** | ✅ **Cœur de la feature** : 3 fichiers JSON typés (`kind`), versionnés, partageables ; **aucune** sauvegarde auto. |
| **VII. Tout est paramétrable** | ✅ `config` exporte **tous** les réglages (seed incluse) ; rien de caché. |
| **VIII. Simplicité / YAGNI** | ✅ Réutilise `AppState`, la sérialisation canonique et l'état RNG existants. Additions minimales (extracteurs + dispatcher). Pas de nouvelle dépendance, pas de refonte. |
| **IX. Spec source de vérité** | ✅ Périmètre tracé sur §11/§12/§13 ; **aucune** modification de `DescriptionProjet.md` requise (points en suspens §13.1/§13.4 tranchés en clarification, dans le sens du document). |
| **X. Anonymat** | ✅ Aucune identité personnelle écrite dans les fichiers exportés ; commits `KingsCookie`, email vide. |

**Verdict** : ✅ PASS (avant et après design). Aucune violation ⇒ **Complexity Tracking vide**.

## Décisions techniques (détail en research.md)

| Sujet | Décision |
|-------|----------|
| **Sous-états typés** | `ConfigState { kind:'config', formatVersion, parameters, catalog, especes }` et `DataState { kind:'data', formatVersion, population, currentYear, couples, rngState }`. `FullState` = `AppState` actuel (`kind:'full'`). |
| **Extraction pure** | `extractConfig(state): ConfigState` et `extractData(state): DataState` (sélection de champs, immutables). |
| **Fusion pure (non destructive)** | `mergeConfig(state, config): AppState` et `mergeData(state, data): AppState` portent la **sémantique des clarifications** (config conserve les données ; data conserve la config — INV-K7) **dans le cœur** ⇒ testables à seed fixe. L'UI `applyConfig`/`applyData` ne fait que **déléguer** + maj des stores (et restaurer le RNG pour `data`). |
| **Sérialiseurs** | `serializeConfig` / `serializeData` / `serializeFull` (= `serializeState`, conservé). Réutilisent la **canonicalisation** existante (clés triées ⇒ fichiers stables, SC-001). |
| **Détection à l'import** | `parseImport(json): Result<ParsedImport>` parse le JSON, lit `kind`, valide la structure **par type** + la version, et renvoie une **union étiquetée** `{kind:'config'\|'data'\|'full', …}`. `deserializeState` (full) conservé pour la rétro-compat des tests. |
| **Application partielle** | Côté store : `config` ⇒ remplace `parameters`/`catalog`/`especes`, **conserve** population/couples/année/RNG (Clarification) ; `data` ⇒ remplace population/couples/année + **restaure l'état RNG**, **conserve** la config ; `full` ⇒ remplace tout (comportement actuel). |
| **Versionnage** | `formatVersion` **unique partagé** par les 3 types (valeur courante inchangée). Version > supportée ⇒ refus (déjà en place). |
| **Rétro-compatibilité** | Le désérialiseur **défaut** les champs récents absents (cohérent avec le repli M1 de la Feature 5 : `resilienceOverrides`, `Trait.weight`, `rngState`, `couples`, `especes`, `currentYear`). |
| **Nom de fichier horodaté** | Généré **côté UI** (`royalcookie-<kind>-YYYYMMDD-HHMMSS.json`) — l'horodatage utilise l'horloge, **interdite dans le cœur** (Principe I/IV) donc reste dans `src/ui`. |
| **Aucune dépendance** | JSON natif, `Blob`, `URL.createObjectURL`, `<input type="file">` — déjà utilisés. |

## Project Structure

### Documentation (this feature)

```text
specs/006-persistance-compl-partage/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — décisions techniques
├── data-model.md        # Phase 1 — entités & invariants
├── quickstart.md        # Phase 1 — scénarios de validation manuelle
├── contracts/
│   └── core-api.md      # Phase 1 — API pure (extraction, sérialisation, détection/import)
└── tasks.md             # Phase 2 (/speckit-tasks — NON créé ici)
```

### Source Code (repository root)

```text
src/core/state/
└── serialize.ts          # MODIFIÉ — types ConfigState/DataState/ParsedImport ;
                          #   extractConfig/extractData ; mergeConfig/mergeData (fusion pure, INV-K7) ;
                          #   serializeConfig/serializeData (serializeFull = serializeState, conservé) ;
                          #   parseImport (détection kind)

src/core/
└── index.ts              # MODIFIÉ — ré-exports des nouveaux types & fonctions

src/ui/stores/
└── appState.ts           # MODIFIÉ — buildConfigJson/buildDataJson/buildFullJson ;
                          #   applyConfig/applyData ; applyImport devient un dispatcher (parseImport)

src/ui/components/
└── StateIO.svelte        # MODIFIÉ — 3 boutons d'export (config/data/full) + 1 import auto-détecté ;
                          #   nom de fichier horodaté par type ; messages FR

tests/unit/
└── state.test.ts         # ÉTENDU — round-trip config/data/full ; détection du kind ;
                          #   application partielle (config conserve data ; data conserve config) ;
                          #   rétro-compat ; refus propre (kind inconnu, version trop récente, JSON invalide)
```

**Structure Decision** : conserver la séparation **cœur pur** (`src/core/state`) ↔ **UI** (`src/ui`).
Toute la logique de (dé)sérialisation et de détection est **pure et testée à seed fixe** ; l'UI ne
détient que les stores, le téléchargement, la sélection de fichier et l'**horodatage** du nom.
Réutilisation maximale de l'existant (`AppState`, canonicalisation, état RNG).

## Complexity Tracking

> Aucune violation de la Constitution — section vide. Réutilisation des structures existantes,
> aucune dépendance ajoutée, cœur pur préservé.
