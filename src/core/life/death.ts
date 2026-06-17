import type { AppState } from '../state/serialize.js';
import { deathEvent } from '../model/event.js';

export type KillResult = { ok: true; state: AppState } | { ok: false; error: string };

/**
 * Mort manuelle (§6.7) : marque un individu **décédé** avec une **cause obligatoire**. Dissout le
 * couple éventuel (conjoints `actuel` → `ex`). N'utilise **aucun** aléatoire (rngState inchangé).
 * Cause vide ⇒ refus sans mutation.
 */
export function kill(state: AppState, personId: string, cause: string): KillResult {
  const trimmed = cause.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: 'La cause du décès est obligatoire.' };
  }
  const target = state.population.find((p) => p.id === personId);
  if (!target) {
    return { ok: false, error: `Individu introuvable : ${personId}.` };
  }

  const couple = state.couples.find((c) => c.memberIds.includes(personId));
  const memberSet = new Set(couple?.memberIds ?? []);

  const toEx = (conjoints: { id: string; statut: 'actuel' | 'ex' }[]) =>
    conjoints.map((c) =>
      c.statut === 'actuel' && memberSet.has(c.id) ? { ...c, statut: 'ex' as const } : { ...c },
    );

  const population = state.population.map((p) => {
    if (p.id === personId) {
      return { ...p, vivant: false, raisonDeces: trimmed, conjoints: toEx(p.conjoints) };
    }
    if (memberSet.has(p.id)) {
      return { ...p, conjoints: toEx(p.conjoints) };
    }
    return p;
  });

  const couples = couple ? state.couples.filter((c) => c.id !== couple.id) : state.couples;
  // Journal d'événements daté (Feature 7) : décès à l'année courante (source de l'« année de décès »).
  const history = [...state.history, deathEvent(personId, state.currentYear)];
  return { ok: true, state: { ...state, population, couples, history } };
}
