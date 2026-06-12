import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng/rng.js';
import { defaultCatalog, defaultEspeces } from '../../src/core/catalog/defaultCatalog.js';
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
  return {
    formatVersion: FORMAT_VERSION,
    kind: 'full',
    parameters,
    catalog,
    especes: defaultEspeces(),
    population,
    currentYear: parameters.birthYear,
    couples: [],
    rngState: createRng(seed).getState(),
  };
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
      rngState: state.rngState,
      population: state.population,
      couples: state.couples,
      especes: state.especes,
      catalog: state.catalog,
      kind: state.kind,
      currentYear: state.currentYear,
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

  it('M1 : import d’un fichier antérieur à la Feature 5 défaute resilienceOverrides', () => {
    const parameters = { ...defaultParameters(), seed: '7', batchSize: 3 };
    // Simule un fichier antérieur : pas de resilienceOverrides dans parameters.
    delete (parameters as Partial<typeof parameters>).resilienceOverrides;
    const catalog = defaultCatalog();
    const population = generateInitialPopulation(
      { ...defaultParameters(), seed: '7', batchSize: 3 },
      catalog,
      createRng(7n),
    );
    const json = JSON.stringify({
      formatVersion: 2,
      kind: 'full',
      parameters,
      catalog,
      population,
    });
    const res = deserializeState(json);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.parameters.resilienceOverrides).toEqual({ byType: {}, byTrait: {} });
    }
  });

  it('M1 : tolère un Trait.weight absent dans le catalogue importé (⇒ null = hérite du type)', () => {
    const parameters = { ...defaultParameters(), seed: '7', batchSize: 0 };
    // Catalogue dont un trait n’a pas de champ weight (fichier antérieur).
    const catalog = {
      byType: {
        Remplacement: [],
        PartieCorps: [],
        Etat: [],
        Element: [{ id: 'Element:feu-0', type: 'Element', label: 'feu' }],
        Ajout: [],
        Action: [],
      },
    };
    const json = JSON.stringify({
      formatVersion: 2,
      kind: 'full',
      parameters,
      catalog,
      population: [],
    });
    const res = deserializeState(json);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.catalog.byType.Element[0].weight).toBeNull();
  });

  it('INV-11 : importe un fichier v1 (sans currentYear/couples/rngState) avec défauts sûrs', () => {
    const parameters = { ...defaultParameters(), seed: '7', batchSize: 5, birthYear: 1990 };
    const catalog = defaultCatalog();
    const population = generateInitialPopulation(parameters, catalog, createRng(7n));
    // Fichier « Feature 1/2 » : formatVersion 1, sans les champs de la Feature 3.
    const v1 = JSON.stringify({ formatVersion: 1, kind: 'full', parameters, catalog, population });
    const res = deserializeState(v1);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.currentYear).toBe(1990); // = birthYear
      expect(res.value.couples).toEqual([]);
      expect(res.value.rngState).toEqual(createRng(7n).getState());
    }
  });
});
