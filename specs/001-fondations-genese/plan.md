# Implementation Plan: Fondations & Genèse de la population

**Branch**: `001-fondations-genese` | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-fondations-genese/spec.md`

## Summary

Mettre en place le socle du projet et la **genèse déterministe** d'une population : un cœur métier
TypeScript **pur** (RNG seedé unique, modèle de données, catalogues, génération du batch initial via le
gabarit de mutation forte, puissance/maîtrise), une **UI Svelte** minimale (liste + fiche en lecture
seule) et un **export/import de fichier** (état complet). Le tout se construit en **bundle statique**
déployable sur **GitHub Pages**, sous forme de **PWA** installable et hors-ligne.

Approche technique : projet applicatif unique avec séparation stricte **cœur (`src/core`) ↔ UI
(`src/ui`)** (Principe IV). Toute l'aléatoire dérive d'une **seule seed** passée à un PRNG déterministe
injecté dans le cœur (Principe I). Tests **Vitest** à seed fixe sur le cœur (Principe V).

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022), exécuté côté navigateur.

**Primary Dependencies**: Vite (build + dev statique), Svelte (UI réactive légère), Vitest (tests),
`vite-plugin-pwa` (manifeste + service worker). Aucune dépendance runtime serveur.

**Storage**: Aucune persistance automatique. État en mémoire ; persistance **explicite** par
**export/import de fichiers JSON** (Principe VI).

**Testing**: Vitest — tests unitaires **déterministes à seed fixe** sur le cœur (`src/core`), incluant les
invariants (bornes puissance/maîtrise, reproductibilité, proportions de pouvoir).

**Target Platform**: navigateurs modernes desktop et mobile (Windows, macOS, Linux, iOS, Android) ;
PWA installable et hors-ligne ; **hébergement GitHub Pages** (site statique servi sous sous-répertoire).

**Project Type**: application web statique (PWA) — projet unique, deux couches (cœur / UI).

**Performance Goals**: génération de **1 000 individus en < 2 s** ; interface réactive (cible 60 fps) y
compris sur mobile.

**Constraints**: 100 % client-side, aucun backend ni secret (Principe II) ; build statique déployable sous
`https://<user>.github.io/<repo>/` avec **base path configurable** et repli `404.html` ; fonctionnement
**hors-ligne** ; **déterminisme** total via seed unique (aucun `Math.random`, horloge, ou UUID aléatoire
dans le cœur) ; cœur **sans dépendance UI/navigateur**.

**Scale/Scope**: Feature 1 — une SPA (liste + fiche), genèse jusqu'à plusieurs milliers d'individus en
mémoire ; pas de reproduction, d'hérédité ni d'avancement du temps (features ultérieures).

## Constitution Check

*GATE : doit passer avant la Phase 0, re-vérifié après la Phase 1.*

| Principe | Gate | Statut |
|---|---|---|
| I. Déterminisme par seed unique | Un seul PRNG seedé, injecté ; aucun aléatoire non seedé dans le cœur ; reproductibilité testée | ✅ PASS (par conception) |
| II. 100 % statique / client-side | Build Vite → assets statiques ; aucun backend/secret ; déploiement Pages | ✅ PASS |
| III. PWA multiplateforme & hors-ligne | `vite-plugin-pwa` (manifeste + SW) ; design responsive | ✅ PASS |
| IV. Cœur pur, isolé, testable | `src/core` sans import UI/navigateur ; RNG passé en paramètre | ✅ PASS |
| V. Tests déterministes du cœur | Vitest à seed fixe (invariants + reproductibilité) | ✅ PASS |
| VI. Persistance explicite par fichiers | Export/import JSON typé ; aucune auto-save | ✅ PASS |
| VII. Tout est paramétrable | Objet `Parameters` exposé et exporté (effectif, année, % pouvoir, résilience initiale, poids) | ✅ PASS |
| VIII. Simplicité & YAGNI | Stack légère (Svelte) ; périmètre limité à la genèse | ✅ PASS |
| IX. Spec source de vérité | `rsrc/DescriptionProjet.md` non modifié ; spec référencée | ✅ PASS |
| X. Anonymat de l'auteur | Aucune donnée perso dans le code/métadonnées (`package.json` sans author nominatif) ; identité `KingsCookie` | ✅ PASS |

**Verdict** : aucune violation. Aucune entrée de *Complexity Tracking* requise.

## Project Structure

### Documentation (this feature)

```text
specs/001-fondations-genese/
├── plan.md              # Ce fichier (/speckit-plan)
├── spec.md              # Spécification (/speckit-specify)
├── research.md          # Phase 0 (décisions techniques)
├── data-model.md        # Phase 1 (entités)
├── quickstart.md        # Phase 1 (build/test/déploiement)
├── contracts/           # Phase 1
│   ├── core-api.md      # API publique du cœur métier
│   └── state-file.md    # Schéma du fichier d'export/import
└── checklists/
    └── requirements.md  # Checklist qualité de la spec
```

### Source Code (repository root)

```text
src/
├── core/                     # CŒUR MÉTIER PUR — aucun import UI ni API navigateur (Principe IV)
│   ├── rng/                  # PRNG seedé déterministe (création seed, tirages, poids)
│   ├── model/                # types: Trait, TraitType, ADN, Personne, Pouvoir, Espece, Genre
│   ├── catalog/              # catalogues de traits par défaut (issus de rsrc/ExempleTraits)
│   ├── genesis/              # génération du batch initial + gabarit de mutation forte (AE/PE/PA/PR)
│   ├── powers/               # puissance/maîtrise (genèse)
│   ├── params/               # Parameters + valeurs par défaut (effectif=100, année=0, %pouvoir=0)
│   └── state/                # AppState + sérialisation/désérialisation (export/import)
├── ui/                       # COUCHE SVELTE — consomme le cœur, jamais l'inverse
│   ├── App.svelte
│   ├── views/                # ListeView, FicheView, ParametresView
│   ├── components/
│   └── stores/               # état réactif (enveloppe le cœur)
├── main.ts                   # point d'entrée
└── app.css

public/
├── icons/                    # icônes PWA
└── 404.html                  # repli routing GitHub Pages

tests/
└── unit/                     # tests du cœur à seed fixe (genesis, rng, powers, state)

.github/workflows/deploy.yml  # CI: build statique → publication GitHub Pages
vite.config.ts                # base path configurable + PWA (manifeste/SW)
vitest.config.ts
tsconfig.json
```

**Structure Decision** : projet **unique** avec séparation physique **`src/core` (pur) / `src/ui`
(Svelte)**. Le cœur ne référence aucune API navigateur ni Svelte ; l'UI importe le cœur. Cette frontière
matérialise le Principe IV et garantit la testabilité (Principe V) et la portabilité du moteur vers les
features suivantes (hérédité, simulation…).

## Complexity Tracking

> Aucune violation de la Constitution Check → section vide.
