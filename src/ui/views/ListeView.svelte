<script lang="ts">
  import {
    population,
    currentYear,
    getCatalog,
    selectPerson,
    selectedIds,
    toggleSelect,
  } from '../stores/appState.js';
  import { buildListRow } from '../lib/ficheViewModel.js';
  import ReproduceBar from '../components/ReproduceBar.svelte';
  import TimeBar from '../components/TimeBar.svelte';

  const catalog = getCatalog();
  // Année courante issue de la simulation (Feature 3) ; l'âge en découle.
  $: rows = $population.map((p) => buildListRow(p, catalog, $currentYear));
</script>

<section>
  <h2>Population — {$population.length} individu(s)</h2>

  {#if $population.length === 0}
    <p class="empty">Aucune population générée. Rendez-vous dans les paramètres pour générer.</p>
  {:else}
    <TimeBar />
    <ReproduceBar />
    <table>
      <thead>
        <tr>
          <th class="sel" aria-label="Sélection"></th>
          <th>Nom</th>
          <th>Date de naissance</th>
          <th>Âge</th>
          <th>Pouvoir(s)</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.id)}
          <tr
            class:selected={$selectedIds.has(row.id)}
            on:click={() => selectPerson(row.id)}
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectPerson(row.id)}
            tabindex="0"
            role="button"
          >
            <td class="sel">
              <!-- Le clic sur la case ne doit pas ouvrir la fiche. -->
              <input
                type="checkbox"
                checked={$selectedIds.has(row.id)}
                on:click|stopPropagation
                on:change={() => toggleSelect(row.id)}
                aria-label={`Sélectionner ${row.nom}`}
              />
            </td>
            <td>{row.nom}</td>
            <td class="mono">{row.dateNaissance}</td>
            <td>{row.age}</td>
            <td>
              {#if row.pouvoirs.length === 0}
                <span class="muted">—</span>
              {:else}
                {row.pouvoirs.join(', ')}
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    text-align: left;
    padding: 0.5rem 0.6rem;
    border-bottom: 1px solid var(--border);
  }
  th {
    color: var(--fg-muted);
    font-weight: 600;
  }
  tbody tr {
    cursor: pointer;
  }
  tbody tr:hover {
    background: var(--bg-elev);
  }
  tbody tr.selected {
    background: color-mix(in srgb, var(--accent) 18%, transparent);
  }
  .sel {
    width: 2.2rem;
    text-align: center;
  }
  .sel input {
    width: 1.1rem;
    height: 1.1rem;
    cursor: pointer;
  }
  .mono {
    font-family: ui-monospace, monospace;
  }
  .muted {
    color: var(--fg-muted);
  }
  .empty {
    color: var(--fg-muted);
  }
</style>
