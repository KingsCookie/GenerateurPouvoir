<script lang="ts">
  import { population, currentYear, catalog, selectPerson } from '../stores/appState.js';
  import { criteria, generationTouched } from '../stores/filters.js';
  import { buildListRow } from '../lib/ficheViewModel.js';
  import { filterPopulation, lastGeneration } from '../../core/index.js';
  import TimeBar from '../components/TimeBar.svelte';
  import FilterBar from '../components/FilterBar.svelte';

  // Défaut dynamique : tant que le filtre génération n'a pas été touché, on affiche la dernière
  // génération recalculée à chaque avancée du temps (FR-011a / INV-G5).
  $: derniere = lastGeneration($population);
  $: effectiveGenerations =
    $generationTouched || derniere === null ? $criteria.generations : new Set<number>([derniere]);
  $: effectiveCriteria = { ...$criteria, generations: effectiveGenerations };
  // Année courante issue de la simulation (Feature 3) ; l'âge en découle.
  $: filtered = filterPopulation($population, effectiveCriteria, { currentYear: $currentYear });
  $: rows = filtered.map((p) => buildListRow(p, $catalog, $currentYear));
</script>

<section>
  <h2>Population — {rows.length} / {$population.length} individu(s)</h2>

  {#if $population.length === 0}
    <p class="empty">Aucune population générée. Rendez-vous dans les paramètres pour générer.</p>
  {:else}
    <TimeBar />
    <FilterBar />
    {#if rows.length === 0}
      <p class="empty">Aucun individu ne correspond aux filtres.</p>
    {/if}
    <table>
      <thead>
        <tr>
          <th>Nom</th>
          <th>Date de naissance</th>
          <th>Âge</th>
          <th>Pouvoir(s)</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.id)}
          <tr
            on:click={() => selectPerson(row.id)}
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectPerson(row.id)}
            tabindex="0"
            role="button"
          >
            <td>{row.nom}</td>
            <td class="mono">{row.dateNaissance}</td>
            <td>{row.age}</td>
            <td>
              {#if row.pouvoirs.length === 0}
                <span class="muted">—</span>
              {:else}
                {#each row.pouvoirs as pouvoir}
                  <div class="pouvoir">{pouvoir}</div>
                {/each}
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
  .mono {
    font-family: ui-monospace, monospace;
  }
  .muted {
    color: var(--fg-muted);
  }
  .pouvoir + .pouvoir {
    margin-top: 0.15rem;
  }
  .empty {
    color: var(--fg-muted);
  }
</style>
