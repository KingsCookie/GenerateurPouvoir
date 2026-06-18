# Implementation Plan: Refonte complète de l'UI

**Branch**: `008-refonte-ui` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-refonte-ui/spec.md`

## Summary

Refonte **purement visuelle** des **5 vues** (Paramètres, Population, Fiche, Arbre, Sandbox) et du **chrome
global**, conforme au handoff `design_handoff_refonte_ui/` (source de vérité visuelle), **sans aucune perte
de fonctionnalité** (`rsrc/DefUi.md` = contrat fonctionnel). Pièce maîtresse : un **système de thème à 3
axes** posés en attributs sur `<html>` — `data-mode` (sombre défaut / clair), `data-palette` (violet / cyan
/ vert), `data-style` (A « Atelier » / B « Signal ») — mémorisés en `localStorage` (préférence d'interface).
Ajouts UX : **pied de page de version**, **bouton remonter-en-haut**, **pagination** (Liste + Sandbox),
**onglets Sandbox** (Population / Couples), **lentille temporelle** champ+curseur, et enrichissements **Fiche**
(liste des enfants, type des traits). Les **polices** sont **auto-hébergées** (woff2 + `@font-face`,
précachées) pour l'autonomie hors-ligne.

Le **cœur (`src/core`) n'est pas modifié** : la refonte touche uniquement `src/ui/**`, `src/app.css`,
`index.html`, la config de build (version + précache des polices) et des assets de polices. L'état ajouté
(apparence, pagination, onglets, vue d'arbre) est de l'**état d'interface** (store `ui.ts`), **non** dans
`AppState` ni l'export/import.

## Technical Context

**Language/Version** : TypeScript 5.x (ESM, `strict`).

**Primary Dependencies** : Svelte + Vite ; `vite-plugin-pwa` (Workbox). **Aucune dépendance ajoutée**
(Principe VIII) — `color-mix()` natif pour les dérivés de thème ; polices locales (pas de SDK).

**Storage** : aucun backend. Persistance applicative **exclusivement** par export/import de fichier JSON
(Principe VI). Les **préférences d'apparence** (mode/palette/style) et `traitMode` vivent en `localStorage`
(préférence d'interface, autorisée par `DefUi.md` ; **jamais** dans `AppState`).

**Testing** : Vitest à seed fixe sur le **cœur** (inchangé → reste vert). Les ajouts UI **purs**
(view-model de fiche : liste enfants, type de trait ; helper de pagination) PEUVENT recevoir des tests
unitaires purs. Validation visuelle manuelle via `quickstart.md` (comparaison maquette + check-list `DefUi`).

**Target Platform** : navigateurs desktop + mobiles (PWA installable, hors-ligne), build statique GitHub
Pages.

**Project Type** : application web statique (cœur pur `src/core` ↔ UI `src/ui`). Refonte côté **UI seule**.

**Performance Goals** : bascule de thème **< 1 s** (échange d'attributs, sans rechargement) ; liste de
**1000+** individus fluide grâce à la **pagination** (DOM borné à la taille de page) ; arbre pan/zoom fluide
(~60 fps) ; aucun rechargement réseau à l'usage (hors-ligne).

**Constraints** : 100 % statique / hors-ligne (Principe II/III) ; **déterminisme** (Principe I — aucun
`Math.random`/horloge introduit dans `src/core`) ; **cœur pur intouché** (Principe IV) ; français ;
anonymat (Principe X) ; accessibilité (clavier, ARIA, contraste 2 thèmes) + responsive/tactile.

**Scale/Scope** : 5 vues + ~14 composants restylés/refondus ; 1 système de thème (3 axes, 12 combinaisons) ;
~5 ajouts d'état d'interface ; 4 polices auto-hébergées. Aucune migration de données.

## Constitution Check

*GATE : doit passer avant Phase 0 ; re-vérifié après Phase 1.*

| Principe | Impact & conformité |
|----------|---------------------|
| **I. Déterminisme** | ✅ Refonte UI ; **aucun** ajout d'aléatoire/horloge dans `src/core`. La version du pied de page est une **constante de build** (pas d'horloge runtime). L'horodatage d'export (UI, existant) reste inchangé. |
| **II. 100 % statique** | ✅ Aucun service ; **polices auto-hébergées** (suppression de l'appel CDN) ⇒ bundle statique autonome. |
| **III. PWA / hors-ligne / responsive** | ✅ Polices **précachées** (Workbox) ⇒ rendu complet hors-ligne ; design responsive conservé/amélioré ; cibles tactiles ≥ 44 px. |
| **IV. Cœur pur, isolé** | ✅ **`src/core` non modifié.** Tout est dans `src/ui/**` + `app.css` + `index.html` + config build. L'UI consomme le cœur, jamais l'inverse. |
| **V. Tests déterministes du cœur** | ✅ Cœur inchangé ⇒ tests existants restent verts. Ajouts UI purs (view-model) testables si pertinent ; pas de test requis par la constitution hors cœur. |
| **VI. Persistance par fichiers** | ✅ Préférences d'apparence/onglets/pagination en **`localStorage`** (préférence d'interface, **hors** `AppState`) ; export/import **inchangé** ; aucune auto-save de l'état applicatif. |
| **VII. Tout est paramétrable** | ✅ Le thème (3 axes) est **choisi par l'utilisateur** ; aucun comportement métier chiffré caché ajouté. |
| **VIII. Simplicité / YAGNI** | ✅ Aucune dépendance ajoutée. Le **système 3 axes** est une **exigence utilisateur clarifiée** (2026-06-18), pas une complexité gratuite ; les polices locales sont justifiées par les Principes II/III. |
| **IX. Spec source de vérité** | ✅ `rsrc/DescriptionProjet.md` **non modifié**. Pour cette feature, le handoff `design_handoff_refonte_ui/` est la source **visuelle** (désignée par l'auteur) et `DefUi.md` le **contrat fonctionnel** ; la refonte ne change **aucune** règle métier. |
| **X. Anonymat** | ✅ Commits `KingsCookie`, email vide ; aucune PII. **Bonus** : l'auto-hébergement des polices supprime l'appel tiers (Google Fonts), améliorant la confidentialité. |

**Verdict** : ✅ PASS (avant et après design). **Aucune** violation ⇒ pas d'entrée obligatoire en Complexity
Tracking (note d'éclairage ci-dessous).

## Project Structure

### Documentation (this feature)

```text
specs/008-refonte-ui/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — décisions techniques (thème, polices, pagination, arbre…)
├── data-model.md        # Phase 1 — entités d'état d'INTERFACE (ui.ts) + invariants
├── quickstart.md        # Phase 1 — validation manuelle (maquette + non-régression DefUi)
├── contracts/
│   └── ui-contract.md   # Phase 1 — contrat de thème (attributs <html>) + store ui.ts + non-régression
└── tasks.md             # Phase 2 (/speckit-tasks — NON créé ici)
```

### Source Code (repository root)

```text
index.html                    # MODIFIÉ — retrait du <link> Google Fonts ; @font-face local via app.css ; (option) script anti-FOUC d'application des attributs de thème
src/app.css                   # DÉJÀ amorcé (tokens fusionnés) — + @font-face (4 polices locales) ; styles de base restylés
public/fonts/                 # NOUVEAU — fichiers woff2 auto-hébergés (Hanken Grotesk, JetBrains Mono, Space Grotesk, Space Mono)

src/ui/stores/
├── ui.ts                     # MODIFIÉ — + apparence (mode/palette/style, persistés) + effet d'application aux attributs <html> ; + pagination (page/size liste & sandbox), onglet sandbox, état vue d'arbre, showScrollTop
└── (appState.ts, sandboxStore.ts, filters.ts : INCHANGÉS — logique)

src/ui/
├── App.svelte                # MODIFIÉ — en-tête sticky (logo, nav .nav-item, toggle thème), barre I/O, pied de page version, bouton remonter-en-haut
├── views/
│   ├── ParametresView.svelte # MODIFIÉ — index latéral collant + section « Paramètres graphiques » (3 axes) + restyle
│   ├── ListeView.svelte      # MODIFIÉ — restyle + pagination
│   ├── FicheView.svelte      # MODIFIÉ — restyle + liste des enfants + type des traits
│   ├── ArbreView.svelte      # REFONTE — organigramme, contrôles zoom/profondeur/recentrer
│   └── SandboxView.svelte    # REFONTE — onglets Population/Couples, lentille champ+curseur, pagination, modale formulaire
└── components/
    ├── ThemeControls.svelte      # NOUVEAU (option) — segments des 3 axes (réutilisé en Paramètres) + toggle en-tête
    ├── Paginator.svelte          # NOUVEAU (option) — contrôle de pagination réutilisable (liste & sandbox)
    ├── ScrollToTop.svelte        # NOUVEAU — bouton remonter-en-haut
    ├── AppFooter.svelte          # NOUVEAU — pied de page version
    ├── GenealogyTree.svelte      # REFONTE — rendu organigramme + zoom/pan (réutilisé fiche/dédiée)
    ├── TimeBar / FilterBar / TreeLegend / TraitModeSelector / SpeciesEditor / GaussianCurve /
    │   TraitCatalogEditor / ResilienceOverrides / StateIO / SandboxPersonForm  # RESTYLÉS
    └── …

src/ui/lib/
├── ficheViewModel.ts         # MODIFIÉ — exposer enfants (ids→noms) + type de trait (pur, testable)
└── treeLayout.ts             # MODIFIÉ — disposition organigramme conforme maquette (pur)

vite.config.ts                # MODIFIÉ — injection version (define) + Workbox globPatterns inclut woff2
package.json                  # version (source du pied de page)

# src/core/**                 # INCHANGÉ (Principe IV)
```

**Structure Decision** : conserver la séparation **cœur pur** (`src/core`, intouché) ↔ **UI** (`src/ui`).
Toute la refonte est présentationnelle ; l'état ajouté est de l'**interface** (`ui.ts`), jamais dans
`AppState`/sérialisation. Réutilisation maximale des composants existants (restyle plutôt que réécriture),
refonte ciblée pour l'arbre et la sandbox (organigramme, onglets).

## Complexity Tracking

> Aucune **violation** de la constitution ⇒ aucune justification obligatoire. Notes d'éclairage :

| Point | Pourquoi | Alternative écartée |
|-------|----------|---------------------|
| **Système de thème 3 axes** (12 combinaisons) | **Exigence utilisateur clarifiée** (2026-06-18) ; le handoff/tokens le fournit déjà (color-mix natif, aucune dépendance). | Mode clair/sombre seul : rejeté car l'utilisateur a tranché le périmètre complet. |
| **Polices auto-hébergées** | **Principes II/III** (autonomie hors-ligne stricte) + confidentialité (Principe X). | CDN Google Fonts : rejeté car dépendance réseau au 1er chargement (entorse au 100 % hors-ligne) et appel tiers. |
