import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng/rng.js';

const SEED = 0x0123456789abcdefn;

describe('RNG déterministe (xoshiro256** / SplitMix64)', () => {
  it('même seed ⇒ même séquence de nextU64', () => {
    const a = createRng(SEED);
    const b = createRng(SEED);
    const seqA = Array.from({ length: 20 }, () => a.nextU64());
    const seqB = Array.from({ length: 20 }, () => b.nextU64());
    expect(seqA).toEqual(seqB);
  });

  it('seeds différentes ⇒ séquences différentes', () => {
    const a = createRng(SEED);
    const b = createRng(SEED + 1n);
    const seqA = Array.from({ length: 20 }, () => a.nextU64());
    const seqB = Array.from({ length: 20 }, () => b.nextU64());
    expect(seqA).not.toEqual(seqB);
  });

  it('nextU64 reste dans la plage 64 bits', () => {
    const r = createRng(SEED);
    for (let i = 0; i < 1000; i++) {
      const v = r.nextU64();
      expect(v >= 0n).toBe(true);
      expect(v < 1n << 64n).toBe(true);
    }
  });

  it('nextFloat ∈ [0, 1)', () => {
    const r = createRng(SEED);
    for (let i = 0; i < 1000; i++) {
      const f = r.nextFloat();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
    }
  });

  it('nextInt(max) ∈ [0, max) et couvre toutes les valeurs (sans biais grossier)', () => {
    const r = createRng(SEED);
    const max = 6;
    const counts = new Array(max).fill(0);
    const n = 60000;
    for (let i = 0; i < n; i++) {
      const v = r.nextInt(max);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(max);
      counts[v]++;
    }
    const expected = n / max;
    for (const c of counts) {
      expect(Math.abs(c - expected) / expected).toBeLessThan(0.1); // ±10 %
    }
  });

  it('nextInt rejette les arguments invalides', () => {
    const r = createRng(SEED);
    expect(() => r.nextInt(0)).toThrow();
    expect(() => r.nextInt(-3)).toThrow();
    expect(() => r.nextInt(2.5)).toThrow();
  });

  it('chance(0) toujours faux, chance(100) toujours vrai', () => {
    const r = createRng(SEED);
    for (let i = 0; i < 1000; i++) {
      expect(r.chance(0)).toBe(false);
      expect(r.chance(100)).toBe(true);
    }
  });

  it('chance(p) approche la proportion p sur grand échantillon', () => {
    const r = createRng(SEED);
    const n = 50000;
    let hits = 0;
    for (let i = 0; i < n; i++) if (r.chance(30)) hits++;
    expect(Math.abs(hits / n - 0.3)).toBeLessThan(0.02);
  });

  it('pick et pickWeighted sont déterministes et valides', () => {
    const items = ['a', 'b', 'c'] as const;
    const r1 = createRng(SEED);
    const r2 = createRng(SEED);
    const s1 = Array.from({ length: 50 }, () => r1.pick(items));
    const s2 = Array.from({ length: 50 }, () => r2.pick(items));
    expect(s1).toEqual(s2);
    for (const v of s1) expect(items).toContain(v);

    const weighted = [
      { k: 'x', w: 0 },
      { k: 'y', w: 10 },
    ];
    const r3 = createRng(SEED);
    for (let i = 0; i < 100; i++) {
      // poids 0 ne doit jamais être tiré
      expect(r3.pickWeighted(weighted, (t) => t.w).k).toBe('y');
    }
  });

  it('pickWeightedOrNull : renvoie null si tous les poids sont nuls (sans exception, FR-052b)', () => {
    const r = createRng(SEED);
    const items = [
      { k: 'a', w: 0 },
      { k: 'b', w: 0 },
    ];
    expect(r.pickWeightedOrNull(items, (t) => t.w)).toBeNull();
  });

  it('pickWeightedOrNull : tire un élément de poids > 0 comme pickWeighted', () => {
    const items = [
      { k: 'x', w: 0 },
      { k: 'y', w: 10 },
    ];
    const r = createRng(SEED);
    for (let i = 0; i < 100; i++) {
      expect(r.pickWeightedOrNull(items, (t) => t.w)?.k).toBe('y');
    }
  });

  it('pickWeightedOrNull : liste vide ⇒ null', () => {
    const r = createRng(SEED);
    expect(r.pickWeightedOrNull([], () => 1)).toBeNull();
  });
});
