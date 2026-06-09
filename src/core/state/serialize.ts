import type { Catalog } from '../model/trait.js';
import type { Personne } from '../model/personne.js';
import type { Parameters } from '../params/parameters.js';
import { defaultParameters } from '../params/parameters.js';
import { defaultCatalog } from '../catalog/defaultCatalog.js';

export const FORMAT_VERSION = 1;

export interface AppState {
  formatVersion: number;
  kind: 'full';
  parameters: Parameters;
  catalog: Catalog;
  population: Personne[];
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** État initial vide (population non générée). */
export function createInitialState(params?: Partial<Parameters>): AppState {
  return {
    formatVersion: FORMAT_VERSION,
    kind: 'full',
    parameters: { ...defaultParameters(), ...params },
    catalog: defaultCatalog(),
    population: [],
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

  return { ok: true, value: parsed as unknown as AppState };
}
