import type { Rng } from '../../src/core/rng/rng.js';

// RNG de test scriptable : files de valeurs déterministes pour piloter exactement les
// algorithmes du cœur (exemples §6.4 / §7.2). `shuffle` est l'**identité** (ordre conservé),
// ce qui permet de reproduire les exemples chiffrés de la spec.
export interface FakeOpts {
  floats?: number[];
  ints?: number[];
  chances?: boolean[];
}

export function fakeRng(opts: FakeOpts = {}): Rng {
  const floats = [...(opts.floats ?? [])];
  const ints = [...(opts.ints ?? [])];
  const chances = [...(opts.chances ?? [])];

  function need<T>(q: T[], name: string): T {
    if (q.length === 0) throw new Error(`fakeRng: file « ${name} » épuisée`);
    return q.shift() as T;
  }

  return {
    nextU64: () => 0n,
    nextFloat: () => need(floats, 'floats'),
    nextInt: () => need(ints, 'ints'),
    chance: () => need(chances, 'chances'),
    pick: <T>(items: readonly T[]) => items[0],
    pickWeighted: <T>(items: readonly T[]) => items[0],
    shuffle: <T>(items: readonly T[]) => items.slice(), // identité
  };
}
