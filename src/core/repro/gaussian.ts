import type { Espece } from '../model/espece.js';

/**
 * Probabilité (%) de **vouloir se reproduire** à un âge donné (§9.4, R3) — pure et déterministe.
 * Cloche tronquée à la fenêtre [début, fin] : 0 en dehors, maximum `reproPeakPct` à l'âge du pic.
 *
 * `p(a) = reproPeakPct × exp(−((a − pic)²) / (2 × pente²))` pour `a ∈ [début, fin]`, sinon 0.
 */
export function reproProbability(age: number, espece: Espece): number {
  if (age < espece.reproStartAge || age > espece.reproEndAge) return 0;
  const sigma = espece.reproSlope > 0 ? espece.reproSlope : 1e-9;
  const d = age - espece.reproPeakAge;
  return espece.reproPeakPct * Math.exp(-(d * d) / (2 * sigma * sigma));
}
