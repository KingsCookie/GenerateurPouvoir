// Gabarit de mutation forte (seul endroit où les « types de pouvoirs » subsistent, §6.1) :
// AE = Action + Élément (le plus fréquent), PE = PartieCorps + État,
// PA = PartieCorps + Ajout, PR = PartieCorps + Remplacement.
export const POWER_TEMPLATES = ['AE', 'PE', 'PA', 'PR'] as const;
export type PowerTemplate = (typeof POWER_TEMPLATES)[number];

export interface Pouvoir {
  id: string;
  label: string;
  template: PowerTemplate;
  traitIds: string[];
  puissance: number; // entier 1..10 (genèse)
  maitrise: number; // entier 1..10 (genèse)
}
