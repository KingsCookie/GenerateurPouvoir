import type { TraitType } from './traitType.js';

// Unité élémentaire typée. `id` unique par (type, libellé) — un même libellé peut
// exister dans plusieurs types et constitue alors des traits distincts.
export interface Trait {
  id: string;
  type: TraitType;
  label: string;
  weight: number; // poids de tirage (> 0)
}

export interface Catalog {
  byType: Record<TraitType, Trait[]>;
}
