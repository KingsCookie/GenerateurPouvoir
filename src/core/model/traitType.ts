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

/**
 * Type d'un trait dérivé du **préfixe** de son id (`type:slug-i`). Renvoie `undefined` si le
 * préfixe n'est pas un `TraitType` connu. Robuste même si le trait a été supprimé du catalogue
 * (la résolution résilience/poids par type reste possible — INV-P3).
 */
export function traitTypeOf(traitId: string): TraitType | undefined {
  const prefix = traitId.split(':', 1)[0];
  return (TRAIT_TYPES as readonly string[]).includes(prefix) ? (prefix as TraitType) : undefined;
}
