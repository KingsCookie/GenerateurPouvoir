import { describe, it, expect } from 'vitest';
import {
  resolveResilience,
  setResiliencePatch,
  clearResiliencePatch,
  propagateResilienceType,
  validateResiliencePatch,
} from '../../src/core/params/resolveResilience.js';
import { defaultParameters, type Parameters } from '../../src/core/params/parameters.js';

const FEU = 'Element:feu-0';
const BRULE = 'Action:brule-0';

function base(): Parameters {
  return {
    ...defaultParameters(),
    initialResilience: 50,
    resilienceMax: 95,
    disappearThreshold: 2,
  };
}

describe('resolveResilience — résolution par champ (byTrait → byType → global)', () => {
  it('sans surcharge ⇒ exactement les valeurs globales (INV-P1)', () => {
    expect(resolveResilience(base(), FEU)).toEqual({ initial: 50, max: 95, disappearThreshold: 2 });
  });

  it('surcharge par type appliquée aux traits du type', () => {
    const p = setResiliencePatch(base(), { level: 'type', type: 'Element' }, { max: 80 });
    expect(resolveResilience(p, FEU).max).toBe(80);
    expect(resolveResilience(p, BRULE).max).toBe(95); // autre type inchangé
  });

  it('surcharge par trait prime sur le type (par champ, INV-P2)', () => {
    let p = setResiliencePatch(
      base(),
      { level: 'type', type: 'Element' },
      { max: 80, initial: 30 },
    );
    p = setResiliencePatch(p, { level: 'trait', traitId: FEU }, { initial: 10 });
    const eff = resolveResilience(p, FEU);
    expect(eff.initial).toBe(10); // trait
    expect(eff.max).toBe(80); // hérité du type (non surchargé au niveau trait)
    expect(eff.disappearThreshold).toBe(2); // global
  });

  it('type dérivé du préfixe de l’id même si le trait est absent du catalogue (INV-P3)', () => {
    const p = setResiliencePatch(base(), { level: 'type', type: 'Element' }, { max: 70 });
    expect(resolveResilience(p, 'Element:trait-supprime-999').max).toBe(70);
  });

  it('préfixe inconnu ⇒ niveau type ignoré (retombe sur le global)', () => {
    const p = setResiliencePatch(base(), { level: 'type', type: 'Element' }, { max: 70 });
    expect(resolveResilience(p, 'Inconnu:x-0').max).toBe(95);
  });
});

describe('resolveResilience — helpers d’édition', () => {
  it('le niveau global écrit les valeurs de base', () => {
    const p = setResiliencePatch(base(), { level: 'global' }, { initial: 40, max: 90 });
    expect(p.initialResilience).toBe(40);
    expect(p.resilienceMax).toBe(90);
    expect(p.disappearThreshold).toBe(2);
  });

  it('clearResiliencePatch retire la surcharge (réhéritage)', () => {
    let p = setResiliencePatch(base(), { level: 'trait', traitId: FEU }, { initial: 10 });
    p = clearResiliencePatch(p, { level: 'trait', traitId: FEU });
    expect(resolveResilience(p, FEU).initial).toBe(50);
  });

  it('propagateResilienceType efface les surcharges de trait du type', () => {
    let p = setResiliencePatch(base(), { level: 'trait', traitId: FEU }, { initial: 10 });
    p = setResiliencePatch(p, { level: 'trait', traitId: BRULE }, { initial: 20 });
    p = propagateResilienceType(p, 'Element');
    expect(resolveResilience(p, FEU).initial).toBe(50); // effacé
    expect(resolveResilience(p, BRULE).initial).toBe(20); // autre type conservé
  });

  it('ne mute pas le Parameters d’entrée', () => {
    const p = base();
    setResiliencePatch(p, { level: 'type', type: 'Element' }, { max: 10 });
    expect(p.resilienceOverrides.byType.Element).toBeUndefined();
  });
});

describe('validateResiliencePatch (INV-P4)', () => {
  it('accepte des champs ∈ [0,100]', () => {
    expect(validateResiliencePatch({ initial: 0, max: 100 }).ok).toBe(true);
  });
  it('refuse hors bornes', () => {
    expect(validateResiliencePatch({ initial: -1 }).ok).toBe(false);
    expect(validateResiliencePatch({ max: 101 }).ok).toBe(false);
  });
  it('refuse seuil > max', () => {
    expect(validateResiliencePatch({ max: 50, disappearThreshold: 60 }).ok).toBe(false);
  });
});
