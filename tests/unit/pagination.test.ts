import { describe, it, expect } from 'vitest';
import { paginate } from '../../src/ui/lib/pagination.js';

const items = Array.from({ length: 23 }, (_, i) => i + 1); // 1..23

describe('paginate (helper UI pur)', () => {
  it('tranche selon la taille et la page', () => {
    const r = paginate(items, 1, 10);
    expect(r.pageItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(r.nbPages).toBe(3);
    expect(r.from).toBe(1);
    expect(r.to).toBe(10);
    expect(r.total).toBe(23);
  });

  it('calcule from/to sur la dernière page partielle', () => {
    const r = paginate(items, 3, 10);
    expect(r.pageItems).toEqual([21, 22, 23]);
    expect(r.from).toBe(21);
    expect(r.to).toBe(23);
    expect(r.page).toBe(3);
  });

  it('borne la page au-dessus de nbPages', () => {
    const r = paginate(items, 99, 10);
    expect(r.page).toBe(3);
    expect(r.pageItems).toEqual([21, 22, 23]);
  });

  it('borne la page en dessous de 1', () => {
    const r = paginate(items, 0, 10);
    expect(r.page).toBe(1);
    expect(r.pageItems[0]).toBe(1);
  });

  it("'all' affiche tout sur une seule page", () => {
    const r = paginate(items, 5, 'all');
    expect(r.pageItems).toHaveLength(23);
    expect(r.nbPages).toBe(1);
    expect(r.page).toBe(1);
    expect(r.from).toBe(1);
    expect(r.to).toBe(23);
  });

  it('liste vide : from/to = 0, nbPages = 1', () => {
    const r = paginate([], 1, 50);
    expect(r.pageItems).toEqual([]);
    expect(r.from).toBe(0);
    expect(r.to).toBe(0);
    expect(r.nbPages).toBe(1);
    expect(r.total).toBe(0);
  });

  it('ne mute pas la liste source', () => {
    const src = [1, 2, 3];
    const copy = [...src];
    paginate(src, 1, 2);
    expect(src).toEqual(copy);
  });
});
