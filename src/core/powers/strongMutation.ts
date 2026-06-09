import type { Rng } from '../rng/rng.js';
import type { Catalog, Trait } from '../model/trait.js';
import type { TraitType } from '../model/traitType.js';
import type { Parameters } from '../params/parameters.js';
import type { Pouvoir, PowerTemplate } from '../model/pouvoir.js';
import { POWER_TEMPLATES } from '../model/pouvoir.js';

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
 * si un type requis est vide dans le catalogue (→ individu sans pouvoir, cf. Edge Cases).
 *
 * Ordre des tirages (fixe, garantit le déterminisme) :
 * gabarit → trait du 1er type → trait du 2e type → puissance → maîtrise.
 */
export function generateStrongMutationPower(
  catalog: Catalog,
  params: Parameters,
  rng: Rng,
): Pouvoir | null {
  const template = rng.pickWeighted(POWER_TEMPLATES, (t) => params.templateWeights[t] ?? 0);
  const [typeA, typeB] = TEMPLATE_TYPES[template];

  const listA = catalog.byType[typeA];
  const listB = catalog.byType[typeB];
  if (listA.length === 0 || listB.length === 0) {
    return null;
  }

  const traitA = rng.pickWeighted(listA, (t: Trait) => t.weight);
  const traitB = rng.pickWeighted(listB, (t: Trait) => t.weight);

  const puissance = rng.nextInt(10) + 1;
  const maitrise = rng.nextInt(10) + 1;

  const traitIds = [traitA.id, traitB.id];
  return {
    id: `pw:${template}:${traitIds.join('+')}`,
    label: `${traitA.label} ${traitB.label}`,
    template,
    traitIds,
    puissance,
    maitrise,
  };
}
