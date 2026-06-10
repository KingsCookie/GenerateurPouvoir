import { describe, it, expect } from 'vitest';
import { reproProbability } from '../../src/core/repro/gaussian.js';
import { defaultEspece } from '../../src/core/catalog/defaultCatalog.js';

const humain = defaultEspece(); // début 16, pic 25, fin 50, pic 60 %, pente 8

describe('Gaussienne de reproduction §9.4 (T014)', () => {
  it('hors de [début, fin] ⇒ probabilité nulle', () => {
    expect(reproProbability(15, humain)).toBe(0);
    expect(reproProbability(51, humain)).toBe(0);
  });

  it('au pic ⇒ probabilité maximale = reproPeakPct', () => {
    expect(reproProbability(25, humain)).toBeCloseTo(60, 6);
  });

  it('décroît de part et d’autre du pic et est symétrique', () => {
    const below = reproProbability(20, humain);
    const above = reproProbability(30, humain);
    expect(below).toBeCloseTo(above, 6); // |25-20| = |25-30|
    expect(below).toBeLessThan(60);
    expect(below).toBeGreaterThan(0);
  });

  it('aux bornes incluses, la probabilité est > 0', () => {
    expect(reproProbability(16, humain)).toBeGreaterThan(0);
    expect(reproProbability(50, humain)).toBeGreaterThan(0);
  });
});
