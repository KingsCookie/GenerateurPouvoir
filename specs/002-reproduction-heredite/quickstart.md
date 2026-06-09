# Quickstart — Reproduction & hérédité (dev, test, validation)

> Stack inchangée (Feature 1) : TypeScript + Vite + Svelte + Vitest + vite-plugin-pwa. Cœur **pur**,
> déterministe, testé à seed fixe. Cette feature **étend** le cœur (moteur génétique) et l'UI.

## Commandes

```bash
npm install
npm run dev          # serveur Vite local
npm run test         # Vitest (cœur déterministe, dont les exemples §6.4 / §7.2)
npm run build        # build statique (PWA)
npm run preview
npm run lint
```

## Tests clés (Principe V — seed fixe)

- `tests/unit/heredity.test.ts` — §4 : Cas 1 / Cas 2 (agrégation), bonus/malus **additif**, plafond
  `resilienceMax`, **disparition** sous `disappearThreshold`, transmission des inactifs.
- `tests/unit/traits-to-powers.test.ts` — §6.4 : **exemple 1** (sans duplication) et **exemple 2** (avec
  duplication) reproduits à l'identique ; génération `K` (inscrite à l'ADN) ; `null` si `K` requis échoue.
- `tests/unit/inherit-stats.test.ts` — §7.2 : **exemples 1 & 2** (mapping `i mod n`), arrondi, tirage A/B/C,
  **bornage cas A uniquement**, cas « aucun parent source » ⇒ aléatoire 1-10.
- `tests/unit/reproduce.test.ts` — pipeline §5 : déterminisme (INV-1), cas spéciaux 0 %/100 % (INV-3),
  parenté symétrique (INV-9), round-trip export/import après reproductions (INV-10).

## Vérification manuelle (smoke test de la feature)

1. `npm run dev`, générer une population (Feature 1) avec `% pouvoir` élevé pour avoir des traits actifs.
2. Dans la **liste**, **sélectionner** 2 individus dotés de traits actifs.
3. Cliquer **« Reproduire »** → un **enfant** apparaît (âge 0, année courante), relié à ses parents.
4. Ouvrir la **fiche** de l'enfant : pouvoirs (puissance/maîtrise), **ADN complet** (traits actifs +
   inactifs + résilience).
5. Rejouer avec la **même seed** + mêmes parents → enfant **identique** ; changer la seed → différent.
6. Régler **taux mutation forte = 100 %** → l'enfant a 1 pouvoir gabarit (P/M 1-10), ADN parental inactif.
7. Régler **taux sans pouvoir = 100 %** → enfant sans pouvoir, ADN parental inactif.
8. **Exporter** puis **réimporter** → état (enfants + parenté) restauré à l'identique.

## Garde-fous (constitution)

- `src/core` ne DOIT importer ni Svelte, ni DOM, ni `Date`/`crypto`/`Math.random` (hors `createSeed`).
- Tout l'aléatoire (tirages d'hérédité, mélanges, duplication, K, P/M) passe par le `Rng` injecté (Principe I).
- L'arbre §6.4.2 est reproduit **verbatim** (Principe IX) ; `D` et `K` sont **distincts** (Principe VII).
- Aucune donnée personnelle de l'auteur (identité `KingsCookie`, Principe X).
