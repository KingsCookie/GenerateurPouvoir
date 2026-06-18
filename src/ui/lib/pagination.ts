// Helper de pagination PUR (aucune dépendance Svelte/DOM) — testable en isolation.
// Tranche une liste déjà filtrée selon (page, size) ; ne modifie jamais la liste source (INV-UI4).

export type PageSizeArg = number | 'all';

export interface PageResult<T> {
  pageItems: T[];
  /** Page effective, bornée à [1, nbPages]. */
  page: number;
  nbPages: number;
  /** Index 1-based du premier élément affiché (0 si vide). */
  from: number;
  /** Index 1-based du dernier élément affiché (0 si vide). */
  to: number;
  total: number;
}

/**
 * Pagine `items`. `size === 'all'` (ou ≤ 0) affiche tout. `page` est borné à `[1, nbPages]`.
 * Pur : renvoie une nouvelle liste tranchée, sans muter l'entrée.
 */
export function paginate<T>(items: readonly T[], page: number, size: PageSizeArg): PageResult<T> {
  const total = items.length;

  if (size === 'all' || typeof size !== 'number' || size <= 0) {
    return {
      pageItems: items.slice(),
      page: 1,
      nbPages: 1,
      from: total === 0 ? 0 : 1,
      to: total,
      total,
    };
  }

  const nbPages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), nbPages);
  const startIdx = (safePage - 1) * size;
  const pageItems = items.slice(startIdx, startIdx + size);

  return {
    pageItems,
    page: safePage,
    nbPages,
    from: total === 0 ? 0 : startIdx + 1,
    to: startIdx + pageItems.length,
    total,
  };
}
