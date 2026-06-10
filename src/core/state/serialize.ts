import type { Catalog } from '../model/trait.js';
import type { Personne } from '../model/personne.js';
import type { Couple } from '../model/couple.js';
import type { Espece } from '../model/espece.js';
import type { Parameters } from '../params/parameters.js';
import { defaultParameters } from '../params/parameters.js';
import { defaultCatalog, defaultEspeces } from '../catalog/defaultCatalog.js';
import { createRng } from '../rng/rng.js';

// v1 (Features 1-2) → v2 (Feature 3 : currentYear, couples, état du RNG). Compatibilité ascendante.
export const FORMAT_VERSION = 2;

export interface AppState {
  formatVersion: number;
  kind: 'full';
  parameters: Parameters;
  catalog: Catalog;
  especes: Espece[]; // catalogue d'espèces (paramètres de reproduction, Feature 3 / §9.4)
  population: Personne[];
  currentYear: number; // année courante (1ᵉʳ janvier), progresse au tick (Feature 3)
  couples: Couple[]; // couples actuels
  rngState: string[]; // état sérialisé du RNG (continuation déterministe, FR-021)
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** État initial vide (population non générée). */
export function createInitialState(params?: Partial<Parameters>): AppState {
  const parameters = { ...defaultParameters(), ...params };
  return {
    formatVersion: FORMAT_VERSION,
    kind: 'full',
    parameters,
    catalog: defaultCatalog(),
    especes: defaultEspeces(),
    population: [],
    currentYear: parameters.birthYear,
    couples: [],
    rngState: createRng(BigInt(parameters.seed)).getState(),
  };
}

// Sérialisation canonique : clés d'objet triées récursivement (ordre stable), ordre des
// tableaux préservé. Deux états égaux ⇒ fichier identique (support de SC-001/INV-1).
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

/** Sérialise l'état en JSON déterministe (kind:"full", formatVersion). */
export function serializeState(state: AppState): string {
  return JSON.stringify(canonicalize(state), null, 2);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Désérialise et valide (kind/version/structure) ; sinon Err sans altérer l'état courant. */
export function deserializeState(json: string): Result<AppState> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Fichier illisible : JSON invalide.' };
  }

  if (!isObject(parsed)) {
    return { ok: false, error: 'Format inattendu : objet d’état attendu.' };
  }
  if (parsed.kind !== 'full') {
    return {
      ok: false,
      error: `Type de fichier non reconnu (kind="${String(parsed.kind)}"). Attendu : "full".`,
    };
  }
  if (typeof parsed.formatVersion !== 'number' || parsed.formatVersion > FORMAT_VERSION) {
    return {
      ok: false,
      error: `Version de format non prise en charge (${String(parsed.formatVersion)} ; max ${FORMAT_VERSION}).`,
    };
  }
  if (
    !isObject(parsed.parameters) ||
    !isObject(parsed.catalog) ||
    !Array.isArray(parsed.population)
  ) {
    return { ok: false, error: 'Structure de l’état incomplète (parameters/catalog/population).' };
  }

  // Compatibilité ascendante (INV-11) : un fichier v1 (sans currentYear/couples/rngState) est
  // accepté en complétant des valeurs par défaut sûres.
  const value = parsed as unknown as AppState;
  const seed = String((value.parameters as Parameters).seed ?? '0');
  if (typeof value.currentYear !== 'number') {
    value.currentYear = (value.parameters as Parameters).birthYear ?? 0;
  }
  if (!Array.isArray(value.couples)) value.couples = [];
  if (!Array.isArray(value.especes) || value.especes.length === 0) {
    value.especes = defaultEspeces();
  }
  if (!Array.isArray(value.rngState) || value.rngState.length !== 4) {
    value.rngState = createRng(BigInt(seed)).getState();
  }

  return { ok: true, value };
}
