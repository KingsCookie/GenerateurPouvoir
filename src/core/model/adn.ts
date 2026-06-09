// Entrée d'ADN : triplet (trait, état actif/inactif, résilience).
export interface ResilientTrait {
  traitId: string;
  active: boolean;
  resilience: number; // pourcentage [0..100]
}

export interface ADN {
  traits: ResilientTrait[]; // vide pour un individu sans pouvoir
}
