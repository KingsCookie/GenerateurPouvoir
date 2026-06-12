import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng/rng.js';
import { defaultCatalog } from '../../src/core/catalog/defaultCatalog.js';
import { defaultParameters, type Parameters } from '../../src/core/params/parameters.js';
import { generateInitialPopulation } from '../../src/core/genesis/genesis.js';
import { computeAge, computeGeneration } from '../../src/core/genesis/derived.js';
import { resolveResilience, setResiliencePatch } from '../../src/core/params/resolveResilience.js';

const SEED = 0xc0ffee1234567890n;

function params(over: Partial<Parameters> = {}): Parameters {
  return { ...defaultParameters(), seed: SEED.toString(), batchSize: 50, ...over };
}

function generate(p: Parameters) {
  return generateInitialPopulation(p, defaultCatalog(), createRng(BigInt(p.seed)));
}

describe('Genèse — invariants (data-model INV-1..7)', () => {
  it('INV-1 : même (seed, params, catalog) ⇒ population strictement identique', () => {
    const p = params({ powerChancePct: 50 });
    expect(generate(p)).toEqual(generate(p));
  });

  it('seeds différentes ⇒ populations différentes', () => {
    const a = generate(params({ powerChancePct: 50 }));
    const b = generate(params({ powerChancePct: 50, seed: (SEED + 1n).toString() }));
    expect(a).not.toEqual(b);
  });

  it('INV-3 : 0 % ⇒ aucun pouvoir', () => {
    const pop = generate(params({ powerChancePct: 0, batchSize: 200 }));
    expect(pop.every((x) => x.pouvoirs.length === 0)).toBe(true);
  });

  it('INV-3 : 100 % ⇒ exactement un pouvoir par individu (catalogue complet)', () => {
    const pop = generate(params({ powerChancePct: 100, batchSize: 200 }));
    expect(pop.every((x) => x.pouvoirs.length === 1)).toBe(true);
  });

  it('INV-2 / SC-004 : puissance & maîtrise entières ∈ [1,10]', () => {
    const pop = generate(params({ powerChancePct: 100, batchSize: 500 }));
    for (const x of pop) {
      for (const pw of x.pouvoirs) {
        expect(Number.isInteger(pw.puissance)).toBe(true);
        expect(Number.isInteger(pw.maitrise)).toBe(true);
        expect(pw.puissance).toBeGreaterThanOrEqual(1);
        expect(pw.puissance).toBeLessThanOrEqual(10);
        expect(pw.maitrise).toBeGreaterThanOrEqual(1);
        expect(pw.maitrise).toBeLessThanOrEqual(10);
      }
    }
  });

  it('INV-4 : individu sans pouvoir ⇒ ADN et pouvoirs vides', () => {
    const pop = generate(params({ powerChancePct: 40, batchSize: 300 }));
    for (const x of pop) {
      if (x.pouvoirs.length === 0) {
        expect(x.adn.traits).toEqual([]);
      } else {
        expect(x.adn.traits.length).toBeGreaterThan(0);
        // INV-5 : tout traitId du pouvoir est présent dans l'ADN actif.
        const adnIds = new Set(x.adn.traits.map((t) => t.traitId));
        for (const id of x.pouvoirs[0].traitIds) expect(adnIds.has(id)).toBe(true);
        expect(x.adn.traits.every((t) => t.active)).toBe(true);
      }
    }
  });

  it('INV-7 : tous nés dans birthYear, âge 0', () => {
    const birthYear = 0;
    const pop = generate(params({ birthYear, batchSize: 100 }));
    for (const x of pop) {
      expect(x.dateNaissance.startsWith('0000-')).toBe(true);
      expect(computeAge(birthYear, birthYear)).toBe(0);
    }
  });

  it('effectif nul ⇒ population vide sans erreur', () => {
    expect(generate(params({ batchSize: 0 }))).toEqual([]);
  });

  it('génération d’affichage = tranche de 20 ans', () => {
    expect(computeGeneration(0)).toBe(0);
    expect(computeGeneration(19)).toBe(0);
    expect(computeGeneration(20)).toBe(1);
    expect(computeGeneration(45)).toBe(2);
  });

  it('SC-003 : sur ≥ 1000, proportion de pouvoirs à moins de 5 points du % configuré', () => {
    for (const pct of [10, 30, 70]) {
      const pop = generate(params({ powerChancePct: pct, batchSize: 2000 }));
      const withPower = pop.filter((x) => x.pouvoirs.length === 1).length;
      const proportion = (withPower / pop.length) * 100;
      expect(Math.abs(proportion - pct)).toBeLessThan(5);
    }
  });

  it('§9.2 : résilience initiale EFFECTIVE appliquée aux traits du pouvoir de genèse', () => {
    let p = params({ powerChancePct: 100, batchSize: 100, initialResilience: 50 });
    p = setResiliencePatch(p, { level: 'type', type: 'Element' }, { initial: 20 });
    const pop = generate(p);
    let sawElement = false;
    for (const x of pop) {
      for (const t of x.adn.traits) {
        const eff = resolveResilience(p, t.traitId);
        expect(t.resilience).toBe(Math.min(eff.initial, eff.max));
        if (t.traitId.startsWith('Element:')) {
          sawElement = true;
          expect(t.resilience).toBe(20);
        }
      }
    }
    expect(sawElement).toBe(true); // garantit que le cas Élément a bien été couvert
  });

  it('ids séquentiels déterministes et noms non vides', () => {
    const pop = generate(params({ batchSize: 5 }));
    expect(pop.map((x) => x.id)).toEqual([
      'p-000001',
      'p-000002',
      'p-000003',
      'p-000004',
      'p-000005',
    ]);
    expect(pop.every((x) => x.nom.length > 0)).toBe(true);
  });
});
