# Implementation Plan: Lot de corrections (bugs & ajustements UI)

**Branch**: `011-corrections-bugs-ui` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-corrections-bugs-ui/spec.md`

## Summary

Lot de dix corrections/améliorations indépendantes réparties entre **cœur pur** (`src/core`) et **UI**
(`src/ui`), sans nouvelle dépendance. Trois bugs de reproduction/généalogie (consanguinité lignée
directe, date partagée de portée, génération 0 relative à la genèse), quatre ajustements
d'interaction/visuel (étiquettes P/M, wrap des filtres de trait, aperçu de pouvoir temps réel, bouton
« Régénérer »), une correction de formule génétique (constante de duplication `D`), un renommage de
fichier exporté et la levée du bornage manuel de P/M. Le déterminisme à seed unique (Principe I) et la
pureté du cœur (Principe IV) sont préservés ; les changements qui divergent de la spécification
fonctionnelle (`rsrc/DescriptionProjet.md`) sont d'abord répercutés dans ce document (Principe IX),
puis dans le `.adoc`.

## Technical Context

**Language/Version**: TypeScript 5.x (ESM, `strict`)

**Primary Dependencies**: Vite, Svelte, vite-plugin-pwa, Vitest — **aucune nouvelle dépendance**

**Storage**: Export/import de fichiers JSON typés (`config | data | full`), **versionnés**
(`FORMAT_VERSION`) ; aucun backend

**Testing**: Vitest à **seed fixe** sur le cœur (`tests/unit/**`)

**Target Platform**: PWA statique (GitHub Pages), navigateurs modernes desktop & mobile, hors-ligne

**Project Type**: Application single-project — cœur pur `src/core` + UI `src/ui` (Svelte)

**Performance Goals**: aperçu de pouvoir « temps réel » **instantané** (< 1 frame perçue) à chaque
changement de trait ; listes/arbres pouvant compter plusieurs milliers d'individus

**Constraints**: déterminisme par seed unique (aucun `Math.random`/horloge dans `src/core`) ;
cœur découplé de l'UI ; base path relatif (sous-répertoire GitHub Pages) ; rétro-compatibilité
d'import des anciens fichiers

**Scale/Scope**: 10 user stories ; ~8 fichiers cœur + ~6 fichiers UI touchés ; population cible
jusqu'à quelques milliers d'individus

## Constitution Check

*GATE : doit passer avant Phase 0. Re-vérifié après Phase 1.*

| Principe | Statut | Justification / action |
|---|---|---|
| I. Déterminisme seed unique | ✅ PASS (vigilance) | US2 tire le jour de portée **une fois** via `rng` ; US7 utilise une **seed d'aperçu stable** dérivée (pas d'entropie) ; US8/US9 consomment le `rng` fourni. Aucun `Math.random`/horloge ajouté. |
| II. 100 % statique | ✅ PASS | Aucun backend ; changements UI/cœur uniquement. |
| III. PWA hors-ligne | ✅ PASS | Aucun impact sur le service worker/manifest. |
| IV. Cœur pur & isolé | ✅ PASS | US1/US2/US3/US8 = logique pure dans `src/core` ; US7/US9 réutilisent le cœur via le store sandbox ; UI ne fait que consommer. |
| V. Tests déterministes du cœur | ✅ PASS (obligation) | US1 (consanguinité), US2 (date portée), US3 (génération relative), US8 (formule `D`), US9 (régénération) ⇒ **tests Vitest à seed fixe obligatoires**. |
| VI. Persistance explicite versionnée | ⚠️ ACTION | US3 ajoute `genesisYear` à l'état exporté ⇒ **bump `FORMAT_VERSION`** + migration/fallback (naissance la plus ancienne). Conforme (explicite, versionné) — documenté en Complexity Tracking. |
| VII. Tout paramétrable | ✅ PASS | `D` reste un paramètre exporté (défaut modifié 20→0.25). |
| VIII. Simplicité / YAGNI | ✅ PASS | Aucune dépendance ajoutée ; réutilisation maximale de l'existant. |
| IX. Spéc fonctionnelle = source de vérité | ⚠️ ACTION | US1 (§6.6.1), US2 (§6.6.2 portée), US3 (génération d'affichage), US8 (§6.4.1 formule `D`) **divergent** de `rsrc/DescriptionProjet.md` ⇒ mettre à jour ce document **avec l'autorisation de l'auteur** (fournie via ce workflow) **avant** le code, puis régénérer le `.adoc`. US10 est **déjà conforme** au §7. US4/US5/US6/US7/US9 relèvent de l'UI/sandbox (hors doc fonctionnel du domaine). |
| X. Anonymat auteur | ✅ PASS | Identité `KingsCookie`, aucun email ; renommage export « PowerGenerator » va dans le sens de l'anonymat. |

**Verdict** : PASS avec deux actions tracées (bump de format VI ; mise à jour du doc IX). Aucune
violation nécessitant une refonte. Détails en Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/011-corrections-bugs-ui/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — décisions techniques
├── data-model.md        # Phase 1 — entités & champs touchés
├── quickstart.md        # Phase 1 — scénarios de validation manuelle
├── contracts/
│   └── ui-contract.md   # Phase 1 — contrats cœur (signatures) & UI
├── checklists/
│   └── requirements.md  # Checklist qualité (déjà présent, 16/16)
└── tasks.md             # Phase 2 — /speckit-tasks (non créé ici)
```

### Source Code (repository root)

```text
src/core/
├── repro/pairing.ts             # US1 — consanguinité lignée directe (2 niveaux)
├── repro/litter.ts              # US2 — (taille de portée, inchangé) ; jour partagé côté appelant
├── birth/reproduce.ts           # US2 — date de naissance injectée (jour de portée partagé)
├── time/tick.ts                 # US2 — tire le jour de portée une fois et le propage
├── genesis/derived.ts           # US3 — computeGeneration(birthYear, genesisYear)
├── powers/traitsToPowers.ts     # US8 — proba duplication = min(100, résilience·D)
├── powers/inheritStats.ts       # US10 — déjà conforme (§7.2) ; réutilisé par US9
├── powers/regenerate.ts         # US9 — regeneratePowers() cœur pur (§6.4 + P/M), testable (NOUVEAU)
├── params/parameters.ts         # US8 — duplicationD : diviseur→multiplicateur, défaut 0.25
├── state/serialize.ts           # US3 — genesisYear (bump FORMAT_VERSION + migration)
└── state/appState.ts            # US3 — champ genesisYear dans l'état

src/ui/
├── components/SandboxPersonForm.svelte  # US7 aperçu temps réel ; US10 lever le clamp P/M
├── components/FilterBar.svelte          # US5 — section traits sur sa propre ligne
├── components/StateIO.svelte            # US6 — nom de fichier PowerGenerator_{type}_…
├── views/ListeView.svelte               # US4 — étiquette « P x » / « M y »
├── views/SandboxView.svelte             # US4 étiquettes ; US9 bouton « Régénérer »
├── stores/sandboxStore.ts               # US7 aperçu (seed stable) ; US9 régénération
└── lib/ficheViewModel.ts                # US3 génération via genesisYear ; US4 format P/M

tests/unit/
├── genealogy-consanguinity.test.ts  # US1 (nouveau)
├── litter-date.test.ts              # US2 (nouveau)
├── generation-origin.test.ts        # US3 (nouveau)
├── duplication-formula.test.ts      # US8 (nouveau)
├── regenerate-powers.test.ts        # US9 (nouveau, logique pure extraite si besoin)
└── (mises à jour) power-label-tree / fiche-vm / serialize / pairing existants
```

**Structure Decision** : single-project existant conservé ; séparation stricte cœur/UI (Principe IV).
Les modifications de règles vivent dans `src/core` (testées Vitest), l'UI ne fait que les invoquer.

## Complexity Tracking

| Écart | Pourquoi nécessaire | Alternative plus simple rejetée car |
|---|---|---|
| VI — `genesisYear` ajouté à l'état exporté (bump `FORMAT_VERSION`) | US3 exige que la génération 0 soit ancrée à l'année de genèse, information non dérivable de façon stable autrement (décision de clarification : persistée) | « Déduire l'origine de la naissance la plus ancienne » a été retenu **uniquement comme fallback** pour les anciens fichiers ; comme source primaire il serait faussé par un ajout sandbox d'individu plus ancien |
| IX — mise à jour de `rsrc/DescriptionProjet.md` (+ `.adoc`) | US1/US2/US3/US8 changent des règles décrites dans la source de vérité ; le Principe IX impose de mettre à jour le doc avant le code | Coder à l'encontre du doc est interdit par la constitution ; l'auteur autorise le changement via ce workflow |
| Détermination de la **seed d'aperçu** (US7) | Fournir un aperçu réactif **et** déterministe sans consommer le RNG de session | Un simple `Math.random` violerait le Principe I ; consommer le RNG à chaque frappe rendrait l'aperçu instable (cf. research.md) |

**Bugfix**: 2026-07-08 — [BUG-001] Le formulaire `SandboxPersonForm.svelte` doit exposer les contrôles
**actif + résilience** par trait **en création comme en édition** (parité, pré-requis d'US7). Défaut de
réactivité Svelte : `{@const entry = traitEntry(t.id)}` ne dépend pas de `fAdn` (lecture dans une
fonction) ⇒ non réévalué à l'ajout d'un trait ⇒ contrôles absents en création (ADN vide au départ).
