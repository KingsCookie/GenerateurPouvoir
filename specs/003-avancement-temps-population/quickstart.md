# Quickstart — Avancement du temps & dynamique de population (dev, test, validation)

> Stack inchangée (Features 1-2) : TypeScript + Vite + Svelte + Vitest + vite-plugin-pwa. Cœur **pur**,
> déterministe, testé à seed fixe. Cette feature **étend** le cœur (simulation temporelle) et l'UI.

## Commandes

```bash
npm install
npm run dev          # serveur Vite local
npm run test         # Vitest (cœur déterministe : tick, gaussienne, appariement, portée, mort, état RNG)
npm run build        # build statique (PWA)
npm run preview
npm run lint
```

## Tests clés (Principe V — seed fixe)

- `tests/unit/rng-state.test.ts` — `getState`/`createRngFromState` : suite identique après restitution (FR-021).
- `tests/unit/gaussian.test.ts` — `reproProbability` : 0 hors [début, fin], maximum au pic, symétrie.
- `tests/unit/pairing.test.ts` — anti-consanguinité (parents/grands-parents), genre « tout »,
  non-inter-espèces, déterminisme, candidats non appariés reportés.
- `tests/unit/litter.test.ts` — portée ∈ [M, N], procédure « M garantis + X % ».
- `tests/unit/tick.test.ts` — ordre §6.6, divorce 0 %/100 % (INV-7), vieillissement (INV-2),
  déterminisme du tick (INV-1), nouveau couple reproduit dès l'année de formation.
- `tests/unit/death.test.ts` — cause obligatoire, exclusion de la reproduction (INV-8).
- `tests/unit/state.test.ts` — round-trip avec `currentYear`/`couples`/`rngState` + **continuation**
  identique après import (INV-10) ; import `formatVersion: 1` avec défauts (INV-11).

## Vérification manuelle (smoke test de la feature)

1. `npm run dev`, générer une population (≥ quelques dizaines d'individus, `% pouvoir` élevé).
2. Régler une **gaussienne** active (défauts humain 16/25/50, pic 60 %) et une **portée** (M/N/X).
3. Cliquer **« avancer de 1 an »** → des couples se forment, des enfants naissent (âge 0, année courante),
   tout le monde vieillit d'1 an, la **date courante** affiche l'année suivante.
4. Avancer de plusieurs années → la population croît ; ouvrir des fiches : conjoints **actuels**, enfants,
   parents reliés.
5. **Déterminisme** : noter la seed, régénérer la même population, avancer du même nombre d'années →
   population **identique** ; changer la seed → différente.
6. Régler **% divorce = 100** → après 1 an, tous les couples sont dissous (anciens conjoints en **ex**).
7. Depuis une fiche, **« tuer »** un individu avec une cause → statut décédé ; aux avancements suivants il
   ne se reproduit plus. Tuer **sans cause** → refusé.
8. **Exporter**, recharger la page, **réimporter**, puis **avancer** → même population qu'une session non
   interrompue (état du RNG restitué).

## Garde-fous (constitution)

- `src/core` ne DOIT importer ni Svelte, ni DOM, ni `Date`/`crypto`/`Math.random` (hors `createSeed`).
  `Math.exp` (gaussienne) est autorisé (pur).
- Tout l'aléatoire (divorce, volonté, appariement, portée, enfants) passe par le `Rng` injecté (Principe I).
- L'**état du RNG** est sérialisé pour une continuation déterministe (FR-021) ; `main` reste déployable.
- Aucune donnée personnelle de l'auteur (identité `KingsCookie`, Principe X).
