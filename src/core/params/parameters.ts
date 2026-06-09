import type { TraitType } from '../model/traitType.js';
import { TRAIT_TYPES } from '../model/traitType.js';
import type { PowerTemplate } from '../model/pouvoir.js';

// Tous les comportements chiffrés sont exposés ici et exportés avec l'état (Principe VII).
export interface Parameters {
  seed: string; // BigInt 64 bits en décimal (source unique d'aléatoire, éditable)
  batchSize: number; // effectif du batch initial (≥ 0)
  birthYear: number; // année de naissance du batch
  powerChancePct: number; // [0..100] chance qu'un individu ait un pouvoir
  initialResilience: number; // résilience initiale des traits d'un pouvoir de genèse [0..100]
  traitTypeWeights: Record<TraitType, number>;
  templateWeights: Record<PowerTemplate, number>;
}

function defaultTraitTypeWeights(): Record<TraitType, number> {
  const w = {} as Record<TraitType, number>;
  for (const t of TRAIT_TYPES) w[t] = 1;
  return w;
}

/**
 * Valeurs par défaut. La `seed` vaut "0" ici (cœur pur, sans entropie) ; l'UI tire une
 * vraie seed via `createSeed()` au démarrage (seul point d'entropie, Principe I).
 */
export function defaultParameters(): Parameters {
  return {
    seed: '0',
    batchSize: 100,
    birthYear: 0,
    powerChancePct: 0,
    initialResilience: 50,
    traitTypeWeights: defaultTraitTypeWeights(),
    // AE majoritaire (i ∈ {0,1,2} dans le gabarit §6.1) → poids 3, les autres 1.
    templateWeights: { AE: 3, PE: 1, PA: 1, PR: 1 },
  };
}
