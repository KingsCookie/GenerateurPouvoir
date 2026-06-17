import type { AppState } from '../state/serialize.js';
import type { Personne, Conjoint } from '../model/personne.js';
import type { Couple } from '../model/couple.js';

function yearOfIso(dateIso: string): number {
  const m = /^(-?\d+)-/.exec(dateIso);
  return m ? Number(m[1]) : 0;
}

/**
 * Projette l'état de la population **à l'année `year`** à partir du journal d'événements daté
 * (Feature 7). **Pure** : ne mute pas `state`, n'altère pas `history`.
 *
 * Règles (INV-S9) :
 * - individu visible ⇔ naissance ≤ year (journal ; repli `yearOf(dateNaissance)` sans journal — INV-S8) ;
 * - vivant à `year` ⇔ aucun `death(year ≤ year)` ;
 * - couple actif à `year` ⇔ `couple(≤ year)`, sans `divorce(≤ year)`, **et** aucun membre mort ≤ year
 *   (un décès dissout le couple — §6.7 — sans émettre de `divorce` ; C1) ; ses conjoints sinon « ex ».
 */
export function reconstructAtYear(state: AppState, year: number): AppState {
  // Index des événements.
  const birthYearById = new Map<string, number>();
  const deathYearById = new Map<string, number>();
  const coupleFormed = new Map<string, { year: number; memberIds: string[] }>();
  const coupleDissolved = new Map<string, number>();

  for (const e of state.history) {
    if (e.kind === 'birth') {
      const prev = birthYearById.get(e.personId);
      if (prev === undefined || e.year < prev) birthYearById.set(e.personId, e.year);
    } else if (e.kind === 'death') {
      const prev = deathYearById.get(e.personId);
      if (prev === undefined || e.year < prev) deathYearById.set(e.personId, e.year);
    } else if (e.kind === 'couple') {
      coupleFormed.set(e.coupleId, { year: e.year, memberIds: e.memberIds });
    } else if (e.kind === 'divorce') {
      const prev = coupleDissolved.get(e.coupleId);
      if (prev === undefined || e.year < prev) coupleDissolved.set(e.coupleId, e.year);
    }
  }

  const birthOf = (p: Personne): number =>
    birthYearById.has(p.id) ? birthYearById.get(p.id)! : yearOfIso(p.dateNaissance);
  const diedBy = (id: string, y: number): boolean => {
    const d = deathYearById.get(id);
    return d !== undefined && d <= y;
  };

  // Individus présents à `year`.
  const visible = state.population.filter((p) => birthOf(p) <= year);
  const visibleIds = new Set(visible.map((p) => p.id));

  // Couples actifs à `year` (journal). Map membre → partenaires actuels.
  const activePartners = new Map<string, Set<string>>();
  const exPartners = new Map<string, Set<string>>();
  const couplesAtYear: Couple[] = [];
  for (const [coupleId, formed] of coupleFormed) {
    if (formed.year > year) continue; // pas encore formé
    const members = formed.memberIds.filter((id) => visibleIds.has(id));
    if (members.length < 2) continue;
    const dissolved = coupleDissolved.has(coupleId) && coupleDissolved.get(coupleId)! <= year;
    const someoneDead = members.some((id) => diedBy(id, year));
    const active = !dissolved && !someoneDead;
    const target = active ? activePartners : exPartners;
    for (const id of members) {
      if (!target.has(id)) target.set(id, new Set());
      for (const other of members) if (other !== id) target.get(id)!.add(other);
    }
    if (active) {
      const src = state.couples.find((c) => c.id === coupleId);
      couplesAtYear.push({ id: coupleId, memberIds: members, reproPct: src?.reproPct ?? null });
    }
  }

  const population: Personne[] = visible.map((p) => {
    const dead = diedBy(p.id, year);
    const conjoints: Conjoint[] = [];
    for (const id of activePartners.get(p.id) ?? []) conjoints.push({ id, statut: 'actuel' });
    for (const id of exPartners.get(p.id) ?? []) {
      if (!conjoints.some((c) => c.id === id)) conjoints.push({ id, statut: 'ex' });
    }
    return {
      ...p,
      vivant: !dead,
      raisonDeces: dead ? p.raisonDeces : null,
      enfants: p.enfants.filter((id) => visibleIds.has(id) && birthYearOfChild(id) <= year),
      parents: p.parents.filter((id) => visibleIds.has(id)),
      conjoints,
    };
  });

  // Année de naissance d'un enfant (pour filtrer `enfants` à `year`).
  function birthYearOfChild(id: string): number {
    if (birthYearById.has(id)) return birthYearById.get(id)!;
    const child = state.population.find((p) => p.id === id);
    return child ? yearOfIso(child.dateNaissance) : Number.NEGATIVE_INFINITY;
  }

  return { ...state, population, couples: couplesAtYear, currentYear: year };
}
