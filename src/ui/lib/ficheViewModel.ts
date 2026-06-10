// Modèle de vue PUR (aucune dépendance Svelte/DOM) : transforme une Personne + le catalogue
// en données d'affichage. Testable en isolation (tests/unit/fiche-vm.test.ts).
import {
  computeAge,
  computeGeneration,
  powerLabel,
  yearOf,
  type Catalog,
  type Personne,
  type PowerKind,
} from '../../core/index.js';

// Réexport pour compatibilité (yearOf vit désormais dans le cœur, réutilisé par la généalogie).
export { yearOf };

export interface TraitView {
  traitId: string;
  label: string;
  resilience: number;
}

export interface PouvoirView {
  label: string;
  template: PowerKind;
  puissance: number;
  maitrise: number;
  traits: TraitView[];
}

export interface FicheView {
  id: string;
  nom: string;
  especeId: string;
  genreId: string;
  dateNaissance: string;
  age: number;
  generation: number;
  vivant: boolean;
  raisonDeces: string | null;
  pouvoirs: PouvoirView[];
  traitsActifs: TraitView[];
  traitsInactifs: TraitView[];
}

function labelIndex(catalog: Catalog): Map<string, string> {
  const idx = new Map<string, string>();
  for (const list of Object.values(catalog.byType)) {
    for (const t of list) idx.set(t.id, t.label);
  }
  return idx;
}

/** Résumé pour une ligne de liste : nom, date, âge, libellés de pouvoir(s). */
export function buildListRow(person: Personne, catalog: Catalog, currentYear: number) {
  return {
    id: person.id,
    nom: person.nom,
    dateNaissance: person.dateNaissance,
    age: computeAge(yearOf(person.dateNaissance), currentYear),
    pouvoirs: person.pouvoirs.map((p) => powerLabel(p, catalog)),
  };
}

/** Vue détaillée d'un individu (US2). */
export function buildFicheView(person: Personne, catalog: Catalog, currentYear: number): FicheView {
  const idx = labelIndex(catalog);
  const resilById = new Map(person.adn.traits.map((t) => [t.traitId, t.resilience]));

  const toView = (t: { traitId: string; resilience: number }): TraitView => ({
    traitId: t.traitId,
    label: idx.get(t.traitId) ?? t.traitId,
    resilience: t.resilience,
  });

  // ADN complet (US3) : traits actifs et inactifs, chacun avec sa résilience.
  const traitsActifs: TraitView[] = person.adn.traits.filter((t) => t.active).map(toView);
  const traitsInactifs: TraitView[] = person.adn.traits.filter((t) => !t.active).map(toView);

  const pouvoirs: PouvoirView[] = person.pouvoirs.map((p) => ({
    label: powerLabel(p, catalog),
    template: p.template,
    puissance: p.puissance,
    maitrise: p.maitrise,
    traits: p.traitIds.map((id) => ({
      traitId: id,
      label: idx.get(id) ?? id,
      resilience: resilById.get(id) ?? 0,
    })),
  }));

  return {
    id: person.id,
    nom: person.nom,
    especeId: person.especeId,
    genreId: person.genreId,
    dateNaissance: person.dateNaissance,
    age: computeAge(yearOf(person.dateNaissance), currentYear),
    generation: computeGeneration(yearOf(person.dateNaissance)),
    vivant: person.vivant,
    raisonDeces: person.raisonDeces,
    pouvoirs,
    traitsActifs,
    traitsInactifs,
  };
}
