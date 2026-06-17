// Journal d'événements daté (Feature 7) : permet de reconstruire l'état de la population à toute
// année passée (couples/divorces/décès tels qu'à l'année). Additif — n'altère pas la logique
// « état courant » des features précédentes ; émis par la genèse, le tick annuel et la mort.
export type PopulationEvent =
  | { kind: 'birth'; year: number; personId: string }
  | { kind: 'death'; year: number; personId: string }
  | { kind: 'couple'; year: number; coupleId: string; memberIds: string[] }
  | { kind: 'divorce'; year: number; coupleId: string };

/** Événement de naissance daté. */
export function birthEvent(personId: string, year: number): PopulationEvent {
  return { kind: 'birth', year, personId };
}

/** Événement de décès daté. */
export function deathEvent(personId: string, year: number): PopulationEvent {
  return { kind: 'death', year, personId };
}

/** Événement de formation de couple daté. */
export function coupleEvent(coupleId: string, memberIds: string[], year: number): PopulationEvent {
  return { kind: 'couple', year, coupleId, memberIds };
}

/** Événement de dissolution (divorce) daté. */
export function divorceEvent(coupleId: string, year: number): PopulationEvent {
  return { kind: 'divorce', year, coupleId };
}
