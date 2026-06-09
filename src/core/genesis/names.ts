import type { Rng } from '../rng/rng.js';
import femininsRaw from '../../../rsrc/ExemplesPrenoms/prenoms_feminins.csv?raw';
import masculinsRaw from '../../../rsrc/ExemplesPrenoms/prenoms_masculins.csv?raw';

// Listes de prénoms INSEE embarquées au bundle comme les catalogues (D9/D11).
// Un générateur plus poussé (composition, époque, espèce) est prévu pour une version future.
function parseCsv(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.toLowerCase() !== 'prenom');
}

const PRENOMS_FEMININS = parseCsv(femininsRaw);
const PRENOMS_MASCULINS = parseCsv(masculinsRaw);

/**
 * Tire un prénom déterministe selon le genre :
 * - `feminin` → liste féminine, `masculin` → liste masculine ;
 * - `tout` (ou tout autre genre) → l'une des deux listes est tirée, puis un prénom.
 */
export function generateName(rng: Rng, genreId: string): string {
  let list: string[];
  if (genreId === 'feminin') {
    list = PRENOMS_FEMININS;
  } else if (genreId === 'masculin') {
    list = PRENOMS_MASCULINS;
  } else {
    list = rng.nextInt(2) === 0 ? PRENOMS_FEMININS : PRENOMS_MASCULINS;
  }
  return rng.pick(list);
}

/** Exposé pour les tests/diagnostics : tailles des listes embarquées. */
export const NAME_LIST_SIZES = {
  feminins: PRENOMS_FEMININS.length,
  masculins: PRENOMS_MASCULINS.length,
};
