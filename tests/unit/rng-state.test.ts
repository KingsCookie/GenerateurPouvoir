import { describe, it, expect } from 'vitest';
import { createRng, createRngFromState } from '../../src/core/rng/rng.js';

describe('Rng — sérialisation d’état (FR-021 / T002)', () => {
  it('createRngFromState(getState()) reproduit la même suite', () => {
    const a = createRng(0xabcdef123456n);
    // Consomme un peu d'aléatoire pour décaler l'état.
    for (let i = 0; i < 7; i++) a.nextU64();

    const snapshot = a.getState();
    const b = createRngFromState(snapshot);

    const suiteA = Array.from({ length: 10 }, () => a.nextU64().toString());
    const suiteB = Array.from({ length: 10 }, () => b.nextU64().toString());
    expect(suiteB).toEqual(suiteA);
  });

  it('getState ne consomme pas d’aléatoire', () => {
    const r = createRng(42n);
    const before = r.getState();
    const after = r.getState();
    expect(after).toEqual(before);
    // Le prochain tirage est inchangé qu'on ait appelé getState ou non.
    const next = createRngFromState(before).nextU64();
    expect(r.nextU64()).toBe(next);
  });

  it('getState renvoie 4 mots ; un état invalide est rejeté', () => {
    expect(createRng(1n).getState()).toHaveLength(4);
    expect(() => createRngFromState(['1', '2', '3'])).toThrow();
  });
});
