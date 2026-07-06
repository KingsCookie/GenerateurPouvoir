// Façade du module généalogie (cœur pur, lecture seule — Feature 4).
export { buildGenealogyTree } from './tree.js';
export type { TreeNode, TreeNodeLite, Union, TreeContext } from './tree.js';
export { filterPopulation, lastGeneration, sortPopulation } from './filter.js';
export type {
  FilterCriteria,
  FilterContext,
  TraitScope,
  TraitPresence,
  PowerPresence,
  Statut,
  SortKey,
  SortDir,
} from './filter.js';
