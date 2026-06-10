// Façade publique du cœur métier pur (Principe IV). L'UI importe UNIQUEMENT depuis ici.
export * from './model/index.js';
export { createRng, createRngFromState, createSeed } from './rng/index.js';
export type { Rng } from './rng/index.js';
export { defaultCatalog, defaultEspece, defaultEspeces } from './catalog/defaultCatalog.js';
export { defaultParameters, statA } from './params/parameters.js';
export type { Parameters } from './params/parameters.js';
export { generateInitialPopulation } from './genesis/genesis.js';
export { generateName, NAME_LIST_SIZES } from './genesis/names.js';
export {
  computeAge,
  computeGeneration,
  powerLabel,
  formatPowerLabel,
  yearOf,
} from './genesis/derived.js';
export { generateStrongMutationPower } from './powers/strongMutation.js';

// Moteur génétique (Feature 2 : hérédité, traits→pouvoirs, puissance/maîtrise, reproduction).
export { inheritADN } from './heredity/inherit.js';
export { derivePowersFromTraits } from './powers/traitsToPowers.js';
export type { DerivePowersResult } from './powers/traitsToPowers.js';
export { powerLabelFromSublist } from './powers/powerLabelTree.js';
export type { SublistGroups } from './powers/powerLabelTree.js';
export { inheritStats } from './powers/inheritStats.js';
export { reproduce } from './birth/reproduce.js';
export type { BirthCase, ReproduceOptions } from './birth/reproduce.js';

// Simulation temporelle (Feature 3 : gaussienne, portée, candidats, appariement, tick, mort).
export { reproProbability } from './repro/gaussian.js';
export { litterSize } from './repro/litter.js';
export { selectCandidates, hasCurrentSpouse } from './repro/candidates.js';
export { formCouples, areConsanguine } from './repro/pairing.js';
export type { PairingResult } from './repro/pairing.js';
export { tick, advanceYears } from './time/tick.js';
export { kill } from './life/death.js';
export type { KillResult } from './life/death.js';
export {
  serializeState,
  deserializeState,
  createInitialState,
  FORMAT_VERSION,
} from './state/serialize.js';
export type { AppState, Result } from './state/serialize.js';

// Généalogie & exploration (Feature 4 : arbre généalogique, filtres, dernière génération).
export { buildGenealogyTree, filterPopulation, lastGeneration } from './genealogy/index.js';
export type {
  TreeNode,
  TreeNodeLite,
  Union,
  TreeContext,
  FilterCriteria,
  FilterContext,
  TraitScope,
  PowerPresence,
  Statut,
} from './genealogy/index.js';
