import { describe, it, expect } from 'vitest';
import { createRng, createRngFromState } from '../../src/core/rng/rng.js';
import { tick, advanceYears } from '../../src/core/time/tick.js';
import { defaultCatalog, defaultEspece } from '../../src/core/catalog/defaultCatalog.js';
import { defaultParameters, type Parameters } from '../../src/core/params/parameters.js';
import {
  serializeState,
  deserializeState,
  FORMAT_VERSION,
  type AppState,
} from '../../src/core/state/serialize.js';
import type { Personne, Conjoint } from '../../src/core/model/personne.js';
import type { Espece } from '../../src/core/model/espece.js';
import type { Couple } from '../../src/core/model/couple.js';

function espece(over: Partial<Espece> = {}): Espece {
  return { ...defaultEspece(), ...over };
}

function person(id: string, birthYear: number, conjoints: Conjoint[] = []): Personne {
  return {
    id,
    nom: id,
    especeId: 'humain',
    genreId: 'masculin',
    dateNaissance: `${String(birthYear).padStart(4, '0')}-06-15`,
    vivant: true,
    raisonDeces: null,
    parents: [],
    enfants: [],
    conjoints,
    adn: { traits: [] },
    pouvoirs: [],
    notes: null,
  };
}

function makeState(opts: {
  population: Personne[];
  currentYear: number;
  espece: Espece;
  params?: Partial<Parameters>;
  couples?: Couple[];
}): AppState {
  return {
    formatVersion: FORMAT_VERSION,
    kind: 'full',
    parameters: { ...defaultParameters(), ...opts.params },
    catalog: defaultCatalog(),
    especes: [opts.espece],
    population: opts.population,
    currentYear: opts.currentYear,
    genesisYear: 0,
    couples: opts.couples ?? [],
    rngState: createRng(1n).getState(),
    history: [],
  };
}

// Espèce « test » : tout le monde veut se reproduire (pic 100 % sur [0,100]), portée fixe 2, pas de divorce.
const sureRepro = espece({
  reproStartAge: 0,
  reproEndAge: 100,
  reproPeakAge: 30,
  reproPeakPct: 100,
  reproSlope: 100,
  groupSize: 2,
  litterMin: 2,
  litterMax: 2,
  litterExtraPct: 0,
  divorcePct: 0,
});

describe('Tick annuel §6.6 — chemin normal (T013)', () => {
  it('INV-2 : vieillissement + année courante +1', () => {
    const noRepro = espece({ reproPeakPct: 0 });
    const s0 = makeState({ population: [person('a', 1975)], currentYear: 2000, espece: noRepro });
    const s1 = advanceYears(s0, 5, createRng(7n));
    expect(s1.currentYear).toBe(2005);
    // a né en 1975 ⇒ âge 30 en 2005.
    const a = s1.population.find((p) => p.id === 'a')!;
    expect(2005 - 1975).toBe(30);
    expect(a.vivant).toBe(true);
  });

  it('formation de couple + portée dès l’année (nouveau couple), parenté posée (INV-9)', () => {
    const s0 = makeState({
      population: [person('a', 1975), person('b', 1976)],
      currentYear: 2000,
      espece: sureRepro,
    });
    const s1 = tick(s0, createRng(0x1111n));
    // 2 parents + 2 enfants (portée fixe 2).
    expect(s1.population).toHaveLength(4);
    expect(s1.couples).toHaveLength(1);
    const children = s1.population.filter((p) => !['a', 'b'].includes(p.id));
    for (const child of children) {
      expect(new Set(child.parents)).toEqual(new Set(['a', 'b']));
      expect(child.dateNaissance.startsWith('2000-')).toBe(true);
    }
    // Les parents référencent les enfants.
    const a = s1.population.find((p) => p.id === 'a')!;
    expect(a.enfants).toHaveLength(2);
  });

  it('INV-1 : déterminisme — même état + même seed ⇒ population identique', () => {
    const base = () =>
      makeState({
        population: [person('a', 1975), person('b', 1976), person('c', 1977), person('d', 1978)],
        currentYear: 2000,
        espece: sureRepro,
      });
    const a = advanceYears(base(), 3, createRng(0xbeefn));
    const b = advanceYears(base(), 3, createRng(0xbeefn));
    expect(a).toEqual(b);
  });
});

describe('Tick annuel §6.6 — divorces & couples existants (T023 / US2)', () => {
  const couple = (a: string, b: string): Couple => ({
    id: 'c-000001',
    memberIds: [a, b],
    reproPct: null,
  });

  it('INV-7 : divorce 0 % ⇒ aucun divorce ; 100 % ⇒ tous dissous + ex-conjoints', () => {
    const mkCoupleState = (divorcePct: number) =>
      makeState({
        population: [
          person('a', 1975, [{ id: 'b', statut: 'actuel' }]),
          person('b', 1976, [{ id: 'a', statut: 'actuel' }]),
        ],
        currentYear: 2000,
        espece: espece({ reproPeakPct: 0, divorcePct }),
        couples: [couple('a', 'b')],
      });

    const kept = tick(mkCoupleState(0), createRng(1n));
    expect(kept.couples).toHaveLength(1);

    const split = tick(mkCoupleState(100), createRng(1n));
    expect(split.couples).toHaveLength(0);
    const a = split.population.find((p) => p.id === 'a')!;
    expect(a.conjoints.find((c) => c.id === 'b')?.statut).toBe('ex');
  });

  it('couple existant : reproPct=100 ⇒ produit une portée', () => {
    const s0 = makeState({
      population: [
        person('a', 1975, [{ id: 'b', statut: 'actuel' }]),
        person('b', 1976, [{ id: 'a', statut: 'actuel' }]),
      ],
      currentYear: 2000,
      espece: espece({
        reproPeakPct: 0,
        divorcePct: 0,
        litterMin: 1,
        litterMax: 1,
        litterExtraPct: 0,
      }),
      couples: [{ id: 'c-000001', memberIds: ['a', 'b'], reproPct: 100 }],
    });
    const s1 = tick(s0, createRng(0x2222n));
    expect(s1.population.length).toBe(3); // 2 + 1 enfant
  });
});

describe('Continuation déterministe après export/import (INV-10 / FR-021 / T031)', () => {
  it('avancer après import = avancer en continu (état du RNG restitué)', () => {
    const base = makeState({
      population: [person('a', 1975), person('b', 1976), person('c', 1977), person('d', 1978)],
      currentYear: 2000,
      espece: sureRepro,
    });

    // Continu : 3 années d'affilée.
    const full = advanceYears(base, 3, createRngFromState(base.rngState));

    // Coupé : 1 an → export → import → 2 ans (RNG repris de l'état sérialisé).
    const s1 = advanceYears(base, 1, createRngFromState(base.rngState));
    const res = deserializeState(serializeState(s1));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const resumed = advanceYears(res.value, 2, createRngFromState(res.value.rngState));

    expect(resumed.currentYear).toBe(full.currentYear);
    expect(resumed.population).toEqual(full.population);
    expect(resumed.couples).toEqual(full.couples);
  });
});
