import type { Pouvoir, PowerTemplate } from '../model/pouvoir.js';
import type { Catalog } from '../model/trait.js';

/** Extrait l'année (entier, éventuellement négatif) d'une date ISO `YYYY-MM-DD`. */
export function yearOf(dateIso: string): number {
  const m = /^(-?\d+)-/.exec(dateIso);
  return m ? Number(m[1]) : 0;
}

/** Génération d'affichage = tranche de 20 ans de l'année de naissance (FR-020). */
export function computeGeneration(birthYear: number): number {
  return Math.floor(birthYear / 20);
}

/** Âge = année courante − année de naissance. En genèse, currentYear = birthYear ⇒ 0. */
export function computeAge(birthYear: number, currentYear: number): number {
  return currentYear - birthYear;
}

/**
 * Formate le libellé d'un pouvoir **selon son gabarit** (FR-024). `labelA`/`labelB` sont les
 * libellés des deux traits dans l'ordre des types du gabarit (cf. `TEMPLATE_TYPES`) :
 * AE = [Action, Élément], PE/PA/PR = [Partie du corps, État/Ajout/Remplacement].
 *
 * - AE → « {action} {élément} »
 * - PE → « {partie du corps} {état} »
 * - PA → « {ajout} sur {partie du corps} »
 * - PR → « {remplacement} à la place de {partie du corps} »
 */
export function formatPowerLabel(template: PowerTemplate, labelA: string, labelB: string): string {
  switch (template) {
    case 'AE':
      return `${labelA} ${labelB}`;
    case 'PE':
      return `${labelA} ${labelB}`;
    case 'PA':
      return `${labelB} sur ${labelA}`;
    case 'PR':
      return `${labelB} à la place de ${labelA}`;
  }
}

/** Libellé lisible d'un pouvoir, formaté **par gabarit** (FR-024). */
export function powerLabel(power: Pouvoir, catalog: Catalog): string {
  const labelById = new Map<string, string>();
  for (const list of Object.values(catalog.byType)) {
    for (const t of list) labelById.set(t.id, t.label);
  }
  // Pouvoir dérivé (§6.4) : le libellé a été pré-calculé via l'arbre §6.4.2.
  if (power.template === 'DERIVE') {
    return power.label;
  }
  const labels = power.traitIds.map((id) => labelById.get(id) ?? id);
  if (labels.length === 2) {
    return formatPowerLabel(power.template, labels[0], labels[1]);
  }
  // Repli défensif (un pouvoir de gabarit a toujours 2 traits).
  return labels.join(' · ');
}
