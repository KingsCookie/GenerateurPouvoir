import type { Rng } from '../rng/rng.js';
import type { Espece } from '../model/espece.js';

/**
 * Taille d'une portée (§6.6.2, R7) : part de `litterMin` (M) garantis ; puis, tant que `n < litterMax`
 * (N), tire `chance(litterExtraPct)` (X) « un enfant de plus ? » jusqu'à un échec ou jusqu'à N.
 * Résultat ∈ `[M, N]`.
 */
export function litterSize(espece: Espece, rng: Rng): number {
  let n = Math.max(0, espece.litterMin);
  const max = Math.max(n, espece.litterMax);
  while (n < max && rng.chance(espece.litterExtraPct)) n += 1;
  return n;
}
