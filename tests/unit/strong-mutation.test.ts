import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng/rng.js';
import { generateStrongMutationPower } from '../../src/core/powers/strongMutation.js';
import { derivePowersFromTraits } from '../../src/core/powers/traitsToPowers.js';
import { defaultParameters, type Parameters } from '../../src/core/params/parameters.js';
import type { Catalog } from '../../src/core/model/trait.js';
import type { ADN } from '../../src/core/model/adn.js';

const SEED = 0xabcdef12n;

function smallCatalog(): Catalog {
  return {
    byType: {
      Remplacement: [],
      PartieCorps: [],
      Etat: [],
      Element: [{ id: 'Element:feu-0', type: 'Element', label: 'feu', weight: null }],
      Ajout: [],
      Action: [{ id: 'Action:brule-0', type: 'Action', label: 'brûle', weight: null }],
    },
  };
}

// Force le gabarit AE (seul poids > 0).
function paramsAEOnly(overrides: Partial<Parameters> = {}): Parameters {
  return {
    ...defaultParameters(),
    powerChancePct: 100,
    templateWeights: { AE: 1, PE: 0, PA: 0, PR: 0 },
    ...overrides,
  };
}

describe('generateStrongMutationPower — tolérance aux poids nuls (FR-052b)', () => {
  it('type « Élément » à poids effectif nul ⇒ pouvoir = null, sans exception', () => {
    const p = paramsAEOnly({
      traitTypeWeights: {
        Remplacement: 1,
        PartieCorps: 1,
        Etat: 1,
        Element: 0,
        Ajout: 1,
        Action: 1,
      },
    });
    const power = generateStrongMutationPower(smallCatalog(), p, createRng(SEED));
    expect(power).toBeNull();
  });

  it('contrôle positif : poids normaux ⇒ un pouvoir AE est produit', () => {
    const power = generateStrongMutationPower(smallCatalog(), paramsAEOnly(), createRng(SEED));
    expect(power).not.toBeNull();
    expect(power?.template).toBe('AE');
  });
});

describe('derivePowersFromTraits — type à 0 : pas de pouvoir mais traits déjà tirés actifs (FR-052b)', () => {
  it('Action active + Élément (généré K) à poids nul ⇒ aucun pouvoir, Action reste active', () => {
    const p = paramsAEOnly({
      generationK: 100, // la génération K est tentée à coup sûr
      traitTypeWeights: {
        Remplacement: 1,
        PartieCorps: 1,
        Etat: 1,
        Element: 0,
        Ajout: 1,
        Action: 1,
      },
    });
    const adn: ADN = { traits: [{ traitId: 'Action:brule-0', active: true, resilience: 50 }] };

    const res = derivePowersFromTraits(adn, smallCatalog(), p, createRng(SEED));

    // La sous-liste « {a} {Ke} » ne peut pas générer d'Élément (poids 0) ⇒ aucun pouvoir.
    expect(res.pouvoirs).toEqual([]);
    // Le trait Action déjà tiré reste actif dans l'ADN.
    const action = res.adn.traits.find((t) => t.traitId === 'Action:brule-0');
    expect(action).toMatchObject({ active: true });
  });

  it('contrôle positif : Élément à poids normal ⇒ un pouvoir est produit', () => {
    const p = paramsAEOnly({ generationK: 100 });
    const adn: ADN = { traits: [{ traitId: 'Action:brule-0', active: true, resilience: 50 }] };
    const res = derivePowersFromTraits(adn, smallCatalog(), p, createRng(SEED));
    expect(res.pouvoirs.length).toBe(1);
  });
});
