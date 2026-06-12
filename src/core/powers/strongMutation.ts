import type { Rng } from '../rng/rng.js';
import type { Catalog, Trait } from '../model/trait.js';
import type { TraitType } from '../model/traitType.js';
import type { Parameters } from '../params/parameters.js';
import { resolveWeight } from '../params/resolveWeight.js';
import type { Pouvoir, PowerTemplate } from '../model/pouvoir.js';
import { POWER_TEMPLATES } from '../model/pouvoir.js';
import { formatPowerLabel } from '../genesis/derived.js';

// Types de traits requis par gabarit (§6.1). L'ordre est significatif (déterminisme +
// libellé lisible). AE = Action + Élément ; PE/PA/PR = Partie du corps + (État/Ajout/Remplacement).
const TEMPLATE_TYPES: Record<PowerTemplate, [TraitType, TraitType]> = {
  AE: ['Action', 'Element'],
  PE: ['PartieCorps', 'Etat'],
  PA: ['PartieCorps', 'Ajout'],
  PR: ['PartieCorps', 'Remplacement'],
};

/**
 * Génère un pouvoir de mutation forte (gabarit pondéré + traits pondérés), ou `null`
 * si un type requis est vide **ou de poids effectif nul** (→ individu sans pouvoir, FR-052b ;
 * les traits déjà inscrits dans l'ADN par l'appelant restent actifs).
 *
 * Poids effectif d'un trait = surcharge ?? poids du type (`resolveWeight`, §9.1). Tirage
 * **tolérant** (`pickWeightedOrNull`) : aucun candidat tirable ⇒ pas de pouvoir, jamais d'exception.
 *
 * Ordre des tirages (fixe, garantit le déterminisme) :
 * gabarit → trait du 1er type → trait du 2e type → puissance → maîtrise.
 */
export function generateStrongMutationPower(
  catalog: Catalog,
  params: Parameters,
  rng: Rng,
): Pouvoir | null {
  const template = rng.pickWeightedOrNull(POWER_TEMPLATES, (t) => params.templateWeights[t] ?? 0);
  if (template === null) return null; // tous les gabarits à poids nul ⇒ aucun pouvoir
  const [typeA, typeB] = TEMPLATE_TYPES[template];

  const listA = catalog.byType[typeA];
  const listB = catalog.byType[typeB];
  if (listA.length === 0 || listB.length === 0) {
    return null;
  }

  const weightOf = (t: Trait): number => resolveWeight(t.id, t.weight, params.traitTypeWeights);
  const traitA = rng.pickWeightedOrNull(listA, weightOf);
  if (traitA === null) return null; // type A à poids effectif nul ⇒ pas de pouvoir (FR-052b)
  const traitB = rng.pickWeightedOrNull(listB, weightOf);
  if (traitB === null) return null; // type B à poids effectif nul ⇒ pas de pouvoir (FR-052b)

  const puissance = rng.nextInt(10) + 1;
  const maitrise = rng.nextInt(10) + 1;

  const traitIds = [traitA.id, traitB.id];
  return {
    id: `pw:${template}:${traitIds.join('+')}`,
    label: formatPowerLabel(template, traitA.label, traitB.label),
    template,
    traitIds,
    puissance,
    maitrise,
  };
}
