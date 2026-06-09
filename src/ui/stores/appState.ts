import { writable, derived, get } from 'svelte/store';
import {
  createSeed,
  createRng,
  defaultCatalog,
  defaultParameters,
  generateInitialPopulation,
  reproduce,
  serializeState,
  deserializeState,
  FORMAT_VERSION,
  type AppState,
  type Catalog,
  type Parameters,
  type Personne,
  type Rng,
} from '../../core/index.js';

export type View = 'parametres' | 'liste' | 'fiche';

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

// Sélection multiple pour la reproduction (US1). Set d'ids ; l'ordre de reproduction suit
// l'ordre de la population (déterminisme).
export const selectedIds = writable<Set<string>>(new Set());

// Générateur du moteur : on **continue le flux** de la genèse (déterminisme : seed + séquence
// d'actions ⇒ résultat reproductible, Principe I). (Re)créé à chaque génération/import.
let engineRng: Rng = createRng(0n);

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
  population.set(generateInitialPopulation(p, catalog, engineRng));
  selectedIds.set(new Set());
  currentView.set('liste');
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

/** Va à l'écran des paramètres. */
export function goToParametres(): void {
  currentView.set('parametres');
}

// --- Persistance par fichier (US3) — aucune sauvegarde automatique (Principe VI). ---

export const importError = writable<string | null>(null);

/** Construit le JSON de l'état courant (paramètres + seed + catalogue + population). */
export function buildStateJson(): string {
  const state: AppState = {
    formatVersion: FORMAT_VERSION,
    kind: 'full',
    parameters: get(parameters),
    catalog,
    population: get(population),
  };
  return serializeState(state);
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
  population.set(res.value.population);
  selectedPersonId.set(null);
  selectedIds.set(new Set());
  // Réamorce le moteur depuis la seed importée (reproductions déterministes post-import).
  engineRng = createRng(BigInt(res.value.parameters.seed));
  currentView.set('liste');
  return true;
}
