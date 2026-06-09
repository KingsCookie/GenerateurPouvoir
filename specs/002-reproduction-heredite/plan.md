# Implementation Plan: Reproduction & hérédité (moteur génétique)

**Branch**: `002-reproduction-heredite` | **Date**: 2026-06-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-reproduction-heredite/spec.md`

## Summary

Implémenter le **moteur génétique** dans le cœur pur TypeScript : **hérédité par résilience** (§4),
**pipeline de naissance** (§5), **algorithme traits→pouvoirs** (§6.4 avec constantes **D** = duplication
et **K** = génération, distinctes), **héritage de puissance/maîtrise** (§7.2), et les **cas spéciaux**
(mutation forte / sans pouvoir §6.1, mutation faible §6.3). Le moteur est **exercé via la reproduction
manuelle** : l'utilisateur sélectionne ≥ 1 individus, déclenche une naissance, et **un enfant** déterministe
est ajouté à la population (liens de parenté posés). L'UI ajoute une **sélection + bouton reproduire** et une
**fiche enrichie** (ADN complet : actifs + inactifs + résilience). Tout reste **pur, déterministe, testé à
seed fixe**, avec couverture des **exemples chiffrés** de la source de vérité (§6.4 ex.1/2, §7.2 ex.1/2).

Approche : étendre le cœur de la Feature 1 (`src/core`) sans casser l'existant. Nouveaux modules cœur :
`heredity/` (résilience, agrégation multi-parents), `powers/traitsToPowers` (sous-listes, duplication,
arbre §6.4.2, génération K), `powers/inheritStats` (§7.2), `birth/` (pipeline §5 + mutation faible + cas
spéciaux). L'UI consomme le cœur (sélection, action, fiche enrichie). Persistance : l'`AppState` existant
sérialise déjà la population et les liens de parenté (round-trip).

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022), strict — **inchangé** (Feature 1).

**Primary Dependencies**: Vite, Svelte, Vitest, `vite-plugin-pwa` — **inchangé**. Aucune nouvelle dépendance
(Principe VIII). Tout le moteur réutilise le `Rng` seedé existant.

**Storage**: Aucune persistance auto ; export/import JSON `kind:"full"` existant (Feature 1), qui inclut déjà
`population` (avec `parents`/`enfants`/`adn`/`pouvoirs`). Round-trip étendu aux enfants générés (Principe VI).

**Testing**: Vitest **à seed fixe**. Tests dérivés des **exemples chiffrés** de la spec (§6.4.1 ex.1 sans
duplication, ex.2 avec duplication ; §7.2 ex.1/ex.2 héritage P/M) + invariants (reproductibilité, héritage
total des traits, bornage uniquement cas A / mutation forte, proportions des taux 0 %/100 %).

**Target Platform**: navigateurs desktop/mobile, PWA hors-ligne, GitHub Pages — **inchangé**.

**Project Type**: application web statique (PWA), projet unique deux couches (cœur pur / UI Svelte).

**Performance Goals**: une reproduction (un enfant) **< 50 ms** en pratique ; rester fluide. Les exemples et
tests s'exécutent en millisecondes. Pas de boucle temporelle ici (Feature 3).

**Constraints**: déterminisme **total** via la seed unique (aucun `Math.random`/horloge/UUID dans `src/core`) ;
cœur **sans dépendance UI/navigateur** ; l'arbre §6.4.2 est reproduit **verbatim** (faisant foi) ; `D` et `K`
**distincts** ; bornage P/M **uniquement** sur le cas A et la mutation forte (les moyennes ne sont pas bornées).

**Scale/Scope**: reproduction d'un enfant à la fois ; ADN/pouvoirs de taille modérée. Pas de tick annuel,
couples, portées, gaussienne (Feature 3), ni 3 modes d'affichage (Feature 4).

### Décisions de paramètres par défaut (clarification différée → fixée ici)

Valeurs par défaut **modifiables** (Principe VII), choisies pour un comportement de base **prévisible** :

| Paramètre | Défaut | Rationale |
|---|---|---|
| `D` (duplication) | **20** | proba duplication = `résilience/D` % ⇒ ~2,5 % à résilience 50 : duplication rare mais possible. |
| `K` (génération) | **10 %** | génération de traits `K…` occasionnelle. |
| résilience initiale | **50** | cohérent Feature 1 (`initialResilience`). |
| résilience maximale | **95** | plafond laissant une marge sous 100. |
| bonus (points) | **+5** | additif (clarification) ; gain modéré quand actif. |
| malus (points) | **−5** | additif ; perte modérée quand inactif. |
| seuil de disparition | **2 %** | valeur de la source de vérité. |
| taux mutation forte | **0 %** | baseline = naissance normale pure (prévisible, comme genèse 0 %). |
| taux naissance sans pouvoir | **0 %** | idem. |
| taux mutation faible (gain) | **0 %** | idem ; activable pour expérimenter. |
| taux mutation faible (perte) | **0 %** | idem. |
| option « malus génome » | **off** | conforme source de vérité (désactivée par défaut). |
| `B` (P/M) | **10 %** | `A = 100 − 2·B − C`. |
| `C` (P/M) | **30 %** | ⇒ `A = 50 %` : équilibre entre nouveauté (A) et héritage (B/C). |

## Constitution Check

*GATE : doit passer avant la Phase 0, re-vérifié après la Phase 1.*

| Principe | Gate | Statut |
|---|---|---|
| I. Déterminisme par seed unique | Tout l'aléatoire (tirages d'hérédité, mélanges, duplication, K, P/M) via le `Rng` injecté ; reproductibilité testée (SC-001) | ✅ PASS |
| II. 100 % statique / client-side | Aucune nouvelle dépendance serveur ; build statique inchangé | ✅ PASS |
| III. PWA multiplateforme & hors-ligne | Aucun impact ; logique pure côté client | ✅ PASS |
| IV. Cœur pur, isolé, testable | Moteur entièrement dans `src/core` (hérédité, traits→pouvoirs, P/M, pipeline) ; UI consomme | ✅ PASS |
| V. Tests déterministes du cœur | Vitest seed fixe + **exemples chiffrés** de la spec (§6.4, §7.2) en tests dédiés | ✅ PASS |
| VI. Persistance explicite par fichiers | Réutilise l'export/import `full` ; enfants + parenté inclus ; aucune auto-save | ✅ PASS |
| VII. Tout est paramétrable | `D`, `K`, résiliences, bonus/malus, seuil, taux, option malus, `B`/`C` exposés et exportés | ✅ PASS |
| VIII. Simplicité & YAGNI | Aucune dépendance ajoutée ; périmètre limité à la reproduction manuelle d'un enfant | ✅ PASS |
| IX. Spec source de vérité | `rsrc/DescriptionProjet.md` respecté ; arbre §6.4.2 reproduit verbatim ; non modifié | ✅ PASS |
| X. Anonymat de l'auteur | Aucune donnée perso introduite | ✅ PASS |

**Verdict** : aucune violation. Aucune entrée de *Complexity Tracking* requise.

## Project Structure

### Documentation (this feature)

```text
specs/002-reproduction-heredite/
├── plan.md              # Ce fichier (/speckit-plan)
├── spec.md              # Spécification + Clarifications (/speckit-specify, /speckit-clarify)
├── research.md          # Phase 0 (décisions techniques)
├── data-model.md        # Phase 1 (entités étendues + invariants)
├── quickstart.md        # Phase 1 (scénarios de validation)
├── contracts/           # Phase 1
│   └── core-api.md      # API publique du moteur (hérédité, traits→pouvoirs, P/M, naissance)
└── checklists/
    └── requirements.md  # Checklist qualité de la spec (16/16)
```

### Source Code (repository root)

```text
src/
├── core/                       # CŒUR MÉTIER PUR — étendu (aucun import UI/navigateur)
│   ├── rng/                    # (existant) PRNG seedé + shuffle déterministe (ajout: shuffle)
│   ├── model/                  # (existant) + champs/aides parenté déjà présents (Personne)
│   ├── params/                 # (existant) Parameters → ajout des paramètres du moteur (D, K, …)
│   ├── catalog/                # (existant) catalogues de traits
│   ├── genesis/                # (existant) genèse + gabarit (réutilisé par mutation forte)
│   ├── powers/
│   │   ├── strongMutation.ts   # (existant) gabarit AE/PE/PA/PR (réutilisé)
│   │   ├── traitsToPowers.ts   # (NOUVEAU) sous-listes + duplication + arbre §6.4.2 + génération K
│   │   └── inheritStats.ts     # (NOUVEAU) héritage puissance/maîtrise §7.2 (moyenne, arrondi, A/B/C)
│   ├── heredity/
│   │   └── inherit.ts          # (NOUVEAU) hérédité de résilience §4 (tirages, agrégation, bonus/malus, seuil)
│   ├── birth/
│   │   └── reproduce.ts        # (NOUVEAU) pipeline §5 : cas spécial → ADN → mutation faible → pouvoirs → P/M
│   └── state/                  # (existant) sérialisation (round-trip enfants/parenté)
├── ui/                         # COUCHE SVELTE — étendue
│   ├── views/ListeView.svelte  # (existant) + sélection multiple d'individus
│   ├── views/FicheView.svelte  # (existant) + ADN complet (actifs + inactifs + résilience)
│   ├── components/             # (NOUVEAU) ReproduceBar.svelte (sélection + bouton « Reproduire »)
│   ├── lib/ficheViewModel.ts   # (existant) + vue ADN complet
│   └── stores/appState.ts      # (existant) + sélection, action reproduire, ajout enfant
└── …

tests/
└── unit/                       # tests cœur à seed fixe
    ├── heredity.test.ts        # (NOUVEAU) §4 : Cas 1/Cas 2, bonus/malus additif, seuil de disparition
    ├── traits-to-powers.test.ts# (NOUVEAU) §6.4 : exemples 1 & 2 (sous-listes/duplication), génération K, null
    ├── inherit-stats.test.ts   # (NOUVEAU) §7.2 : exemples 1 & 2, arrondi, A/B/C, bornage cas A
    └── reproduce.test.ts       # (NOUVEAU) pipeline §5, cas spéciaux, déterminisme, round-trip
```

**Structure Decision** : on **étend** le cœur pur de la Feature 1 par des modules cohésifs
(`heredity`, `powers/traitsToPowers`, `powers/inheritStats`, `birth`), chacun pur et injecté avec le `Rng`.
La frontière `src/core` (pur) ↔ `src/ui` (Svelte) est préservée (Principe IV). L'arbre §6.4.2 est implémenté
**verbatim** comme une fonction de libellé pilotée par la présence des types de traits, isolée et testée.

## Complexity Tracking

> Aucune violation de la Constitution Check → section vide.
