import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng/rng.js';
import { kill } from '../../src/core/life/death.js';
import { selectCandidates } from '../../src/core/repro/candidates.js';
import {
  defaultCatalog,
  defaultEspece,
  defaultEspeces,
} from '../../src/core/catalog/defaultCatalog.js';
import { defaultParameters } from '../../src/core/params/parameters.js';
import { FORMAT_VERSION, type AppState } from '../../src/core/state/serialize.js';
import type { Personne, Conjoint } from '../../src/core/model/personne.js';
import type { Couple } from '../../src/core/model/couple.js';

function person(id: string, conjoints: Conjoint[] = []): Personne {
  return {
    id,
    nom: id,
    especeId: 'humain',
    genreId: 'masculin',
    dateNaissance: '1980-06-15',
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

function state(population: Personne[], couples: Couple[] = []): AppState {
  return {
    formatVersion: FORMAT_VERSION,
    kind: 'full',
    parameters: defaultParameters(),
    catalog: defaultCatalog(),
    especes: defaultEspeces(),
    population,
    currentYear: 2010,
    couples,
    rngState: createRng(1n).getState(),
    history: [],
  };
}

describe('Mort manuelle §6.7 (T028)', () => {
  it('cause vide ⇒ refus sans mutation', () => {
    const s = state([person('a')]);
    const res = kill(s, 'a', '   ');
    expect(res.ok).toBe(false);
  });

  it('individu introuvable ⇒ refus', () => {
    const res = kill(state([person('a')]), 'zzz', 'accident');
    expect(res.ok).toBe(false);
  });

  it('cause valide ⇒ décédé + raison ; couple dissous (ex-conjoints)', () => {
    const s = state(
      [person('a', [{ id: 'b', statut: 'actuel' }]), person('b', [{ id: 'a', statut: 'actuel' }])],
      [{ id: 'c-000001', memberIds: ['a', 'b'], reproPct: null }],
    );
    const res = kill(s, 'a', 'accident');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const a = res.state.population.find((p) => p.id === 'a')!;
    const b = res.state.population.find((p) => p.id === 'b')!;
    expect(a.vivant).toBe(false);
    expect(a.raisonDeces).toBe('accident');
    expect(res.state.couples).toHaveLength(0);
    expect(b.conjoints.find((c) => c.id === 'a')?.statut).toBe('ex');
  });

  it('INV-8 : un mort n’est jamais candidat à la reproduction', () => {
    const repro = { ...defaultEspece(), reproStartAge: 0, reproEndAge: 100, reproPeakPct: 100 };
    const especeById = new Map([['humain', repro]]);
    const s = state([person('a')]);
    const dead = kill(s, 'a', 'maladie');
    expect(dead.ok).toBe(true);
    if (!dead.ok) return;
    const candidates = selectCandidates(dead.state.population, 2010, especeById, createRng(1n));
    expect(candidates).not.toContain('a');
  });
});
