// Moteur de filtres de la population — cœur PUR, déterministe, LECTURE SEULE (Principes I/IV).
// OU au sein d'une dimension non vide, ET entre dimensions renseignées (INV-G4). Aucune mutation
// des entrées : renvoie un nouveau tableau (INV-G6).
import type { Personne } from '../model/personne.js';
import { computeAge, computeGeneration, yearOf } from '../genesis/derived.js';

export type TraitScope = 'actifs' | 'inactifs' | 'tous';
export type PowerPresence = 'any' | 'none' | null;
export type Statut = 'vivant' | 'décédé';

/**
 * Présence de trait dans l'ADN (dimension indépendante du choix de traits précis) — Feature 010.
 * `null` ⇒ ignoré.
 *   none-active   : aucun trait actif        · some-active   : ≥1 trait actif
 *   some-inactive : ≥1 trait inactif         · some-any      : ≥1 trait (actif ou inactif)
 */
export type TraitPresence = 'none-active' | 'some-active' | 'some-inactive' | 'some-any' | null;

export interface FilterCriteria {
  /** Sous-chaîne, normalisée (casse + accents) ; vide ⇒ ignoré. */
  nameQuery: string;
  /** OU intra ; vide ⇒ ignoré. */
  generations: Set<number>;
  /** OU intra ; vide ⇒ ignoré. */
  especeIds: Set<string>;
  /** OU intra ; vide ⇒ ignoré. */
  traitIds: Set<string>;
  /** Portée du filtre trait (défaut `actifs`). */
  traitScope: TraitScope;
  /** Présence de trait dans l'ADN (mono-sélection) ; `null` ⇒ ignoré. */
  traitPresence: TraitPresence;
  /** Présence/absence de pouvoir ; `null` ⇒ ignoré. */
  powerPresence: PowerPresence;
  /** OU intra ; vide ⇒ ignoré. */
  statuses: Set<Statut>;
}

export interface FilterContext {
  currentYear: number;
}

/** Clé de tri d'une liste d'individus (Feature 010). */
export type SortKey = 'nom' | 'naissance' | 'age';
/** Sens de tri. */
export type SortDir = 'asc' | 'desc';

/** Plage Unicode des diacritiques combinants (à retirer après normalisation NFD). */
const DIACRITICS = /[̀-ͯ]/g;

/** Minuscule + diacritiques retirés (comparaison de noms insensible casse/accents). */
function normalize(s: string): string {
  return s.normalize('NFD').replace(DIACRITICS, '').toLowerCase();
}

/** Vrai si au moins un trait recherché est présent selon la portée (OU intra-dimension). */
function matchTrait(p: Personne, traitIds: Set<string>, scope: TraitScope): boolean {
  for (const t of p.adn.traits) {
    if (!traitIds.has(t.traitId)) continue;
    if (scope === 'actifs' && !t.active) continue;
    if (scope === 'inactifs' && t.active) continue;
    return true; // 'tous' (ou état correspondant à la portée)
  }
  return false;
}

/** Vrai si le statut de l'individu figure dans l'ensemble demandé (OU intra-dimension). */
function matchStatus(p: Personne, statuses: Set<Statut>): boolean {
  return (statuses.has('vivant') && p.vivant) || (statuses.has('décédé') && !p.vivant);
}

/** Vrai si l'ADN de l'individu satisfait le critère de présence de trait (Feature 010). */
function matchTraitPresence(p: Personne, presence: Exclude<TraitPresence, null>): boolean {
  const traits = p.adn.traits;
  switch (presence) {
    case 'none-active':
      return !traits.some((t) => t.active); // aucun trait actif (inclut ADN vide)
    case 'some-active':
      return traits.some((t) => t.active);
    case 'some-inactive':
      return traits.some((t) => !t.active);
    case 'some-any':
      return traits.length > 0;
  }
}

/** Comparateur déterministe : date de naissance puis id. */
function byBirthThenId(a: Personne, b: Personne): number {
  const ya = yearOf(a.dateNaissance);
  const yb = yearOf(b.dateNaissance);
  if (ya !== yb) return ya - yb;
  const md = a.dateNaissance
    .replace(/^-?\d+-/, '')
    .localeCompare(b.dateNaissance.replace(/^-?\d+-/, ''));
  if (md !== 0) return md;
  return a.id.localeCompare(b.id);
}

/**
 * Filtre la population selon `criteria`. Dimensions vides (`Set` vide, `nameQuery` vide,
 * `powerPresence === null`) sans effet ; ET entre dimensions renseignées (INV-G4). Renvoie un
 * **nouveau** tableau (mêmes références d'individus) trié par date puis id. `pop` non modifié.
 */
export function filterPopulation(
  pop: Personne[],
  criteria: FilterCriteria,
  _ctx: FilterContext,
): Personne[] {
  const q = normalize(criteria.nameQuery.trim());
  const result = pop.filter((p) => {
    if (q && !normalize(p.nom).includes(q)) return false;
    if (
      criteria.generations.size > 0 &&
      !criteria.generations.has(computeGeneration(yearOf(p.dateNaissance)))
    )
      return false;
    if (criteria.especeIds.size > 0 && !criteria.especeIds.has(p.especeId)) return false;
    if (criteria.traitIds.size > 0 && !matchTrait(p, criteria.traitIds, criteria.traitScope))
      return false;
    if (criteria.traitPresence && !matchTraitPresence(p, criteria.traitPresence)) return false;
    if (criteria.powerPresence === 'any' && p.pouvoirs.length === 0) return false;
    if (criteria.powerPresence === 'none' && p.pouvoirs.length > 0) return false;
    if (criteria.statuses.size > 0 && !matchStatus(p, criteria.statuses)) return false;
    return true;
  });
  return result.sort(byBirthThenId);
}

/**
 * Trie une population **déjà filtrée** selon une clé et un sens (Feature 010). PUR : renvoie un **nouveau**
 * tableau, ne mute pas `pop`. `key === null` ⇒ ordre reçu **préservé** (= tri « par défaut »). Le départage
 * final est toujours `byBirthThenId` (déterministe et stable — FR-009). `age` dérive de `ctx.currentYear`.
 */
export function sortPopulation(
  pop: readonly Personne[],
  key: SortKey | null,
  dir: SortDir,
  ctx: FilterContext,
): Personne[] {
  const arr = [...pop];
  if (key === null) return arr; // ordre d'entrée conservé (défaut)
  const sign = dir === 'desc' ? -1 : 1;
  arr.sort((a, b) => {
    let primary = 0;
    if (key === 'nom') primary = normalize(a.nom).localeCompare(normalize(b.nom));
    else if (key === 'naissance') primary = byBirthThenId(a, b);
    else
      primary =
        computeAge(yearOf(a.dateNaissance), ctx.currentYear) -
        computeAge(yearOf(b.dateNaissance), ctx.currentYear);
    if (primary !== 0) return sign * primary;
    return byBirthThenId(a, b); // départage stable, non inversé
  });
  return arr;
}

/**
 * Plus grande génération présente dans `pop` (= max `computeGeneration`), ou `null` si vide.
 * Sert de défaut dynamique au filtre génération côté UI (FR-011a).
 */
export function lastGeneration(pop: Personne[]): number | null {
  let max: number | null = null;
  for (const p of pop) {
    const g = computeGeneration(yearOf(p.dateNaissance));
    if (max === null || g > max) max = g;
  }
  return max;
}
