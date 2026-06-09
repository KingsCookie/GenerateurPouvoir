// Gabarit de mutation forte (seul endroit où les « types de pouvoirs » subsistent, §6.1) :
// AE = Action + Élément (le plus fréquent), PE = PartieCorps + État,
// PA = PartieCorps + Ajout, PR = PartieCorps + Remplacement.
export const POWER_TEMPLATES = ['AE', 'PE', 'PA', 'PR'] as const;
export type PowerTemplate = (typeof POWER_TEMPLATES)[number];

// Origine d'un pouvoir : l'un des 4 gabarits de mutation forte (§6.1), ou « DERIVE » pour un
// pouvoir issu de l'algorithme traits → pouvoirs (§6.4), dont le libellé est pré-calculé.
export type PowerKind = PowerTemplate | 'DERIVE';

export interface Pouvoir {
  id: string;
  label: string;
  template: PowerKind;
  traitIds: string[];
  puissance: number; // entier (borné 1..10 seulement en mutation forte / cas A, §7)
  maitrise: number; // entier (idem)
}
