# Contrats — UI Feature 008 (Refonte)

Refonte **présentation seulement**. Il n'y a **pas** d'API métier nouvelle (le cœur `src/core` est
inchangé). Les « contrats » ci-dessous sont : (1) le **contrat de thème** (attributs + tokens), (2) le
**contrat du store d'interface** `ui.ts`, (3) le **contrat de non-régression fonctionnelle** (mapping
`DefUi.md`).

## 1. Contrat de thème (attributs sur `<html>` + tokens)

```text
<html data-mode="dark|light" data-palette="violet|cyan|vert" data-style="a|b">
```

- **Défauts** (aucune préférence) : `data-mode="dark"`, `data-palette="violet"`, `data-style="a"`.
- Les **tokens** sont définis dans `src/app.css` (déjà fusionné depuis `tokens.css`) et **dérivés** via
  `color-mix()`. Tout composant DOIT consommer **exclusivement** les variables de rôle (jamais de couleur
  en dur) : `--bg`, `--bg-elev`, `--fg`, `--fg-muted`, `--fg-faint`, `--border`, `--row-border`,
  `--hover-bg`, `--danger`, `--accent`, `--accent-fg`, `--accent-text`, `--chip-bg`, `--chip-border`,
  `--chip-text`, `--tint-bg`, `--year-shadow`, `--font`, `--mono`, `--radius`, `--radius-sm`,
  `--chip-radius`, `--logo-radius`, `--label-transform`, `--btn-transform`, `--btn-spacing`.
- **État actif de nav** : classe `.nav-item.is-active` (style A = chip ; style B = aplat d'accent — déjà
  dans `app.css`).
- **Application** : le store `ui.ts` pose/maj les 3 attributs sur `document.documentElement` ; un **script
  anti-FOUC** dans `index.html` les pose avant le 1er rendu d'après `localStorage`.

## 2. Contrat du store d'interface (`src/ui/stores/ui.ts`)

> Stores Svelte + fonctions setters. **Aucune** de ces valeurs n'entre dans `AppState`/export.

```ts
// --- Apparence (persistée localStorage) ---
mode:    Writable<'dark'|'light'>          // défaut 'dark'
palette: Writable<'violet'|'cyan'|'vert'>  // défaut 'violet'
style:   Writable<'a'|'b'>                  // défaut 'a'
traitMode: Writable<1|2|3>                  // existant, défaut 3
setMode(m) / toggleMode() / setPalette(p) / setStyle(s)   // posent les attributs + persistent

// --- Pagination (session) ---
listePageSize: Writable<50|100|250|1000|'all'>  // défaut 50
listePage:     Writable<number>                  // 1-based
sbPageSize / sbPage                              // idem pour la sandbox
setListePageSize(n) // remet listePage = 1   ;   setSbPageSize(n) // remet sbPage = 1

// --- Sandbox onglet (session) ---
sbTab: Writable<'population'|'couples'>          // défaut 'population'

// --- Vue d'arbre (session) ---
arbreScale / arbreTx / arbreTy : Writable<number>
arbreRootId: Writable<string|null>  ;  arbreDepth: Writable<number>  // >=1

// --- Chrome (session) ---
showScrollTop: Writable<boolean>                 // vrai si scrollY > ~300
```

**Contrats** :
- `toggleMode()` bascule `dark`⇄`light`, applique l'attribut et persiste (reflété **< 1 s**, sans
  rechargement — SC-004).
- `setMode/Palette/Style` appliquent **immédiatement** l'attribut correspondant et persistent.
- Au démarrage : hydrater depuis `localStorage` ; si absent/illisible ⇒ défauts (l'app fonctionne sans
  `localStorage`).
- `setListePageSize`/`setSbPageSize` remettent la page à **1** (INV-UI4).
- Aucune fonction d'interface ne modifie `appState`/`sandboxStore` (logique).

## 3. View-models purs (`src/ui/lib`)

```ts
// ficheViewModel.ts (extensions PURES, testables)
// Enfants de l'individu (résolution id -> nom dans la population courante)
buildFicheView(...)        // gagne : enfants: { id: string; nom: string }[]
// Type de chaque trait affiché
traitTypeOf(traitId)       // déjà au cœur : 'Remplacement'|'PartieCorps'|'Etat'|'Element'|'Ajout'|'Action'|undefined

// Pagination (helper pur)
paginate(items: T[], page: number, size: number | 'all'): { pageItems: T[]; page: number; nbPages: number; from: number; to: number; total: number }
```

**Contrats** : fonctions **pures** (aucune mutation, aucun accès DOM) ; `paginate` borne `page` à
`[1, nbPages]` et gère `'all'`.

## 4. Contrat de non-régression fonctionnelle (`DefUi.md`)

La refonte DOIT préserver **100 %** des fonctionnalités de `rsrc/DefUi.md` (SC-001). Mapping de contrôle
(check-list à dérouler en `quickstart.md`) :

| DefUi.md | Doit rester disponible après refonte |
|----------|--------------------------------------|
| §3 Navigation | En-tête (Paramètres/Population/Sandbox, conditions d'activation), barre I/O, retour Fiche/Arbre |
| §4.1 Temps | Année courante + avancer de N |
| §4.2 Import/export | 3 exports + import auto-détecté + rétro-compat + erreurs |
| §4.3 Filtres | Tous critères + défaut « dernière génération » + réinitialiser |
| §4.4 Modes traits | 1/2/3, défaut 3 |
| §4.5 Arbre | zoom/pan/pincement, clic, légende, profondeurs |
| §5 Paramètres | Toutes sections (génération, hérédité, population, espèces+gaussienne, catalogues, pondérations, résilience) + Générer |
| §6 Liste | Tableau, lignes cliquables, états vides |
| §7 Fiche | Infos, cycle de vie (conjoints, % repro, tuer), traits/pouvoirs par mode |
| §8 Sandbox | make it real/reset/quitter, lentille, repro manuelle, CRUD, couples, filtres |
| §11 Backlog UI | Pied de page version, bouton remonter, pagination, fratries arbre, **liste enfants**, **type de trait** |

**Règle** : aucun item ne doit disparaître ; les ajouts (thème, pagination, onglets, enrichissements Fiche)
**complètent** sans retirer.
