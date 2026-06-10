// État d'interface (Feature 4) — NON exporté dans l'état applicatif (Principe VI).
import { writable } from 'svelte/store';

// Mode d'affichage des traits sur la fiche (FR-012/FR-013) :
//   1 = pouvoirs seuls ; 2 = + traits actifs ; 3 = + traits inactifs + résilience.
export type TraitMode = 1 | 2 | 3;

/** Mode d'affichage courant, **défaut 3** (FR-013). Module-level ⇒ persiste sur la session. */
export const traitMode = writable<TraitMode>(3);

/** Sélectionne le mode d'affichage des traits. */
export function setTraitMode(m: TraitMode): void {
  traitMode.set(m);
}
