import { describe, it, expect } from 'vitest';
import { resolveWeight } from '../../src/core/params/resolveWeight.js';
import { propagateTypeWeight, setTraitWeight } from '../../src/core/catalog/editCatalog.js';
import { defaultCatalog } from '../../src/core/catalog/defaultCatalog.js';
import type { TraitType } from '../../src/core/model/traitType.js';

const weights = (): Record<TraitType, number> => ({
  Remplacement: 1,
  PartieCorps: 1,
  Etat: 1,
  Element: 3,
  Ajout: 1,
  Action: 1,
});

describe('resolveWeight — héritage type → trait', () => {
  it('sans surcharge ⇒ poids du type', () => {
    expect(resolveWeight('Element:feu-0', null, weights())).toBe(3);
    expect(resolveWeight('Action:brule-0', undefined, weights())).toBe(1);
  });

  it('avec surcharge ⇒ la surcharge prime', () => {
    expect(resolveWeight('Element:feu-0', 9, weights())).toBe(9);
    expect(resolveWeight('Element:feu-0', 0, weights())).toBe(0); // surcharge 0 prime sur type 3
  });

  it('type à poids 0 ⇒ poids effectif nul pour les traits non surchargés', () => {
    const w = { ...weights(), Element: 0 };
    expect(resolveWeight('Element:feu-0', null, w)).toBe(0);
  });

  it('préfixe inconnu ⇒ poids 0 (jamais tiré)', () => {
    expect(resolveWeight('Inconnu:x-0', null, weights())).toBe(0);
  });
});

describe('resolveWeight — interaction avec le catalogue', () => {
  it('« Propager » efface les surcharges ⇒ retour au poids du type', () => {
    let cat = defaultCatalog();
    cat = setTraitWeight(cat, cat.byType.Element[0].id, 99);
    const overridden = cat.byType.Element[0];
    expect(resolveWeight(overridden.id, overridden.weight, weights())).toBe(99);

    cat = propagateTypeWeight(cat, 'Element');
    const reset = cat.byType.Element[0];
    expect(reset.weight).toBeNull();
    expect(resolveWeight(reset.id, reset.weight, weights())).toBe(3);
  });
});
