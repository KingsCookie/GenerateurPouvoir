import type { Rng } from '../rng/rng.js';
import type { Catalog } from '../model/trait.js';
import type { Parameters } from '../params/parameters.js';
import type { Personne } from '../model/personne.js';
import type { ADN } from '../model/adn.js';
import type { Pouvoir } from '../model/pouvoir.js';
import { derivePowersFromTraits } from './traitsToPowers.js';
import { inheritStats } from './inheritStats.js';

/**
 * **Régénère** les pouvoirs d'un individu à partir de ses **traits actifs** (US9) — cœur pur
 * (Principe IV), déterministe pour une séquence de seed donnée, **sans dépendance UI/DOM**.
 *
 * Contrairement à une naissance, on **n'effectue aucun tirage de cas** (« sans pouvoir » /
 * « mutation forte ») : on applique **seulement** l'algorithme §6.4 (sous-listes + duplication + K)
 * sur l'ADN existant, puis on attribue puissance/maîtrise selon §7.2.
 *
 * Ordre des tirages (fixe ⇒ déterminisme) :
 *   1. dérivation §6.4 (duplications + génération K, qui peut enrichir l'ADN) ;
 *   2. mélange unique des pouvoirs de chaque parent (comme `reproduce`) ;
 *   3. puissance/maîtrise du i-ᵉ pouvoir (§7.2) — parents avec pouvoirs ⇒ moyenne A/B/C ;
 *      **aucun parent source** (dont individu **sans parents**) ⇒ **cas A** (1–10, borné).
 *
 * @returns l'ADN (éventuellement enrichi par K) et les pouvoirs régénérés.
 */
export function regeneratePowers(
  person: Personne,
  parents: Personne[],
  catalog: Catalog,
  params: Parameters,
  rng: Rng,
): { adn: ADN; pouvoirs: Pouvoir[] } {
  // 1. Dérivation §6.4 depuis les traits actifs (aucun pouvoir si aucun trait actif).
  const derived = derivePowersFromTraits(person.adn, catalog, params, rng);
  // 2. Mélange unique des pouvoirs parentaux (même contrat que reproduce, cf. inheritStats).
  const shuffledParents = parents.map((p) => ({ ...p, pouvoirs: rng.shuffle(p.pouvoirs) }));
  // 3. Puissance/maîtrise (§7.2) ; sans parent source ⇒ cas A (1–10).
  const pouvoirs = derived.pouvoirs.map((pw, i) => ({
    ...pw,
    ...inheritStats(i, shuffledParents, params, rng),
  }));
  return { adn: derived.adn, pouvoirs };
}
