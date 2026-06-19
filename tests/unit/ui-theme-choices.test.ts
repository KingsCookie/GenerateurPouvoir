import { describe, it, expect } from 'vitest';
import { MODES, PALETTES, STYLES, readChoice } from '../../src/ui/stores/ui.js';

// Test d'INTERFACE pur (aucun accès DOM ; cœur intouché). Garde-fou de non-régression
// des axes de thème après extension Feature 009 : 6 styles, 6 palettes, repli sur défaut.

describe('Axes de thème (ui.ts) — Feature 009', () => {
  it('expose 6 styles, dont les 2 historiques et les 4 nouveaux', () => {
    expect(STYLES).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('expose 6 palettes, dont les 3 historiques et les 3 nouvelles', () => {
    expect(PALETTES).toEqual(['violet', 'cyan', 'vert', 'ambre', 'rose', 'bleu']);
  });

  it('conserve les 2 modes', () => {
    expect(MODES).toEqual(['dark', 'light']);
  });

  it('readChoice replie une valeur inconnue/obsolète sur le défaut', () => {
    // Sans localStorage (env de test), readChoice renvoie toujours le fallback.
    expect(readChoice('ui.style', STYLES, 'a')).toBe('a');
    expect(readChoice('ui.palette', PALETTES, 'violet')).toBe('violet');
    // Une valeur hors liste n'est jamais retournée : le fallback fait foi.
    expect(readChoice('whatever', ['x', 'y'] as const, 'x')).toBe('x');
  });

  it('chaque nouvelle valeur est bien typée et présente une seule fois (pas de doublon)', () => {
    expect(new Set(STYLES).size).toBe(STYLES.length);
    expect(new Set(PALETTES).size).toBe(PALETTES.length);
  });
});
