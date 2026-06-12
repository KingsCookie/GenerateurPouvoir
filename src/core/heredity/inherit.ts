import type { Rng } from '../rng/rng.js';
import type { Parameters } from '../params/parameters.js';
import { resolveResilience } from '../params/resolveResilience.js';
import type { Personne } from '../model/personne.js';
import type { ADN, ResilientTrait } from '../model/adn.js';

// Un parent porteur d'un trait : sa résilience pour ce trait (qu'il l'ait actif ou inactif, §4.3).
interface Carrier {
  resilience: number;
}

/**
 * Hérédité de résilience (§4). L'enfant hérite de **tous** les traits de tous les parents ;
 * pour chaque trait on tire, parent porteur par parent porteur, actif/inactif selon la
 * résilience de ce parent, puis on agrège (§4.2). Bonus/malus **additif** (clarification).
 *
 * Déterminisme (Principe I) : les traits sont parcourus dans un **ordre stable** (clé triée),
 * et pour chaque trait les parents porteurs dans l'**ordre fourni**. L'aléatoire passe par `rng`.
 */
export function inheritADN(parents: Personne[], params: Parameters, rng: Rng): ADN {
  // Union des traits portés (actifs ou inactifs), regroupés par traitId en conservant
  // l'ordre des parents fournis pour chaque porteur.
  const carriersByTrait = new Map<string, Carrier[]>();
  for (const parent of parents) {
    for (const t of parent.adn.traits) {
      const list = carriersByTrait.get(t.traitId) ?? [];
      list.push({ resilience: t.resilience });
      carriersByTrait.set(t.traitId, list);
    }
  }

  const traits: ResilientTrait[] = [];
  const traitIds = [...carriersByTrait.keys()].sort();

  for (const traitId of traitIds) {
    const carriers = carriersByTrait.get(traitId)!;

    // Tirage individuel par parent porteur (ordre stable des parents).
    const draws = carriers.map((c) => rng.chance(c.resilience));
    const nbActifs = draws.filter(Boolean).length;
    const maxResilience = Math.max(...carriers.map((c) => c.resilience));

    let active: boolean;
    let resilience: number;
    let bonusFactor = 0; // nombre de fois où le bonus s'applique (0 ⇒ malus)

    if (carriers.length === 1) {
      // Cas 1 — un seul porteur.
      active = draws[0];
      resilience = carriers[0].resilience;
      bonusFactor = active ? 1 : 0;
    } else {
      // Cas 2 — plusieurs porteurs : on regarde le résultat des tirages.
      if (nbActifs === 0) {
        active = false;
        resilience = maxResilience;
      } else if (nbActifs === 1) {
        active = true;
        resilience = carriers[draws.indexOf(true)].resilience;
        bonusFactor = 1;
      } else {
        active = true;
        resilience = maxResilience;
        bonusFactor = nbActifs; // bonus appliqué autant de fois qu'il y a de tirages actifs
      }
    }

    resilience += bonusFactor > 0 ? params.bonusPoints * bonusFactor : -params.malusPoints;

    // Plafond/seuil **effectifs** par trait (global → type → trait, §9.2). Bonus/malus restent
    // globaux (hors périmètre clarification).
    const eff = resolveResilience(params, traitId);

    // Plafond (le bonus ne s'applique plus au-dessus) puis plancher à 0.
    resilience = Math.min(resilience, eff.max);
    resilience = Math.max(resilience, 0);

    // Sous le seuil de disparition, le trait quitte l'ADN (seule disparition définitive, §4.1).
    if (resilience < eff.disappearThreshold) continue;

    traits.push({ traitId, active, resilience });
  }

  return { traits };
}
