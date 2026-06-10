import { describe, it, expect } from 'vitest';
import { litterSize } from '../../src/core/repro/litter.js';
import { defaultEspece } from '../../src/core/catalog/defaultCatalog.js';
import { fakeRng } from './_fakeRng.js';

const humain = defaultEspece(); // M=1, N=4, X=40

describe('Portée §6.6.2 (T015)', () => {
  it('aucun « enfant de plus » ⇒ M enfants', () => {
    expect(litterSize(humain, fakeRng({ chances: [false] }))).toBe(1);
  });

  it('procédure M + X % : succès successifs ajoutent des enfants jusqu’à N', () => {
    // M=1 ; trois succès ⇒ 4 (= N), puis arrêt (plus de tirage).
    expect(litterSize(humain, fakeRng({ chances: [true, true, true] }))).toBe(4);
    // un succès puis échec ⇒ 2.
    expect(litterSize(humain, fakeRng({ chances: [true, false] }))).toBe(2);
  });

  it('toujours borné dans [M, N]', () => {
    // Beaucoup de succès : plafonné à N=4 sans consommer au-delà.
    const n = litterSize(humain, fakeRng({ chances: [true, true, true] }));
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(4);
  });
});
