import type { TraitType } from '../model/traitType.js';
import { traitTypeOf } from '../model/traitType.js';
import type { Parameters, ResiliencePatch } from './parameters.js';

/** Valeur effective résolue (toujours 3 nombres définis). */
export interface EffectiveResilience {
  initial: number;
  max: number;
  disappearThreshold: number;
}

/** Niveau visé par une surcharge. */
export type ResilienceScope =
  | { level: 'global' }
  | { level: 'type'; type: TraitType }
  | { level: 'trait'; traitId: string };

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

/**
 * Résout la résilience effective d'un trait (§9.2) — **par champ, indépendamment** :
 * `byTrait[traitId].champ ?? byType[type].champ ?? global.champ` (INV-P1/P2).
 * Le **type** est dérivé du préfixe de l'id ; un trait absent du catalogue reste résolu tant que
 * son préfixe est un `TraitType` connu (INV-P3). Pure, ne consomme pas le RNG.
 */
export function resolveResilience(params: Parameters, traitId: string): EffectiveResilience {
  const type = traitTypeOf(traitId);
  const byTrait = params.resilienceOverrides.byTrait[traitId];
  const byType = type ? params.resilienceOverrides.byType[type] : undefined;

  return {
    initial: byTrait?.initial ?? byType?.initial ?? params.initialResilience,
    max: byTrait?.max ?? byType?.max ?? params.resilienceMax,
    disappearThreshold:
      byTrait?.disappearThreshold ?? byType?.disappearThreshold ?? params.disappearThreshold,
  };
}

/** Borne une valeur de pourcentage dans [0, 100]. */
export function clampPct(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

/**
 * Valide un patch de résilience : tous les champs présents ∈ [0,100] et, si `disappearThreshold`
 * et `max` sont tous deux fournis, `disappearThreshold ≤ max` (INV-P4). Messages en français.
 */
export function validateResiliencePatch(p: ResiliencePatch): ValidationResult {
  const fields: [keyof ResiliencePatch, string][] = [
    ['initial', 'la résilience initiale'],
    ['max', 'la résilience maximale'],
    ['disappearThreshold', 'le seuil de disparition'],
  ];
  for (const [key, name] of fields) {
    const v = p[key];
    if (v === undefined) continue;
    if (!Number.isFinite(v) || v < 0 || v > 100) {
      return {
        ok: false,
        error: `Valeur invalide pour ${name} : attendu un nombre entre 0 et 100.`,
      };
    }
  }
  if (p.disappearThreshold !== undefined && p.max !== undefined && p.disappearThreshold > p.max) {
    return {
      ok: false,
      error: 'Le seuil de disparition ne peut pas dépasser la résilience maximale.',
    };
  }
  return { ok: true };
}

// Patch « nettoyé » : on retire les champs undefined pour garder une structure minimale et
// une sérialisation canonique stable.
function cleanPatch(patch: ResiliencePatch): ResiliencePatch {
  const out: ResiliencePatch = {};
  if (patch.initial !== undefined) out.initial = patch.initial;
  if (patch.max !== undefined) out.max = patch.max;
  if (patch.disappearThreshold !== undefined) out.disappearThreshold = patch.disappearThreshold;
  return out;
}

/**
 * Pose/met à jour une surcharge de résilience au niveau visé. Renvoie un **nouveau** `Parameters`.
 * Le niveau `global` écrit les 3 valeurs de base (`initialResilience`/`resilienceMax`/
 * `disappearThreshold`) pour les champs fournis. Un patch vide au niveau type/trait retire la
 * surcharge (équivaut à `clearResiliencePatch`). Pure.
 */
export function setResiliencePatch(
  params: Parameters,
  scope: ResilienceScope,
  patch: ResiliencePatch,
): Parameters {
  const clean = cleanPatch(patch);

  if (scope.level === 'global') {
    return {
      ...params,
      initialResilience: clean.initial ?? params.initialResilience,
      resilienceMax: clean.max ?? params.resilienceMax,
      disappearThreshold: clean.disappearThreshold ?? params.disappearThreshold,
    };
  }

  const overrides = params.resilienceOverrides;
  if (scope.level === 'type') {
    const byType = { ...overrides.byType };
    if (Object.keys(clean).length === 0) delete byType[scope.type];
    else byType[scope.type] = clean;
    return { ...params, resilienceOverrides: { ...overrides, byType } };
  }
  // scope.level === 'trait'
  const byTrait = { ...overrides.byTrait };
  if (Object.keys(clean).length === 0) delete byTrait[scope.traitId];
  else byTrait[scope.traitId] = clean;
  return { ...params, resilienceOverrides: { ...overrides, byTrait } };
}

/** Retire toute surcharge au niveau visé (réhéritage du niveau supérieur). Pure. */
export function clearResiliencePatch(params: Parameters, scope: ResilienceScope): Parameters {
  if (scope.level === 'global') return params; // pas de « suppression » du global (c'est la base)
  const overrides = params.resilienceOverrides;
  if (scope.level === 'type') {
    const byType = { ...overrides.byType };
    delete byType[scope.type];
    return { ...params, resilienceOverrides: { ...overrides, byType } };
  }
  const byTrait = { ...overrides.byTrait };
  delete byTrait[scope.traitId];
  return { ...params, resilienceOverrides: { ...overrides, byTrait } };
}

/**
 * « Propager » la résilience d'un type : efface toutes les **surcharges de trait** des traits de ce
 * type (les traits réhéritent du niveau type, sinon global). Renvoie un nouveau `Parameters`. Pure.
 */
export function propagateResilienceType(params: Parameters, type: TraitType): Parameters {
  const byTrait: Record<string, ResiliencePatch> = {};
  for (const [traitId, patch] of Object.entries(params.resilienceOverrides.byTrait)) {
    if (traitTypeOf(traitId) !== type) byTrait[traitId] = patch;
  }
  return { ...params, resilienceOverrides: { ...params.resilienceOverrides, byTrait } };
}
