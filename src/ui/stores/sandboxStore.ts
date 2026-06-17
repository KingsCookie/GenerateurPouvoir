import { writable, derived, get } from 'svelte/store';
import {
  createRng,
  createRngFromState,
  manualReproduce,
  createPerson as createPersonCore,
  clonePerson as clonePersonCore,
  editPerson as editPersonCore,
  deletePerson as deletePersonCore,
  formCouple as formCoupleCore,
  divorceCouple as divorceCoupleCore,
  dissolveConjugalLink as dissolveConjugalLinkCore,
  generateStrongMutationPower,
  derivePowersFromTraits,
  reconstructAtYear,
  type AppState,
  type Rng,
  type ADN,
  type Pouvoir,
  type PersonDraft,
  type PersonPatch,
} from '../../core/index.js';
import { snapshotState, promoteState, goToSandbox, currentView } from './appState.js';

// État sandbox **isolé** (copie profonde de l'état réel). `null` tant que la sandbox n'est pas ouverte.
export const sandboxState = writable<AppState | null>(null);

// RNG **forké** de l'instantané réel (déterministe ; sa position est transférée au « make it real »).
let sbRng: Rng = createRng(0n);

// Année sélectionnée (lentille d'affichage + année de naissance des enfants de reproduction manuelle).
export const sandboxYear = writable<number>(0);

// État du mode reproduction manuelle (Feature 7, FR-007..007c).
export const reproMode = writable<boolean>(false);
export const reproSelected = writable<Set<string>>(new Set());
export const reproChildCount = writable<number>(1);
export const reproLastParents = writable<string[]>([]);

// Erreur de suppression (descendants), affichée par l'écran sandbox.
export const sandboxError = writable<string | null>(null);

/** Vue reconstruite à l'année sélectionnée (état affiché). */
export const sandboxView = derived([sandboxState, sandboxYear], ([$s, $y]) =>
  $s ? reconstructAtYear($s, $y) : null,
);

function deepClone(state: AppState): AppState {
  return structuredClone(state);
}

function nextPersonId(state: AppState): string {
  let max = 0;
  for (const p of state.population) {
    const m = /^p-(\d+)$/.exec(p.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `p-${String(max + 1).padStart(6, '0')}`;
}

function resetReproMode(): void {
  reproMode.set(false);
  reproSelected.set(new Set());
  reproChildCount.set(1);
  sandboxError.set(null);
}

/** Ouvre la sandbox sur une **copie** de l'état réel courant (RNG forké). */
export function enterSandbox(): void {
  const real = snapshotState();
  sandboxState.set(deepClone(real));
  sbRng = createRngFromState(real.rngState);
  sandboxYear.set(real.currentYear);
  reproLastParents.set([]);
  resetReproMode();
  goToSandbox();
}

/** Réinitialise la sandbox à l'**état réel courant** (les modifications sandbox sont abandonnées). */
export function resetSandbox(): void {
  const real = snapshotState();
  sandboxState.set(deepClone(real));
  sbRng = createRngFromState(real.rngState);
  sandboxYear.set(real.currentYear);
  reproLastParents.set([]);
  resetReproMode();
}

/** « Make it real » : l'état sandbox **devient** l'état réel (transfert, pas de rejeu). */
export function makeItReal(): void {
  const s = get(sandboxState);
  if (!s) return;
  promoteState(s); // bascule la vue sur la liste réelle
  sandboxState.set(null);
  resetReproMode();
}

/** Quitte la sandbox sans promouvoir (revient à la population réelle). */
export function exitSandbox(): void {
  sandboxState.set(null);
  resetReproMode();
  currentView.set('liste');
}

/** Règle l'année sélectionnée, bornée à [birthYear, currentYear]. */
export function setSandboxYear(year: number): void {
  const s = get(sandboxState);
  if (!s) return;
  const min = s.parameters.birthYear;
  const max = s.currentYear;
  sandboxYear.set(Math.min(Math.max(Math.floor(year), min), max));
}

// --- Mode reproduction manuelle ---

export function startManualRepro(): void {
  reproMode.set(true);
  reproSelected.set(new Set());
  sandboxError.set(null);
}

export function toggleReproSelect(id: string): void {
  reproSelected.update((set) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

export function setReproChildCount(n: number): void {
  reproChildCount.set(Math.max(1, Math.floor(Number.isFinite(n) ? n : 1)));
}

/** Valide la reproduction : produit `count` enfants dans l'année sélectionnée, sort du mode + vide. */
export function validateRepro(): void {
  const s = get(sandboxState);
  if (!s) return;
  const ids = [...get(reproSelected)];
  if (ids.length === 0) return;
  const count = get(reproChildCount);
  const next = manualReproduce(s, ids, count, get(sandboxYear), sbRng);
  sandboxState.set(next);
  reproLastParents.set(ids);
  reproMode.set(false);
  reproSelected.set(new Set());
}

/** Annule : vide la sélection et sort du mode, sans reproduire. */
export function cancelRepro(): void {
  reproMode.set(false);
  reproSelected.set(new Set());
}

/** Re-sélectionne les parents de la dernière reproduction (ignore les individus absents). */
export function reselectLastParents(): void {
  const s = get(sandboxState);
  const present = new Set((s?.population ?? []).map((p) => p.id));
  reproSelected.set(new Set(get(reproLastParents).filter((id) => present.has(id))));
}

// --- Création / clonage / édition / suppression ---

export function sbCreatePerson(draft: PersonDraft): void {
  const s = get(sandboxState);
  if (!s) return;
  sandboxState.set(createPersonCore(s, draft, nextPersonId(s)));
}

export function sbClonePerson(sourceId: string): void {
  const s = get(sandboxState);
  if (!s) return;
  sandboxState.set(clonePersonCore(s, sourceId, nextPersonId(s)));
}

export function sbEditPerson(id: string, patch: PersonPatch): void {
  const s = get(sandboxState);
  if (!s) return;
  sandboxState.set(editPersonCore(s, id, patch));
}

/** Supprime un individu ; renvoie un message d'erreur (descendants) ou `null` en cas de succès. */
export function sbDeletePerson(id: string): string | null {
  const s = get(sandboxState);
  if (!s) return null;
  const res = deletePersonCore(s, id);
  if (!res.ok) {
    sandboxError.set(res.error);
    return res.error;
  }
  sandboxError.set(null);
  sandboxState.set(res.value);
  return null;
}

// --- Édition du cycle de vie conjugal (BUG-001 volet B) — à l'année sélectionnée ---

/** Forme un couple « actuel » entre deux individus ; message d'erreur ou `null`. */
export function sbFormCouple(aId: string, bId: string): string | null {
  const s = get(sandboxState);
  if (!s) return null;
  const res = formCoupleCore(s, aId, bId, get(sandboxYear));
  if (!res.ok) {
    sandboxError.set(res.error);
    return res.error;
  }
  sandboxError.set(null);
  sandboxState.set(res.value);
  return null;
}

/** Divorce/sépare un couple actif (conjoints → « ex ») ; message d'erreur ou `null`. */
export function sbDivorceCouple(coupleId: string): string | null {
  const s = get(sandboxState);
  if (!s) return null;
  const res = divorceCoupleCore(s, coupleId, get(sandboxYear));
  if (!res.ok) {
    sandboxError.set(res.error);
    return res.error;
  }
  sandboxError.set(null);
  sandboxState.set(res.value);
  return null;
}

/** Dissout totalement un lien conjugal (retour célibataire) ; message d'erreur ou `null`. */
export function sbDissolveConjugalLink(coupleId: string): string | null {
  const s = get(sandboxState);
  if (!s) return null;
  const res = dissolveConjugalLinkCore(s, coupleId);
  if (!res.ok) {
    sandboxError.set(res.error);
    return res.error;
  }
  sandboxError.set(null);
  sandboxState.set(res.value);
  return null;
}

// --- Génération de pouvoirs pour le formulaire (BUG-001 volet A) — consomme le RNG forké. ---

/** Génère un pouvoir de **mutation forte** (ou aucun si types/poids le rendent impossible). */
export function sbGenerateStrongPower(): Pouvoir[] {
  const s = get(sandboxState);
  if (!s) return [];
  const p = generateStrongMutationPower(s.catalog, s.parameters, sbRng);
  return p ? [p] : [];
}

/** Dérive les pouvoirs de **mutation normale** depuis les traits actifs de l'ADN (peut enrichir l'ADN). */
export function sbDerivePowers(adn: ADN): { pouvoirs: Pouvoir[]; adn: ADN } {
  const s = get(sandboxState);
  if (!s) return { pouvoirs: [], adn };
  return derivePowersFromTraits(adn, s.catalog, s.parameters, sbRng);
}
