import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng/rng.js';

describe('Rng.shuffle — mélange déterministe (R2 / T003)', () => {
  const items = Array.from({ length: 20 }, (_, i) => i);

  it('même seed ⇒ même permutation', () => {
    const a = createRng(0xabcdef123456n).shuffle(items);
    const b = createRng(0xabcdef123456n).shuffle(items);
    expect(a).toEqual(b);
  });

  it('seeds différentes ⇒ permutations (en général) différentes', () => {
    const a = createRng(1n).shuffle(items);
    const b = createRng(2n).shuffle(items);
    expect(a).not.toEqual(b);
  });

  it('est une permutation : mêmes éléments, même longueur', () => {
    const out = createRng(42n).shuffle(items);
    expect(out.length).toBe(items.length);
    expect([...out].sort((x, y) => x - y)).toEqual(items);
  });

  it('ne mute pas la liste d’entrée (renvoie une copie)', () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];
    const out = createRng(7n).shuffle(input);
    expect(input).toEqual(snapshot);
    expect(out).not.toBe(input);
  });

  it('liste vide ou singleton : renvoie une copie inchangée', () => {
    expect(createRng(1n).shuffle([])).toEqual([]);
    expect(createRng(1n).shuffle(['x'])).toEqual(['x']);
  });
});
