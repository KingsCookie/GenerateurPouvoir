import type { Catalog, Trait } from '../model/trait.js';
import type { TraitType } from '../model/traitType.js';
import { TRAIT_TYPES } from '../model/traitType.js';
import { slug } from './defaultCatalog.js';

// Mutations **pures** du catalogue (Feature 5, US1). Chaque fonction renvoie un **nouveau**
// `Catalog` ; aucune ne mute un `ADN` existant (suppression = futur seulement, INV-C1) ni n'ajoute/
// retire un `TraitType` (INV-C3). Les ids restent stables et uniques par type (INV-C2).

/** Copie superficielle du catalogue (nouveau `byType` + nouveaux tableaux par type). */
function cloneCatalog(cat: Catalog): Catalog {
  const byType = {} as Record<TraitType, Trait[]>;
  for (const type of TRAIT_TYPES) byType[type] = [...(cat.byType[type] ?? [])];
  return { byType };
}

/** Génère un id stable et **unique** dans le type : `type:slug-n`, n minimal libre. */
function uniqueId(type: TraitType, label: string, existing: Trait[]): string {
  const taken = new Set(existing.map((t) => t.id));
  const base = slug(label) || 'trait';
  let n = existing.length;
  let id = `${type}:${base}-${n}`;
  while (taken.has(id)) {
    n++;
    id = `${type}:${base}-${n}`;
  }
  return id;
}

/**
 * Ajoute un trait à un type (sans surcharge de poids ⇒ hérite du poids du type). Le libellé peut
 * déjà exister (doublon toléré) : l'id reste unique grâce au suffixe différenciateur (INV-C2).
 */
export function addTrait(cat: Catalog, type: TraitType, label: string): Catalog {
  const next = cloneCatalog(cat);
  const id = uniqueId(type, label, next.byType[type]);
  next.byType[type] = [...next.byType[type], { id, type, label: label.trim(), weight: null }];
  return next;
}

/** Renomme un trait (id inchangé). No-op sûr si l'id est absent. */
export function renameTrait(cat: Catalog, traitId: string, label: string): Catalog {
  const next = cloneCatalog(cat);
  for (const type of TRAIT_TYPES) {
    next.byType[type] = next.byType[type].map((t) =>
      t.id === traitId ? { ...t, label: label.trim() } : t,
    );
  }
  return next;
}

/**
 * Retire un trait du catalogue (**futur seulement** : ne touche aucun ADN — INV-C1). No-op sûr
 * si l'id est absent.
 */
export function removeTrait(cat: Catalog, traitId: string): Catalog {
  const next = cloneCatalog(cat);
  for (const type of TRAIT_TYPES) {
    next.byType[type] = next.byType[type].filter((t) => t.id !== traitId);
  }
  return next;
}

/**
 * Surcharge le poids d'un trait (le distingue du défaut de son type). `weight = null` retire la
 * surcharge (le trait réhérite du poids de son type). No-op sûr si l'id est absent.
 */
export function setTraitWeight(cat: Catalog, traitId: string, weight: number | null): Catalog {
  const next = cloneCatalog(cat);
  const w = weight === null ? null : Math.max(0, weight);
  for (const type of TRAIT_TYPES) {
    next.byType[type] = next.byType[type].map((t) => (t.id === traitId ? { ...t, weight: w } : t));
  }
  return next;
}

/**
 * « Propager » : applique le poids du type à tous ses traits en **effaçant leurs surcharges**
 * (`weight = null` ⇒ héritage du poids du type). Renvoie un nouveau `Catalog`.
 */
export function propagateTypeWeight(cat: Catalog, type: TraitType): Catalog {
  const next = cloneCatalog(cat);
  next.byType[type] = next.byType[type].map((t) => ({ ...t, weight: null }));
  return next;
}
