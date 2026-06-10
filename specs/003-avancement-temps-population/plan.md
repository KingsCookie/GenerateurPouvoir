# Implementation Plan: Avancement du temps & dynamique de population

**Branch**: `003-avancement-temps-population` | **Date**: 2026-06-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-avancement-temps-population/spec.md`

## Summary

Construire la **couche de simulation temporelle** au-dessus du moteur génétique (Feature 2). Une action
**« avancer de X années »** applique, **année par année**, un **tick annuel déterministe** (§6.6) :
(1) **divorces** selon le taux d'espèce, (2) **formation de couples** parmi les candidats — éligibilité et
volonté tirées d'une **gaussienne de reproduction** par espèce, en respectant **consanguinité**, **genre**
et **non-inter-espèces** — puis **reproduction** (nouveaux couples **et** couples existants) produisant des
**portées** (M/N/X), chaque enfant venant du **moteur Feature 2**. Les individus **vieillissent**
(âge = année courante − année de naissance) ; l'utilisateur peut **tuer** un individu (cause obligatoire).
Le **déterminisme** est total : l'**état du RNG** est **sérialisé** dans l'export pour une **continuation
strictement reproductible** après import (FR-021). Tout est **pur, testé à seed fixe**.

Approche : étendre le cœur (`src/core`) par des modules **`time/`** (tick annuel, avance) et **`repro/`**
(gaussienne, sélection des candidats, formation déterministe des groupes, portée), réutiliser
`reproduce` (F2) pour chaque enfant, étendre **`Espece`** (paramètres de reproduction), **`Parameters`**
(consanguinité), l'**état** (`currentYear`, `couples`, état RNG) et l'export/import. L'UI ajoute un
**contrôleur de temps** (avancer de X ans, date courante) et l'action **« tuer »** sur la fiche.

## Technical Context

**Language/Version** : TypeScript 5.x (ES2022), strict — **inchangé** (Features 1-2).

**Primary Dependencies** : Vite, Svelte, Vitest, `vite-plugin-pwa` — **inchangé**. Aucune nouvelle
dépendance (Principe VIII). Le tick réutilise le `Rng` seedé et `reproduce` (F2).

**Storage** : export/import JSON `kind:"full"` existant, **étendu** : `currentYear`, `couples`, et **état
du RNG** sérialisé (FR-021). Aucune persistance auto (Principe VI).

**Testing** : Vitest **à seed fixe**. Tests dérivés des invariants (déterminisme du tick, portées bornées,
anti-consanguinité, non-inter-espèces, divorce 0 %/100 %, continuation après round-trip avec état RNG).

**Target Platform** : navigateurs desktop/mobile, PWA hors-ligne, GitHub Pages — **inchangé**.

**Project Type** : application web statique (PWA), projet unique deux couches (cœur pur / UI Svelte).

**Performance Goals** : avancer **1 an sur ~1 000 individus < ~1 s** (SC-009) ; rester fluide.

**Constraints** : déterminisme **total** via la seed unique (aucun `Math.random`/horloge/UUID dans
`src/core`) ; l'**ordre des tirages** du tick est **fixé** ; cœur **sans dépendance UI/navigateur** ;
l'**état du RNG** doit être sérialisable/restituable sans perte de séquence.

**Scale/Scope** : population jusqu'à quelques milliers d'individus ; avance de plusieurs années. Pas
d'arbre généalogique visuel (Feature 4), pas de page paramètres avancée 3 niveaux/courbes (Feature 5),
pas de création/édition manuelle d'individus §6.8 (feature ultérieure).

### Décisions de paramètres par défaut (fixées ici, modifiables — Principe VII)

| Paramètre (espèce `humain`, sauf indication) | Défaut | Rationale |
|---|---|---|
| Gaussienne — âge de **début** | **16** | clarification (fenêtre de reproduction). |
| Gaussienne — âge du **pic** | **25** | clarification. |
| Gaussienne — âge de **fin** (max) | **50** | clarification ; au-delà, probabilité nulle. |
| Gaussienne — **probabilité au pic** | **40 %** | clarification (ajusté). |
| Gaussienne — **pente** (écart-type) | **8 ans** | cloche large couvrant la fenêtre [16,50]. |
| **Taille du groupe** de reproduction | **2** | clarification (couple classique). |
| Portée **M** (min) | **1** | au moins un enfant par reproduction. |
| Portée **N** (max) | **4** | plafond raisonnable. |
| Portée **X %** (enfant suppl.) | **15 %** | portées resserrées (espérance ~1,2). |
| **% de divorce** / an | **0 %** | baseline prévisible (comme les taux F2) ; activable. |
| **Consanguinité** (global) | **interdite** | source de vérité §6.6.1 / §9.5. |

## Constitution Check

*GATE : doit passer avant la Phase 0, re-vérifié après la Phase 1.*

| Principe | Gate | Statut |
|---|---|---|
| I. Déterminisme par seed unique | Tout l'aléatoire du tick (divorce, volonté, groupes, portée, enfants) via le `Rng` injecté ; **état RNG sérialisé** ⇒ continuation reproductible (SC-001/FR-021) | ✅ PASS |
| II. 100 % statique / client-side | Aucune dépendance serveur ; build statique inchangé | ✅ PASS |
| III. PWA multiplateforme & hors-ligne | Logique pure côté client ; aucun impact | ✅ PASS |
| IV. Cœur pur, isolé, testable | `time/` & `repro/` entièrement dans `src/core` (pas de Svelte/DOM/Date/Math.random) ; UI consomme | ✅ PASS |
| V. Tests déterministes du cœur | Vitest seed fixe + invariants ; gaussienne/portée/groupes testés | ✅ PASS |
| VI. Persistance explicite par fichiers | Export/import `full` étendu (année, couples, état RNG) ; aucune auto-save | ✅ PASS |
| VII. Tout est paramétrable | Paramètres d'espèce (gaussienne, portée, divorce, taille de groupe) + consanguinité globale, exportés | ✅ PASS |
| VIII. Simplicité & YAGNI | Réutilise `reproduce` (F2) ; aucune dépendance ajoutée ; périmètre borné au tick | ✅ PASS |
| IX. Spec source de vérité | §6.5/§6.6/§6.7/§9.4 respectés ; `DescriptionProjet.md` non modifié | ✅ PASS |
| X. Anonymat de l'auteur | Aucune donnée perso introduite | ✅ PASS |

**Verdict** : aucune violation. Aucune entrée de *Complexity Tracking* requise.

## Project Structure

### Documentation (this feature)

```text
specs/003-avancement-temps-population/
├── plan.md              # Ce fichier (/speckit-plan)
├── spec.md              # Spécification + Clarifications
├── research.md          # Phase 0 (décisions techniques)
├── data-model.md        # Phase 1 (entités étendues + invariants)
├── quickstart.md        # Phase 1 (scénarios de validation)
├── contracts/
│   └── core-api.md      # API publique : RNG sérialisable, gaussienne, tick, mort
└── checklists/
    └── requirements.md  # Checklist qualité de la spec (16/16)
```

### Source Code (repository root)

```text
src/
├── core/                          # CŒUR MÉTIER PUR — étendu (aucun import UI/navigateur)
│   ├── rng/
│   │   └── rng.ts                 # (existant) + getState()/createRngFromState() pour FR-021
│   ├── model/
│   │   ├── espece.ts              # (existant) + paramètres de reproduction (gaussienne, portée, divorce, taille groupe)
│   │   ├── couple.ts              # (NOUVEAU) entité Couple (membres, % repro éditable)
│   │   └── personne.ts            # (existant) conjoints actuel/ex déjà présents ; mort manuelle (raisonDeces)
│   ├── params/parameters.ts       # (existant) + option globale consanguinité
│   ├── repro/
│   │   ├── gaussian.ts            # (NOUVEAU) probabilité de reproduction selon l'âge (pure)
│   │   ├── candidates.ts          # (NOUVEAU) éligibilité + volonté (gaussienne) → candidats
│   │   ├── pairing.ts             # (NOUVEAU) formation déterministe de groupes (consanguinité, genre, espèce)
│   │   └── litter.ts              # (NOUVEAU) taille de portée (M/N/X)
│   ├── birth/reproduce.ts         # (existant, F2) réutilisé pour chaque enfant d'une portée
│   ├── time/
│   │   └── tick.ts                # (NOUVEAU) tick annuel (§6.6) + advanceYears (§6.5)
│   ├── life/
│   │   └── death.ts               # (NOUVEAU) mort manuelle (cause obligatoire, §6.7)
│   └── state/serialize.ts         # (existant) + currentYear, couples, état RNG (round-trip)
├── ui/
│   ├── components/
│   │   └── TimeBar.svelte         # (NOUVEAU) « avancer de X ans » + date courante
│   ├── views/FicheView.svelte     # (existant) + action « tuer » (cause), statut décédé, conjoints
│   ├── views/ListeView.svelte     # (existant) + colonne statut/âge (date courante)
│   └── stores/appState.ts         # (existant) + advanceYears, kill, currentYear, couples
└── …

tests/
└── unit/
    ├── rng-state.test.ts          # (NOUVEAU) getState/createRngFromState ⇒ même suite
    ├── gaussian.test.ts           # (NOUVEAU) bornes [début,fin], pic, hors-plage = 0
    ├── pairing.test.ts            # (NOUVEAU) anti-consanguinité, genre « tout », non-inter-espèces, déterminisme
    ├── litter.test.ts             # (NOUVEAU) portée ∈ [M,N], procédure M + X%
    ├── tick.test.ts               # (NOUVEAU) ordre §6.6, divorce 0/100 %, vieillissement, déterminisme
    ├── death.test.ts              # (NOUVEAU) cause obligatoire, exclusion de la reproduction
    └── state.test.ts              # (existant) + round-trip avec état RNG / continuation
```

**Structure Decision** : on **étend** le cœur pur par deux familles de modules cohésifs — **`repro/`**
(gaussienne, candidats, appariement, portée, **purs et injectés avec le `Rng`**) et **`time/`** (tick,
avance) — plus `life/death`. La frontière `src/core` (pur) ↔ `src/ui` (Svelte) est préservée (Principe IV).
Le `Rng` gagne la **sérialisation d'état** (FR-021) sans changer son algorithme (xoshiro256**).

## Complexity Tracking

> Aucune violation de la Constitution Check → section vide.
