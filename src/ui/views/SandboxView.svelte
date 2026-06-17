<script lang="ts">
  import {
    sandboxState,
    sandboxView,
    sandboxYear,
    setSandboxYear,
    reproMode,
    reproSelected,
    reproChildCount,
    setReproChildCount,
    startManualRepro,
    toggleReproSelect,
    validateRepro,
    cancelRepro,
    reselectLastParents,
    makeItReal,
    resetSandbox,
    exitSandbox,
    sandboxError,
    sbClonePerson,
    sbDeletePerson,
    sbCreatePerson,
    sbEditPerson,
  } from '../stores/sandboxStore.js';
  import { catalog, especes } from '../stores/appState.js';
  import { buildListRow } from '../lib/ficheViewModel.js';
  import type { PersonDraft } from '../../core/index.js';

  $: view = $sandboxView;
  $: rows = view ? view.population.map((p) => buildListRow(p, $catalog, $sandboxYear)) : [];
  $: minYear = $sandboxState ? $sandboxState.parameters.birthYear : 0;
  $: maxYear = $sandboxState ? $sandboxState.currentYear : 0;
  $: selectedCount = $reproSelected.size;

  // --- Formulaire de création / édition ---
  let formOpen = false;
  let editingId: string | null = null;
  let fNom = '';
  let fEspeceId = '';
  let fGenreId = '';
  let fNotes = '';
  let fVivant = true;

  function openCreate() {
    editingId = null;
    fNom = 'Nouvel individu';
    fEspeceId = $especes[0]?.id ?? 'humain';
    fGenreId = $especes[0]?.genres[0]?.id ?? 'tout';
    fNotes = '';
    fVivant = true;
    formOpen = true;
  }

  function openEdit(id: string) {
    const p = $sandboxState?.population.find((x) => x.id === id);
    if (!p) return;
    editingId = id;
    fNom = p.nom;
    fEspeceId = p.especeId;
    fGenreId = p.genreId;
    fNotes = p.notes ?? '';
    fVivant = p.vivant;
    formOpen = true;
  }

  function submitForm() {
    if (editingId) {
      sbEditPerson(editingId, {
        nom: fNom,
        especeId: fEspeceId,
        genreId: fGenreId,
        notes: fNotes || null,
        vivant: fVivant,
      });
    } else {
      const yyyy = String(Math.abs($sandboxYear)).padStart(4, '0');
      const draft: PersonDraft = {
        nom: fNom,
        especeId: fEspeceId,
        genreId: fGenreId,
        dateNaissance: `${yyyy}-01-01`,
        vivant: fVivant,
        raisonDeces: null,
        adn: { traits: [] },
        pouvoirs: [],
        notes: fNotes || null,
      };
      sbCreatePerson(draft);
    }
    formOpen = false;
  }

  $: genresForEspece = $especes.find((e) => e.id === fEspeceId)?.genres ?? [];
</script>

{#if !$sandboxState}
  <p class="empty">La sandbox n'est pas ouverte.</p>
{:else}
  <section>
    <div class="bar">
      <h2>Bac à sable — année {$sandboxYear}</h2>
      <div class="actions">
        <button type="button" class="primary" on:click={makeItReal}>✔ Make it real</button>
        <button type="button" on:click={resetSandbox}>↺ Reset</button>
        <button type="button" on:click={exitSandbox}>✕ Quitter (sans appliquer)</button>
      </div>
    </div>

    <div class="year">
      <label for="sb-year">Voir l'état à l'année : <strong>{$sandboxYear}</strong></label>
      <input
        id="sb-year"
        type="range"
        min={minYear}
        max={maxYear}
        value={$sandboxYear}
        on:input={(e) => setSandboxYear(Number((e.target as HTMLInputElement).value))}
      />
      <span class="muted">[{minYear} … {maxYear}]</span>
    </div>

    <!-- Mode reproduction manuelle -->
    {#if !$reproMode}
      <div class="repro">
        <button type="button" on:click={startManualRepro}>👶 Reproduction manuelle</button>
        <button type="button" on:click={openCreate}>＋ Créer un individu</button>
      </div>
    {:else}
      <div class="repro mode" role="region" aria-label="Reproduction manuelle">
        <span>{selectedCount} parent(s) sélectionné(s)</span>
        <label>
          Nombre d'enfants
          <input
            type="number"
            min="1"
            value={$reproChildCount}
            on:input={(e) => setReproChildCount(Number((e.target as HTMLInputElement).value))}
          />
        </label>
        <button
          type="button"
          class="primary"
          on:click={validateRepro}
          disabled={selectedCount === 0}
        >
          Valider
        </button>
        <button type="button" on:click={cancelRepro}>Annuler</button>
        <button type="button" on:click={reselectLastParents}
          >Re-sélectionner les derniers parents</button
        >
      </div>
    {/if}

    {#if $sandboxError}
      <p class="error" role="alert">{$sandboxError}</p>
    {/if}

    <table>
      <thead>
        <tr>
          {#if $reproMode}<th class="sel"></th>{/if}
          <th>Nom</th>
          <th>Naissance</th>
          <th>Âge</th>
          <th>Pouvoir(s)</th>
          {#if !$reproMode}<th>Actions</th>{/if}
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.id)}
          <tr
            class:selected={$reproSelected.has(row.id)}
            on:click={() => $reproMode && toggleReproSelect(row.id)}
          >
            {#if $reproMode}
              <td class="sel">
                <input
                  type="checkbox"
                  checked={$reproSelected.has(row.id)}
                  on:change|stopPropagation={() => toggleReproSelect(row.id)}
                  aria-label={`Sélectionner ${row.nom}`}
                />
              </td>
            {/if}
            <td>{row.nom}</td>
            <td class="mono">{row.dateNaissance}</td>
            <td>{row.age}</td>
            <td>
              {#if row.pouvoirs.length === 0}<span class="muted">—</span
                >{:else}{#each row.pouvoirs as pw}<div>{pw}</div>{/each}{/if}
            </td>
            {#if !$reproMode}
              <td class="row-actions">
                <button type="button" on:click|stopPropagation={() => openEdit(row.id)}
                  >Éditer</button
                >
                <button type="button" on:click|stopPropagation={() => sbClonePerson(row.id)}
                  >Cloner</button
                >
                <button
                  type="button"
                  class="danger"
                  on:click|stopPropagation={() => sbDeletePerson(row.id)}>Supprimer</button
                >
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  {#if formOpen}
    <div
      class="form"
      role="dialog"
      aria-label={editingId ? 'Éditer un individu' : 'Créer un individu'}
    >
      <h3>{editingId ? 'Éditer' : 'Créer'} un individu</h3>
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
      <label>Notes <input type="text" bind:value={fNotes} /></label>
      <label class="inline"><input type="checkbox" bind:checked={fVivant} /> Vivant</label>
      <div class="form-actions">
        <button type="button" class="primary" on:click={submitForm}
          >{editingId ? 'Enregistrer' : 'Créer'}</button
        >
        <button type="button" on:click={() => (formOpen = false)}>Annuler</button>
      </div>
      <p class="muted">
        Astuce : pour un ADN/des pouvoirs précis, clonez un individu existant puis éditez.
      </p>
    </div>
  {/if}
{/if}

<style>
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .actions,
  .repro {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .repro {
    margin: 0.8rem 0;
    align-items: center;
  }
  .repro.mode {
    padding: 0.6rem 0.8rem;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .year {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    margin: 0.6rem 0;
  }
  .year input[type='range'] {
    flex: 1 1 12rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    text-align: left;
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid var(--border);
  }
  tbody tr.selected {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
  }
  .sel {
    width: 2.2rem;
    text-align: center;
  }
  .row-actions {
    display: flex;
    gap: 0.3rem;
    flex-wrap: wrap;
  }
  .mono {
    font-family: ui-monospace, monospace;
  }
  .muted {
    color: var(--fg-muted);
  }
  .danger {
    color: var(--danger);
  }
  .error {
    color: var(--danger);
  }
  .form {
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-elev);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 28rem;
  }
  .form label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .form label.inline {
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
  }
  .form-actions {
    display: flex;
    gap: 0.5rem;
  }
  .empty {
    color: var(--fg-muted);
  }
</style>
