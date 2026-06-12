import type { TraitType } from '../model/traitType.js';
import { traitTypeOf } from '../model/traitType.js';

/**
 * Poids effectif d'un trait (Feature 5, §9.1) — **héritage type → trait** :
 * `override ?? traitTypeWeights[type]` (résolution `trait ?? type`, **2 niveaux**, pas une
 * multiplication). `override` est la surcharge portée par le trait (`Trait.weight`), `null`/
 * `undefined` ⇒ le trait hérite du poids de son type. Type dérivé du préfixe de l'id (robuste si
 * le trait a été supprimé du catalogue). Type inconnu ⇒ poids 0 (jamais tiré). Pure.
 */
export function resolveWeight(
  traitId: string,
  override: number | null | undefined,
  traitTypeWeights: Record<TraitType, number>,
): number {
  if (override !== null && override !== undefined) return override;
  const type = traitTypeOf(traitId);
  return type ? (traitTypeWeights[type] ?? 0) : 0;
}
