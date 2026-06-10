// Adaptateur d'affichage des nœuds d'arbre (UI pur). Le cœur renvoie des nœuds complets ; ici on
// choisit les champs montrés par case : fiche = nom + pouvoirs ; page dédiée = nom + âge + pouvoirs
// (FR-003b). Séparateur ` || ` cohérent avec la liste (BUG-001 F3).
import type { TreeNodeLite } from '../../core/index.js';

const POWER_SEP = ' || ';

/** Libellé condensé des pouvoirs d'un nœud (`—` si aucun). */
export function powersLabel(node: Pick<TreeNodeLite, 'pouvoirs'>): string {
  return node.pouvoirs.length > 0 ? node.pouvoirs.join(POWER_SEP) : '—';
}

/**
 * Lignes secondaires d'une case (sous le nom). `showAge` ajoute l'âge en tête (page dédiée).
 * Fiche : `[pouvoirs]` ; page dédiée : `[âge, pouvoirs]`.
 */
export function cellLines(
  node: Pick<TreeNodeLite, 'age' | 'pouvoirs'>,
  showAge: boolean,
): string[] {
  const lines: string[] = [];
  if (showAge) lines.push(`${node.age} an(s)`);
  lines.push(powersLabel(node));
  return lines;
}
