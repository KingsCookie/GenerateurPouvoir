import { writable, derived, get } from 'svelte/store';
import {
  createSeed,
  createRng,
  createRngFromState,
  defaultCatalog,
  defaultEspeces,
  defaultParameters,
  generateInitialPopulation,
  reproduce,
  advanceYears as advanceYearsCore,
  kill as killCore,
  serializeState,
  deserializeState,
  FORMAT_VERSION,
  type AppState,
  type Catalog,
  type Couple,
  type Espece,
  type Parameters,
  type Personne,
  type Rng,
} from '../../core/index.js';

export type View = 'parametres' | 'liste' | 'fiche' | 'arbre';

// Catalogue embarqué (données du cœur, non réactif en Feature 1).
const catalog: Catalog = defaultCatalog();

// Seed initiale tirée via le SEUL point d'entropie (createSeed), côté UI (Principe I).
function initialParameters(): Parameters {
  return { ...defaultParameters(), seed: createSeed().toString() };
}

export const parameters = writable<Parameters>(initialParameters());
export const population = writable<Personne[]>([]);
export const currentView = writable<View>('parametres');
export const selectedPersonId = writable<string | null>(null);

// Page dédiée à l'arbre (Feature 4) : individu centre + profondeur réglable (≥ 1, défaut 2,
// sans plafond). État d'interface uniquement (non exporté — Principe VI).
export const treeRootId = writable<string | null>(null);
export const treeDepth = writable<number>(2);

// Simulation temporelle (Feature 3) : année courante + couples actuels.
export const currentYear = writable<number>(0);
export const couples = writable<Couple[]>([]);

// Sélection multiple pour la reproduction (US1). Set d'ids ; l'ordre de reproduction suit
// l'ordre de la population (déterminisme).
export const selectedIds = writable<Set<string>>(new Set());

// Générateur du moteur : on **continue le flux** de la genèse (déterminisme : seed + séquence
// d'actions ⇒ résultat reproductible, Principe I). (Re)créé à chaque génération/import.
let engineRng: Rng = createRng(0n);

// Catalogue d'espèces (paramètres de reproduction). Non éditable dans l'UI en Feature 3
// (édition complète en Feature 5) ; inclus dans l'export/import.
let especesRef: Espece[] = defaultEspeces();

// Individu actuellement sélectionné (US2), dérivé de la population et de l'id sélectionné.
export const selectedPerson = derived(
  [population, selectedPersonId],
  ([$population, $id]) => $population.find((p) => p.id === $id) ?? null,
);

export function getCatalog(): Catalog {
  return catalog;
}

/** Tire une nouvelle seed (entropie volontaire) ; la prochaine génération l'utilise. */
export function regenerateSeed(): void {
  parameters.update((p) => ({ ...p, seed: createSeed().toString() }));
}

/** Met à jour un paramètre nommé. */
export function setParam<K extends keyof Parameters>(key: K, value: Parameters[K]): void {
  parameters.update((p) => ({ ...p, [key]: value }));
}

/** Génère la population déterministe à partir des paramètres courants, puis affiche la liste. */
export function generate(): void {
  const p = get(parameters);
  engineRng = createRng(BigInt(p.seed));
  especesRef = defaultEspeces();
  population.set(generateInitialPopulation(p, catalog, engineRng));
  currentYear.set(p.birthYear);
  couples.set([]);
  selectedIds.set(new Set());
  currentView.set('liste');
}

/** Assemble l'état applicatif courant (pour le cœur ou l'export). */
function snapshot(): AppState {
  return {
    formatVersion: FORMAT_VERSION,
    kind: 'full',
    parameters: get(parameters),
    catalog,
    especes: especesRef,
    population: get(population),
    currentYear: get(currentYear),
    couples: get(couples),
    rngState: engineRng.getState(),
  };
}

/**
 * Avance la simulation de `years` années (≥ 1) via le tick annuel déterministe (Feature 3).
 * Continue le flux `engineRng` ; met à jour population, couples et année courante.
 */
export function advanceYears(years: number): void {
  if (!Number.isFinite(years) || years < 1) return;
  const result = advanceYearsCore(snapshot(), Math.floor(years), engineRng);
  population.set(result.population);
  couples.set(result.couples);
  currentYear.set(result.currentYear);
}

/**
 * Tue manuellement un individu (cause obligatoire, §6.7). Renvoie un message d'erreur si refusé
 * (cause vide), sinon `null`.
 */
export function killPerson(personId: string, cause: string): string | null {
  const res = killCore(snapshot(), personId, cause);
  if (!res.ok) return res.error;
  population.set(res.state.population);
  couples.set(res.state.couples);
  return null;
}

/** Bascule la sélection d'un individu (pour la reproduction). */
export function toggleSelect(id: string): void {
  selectedIds.update((set) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

/** Calcule le prochain id séquentiel `p-NNNNNN` à partir de la population existante. */
function nextChildId(pop: Personne[]): string {
  let max = 0;
  for (const person of pop) {
    const m = /^p-(\d+)$/.exec(person.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `p-${String(max + 1).padStart(6, '0')}`;
}

/**
 * Reproduit les individus sélectionnés (≥ 1) → **un enfant** ajouté à la population, parenté posée
 * des deux côtés (INV-9). Continue le flux déterministe `engineRng`. Renvoie l'id de l'enfant ou null.
 */
export function reproduceSelected(): string | null {
  const ids = get(selectedIds);
  if (ids.size === 0) return null;
  const pop = get(population);
  const p = get(parameters);

  const parents = pop.filter((person) => ids.has(person.id)); // ordre = ordre population
  if (parents.length === 0) return null;

  const childId = nextChildId(pop);
  const child = reproduce(parents, p, catalog, engineRng, { childId, birthYear: p.birthYear });

  const parentIds = new Set(parents.map((x) => x.id));
  const updated = pop.map((person) =>
    parentIds.has(person.id) ? { ...person, enfants: [...person.enfants, childId] } : person,
  );
  population.set([...updated, child]);
  selectedIds.set(new Set());
  return childId;
}

/** Couple actuel contenant un individu, ou null. */
export function coupleOf(personId: string): Couple | null {
  return get(couples).find((c) => c.memberIds.includes(personId)) ?? null;
}

/** Édite le % de reproduction d'un couple (null ⇒ hérité de la gaussienne, FR-011). */
export function setCoupleReproPct(coupleId: string, pct: number | null): void {
  couples.update((list) => list.map((c) => (c.id === coupleId ? { ...c, reproPct: pct } : c)));
}

/** Ouvre la fiche d'un individu (US2). */
export function selectPerson(id: string): void {
  selectedPersonId.set(id);
  currentView.set('fiche');
}

/** Retour à la liste depuis la fiche (conserve la population). */
export function backToList(): void {
  selectedPersonId.set(null);
  currentView.set('liste');
}

/** Ouvre la page dédiée à l'arbre, centrée sur `rootId` (FR-002a/FR-005). */
export function goToArbre(rootId: string): void {
  treeRootId.set(rootId);
  currentView.set('arbre');
}

/** Recentre l'arbre de la page dédiée sur un autre individu (FR-004). */
export function recenterTree(id: string): void {
  treeRootId.set(id);
}

/** Règle la profondeur de la page dédiée (≥ 1, sans plafond). */
export function setTreeDepth(n: number): void {
  if (!Number.isFinite(n)) return;
  treeDepth.set(Math.max(1, Math.floor(n)));
}

/** Quitte la page dédiée vers la fiche de l'individu centré. */
export function arbreToFiche(): void {
  const id = get(treeRootId);
  if (id) selectedPersonId.set(id);
  currentView.set(id ? 'fiche' : 'liste');
}

/** Va à l'écran des paramètres. */
export function goToParametres(): void {
  currentView.set('parametres');
}

// --- Persistance par fichier (US3) — aucune sauvegarde automatique (Principe VI). ---

export const importError = writable<string | null>(null);

/** Construit le JSON de l'état courant (paramètres, catalogue, population, année, couples, état RNG). */
export function buildStateJson(): string {
  return serializeState(snapshot());
}

/**
 * Applique un état importé. En cas d'échec, renseigne `importError` et NE modifie PAS
 * l'état courant (rejet propre, FR-023). Retourne true si l'import a réussi.
 */
export function applyImport(json: string): boolean {
  const res = deserializeState(json);
  if (!res.ok) {
    importError.set(res.error);
    return false;
  }
  importError.set(null);
  parameters.set(res.value.parameters);
  especesRef = res.value.especes;
  population.set(res.value.population);
  currentYear.set(res.value.currentYear);
  couples.set(res.value.couples);
  selectedPersonId.set(null);
  selectedIds.set(new Set());
  // Restitue l'état EXACT du RNG (continuation strictement déterministe après import, FR-021).
  engineRng = createRngFromState(res.value.rngState);
  currentView.set('liste');
  return true;
}
