import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng/rng.js';
import { defaultCatalog } from '../../src/core/catalog/defaultCatalog.js';
import { defaultParameters } from '../../src/core/params/parameters.js';
import { generateInitialPopulation } from '../../src/core/genesis/genesis.js';
import {
  serializeState,
  deserializeState,
  createInitialState,
  FORMAT_VERSION,
  type AppState,
} from '../../src/core/state/serialize.js';

function sampleState(seed: bigint): AppState {
  const parameters = {
    ...defaultParameters(),
    seed: seed.toString(),
    batchSize: 25,
    powerChancePct: 50,
  };
  const catalog = defaultCatalog();
  const population = generateInitialPopulation(parameters, catalog, createRng(seed));
  return { formatVersion: FORMAT_VERSION, kind: 'full', parameters, catalog, population };
}

describe('Sérialisation de l’état (US3)', () => {
  it('INV-6 : round-trip serialize → deserialize redonne un état égal', () => {
    const state = sampleState(0xabcdefn);
    const json = serializeState(state);
    const res = deserializeState(json);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toEqual(state);
  });

  it('deux états égaux ⇒ fichier identique (ordre de clés déterministe)', () => {
    const a = serializeState(sampleState(0x1234n));
    const b = serializeState(sampleState(0x1234n));
    expect(a).toBe(b);
  });

  it('la sérialisation est insensible à l’ordre d’insertion des clés', () => {
    const state = createInitialState({ seed: '42' });
    const reordered = {
      population: state.population,
      catalog: state.catalog,
      kind: state.kind,
      parameters: state.parameters,
      formatVersion: state.formatVersion,
    } as AppState;
    expect(serializeState(reordered)).toBe(serializeState(state));
  });

  it('la seed est toujours incluse dans le fichier', () => {
    const json = serializeState(sampleState(0x999n));
    expect(json).toContain('"seed"');
    expect(JSON.parse(json).parameters.seed).toBe(0x999n.toString());
  });

  it('rejette un JSON invalide sans exception', () => {
    const res = deserializeState('{ ceci nest pas du json');
    expect(res.ok).toBe(false);
  });

  it('rejette un kind inconnu', () => {
    const res = deserializeState(JSON.stringify({ kind: 'config', formatVersion: 1 }));
    expect(res.ok).toBe(false);
  });

  it('rejette une version de format trop récente', () => {
    const state = sampleState(0x1n);
    const json = JSON.stringify({ ...state, formatVersion: FORMAT_VERSION + 1 });
    const res = deserializeState(json);
    expect(res.ok).toBe(false);
  });

  it('rejette une structure incomplète', () => {
    const res = deserializeState(JSON.stringify({ kind: 'full', formatVersion: 1 }));
    expect(res.ok).toBe(false);
  });
});
