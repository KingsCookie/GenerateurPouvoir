import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/core/rng/rng.js';
import { defaultCatalog } from '../../src/core/catalog/defaultCatalog.js';
import { defaultParameters } from '../../src/core/params/parameters.js';
import { generateStrongMutationPower } from '../../src/core/powers/strongMutation.js';
import { formatPowerLabel, powerLabel } from '../../src/core/genesis/derived.js';
import { POWER_TEMPLATES, type PowerTemplate } from '../../src/core/model/pouvoir.js';

describe('Libellé des pouvoirs par gabarit (FR-024 / BUG-001)', () => {
  it('formatPowerLabel applique les 4 formats avec le bon ordre et les bons connecteurs', () => {
    // labelA = trait du 1er type du gabarit, labelB = 2e type (cf. TEMPLATE_TYPES).
    expect(formatPowerLabel('AE', 'contrôle', 'feu')).toBe('contrôle feu');
    expect(formatPowerLabel('PE', 'Yeux', 'Lumineux')).toBe('Yeux en Lumineux');
    expect(formatPowerLabel('PA', 'Yeux', 'Fourrure')).toBe('Fourrure sur Yeux');
    expect(formatPowerLabel('PR', 'Yeux', 'Pinces de crabe')).toBe(
      'Pinces de crabe à la place de Yeux',
    );
  });

  it('le libellé ne contient jamais le séparateur générique « · »', () => {
    const catalog = defaultCatalog();
    const params = defaultParameters();
    const rng = createRng(0x5eedn);
    for (let i = 0; i < 200; i++) {
      const power = generateStrongMutationPower(catalog, params, rng);
      if (power) expect(power.label).not.toContain('·');
    }
  });

  it('powerLabel (vue) et label stocké coïncident pour chaque gabarit', () => {
    const catalog = defaultCatalog();

    // Force chaque gabarit via des poids ne laissant qu'un seul template possible.
    for (const template of POWER_TEMPLATES) {
      const params = {
        ...defaultParameters(),
        templateWeights: makeSoloWeights(template),
      };
      const rng = createRng(0xb00bn + BigInt(template.length));
      const power = generateStrongMutationPower(catalog, params, rng);
      expect(power).not.toBeNull();
      if (!power) continue;
      expect(power.template).toBe(template);
      // Le libellé stocké doit être identique à celui recalculé par la vue.
      expect(powerLabel(power, catalog)).toBe(power.label);
      // Vérifie le connecteur attendu par gabarit.
      if (template === 'PE') expect(power.label).toContain(' en ');
      if (template === 'PA') expect(power.label).toContain(' sur ');
      if (template === 'PR') expect(power.label).toContain(' à la place de ');
    }
  });
});

function makeSoloWeights(only: PowerTemplate): Record<PowerTemplate, number> {
  const w = {} as Record<PowerTemplate, number>;
  for (const t of POWER_TEMPLATES) w[t] = t === only ? 1 : 0;
  return w;
}
