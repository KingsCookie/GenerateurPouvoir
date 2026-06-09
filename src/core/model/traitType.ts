// Les 6 types de traits fixes (data-model.md). L'ordre est stable et fait foi pour
// la sérialisation déterministe et l'itération des catalogues.
export const TRAIT_TYPES = [
  'Remplacement',
  'PartieCorps',
  'Etat',
  'Element',
  'Ajout',
  'Action',
] as const;

export type TraitType = (typeof TRAIT_TYPES)[number];
