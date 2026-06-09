import type { ADN } from './adn.js';
import type { Pouvoir } from './pouvoir.js';

export interface Conjoint {
  id: string;
  statut: 'actuel' | 'ex';
}

// Individu de la population. Les champs de parenté/conjoints sont vides à la genèse
// (batch initial) — l'hérédité et les couples relèvent de features ultérieures.
export interface Personne {
  id: string;
  nom: string;
  especeId: string;
  genreId: string;
  dateNaissance: string; // ISO YYYY-MM-DD
  vivant: boolean;
  raisonDeces: string | null;
  parents: string[];
  enfants: string[];
  conjoints: Conjoint[];
  adn: ADN;
  pouvoirs: Pouvoir[]; // 0 ou 1 en genèse
  notes: string | null;
}
