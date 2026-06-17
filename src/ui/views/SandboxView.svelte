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
    sbFormCouple,
    sbDivorceCouple,
    sbDissolveConjugalLink,
  } from '../stores/sandboxStore.js';
  import { catalog } from '../stores/appState.js';
  import { criteria, generationTouched } from '../stores/filters.js';
  import { filterPopulation, lastGeneration, type Personne } from '../../core/index.js';
  import { buildListRow } from '../lib/ficheViewModel.js';
  import FilterBar from '../components/FilterBar.svelte';
  import SandboxPersonForm from '../components/SandboxPersonForm.svelte';

  $: view = $sandboxView;
  // Filtrage (BUG-002) : mêmes filtres que la liste principale, appliqués à l'état RECONSTRUIT à l'année.
  $: derniere = view ? lastGeneration(view.population) : null;
  $: effectiveGenerations =
    $generationTouched || derniere === null ? $criteria.generations : new Set<number>([derniere]);
  $: effectiveCriteria = { ...$criteria, generations: effectiveGenerations };
  $: filtered = view
    ? filterPopulation(view.population, effectiveCriteria, { currentYear: $sandboxYear })
    : [];
  $: rows = filtered.map((p) => buildListRow(p, $catalog, $sandboxYear));
  $: minYear = $sandboxState ? $sandboxState.parameters.birthYear : 0;
  $: maxYear = $sandboxState ? $sandboxState.currentYear : 0;
  $: selectedCount = $reproSelected.size;

  // --- Formulaire de création / édition (BUG-001 volet A) ---
  let formOpen = false;
  let formMode: 'create' | 'edit' = 'create';
  let editingPerson: Personne | null = null;

  function openCreate() {
    formMode = 'create';
    editingPerson = null;
    formOpen = true;
  }
  function openEdit(id: string) {
    const p = $sandboxState?.population.find((x) => x.id === id) ?? null;
    if (!p) return;
    formMode = 'edit';
    editingPerson = p;
    formOpen = true;
  }

  // --- Édition des couples (BUG-001 volet B) ---
  let coupleA = '';
  let coupleB = '';
  $: nameById = new Map(($sandboxState?.population ?? []).map((p) => [p.id, p.nom]));
  $: activeCoupleIds = new Set(($sandboxState?.couples ?? []).map((c) => c.id));
  // Couples connus (depuis le journal) : actifs ou divorcés (« ex »). Purgés à la dissolution.
  $: coupleList = (() => {
    const seen = new Map<string, { id: string; memberIds: string[]; active: boolean }>();
    for (const e of $sandboxState?.history ?? []) {
      if (e.kind === 'couple') {
        seen.set(e.coupleId, {
          id: e.coupleId,
          memberIds: e.memberIds,
          active: activeCoupleIds.has(e.coupleId),
        });
      }
    }
    return [...seen.values()];
  })();

  function formCoupleNow() {
    if (!coupleA || !coupleB) return;
    sbFormCouple(coupleA, coupleB);
  }
  function nom(id: string): string {
    return nameById.get(id) ?? id;
  }
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

    <!-- Édition des couples (cycle de vie conjugal) -->
    {#if !$reproMode}
      <details class="couples">
        <summary>Couples & cycle de vie conjugal</summary>
        <div class="form-couple">
          <label>
            A
            <select bind:value={coupleA}>
              <option value="" disabled>— choisir —</option>
              {#each $sandboxState.population as p (p.id)}<option value={p.id}>{p.nom}</option
                >{/each}
            </select>
          </label>
          <label>
            B
            <select bind:value={coupleB}>
              <option value="" disabled>— choisir —</option>
              {#each $sandboxState.population as p (p.id)}<option value={p.id}>{p.nom}</option
                >{/each}
            </select>
          </label>
          <button
            type="button"
            on:click={formCoupleNow}
            disabled={!coupleA || !coupleB || coupleA === coupleB}
            >Former le couple (année {$sandboxYear})</button
          >
        </div>
        {#if coupleList.length === 0}
          <p class="muted">Aucun couple.</p>
        {:else}
          <ul class="couple-list">
            {#each coupleList as c (c.id)}
              <li>
                <span>{c.memberIds.map(nom).join(' ⚭ ')}</span>
                <span class="badge" class:ex={!c.active}>{c.active ? 'actuel' : 'ex'}</span>
                {#if c.active}
                  <button type="button" on:click={() => sbDivorceCouple(c.id)}>Divorcer</button>
                {/if}
                <button type="button" class="danger" on:click={() => sbDissolveConjugalLink(c.id)}
                  >Dissoudre</button
                >
              </li>
            {/each}
          </ul>
        {/if}
      </details>
    {/if}

    <!-- Filtres (parité avec la liste principale, BUG-002) -->
    <FilterBar />

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
    {#if rows.length === 0}
      <p class="empty">Aucun individu ne correspond aux filtres.</p>
    {/if}
  </section>

  {#if formOpen}
    <SandboxPersonForm
      mode={formMode}
      person={editingPerson}
      year={$sandboxYear}
      onClose={() => (formOpen = false)}
    />
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
  .couples {
    margin: 0.6rem 0;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.5rem 0.7rem;
    background: var(--bg-elev);
  }
  .couples summary {
    cursor: pointer;
    font-weight: 600;
  }
  .form-couple {
    display: flex;
    gap: 0.6rem;
    align-items: flex-end;
    flex-wrap: wrap;
    margin: 0.5rem 0;
  }
  .form-couple label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.82rem;
  }
  .couple-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .couple-list li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .badge {
    font-size: 0.74rem;
    padding: 0.05rem 0.4rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--accent) 25%, transparent);
  }
  .badge.ex {
    background: color-mix(in srgb, var(--fg-muted) 25%, transparent);
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
  .empty {
    color: var(--fg-muted);
  }
</style>
