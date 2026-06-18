<script lang="ts">
  // Formulaire complet de création / édition d'un individu dans la sandbox (BUG-001 volet A).
  // Expose TOUS les attributs caractérisants : nom, espèce, genre, statut (vivant + raisonDeces),
  // ADN/traits (actif + résilience), et profil de pouvoir (sans-pouvoir / mutation normale / forte).
  // La parenté (parents/enfants/conjoints) n'est PAS éditée ici (réservée à la reproduction / aux
  // opérations conjugales dédiées).
  import {
    TRAIT_TYPES,
    type Personne,
    type ResilientTrait,
    type Pouvoir,
  } from '../../core/index.js';
  import { catalog, especes } from '../stores/appState.js';
  import { traitLabelOf } from '../lib/ficheViewModel.js';
  import {
    sbCreatePerson,
    sbEditPerson,
    sbGenerateStrongPower,
    sbDerivePowers,
  } from '../stores/sandboxStore.js';

  export let mode: 'create' | 'edit' = 'create';
  export let person: Personne | null = null;
  export let year = 0;
  export let onClose: () => void = () => {};

  // Fermeture par Échap (la modale capte le focus visuellement ; backdrop cliquable aussi).
  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') onClose();
  }

  // --- État local du formulaire ---
  let fNom = '';
  let fEspeceId = '';
  let fGenreId = '';
  let fNotes = '';
  let fVivant = true;
  let fRaisonDeces = '';
  let fAdn: ResilientTrait[] = [];
  let fPouvoirs: Pouvoir[] = [];

  // Initialisation (réactive au changement de mode/personne).
  function init() {
    if (mode === 'edit' && person) {
      fNom = person.nom;
      fEspeceId = person.especeId;
      fGenreId = person.genreId;
      fNotes = person.notes ?? '';
      fVivant = person.vivant;
      fRaisonDeces = person.raisonDeces ?? '';
      fAdn = person.adn.traits.map((t) => ({ ...t }));
      fPouvoirs = person.pouvoirs.map((p) => ({ ...p, traitIds: [...p.traitIds] }));
    } else {
      fNom = 'Nouvel individu';
      fEspeceId = $especes[0]?.id ?? 'humain';
      fGenreId = $especes[0]?.genres[0]?.id ?? 'tout';
      fNotes = '';
      fVivant = true;
      fRaisonDeces = '';
      fAdn = [];
      fPouvoirs = [];
    }
  }
  // Réinitialise quand on (ré)ouvre le formulaire pour une autre cible (dépend de person & mode).
  function reinit(_p: Personne | null, _m: 'create' | 'edit'): void {
    init();
  }
  $: reinit(person, mode);

  $: genresForEspece = $especes.find((e) => e.id === fEspeceId)?.genres ?? [];
  $: idx = (() => {
    const m = new Map<string, string>();
    for (const list of Object.values($catalog.byType)) for (const t of list) m.set(t.id, t.label);
    return m;
  })();

  // --- Édition de l'ADN (traits) ---
  function hasTrait(traitId: string): boolean {
    return fAdn.some((t) => t.traitId === traitId);
  }
  function toggleTrait(traitId: string): void {
    fAdn = hasTrait(traitId)
      ? fAdn.filter((t) => t.traitId !== traitId)
      : [...fAdn, { traitId, active: true, resilience: 50 }];
  }
  function setTraitActive(traitId: string, active: boolean): void {
    fAdn = fAdn.map((t) => (t.traitId === traitId ? { ...t, active } : t));
  }
  function setTraitResilience(traitId: string, resilience: number): void {
    const r = Math.min(100, Math.max(0, Math.floor(Number.isFinite(resilience) ? resilience : 0)));
    fAdn = fAdn.map((t) => (t.traitId === traitId ? { ...t, resilience: r } : t));
  }
  function traitEntry(traitId: string): ResilientTrait | undefined {
    return fAdn.find((t) => t.traitId === traitId);
  }

  // --- Profil de pouvoir ---
  function setSansPouvoir(): void {
    fPouvoirs = [];
  }
  function genMutationNormale(): void {
    const r = sbDerivePowers({ traits: fAdn });
    fAdn = r.adn.traits.map((t) => ({ ...t })); // la génération « K » peut enrichir l'ADN
    fPouvoirs = r.pouvoirs;
  }
  function genMutationForte(): void {
    fPouvoirs = sbGenerateStrongPower();
  }
  function setPuissance(i: number, v: number): void {
    const n = Math.min(10, Math.max(1, Math.floor(Number.isFinite(v) ? v : 1)));
    fPouvoirs = fPouvoirs.map((p, j) => (j === i ? { ...p, puissance: n } : p));
  }
  function setMaitrise(i: number, v: number): void {
    const n = Math.min(10, Math.max(1, Math.floor(Number.isFinite(v) ? v : 1)));
    fPouvoirs = fPouvoirs.map((p, j) => (j === i ? { ...p, maitrise: n } : p));
  }
  function removePouvoir(i: number): void {
    fPouvoirs = fPouvoirs.filter((_, j) => j !== i);
  }

  function submit(): void {
    const common = {
      nom: fNom,
      especeId: fEspeceId,
      genreId: fGenreId,
      vivant: fVivant,
      raisonDeces: fVivant ? null : fRaisonDeces.trim() || 'inconnue',
      adn: { traits: fAdn },
      pouvoirs: fPouvoirs,
      notes: fNotes.trim() || null,
    };
    if (mode === 'edit' && person) {
      sbEditPerson(person.id, common);
    } else {
      const yyyy = String(Math.abs(year)).padStart(4, '0');
      sbCreatePerson({ ...common, dateNaissance: `${yyyy}-01-01` });
    }
    onClose();
  }
</script>

<svelte:window on:keydown={onKeydown} />

<!-- Fermeture par clic sur le fond ; le clavier ferme via Échap (svelte:window on:keydown). -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="overlay" on:click={onClose} role="presentation">
  <div
    class="modal"
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-label={mode === 'edit' ? 'Éditer un individu' : 'Créer un individu'}
    on:click|stopPropagation
  >
    <h3>{mode === 'edit' ? 'Éditer' : 'Créer'} un individu</h3>

    <div class="grid">
      <label>Nom <input type="text" bind:value={fNom} /></label>
      <label>
        Espèce
        <select bind:value={fEspeceId}>
          {#each $especes as e (e.id)}<option value={e.id}>{e.label}</option>{/each}
        </select>
      </label>
      <label>
        Genre
        <select bind:value={fGenreId}>
          {#each genresForEspece as g (g.id)}<option value={g.id}>{g.label}</option>{/each}
        </select>
      </label>
      <div class="statut-seg" role="group" aria-label="Statut">
        <span class="field-label">Statut</span>
        <div class="segments">
          <button
            type="button"
            class="nav-item"
            class:is-active={fVivant}
            on:click={() => (fVivant = true)}>Vivant</button
          >
          <button
            type="button"
            class="nav-item"
            class:is-active={!fVivant}
            on:click={() => (fVivant = false)}>Décédé</button
          >
        </div>
      </div>
      {#if !fVivant}
        <label
          >Raison du décès <input
            type="text"
            bind:value={fRaisonDeces}
            placeholder="inconnue"
          /></label
        >
      {/if}
    </div>

    <label>Notes <input type="text" bind:value={fNotes} /></label>

    <!-- Profil de pouvoir -->
    <fieldset>
      <legend>Profil de pouvoir</legend>
      <div class="actions">
        <button type="button" on:click={setSansPouvoir}>Sans pouvoir</button>
        <button type="button" on:click={genMutationNormale}
          >Mutation normale (traits → pouvoirs)</button
        >
        <button type="button" on:click={genMutationForte}>Mutation forte</button>
      </div>
      {#if fPouvoirs.length === 0}
        <p class="muted">Aucun pouvoir.</p>
      {:else}
        <ul class="powers">
          {#each fPouvoirs as p, i (p.id + i)}
            <li>
              <span class="pw-label">{p.label}</span>
              <label class="stat"
                >P <input
                  type="number"
                  min="1"
                  max="10"
                  value={p.puissance}
                  on:input={(e) => setPuissance(i, Number((e.target as HTMLInputElement).value))}
                /></label
              >
              <label class="stat"
                >M <input
                  type="number"
                  min="1"
                  max="10"
                  value={p.maitrise}
                  on:input={(e) => setMaitrise(i, Number((e.target as HTMLInputElement).value))}
                /></label
              >
              <button type="button" class="danger" on:click={() => removePouvoir(i)}>✕</button>
            </li>
          {/each}
        </ul>
      {/if}
    </fieldset>

    <!-- ADN / traits -->
    <fieldset>
      <legend>ADN / traits ({fAdn.length} sélectionné(s))</legend>
      {#each TRAIT_TYPES as type (type)}
        <details>
          <summary>{type}</summary>
          <div class="traits">
            {#each $catalog.byType[type] as t (t.id)}
              {@const entry = traitEntry(t.id)}
              <div class="trait-row">
                <label class="chip">
                  <input
                    type="checkbox"
                    checked={hasTrait(t.id)}
                    on:change={() => toggleTrait(t.id)}
                  />
                  {traitLabelOf(idx, t.id)}
                </label>
                {#if entry}
                  <label class="mini"
                    ><input
                      type="checkbox"
                      checked={entry.active}
                      on:change={(e) =>
                        setTraitActive(t.id, (e.target as HTMLInputElement).checked)}
                    /> actif</label
                  >
                  <label class="mini"
                    >rés. <input
                      type="number"
                      min="0"
                      max="100"
                      value={entry.resilience}
                      on:input={(e) =>
                        setTraitResilience(t.id, Number((e.target as HTMLInputElement).value))}
                    /></label
                  >
                {/if}
              </div>
            {/each}
          </div>
        </details>
      {/each}
    </fieldset>

    <div class="form-actions">
      <button type="button" on:click={onClose} class="contour">Annuler</button>
      <button type="button" class="primary" on:click={submit}
        >{mode === 'edit' ? 'Enregistrer' : 'Créer'}</button
      >
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 5vh 1rem;
    overflow-y: auto;
  }
  .modal {
    padding: 22px 24px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-elev);
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    width: 100%;
    max-width: 640px;
    max-height: 86vh;
    overflow-y: auto;
  }
  .statut-seg {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .segments {
    display: inline-flex;
    gap: 5px;
  }
  .nav-item {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--fg-muted);
    border-radius: var(--chip-radius);
    padding: 6px 13px;
    font-size: 13px;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    align-items: flex-end;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.85rem;
  }
  fieldset {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.5rem 0.7rem;
  }
  legend {
    font-size: 0.8rem;
    color: var(--fg-muted);
    padding: 0 0.3rem;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.4rem;
  }
  .powers {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .powers li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .pw-label {
    flex: 1 1 12rem;
    font-weight: 600;
  }
  .stat {
    flex-direction: row;
    align-items: center;
    gap: 0.2rem;
  }
  .stat input {
    width: 3.2rem;
  }
  .traits {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 14rem;
    overflow-y: auto;
    margin-top: 0.3rem;
  }
  .trait-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .chip {
    flex-direction: row;
    align-items: center;
    gap: 0.25rem;
    flex: 1 1 14rem;
  }
  .mini {
    flex-direction: row;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.78rem;
    color: var(--fg-muted);
  }
  .mini input[type='number'] {
    width: 3.2rem;
  }
  summary {
    cursor: pointer;
    font-size: 0.85rem;
  }
  .form-actions {
    display: flex;
    gap: 0.5rem;
  }
  .muted {
    color: var(--fg-muted);
    margin: 0;
  }
  .danger {
    color: var(--danger);
  }
</style>
