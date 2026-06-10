// Façade du module généalogie (cœur pur, lecture seule — Feature 4).
export { buildGenealogyTree } from './tree.js';
export type { TreeNode, TreeNodeLite, Union, TreeContext } from './tree.js';
export { filterPopulation, lastGeneration } from './filter.js';
export type { FilterCriteria, FilterContext, TraitScope, PowerPresence, Statut } from './filter.js';
