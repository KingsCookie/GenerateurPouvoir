import { describe, it, expect } from 'vitest';
import { buildSublists } from '../../src/core/powers/traitsToPowers.js';
import { createRng } from '../../src/core/rng/rng.js';
import { defaultParameters } from '../../src/core/params/parameters.js';
import type { TraitType } from '../../src/core/model/traitType.js';

// US8 — probabilité de duplication d'un trait secondaire = min(100, résilience · D) % (§6.4.1).
// buildSublists place les principaux (1 sous-liste chacun) puis les secondaires ; un secondaire
// peut être **dupliqué** dans une autre sous-liste avec cette probabilité.

type Ref = { traitId: string; type: TraitType; label: string; resilience: number };

// Deux principaux (Actions) ⇒ 2 sous-listes ; un secondaire (Élément) dupliquable une fois.
function makeActive(resilience: number): Ref[] {
  return [
    { traitId: 'Action:a1', type: 'Action', label: 'a1', resilience: 100 },
    { traitId: 'Action:a2', type: 'Action', label: 'a2', resilience: 100 },
    { traitId: 'Element:e1', type: 'Element', label: 'e1', resilience },
  ];
}

// Fraction de tirages où le secondaire e1 est dupliqué (présent dans les 2 sous-listes).
function duplicationRate(resilience: number, D: number, runs: number): number {
  const params = { ...defaultParameters(), duplicationD: D };
  let dup = 0;
  for (let i = 0; i < runs; i++) {
    const rng = createRng(BigInt(i + 1));
    const sublists = buildSublists(makeActive(resilience), params, rng);
    const occurrences = sublists.filter((sl) => sl.some((t) => t.traitId === 'Element:e1')).length;
    if (occurrences >= 2) dup++;
  }
  return dup / runs;
}

describe('US8 — formule de duplication min(100, résilience·D)', () => {
  it('D = 0 ⇒ aucune duplication', () => {
    expect(duplicationRate(100, 0, 300)).toBe(0);
  });

  it('fréquence ≈ résilience·D % (résilience 50, D 0.25 ⇒ ≈ 12,5 %)', () => {
    const rate = duplicationRate(50, 0.25, 2000); // ≈ 0.125
    expect(rate).toBeGreaterThan(0.09);
    expect(rate).toBeLessThan(0.16);
  });

  it('probabilité plafonnée à 100 % (résilience·D ≥ 100 ⇒ duplication systématique)', () => {
    // 100 · 2 = 200 ⇒ min(100, 200) = 100 % ⇒ toujours dupliqué.
    expect(duplicationRate(100, 2, 300)).toBe(1);
  });
});
