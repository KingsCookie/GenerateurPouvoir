import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng/rng.js';
import { defaultCatalog } from '../../src/core/catalog/defaultCatalog.js';
import { defaultParameters } from '../../src/core/params/parameters.js';
import { generateInitialPopulation } from '../../src/core/genesis/genesis.js';

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
