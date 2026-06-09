// Façade publique du cœur métier pur (Principe IV). L'UI importe UNIQUEMENT depuis ici.
export * from './model/index.js';
export { createRng, createSeed } from './rng/index.js';
export type { Rng } from './rng/index.js';
export { defaultCatalog, defaultEspece, defaultEspeces } from './catalog/defaultCatalog.js';
export { defaultParameters, statA } from './params/parameters.js';
export type { Parameters } from './params/parameters.js';
export { generateInitialPopulation } from './genesis/genesis.js';
export { generateName, NAME_LIST_SIZES } from './genesis/names.js';
export { computeAge, computeGeneration, powerLabel, formatPowerLabel } from './genesis/derived.js';
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
export {
  serializeState,
  deserializeState,
  createInitialState,
  FORMAT_VERSION,
} from './state/serialize.js';
export type { AppState, Result } from './state/serialize.js';
