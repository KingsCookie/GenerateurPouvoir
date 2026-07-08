import type { TraitType } from '../model/traitType.js';
import { TRAIT_TYPES } from '../model/traitType.js';
import type { PowerTemplate } from '../model/pouvoir.js';

/**
 * Surcharge de résilience (Feature 5, §9.2) — par champ et indépendante. Un champ absent
 * (`undefined`) ⇒ réhéritage du niveau supérieur (trait → type → global).
 */
export interface ResiliencePatch {
  initial?: number; // résilience initiale [0..100]
  max?: number; // plafond [0..100]
  disappearThreshold?: number; // seuil de disparition (« minimale ») [0..100]
}

/** Surcharges déclinées par type de trait et par trait (clé = traitId). */
export interface ResilienceOverrides {
  byType: Partial<Record<TraitType, ResiliencePatch>>;
  byTrait: Record<string, ResiliencePatch>;
}

// Tous les comportements chiffrés sont exposés ici et exportés avec l'état (Principe VII).
export interface Parameters {
  seed: string; // BigInt 64 bits en décimal (source unique d'aléatoire, éditable)
  batchSize: number; // effectif du batch initial (≥ 0)
  birthYear: number; // année de naissance du batch
  powerChancePct: number; // [0..100] chance qu'un individu ait un pouvoir
  initialResilience: number; // résilience initiale des traits d'un pouvoir de genèse [0..100]
  traitTypeWeights: Record<TraitType, number>;
  templateWeights: Record<PowerTemplate, number>;

  // --- Moteur génétique (Feature 2). Cf. specs/002-reproduction-heredite/data-model.md. ---
  duplicationD: number; // multiplicateur D (§6.4.1) : proba duplication = min(100, résilience·D) % (≥ 0 ; 0 ⇒ aucune)
  generationK: number; // K % (§6.4.2) : proba de génération d'un trait K… [0..100]
  resilienceMax: number; // plafond de résilience [0..100] (bonus inopérant au-dessus)
  bonusPoints: number; // bonus additif (points) si trait tiré actif
  malusPoints: number; // malus additif (points) si trait tiré inactif
  disappearThreshold: number; // seuil de disparition (%) ; sous ce seuil le trait quitte l'ADN
  strongMutationRatePct: number; // taux de mutation forte par naissance [0..100]
  noPowerRatePct: number; // taux de naissance sans pouvoir [0..100]
  weakMutationGainPct: number; // mutation faible — gain d'un trait [0..100]
  weakMutationLossPct: number; // mutation faible — perte d'un trait [0..100]
  genomeMalusEnabled: boolean; // option « malus sur le génome » (cas spéciaux)
  statB: number; // probabilité B (%) pour moyenne∓1 (§7.2)
  statC: number; // probabilité C (%) pour moyenne ; A = 100 − 2·B − C

  // --- Simulation temporelle (Feature 3). ---
  consanguinityAllowed: boolean; // si false, interdit l'appariement entre proches (§6.6.1)

  // --- Paramétrage avancé (Feature 5, §9.2). ---
  // Déclinaison de la résilience (initiale / maximale / seuil) global → type → trait. Les 3
  // champs globaux ci-dessus restent la **base** ; ces surcharges priment par champ (résolu
  // par `resolveResilience`). Défaut : aucune surcharge ⇒ comportement identique aux Features 1-3.
  resilienceOverrides: ResilienceOverrides;
}

function defaultTraitTypeWeights(): Record<TraitType, number> {
  const w = {} as Record<TraitType, number>;
  for (const t of TRAIT_TYPES) w[t] = 1;
  return w;
}

/**
 * Valeurs par défaut. La `seed` vaut "0" ici (cœur pur, sans entropie) ; l'UI tire une
 * vraie seed via `createSeed()` au démarrage (seul point d'entropie, Principe I).
 */
export function defaultParameters(): Parameters {
  return {
    seed: '0',
    batchSize: 100,
    birthYear: 0,
    powerChancePct: 0,
    initialResilience: 50,
    traitTypeWeights: defaultTraitTypeWeights(),
    // AE majoritaire (i ∈ {0,1,2} dans le gabarit §6.1) → poids 3, les autres 1.
    templateWeights: { AE: 3, PE: 1, PA: 1, PR: 1 },

    // Moteur génétique : défauts prévisibles (taux à 0 ⇒ naissance normale pure ; cf. plan.md).
    duplicationD: 0.25,
    generationK: 10,
    resilienceMax: 95,
    bonusPoints: 5,
    malusPoints: 5,
    disappearThreshold: 2,
    strongMutationRatePct: 20,
    noPowerRatePct: 10,
    weakMutationGainPct: 20,
    weakMutationLossPct: 20,
    genomeMalusEnabled: false,
    statB: 10,
    statC: 30, // ⇒ A = 100 − 2·10 − 30 = 50

    consanguinityAllowed: false, // consanguinité interdite par défaut (§6.6.1 / §9.5)

    resilienceOverrides: { byType: {}, byTrait: {} }, // aucune surcharge par défaut (Feature 5)
  };
}

/** Probabilité A (%) du tirage P/M (§7.2), dérivée : A = 100 − 2·B − C (clampée ≥ 0). */
export function statA(params: Parameters): number {
  return Math.max(0, 100 - 2 * params.statB - params.statC);
}
