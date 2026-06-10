import type { Rng } from '../rng/rng.js';
import type { Personne } from '../model/personne.js';
import type { Espece } from '../model/espece.js';
import type { Parameters } from '../params/parameters.js';
import type { Couple } from '../model/couple.js';

export interface PairingResult {
  couples: Couple[];
  unpaired: string[]; // candidats non appariés (re-candidats l'année suivante, FR-008)
}

function parentsOf(id: string, byId: Map<string, Personne>): string[] {
  return byId.get(id)?.parents ?? [];
}

function grandparentsOf(id: string, byId: Map<string, Personne>): string[] {
  const out: string[] = [];
  for (const p of parentsOf(id, byId)) out.push(...parentsOf(p, byId));
  return out;
}

/** Deux individus sont consanguins s'ils partagent ≥ 1 parent OU ≥ 1 grand-parent (§6.6.1). */
export function areConsanguine(a: string, b: string, byId: Map<string, Personne>): boolean {
  const parentsA = new Set(parentsOf(a, byId));
  if (parentsOf(b, byId).some((x) => parentsA.has(x))) return true;
  const gpA = new Set(grandparentsOf(a, byId));
  if (grandparentsOf(b, byId).some((x) => gpA.has(x))) return true;
  return false;
}

/**
 * Forme des **couples** (§6.6, R5) à partir des candidats volontaires. Mélange déterministe, puis
 * parcours glouton : pour chaque candidat libre, on complète un groupe de `groupSize` avec des
 * partenaires **de la même espèce** et **non consanguins** (si interdit). Le **genre n'intervient
 * pas** en Feature 3 (décision A1). Groupe complet ⇒ `Couple` ; sinon le candidat est reporté.
 */
export function formCouples(
  candidateIds: string[],
  population: Personne[],
  params: Parameters,
  especeById: Map<string, Espece>,
  rng: Rng,
  nextCoupleId: () => string,
): PairingResult {
  const byId = new Map(population.map((p) => [p.id, p]));
  const order = rng.shuffle(candidateIds);
  const available = new Set(order);

  const couples: Couple[] = [];
  const unpaired: string[] = [];

  for (const id of order) {
    if (!available.has(id)) continue;
    const person = byId.get(id);
    const espece = person ? especeById.get(person.especeId) : undefined;
    if (!person || !espece) {
      available.delete(id);
      unpaired.push(id);
      continue;
    }

    const size = Math.max(1, espece.groupSize);
    const group = [id];

    if (size > 1) {
      for (const other of order) {
        if (group.length === size) break;
        if (other === id || !available.has(other)) continue;
        const op = byId.get(other);
        if (!op || op.especeId !== person.especeId) continue; // même espèce uniquement
        if (!params.consanguinityAllowed && group.some((gid) => areConsanguine(gid, other, byId))) {
          continue; // anti-consanguinité (avec tous les membres déjà retenus)
        }
        group.push(other);
      }
    }

    if (group.length === size) {
      for (const m of group) available.delete(m);
      couples.push({ id: nextCoupleId(), memberIds: group, reproPct: null });
    } else {
      available.delete(id); // partenaires insuffisants : reporté
      unpaired.push(id);
    }
  }

  return { couples, unpaired };
}
