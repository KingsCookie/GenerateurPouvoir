# Quickstart — Fondations & Genèse (dev, test, build, déploiement)

> Stack : TypeScript + Vite + Svelte + Vitest + vite-plugin-pwa. Application **100 % statique** (PWA),
> déployée sur **GitHub Pages**. Aucun backend.

## Prérequis

- **Node.js** LTS (≥ 20) et un gestionnaire de paquets (npm).

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev          # serveur Vite local (HMR)
```

## Tests (cœur déterministe)

```bash
npm run test         # Vitest (une passe)
npm run test:watch   # Vitest en watch
```

- Les tests du cœur utilisent une **seed fixe** et vérifient les invariants (reproductibilité,
  bornes puissance/maîtrise ∈ [1,10], proportions de pouvoir 0 %/100 %, round-trip export/import).

## Build statique

```bash
npm run build        # génère dist/ (bundle statique + assets PWA)
npm run preview      # sert dist/ localement pour vérification
```

- **Base path GitHub Pages** : le site étant servi sous `/<repo>/`, `vite.config.ts` lit la base depuis
  une variable d'environnement de build (ex. `BASE_PATH=/GenerateurPouvoirTraits/`). En local, base = `/`.
- `public/404.html` (copie d'`index.html`) assure le repli de routing côté client.

## Déploiement (GitHub Actions → Pages)

- Workflow `.github/workflows/deploy.yml` : `install → test → build (avec base) → upload-pages-artifact →
  deploy-pages`. Déclenché sur push `main`.
- Pré-requis dépôt : *Settings → Pages → Source = GitHub Actions*. Aucun secret applicatif (Principe II).

## Vérification manuelle (smoke test de la feature)

1. `npm run dev`, ouvrir l'app.
2. Vérifier que la **seed** est affichée et éditable, avec un bouton de **régénération**.
3. Laisser les défauts (effectif **100**, **0 %** de pouvoir) → générer → la liste affiche **100**
   individus, âge 0, **aucun** pouvoir.
4. Régénérer avec la **même seed** → population **identique** ; changer la seed → population différente.
5. Mettre `% pouvoir` à 100 → chaque individu a **un** pouvoir (puissance/maîtrise entre 1 et 10).
6. Ouvrir une **fiche** : infos globales (dont **génération** = tranche de 20 ans) + pouvoir(s) + traits actifs.
7. **Exporter** l'état, recharger la page (état vide), **réimporter** → état restauré à l'identique.
8. Mode hors-ligne (après 1er chargement) : l'app se charge toujours.

## Garde-fous (constitution)

- `src/core` ne DOIT importer ni Svelte, ni DOM, ni `Date`/`crypto`/`Math.random` (hors `createSeed`).
- Aucune donnée personnelle de l'auteur dans le code, `package.json`, ou les artefacts (identité `KingsCookie`).
