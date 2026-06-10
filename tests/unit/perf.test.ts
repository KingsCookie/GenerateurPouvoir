import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng/rng.js';
import { defaultCatalog } from '../../src/core/catalog/defaultCatalog.js';
import { defaultParameters } from '../../src/core/params/parameters.js';
import { generateInitialPopulation } from '../../src/core/genesis/genesis.js';
import { reproduce } from '../../src/core/birth/reproduce.js';
import { advanceYears } from '../../src/core/time/tick.js';
import { defaultEspeces } from '../../src/core/catalog/defaultCatalog.js';
import { FORMAT_VERSION, type AppState } from '../../src/core/state/serialize.js';

describe('Performance de la genèse (SC-005)', () => {
  it('génère 1 000 individus en moins de 2 s', () => {
    const params = {
      ...defaultParameters(),
      seed: '123456789',
      batchSize: 1000,
      powerChancePct: 50,
    };
    const catalog = defaultCatalog();

    const start = performance.now();
    const pop = generateInitialPopulation(params, catalog, createRng(BigInt(params.seed)));
    const elapsed = performance.now() - start;

    expect(pop).toHaveLength(1000);
    expect(elapsed).toBeLessThan(2000);
  });
});

describe('Performance du tick annuel (T032 / SC-009)', () => {
  it('avance 1 an sur ~1 000 individus en moins de 1 s', () => {
    const params = { ...defaultParameters(), seed: '987654321', batchSize: 1000, birthYear: 0 };
    const catalog = defaultCatalog();
    // Population d'adultes (âge ≈ 25 à l'année courante 25) pour exercer l'appariement.
    const population = generateInitialPopulation(params, catalog, createRng(BigInt(params.seed)));
    const state: AppState = {
      formatVersion: FORMAT_VERSION,
      kind: 'full',
      parameters: params,
      catalog,
      especes: defaultEspeces(),
      population,
      currentYear: 25,
      couples: [],
      rngState: createRng(BigInt(params.seed)).getState(),
    };

    const start = performance.now();
    const next = advanceYears(state, 1, createRng(0x1n));
    const elapsed = performance.now() - start;

    expect(next.currentYear).toBe(26);
    expect(elapsed).toBeLessThan(1000);
  });
});

describe('Performance de la reproduction (T026)', () => {
  it('une reproduction (un enfant) en moins de 50 ms', () => {
    const params = { ...defaultParameters(), powerChancePct: 100, batchSize: 4, birthYear: 0 };
    const catalog = defaultCatalog();
    const rng = createRng(0xbeefn);
    const parents = generateInitialPopulation(params, catalog, rng).slice(0, 2);

    const start = performance.now();
    reproduce(parents, params, catalog, rng, { childId: 'p-000999', birthYear: 0 });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});
