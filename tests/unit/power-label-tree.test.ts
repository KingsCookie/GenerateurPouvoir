import { describe, it, expect } from 'vitest';
import { powerLabelFromSublist } from '../../src/core/powers/powerLabelTree.js';

// Vérifie que l'arbre §6.4.2 (verbatim) produit exactement les feuilles attendues selon la
// présence des types. Les jetons {Ka}/{Ke}/{Kp}/{Kaj} (types absents) restent **littéraux**
// (la génération K est résolue par derivePowersFromTraits, pas par cette fonction pure).
describe('Arbre de libellé §6.4.2 (T011)', () => {
  it('a & e seuls ⇒ « {a} {e} »', () => {
    expect(powerLabelFromSublist({ a: 'A', e: 'E' })).toBe('A E');
  });

  it('a seul ⇒ feuille « {a} {Ke} » (jeton K littéral)', () => {
    expect(powerLabelFromSublist({ a: 'A' })).toBe('A {Ke}');
  });

  it('p seul ⇒ feuille « {p} {Kaj} »', () => {
    expect(powerLabelFromSublist({ p: 'P' })).toBe('P {Kaj}');
  });

  it('et seul ⇒ feuille « {Kp} {et} »', () => {
    expect(powerLabelFromSublist({ et: 'ET' })).toBe('{Kp} ET');
  });

  it('aj & et (sans a, p, e, r) ⇒ « {aj} {et} sur {Kp} »', () => {
    expect(powerLabelFromSublist({ aj: 'AJ', et: 'ET' })).toBe('AJ ET sur {Kp}');
  });

  it('tous les types présents ⇒ feuille la plus riche', () => {
    expect(powerLabelFromSublist({ a: 'A', e: 'E', p: 'P', aj: 'AJ', r: 'R', et: 'ET' })).toBe(
      'A E avec AJ, ET sur R à la place de P',
    );
  });

  it('p & e (sans a, aj, r, et) ⇒ « {p} en {e} »', () => {
    expect(powerLabelFromSublist({ p: 'P', e: 'E' })).toBe('P en E');
  });

  it('aucun type ⇒ null (feuille terminale de l’arbre)', () => {
    expect(powerLabelFromSublist({})).toBeNull();
  });
});
