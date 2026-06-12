import type { TraitType } from './traitType.js';

// Unité élémentaire typée. `id` unique par (type, libellé) — un même libellé peut
// exister dans plusieurs types et constitue alors des traits distincts.
export interface Trait {
  id: string;
  type: TraitType;
  label: string;
  // Poids de tirage — **surcharge optionnelle** (Feature 5) : `null` (ou absent) ⇒ le trait
  // hérite du poids de son type (`traitTypeWeights[type]`). Poids effectif résolu par
  // `resolveWeight(id, weight, traitTypeWeights)` = `weight ?? traitTypeWeights[type]`.
  weight: number | null;
}

export interface Catalog {
  byType: Record<TraitType, Trait[]>;
}
