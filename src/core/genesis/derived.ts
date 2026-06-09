import type { Pouvoir } from '../model/pouvoir.js';
import type { Catalog } from '../model/trait.js';

/** Génération d'affichage = tranche de 20 ans de l'année de naissance (FR-020). */
export function computeGeneration(birthYear: number): number {
  return Math.floor(birthYear / 20);
}

/** Âge = année courante − année de naissance. En genèse, currentYear = birthYear ⇒ 0. */
export function computeAge(birthYear: number, currentYear: number): number {
  return currentYear - birthYear;
}

/** Libellé lisible d'un pouvoir à partir des libellés de ses traits constitutifs. */
export function powerLabel(power: Pouvoir, catalog: Catalog): string {
  const labelById = new Map<string, string>();
  for (const list of Object.values(catalog.byType)) {
    for (const t of list) labelById.set(t.id, t.label);
  }
  const parts = power.traitIds.map((id) => labelById.get(id) ?? id);
  return parts.join(' · ');
}
