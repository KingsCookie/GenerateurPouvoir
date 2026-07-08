import { describe, it, expect } from 'vitest';
import { computeGeneration } from '../../src/core/genesis/derived.js';

// US3 — génération d'affichage relative à l'année de la genèse (§6.2).

describe('US3 — computeGeneration relative à la genèse', () => {
  it('génération 0 à l’année de genèse (quelle que soit l’année)', () => {
    expect(computeGeneration(0, 0)).toBe(0);
    expect(computeGeneration(1900, 1900)).toBe(0); // genèse en 1900 → génération 0
    expect(computeGeneration(2500, 2500)).toBe(0);
  });

  it('+1 par tranche de 20 ans après la genèse', () => {
    expect(computeGeneration(1919, 1900)).toBe(0); // [1900, 1919]
    expect(computeGeneration(1920, 1900)).toBe(1); // [1920, 1939]
    expect(computeGeneration(1959, 1900)).toBe(2);
    expect(computeGeneration(1960, 1900)).toBe(3);
  });

  it('valeur négative pour une naissance antérieure à la genèse', () => {
    expect(computeGeneration(1899, 1900)).toBe(-1);
    expect(computeGeneration(1880, 1900)).toBe(-1);
    expect(computeGeneration(1879, 1900)).toBe(-2);
  });
});
