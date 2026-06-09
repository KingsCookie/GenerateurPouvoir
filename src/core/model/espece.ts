// Genre spécial toujours présent dans une espèce (data-model.md, FR-011).
export const GENRE_TOUT = 'tout';

export interface Genre {
  id: string;
  label: string;
}

export interface Espece {
  id: string;
  label: string;
  genres: Genre[]; // contient toujours le genre spécial « tout »
}
