# Phase 0 — Recherche & décisions techniques

Feature : Fondations & Genèse de la population (`001-fondations-genese`).
Toutes les décisions respectent la constitution (`.specify/memory/constitution.md`) et la spec.

## D1 — Langage : TypeScript

- **Décision** : TypeScript 5.x (strict).
- **Rationale** : typage fort pour le modèle de domaine (ADN, pouvoirs) ; rend le cœur sûr et testable
  (Principes IV/V) ; compile vers JS statique pour le navigateur (Principe II).
- **Alternatives** : JavaScript pur (rejeté : pas de garanties de types sur un domaine complexe) ;
  autre langage compilé en WASM (rejeté : sur-ingénierie, Principe VIII).

## D2 — Framework UI : Svelte (choix utilisateur)

- **Décision** : Svelte (via Vite).
- **Rationale** : compile en JS minimal (bundle léger, bon pour PWA/Pages, Principes III/VIII) ;
  réactivité ergonomique pour les écrans à venir (arbres, listes filtrées, courbes live).
- **Alternatives** : vanilla DOM (rejeté : coûteux à maintenir quand l'UI grandit) ; React (rejeté :
  runtime/bundle plus lourds, moins aligné « stack légère »).

## D3 — Build & dev : Vite

- **Décision** : Vite ; sortie **statique** (`vite build`) ; **`base` configurable** pour le
  sous-répertoire GitHub Pages.
- **Rationale** : build statique pur (Principe II), DX rapide, écosystème Svelte/Vitest/PWA intégré.
- **GitHub Pages** : `base: '/<repo>/'` (paramétrable via variable d'env de build) ; chemins **relatifs** ;
  `public/404.html` recopie `index.html` pour le repli de routing client.
- **Alternatives** : SvelteKit (rejeté pour la V1 : oriente vers SSR/adaptateurs ; un SPA statique
  Vite+Svelte suffit et reste plus simple — Principe VIII).

## D4 — PWA : vite-plugin-pwa

- **Décision** : `vite-plugin-pwa` (Workbox) pour manifeste + service worker, stratégie
  **precache** des assets (offline après 1er chargement, Principe III).
- **Rationale** : intégration native Vite, génère le SW et le manifeste, gère le base path.
- **Alternatives** : SW écrit à la main (rejeté : réinvention, Principe VIII).

## D5 — Tests : Vitest

- **Décision** : Vitest pour les tests unitaires du cœur, **à seed fixe**.
- **Rationale** : même moteur que Vite (config unique), rapide ; le déterminisme (D6) rend les sorties
  exactement assertables (Principe V). Tests clés : reproductibilité (même seed ⇒ même population),
  bornes puissance/maîtrise ∈ [1,10], proportions de pouvoir (0 %/100 %), round-trip export/import.
- **Alternatives** : Jest (rejeté : intégration Vite moins directe).

## D6 — PRNG déterministe seedé

- **Décision** : un **unique** générateur seedé, déterministe et portable, exposé par le cœur et **injecté**
  partout (Principe I). Seed = entier **64 bits** manipulé en **BigInt** (les `number` JS ne tiennent pas
  64 bits entiers). Algorithme : **SplitMix64** pour dériver l'état initial, puis **xoshiro256\*\*** pour le
  flux de nombres (réputés, rapides, reproductibles, indépendants de la plateforme).
- **Création de la seed** : la génération d'une **nouvelle** seed est le **seul** point d'entropie non
  déterministe autorisé (via `crypto.getRandomValues` côté UI). Une fois la seed fixée, **tout** en dérive.
  La seed est éditable et exportée (Principes I/VI).
- **Tirages dérivés** : entier borné sans biais (rejet d'échantillonnage), tirage **pondéré** (poids des
  traits/types) et choix uniforme dans une liste — tous consommant le même flux.
- **Rationale** : reproductibilité stricte multiplateforme ; pas de dépendance à l'implémentation `Math.random`.
- **Alternatives** : `Math.random` (rejeté : non seedable, viole Principe I) ; LCG type `java.util.Random`
  (rejeté : on ne vise pas la parité Java — seule la logique de genèse compte, pas la séquence exacte).

## D7 — Identité & dates

- **Décision** : date de naissance = `année + jour aléatoire dans l'année` (déterministe), stockée en ISO
  (`YYYY-MM-DD`). Âge = `année courante − année de naissance` ; en Feature 1, sans avancement du temps,
  l'année courante = année de naissance ⇒ âge 0 pour tous. **Génération d'affichage** = `floor(année/20)`.
- **Identifiants de personnes** : identifiant **séquentiel déterministe** au sein d'une génération
  (ex. ordre de création), pour éviter tout UUID aléatoire non seedé (Principe I).
- **Noms** : générés depuis des **listes de syllabes/segments** combinées via le PRNG (déterministe).

## D8 — Persistance par fichier (export/import minimal)

- **Décision** : un seul fichier **`kind: "full"`** pour la Feature 1 (paramètres + seed + population),
  **versionné** (`formatVersion`). Import : validation du `kind`/version, sinon **rejet propre** sans
  altérer l'état courant (Principe VI). Téléchargement via `Blob`/lien ; import via `<input type=file>`.
- **Rationale** : suffisant pour ne rien perdre au rechargement ; la déclinaison fine `config|data|full`
  est reportée à une feature ultérieure (cf. spec, Assumptions).
- **Alternatives** : `localStorage` automatique (rejeté : viole Principe VI — pas d'auto-save).

## D9 — Catalogues de traits par défaut

- **Décision** : embarquer les **listes par défaut** des 6 types (issues de `rsrc/ExempleTraits/`) comme
  **données du cœur** (modules TS/JSON intégrés au bundle), chargées au démarrage.
- **Rationale** : disponibilité hors-ligne (Principe III), pas d'I/O réseau (Principe II). `rsrc/` reste la
  référence ; une copie de données est intégrée au build (les fichiers `rsrc/` ne sont pas servis en prod).
- **Alternatives** : fetch des fichiers `rsrc/` au runtime (rejeté : couplage chemin/serveur, offline KO).

## D10 — Déploiement : GitHub Actions → Pages

- **Décision** : workflow `.github/workflows/deploy.yml` : `install → test → build (base=/<repo>/) →
  upload-pages-artifact → deploy-pages`. `main` reste déployable (constitution).
- **Rationale** : automatisation standard, pas de secret applicatif (Principe II).
- **Alternatives** : déploiement manuel de `dist/` (rejeté : non reproductible, error-prone).

## D11 — Données de prénoms (genèse)

- **Décision** : deux listes embarquées `rsrc/ExemplesPrenoms/prenoms_feminins.csv` et
  `rsrc/ExemplesPrenoms/prenoms_masculins.csv` (≈ 1 000 prénoms chacune), **intégrées au bundle comme les
  catalogues** (cf. D9) ; le générateur de noms (T016) y tire un prénom **déterministement** via le `Rng`.
- **Source** : **INSEE — Fichier des prénoms** (`nat2022`, **domaine public / données ouvertes**) ; effectifs
  agrégés par sexe sur 1900–2022, **top 1 000 par sexe**, `_PRENOMS_RARES` exclu, mise en casse propre.
- **Rationale** : données **légales et ouvertes**, disponibles **hors-ligne** (Principe III), aucune I/O
  réseau au runtime (Principe II).
- **Alternatives** : geneanet (rejeté : HTTP 403 sur accès automatisé + CGU restrictives) ; génération
  synthétique de noms (reportée — générateur de prénoms plus poussé prévu pour une version future).

## Points explicitement reportés (hors Feature 1)

- Algorithme **traits→pouvoirs** (constantes D/K), hérédité, mutation faible — Feature 2.
- Avancement du temps, couples, portées, gaussiennes — Feature 3.
- Arbre généalogique, filtres avancés, 3 modes d'affichage — Feature 4.
- Déclinaison `config|data|full` et partage avancé — Feature 6.
