# Générateur de Pouvoir

Générateur de **pouvoirs aléatoires déterministe** avec hérédité génétique (ADN, traits → pouvoirs).
Application **100 % statique** (PWA installable et hors-ligne), sans backend, déployée sur **GitHub Pages**.

> Feature 1 — **Fondations & Genèse** : socle déterministe (seed unique), modèle de données
> (Trait, ADN, Personne, Pouvoir, Espèce), catalogues par défaut, génération d'un batch initial,
> UI liste + fiche en lecture seule, et export/import par fichier.

## Stack

TypeScript · Vite · Svelte · Vitest · `vite-plugin-pwa`. Cœur métier **pur** (`src/core`, sans
dépendance UI/navigateur) découplé de l'UI Svelte (`src/ui`).

## Prérequis

- Node.js LTS (≥ 20) et npm.

## Commandes

```bash
npm install        # installer les dépendances
npm run dev        # serveur de développement (HMR)
npm run test       # tests déterministes du cœur (Vitest)
npm run build      # build statique → dist/
npm run preview    # prévisualiser le build
npm run lint       # ESLint + Prettier (vérification)
```

## Déterminisme

Toute l'aléatoire dérive d'une **seule seed** (entier 64 bits) via un PRNG unique
(SplitMix64 + xoshiro256\*\*). À seed et paramètres identiques, la population générée est
**strictement reproductible**. Le seul point d'entropie est `createSeed()` (tirage d'une nouvelle
seed côté UI). Aucun `Math.random`, horloge ou identifiant aléatoire dans le cœur.

## Persistance

Aucune sauvegarde automatique. L'état (paramètres + seed + population) s'**exporte** et s'**importe**
explicitement via un fichier JSON versionné.

## Déploiement (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` construit le site et le publie sur Pages à chaque push sur
`main`. Le site est servi sous `https://<utilisateur>.github.io/<repo>/` : le **base path** est fourni
au build via la variable d'environnement `BASE_PATH` (ex. `BASE_PATH=/GenerateurPouvoirTraits/`), et
`public/404.html` assure le repli de routing côté client. En local, le base path vaut `/`.

Côté dépôt : _Settings → Pages → Source = GitHub Actions_. Aucun secret applicatif.

## Licence

Code source visible publiquement. **Tous droits réservés** — voir [LICENSE](./LICENSE) : usage personnel
autorisé, usage commercial interdit. Contact : via les _issues_ du dépôt GitHub.

Auteur : **KingsCookie**.
