import { describe, it, expect } from 'vitest';
import { sortPopulation, type FilterContext } from '../../src/core/genealogy/filter.js';
import type { Personne } from '../../src/core/model/personne.js';

// Tri pur, déterministe (Feature 010). Population construite à la main pour contrôler noms/dates.
const ctx: FilterContext = { currentYear: 100 };

function mk(id: string, nom: string, dateNaissance: string): Personne {
  return {
    id,
    nom,
    especeId: 'humain',
    genreId: 'g-1',
    dateNaissance,
    vivant: true,
    raisonDeces: null,
    parents: [],
    enfants: [],
    conjoints: [],
    adn: { traits: [] },
    pouvoirs: [],
    notes: null,
  };
}

// Ordre « par défaut » = date de naissance puis id (comme filterPopulation).
const base: Personne[] = [
  mk('p2', 'Bruno', '0010-01-01'),
  mk('p1', 'Zoé', '0005-01-01'),
  mk('p3', 'alice', '0020-01-01'),
];
const ids = (pop: { id: string }[]) => pop.map((p) => p.id);

describe('sortPopulation (Feature 010)', () => {
  it('key=null ⇒ ordre reçu préservé (tri par défaut)', () => {
    expect(ids(sortPopulation(base, null, 'asc', ctx))).toEqual(['p2', 'p1', 'p3']);
  });

  it('nom : alphabétique insensible casse/accents (asc puis desc)', () => {
    // « alice » (minuscule) doit passer avant « Bruno » et « Zoé ».
    expect(ids(sortPopulation(base, 'nom', 'asc', ctx))).toEqual(['p3', 'p2', 'p1']);
    expect(ids(sortPopulation(base, 'nom', 'desc', ctx))).toEqual(['p1', 'p2', 'p3']);
  });

  it('naissance : chronologique (asc) puis inverse (desc)', () => {
    expect(ids(sortPopulation(base, 'naissance', 'asc', ctx))).toEqual(['p1', 'p2', 'p3']);
    expect(ids(sortPopulation(base, 'naissance', 'desc', ctx))).toEqual(['p3', 'p2', 'p1']);
  });

  it('age : numérique — croissant = du plus jeune au plus vieux', () => {
    // À currentYear=100 : p3 (né 0020) = 80 ans, p2 (0010) = 90, p1 (0005) = 95.
    expect(ids(sortPopulation(base, 'age', 'asc', ctx))).toEqual(['p3', 'p2', 'p1']);
    expect(ids(sortPopulation(base, 'age', 'desc', ctx))).toEqual(['p1', 'p2', 'p3']);
  });

  it('départage stable et déterministe pour des clés égales', () => {
    // Deux individus nés la même année ⇒ départage par id (byBirthThenId), non inversé.
    const tie = [mk('b', 'Même', '0030-01-01'), mk('a', 'Même', '0030-01-01')];
    // tri par nom (égal) ⇒ ordre stable a avant b (id croissant), en asc comme en desc.
    expect(ids(sortPopulation(tie, 'nom', 'asc', ctx))).toEqual(['a', 'b']);
    expect(ids(sortPopulation(tie, 'nom', 'desc', ctx))).toEqual(['a', 'b']);
  });

  it('pur : ne mute pas le tableau d’entrée', () => {
    const order = ids(base).join(',');
    sortPopulation(base, 'nom', 'asc', ctx);
    expect(ids(base).join(',')).toBe(order);
  });
});
