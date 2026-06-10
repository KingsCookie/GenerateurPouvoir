<script lang="ts">
  import {
    population,
    currentYear,
    getCatalog,
    selectPerson,
    selectedIds,
    toggleSelect,
  } from '../stores/appState.js';
  import { criteria, generationTouched } from '../stores/filters.js';
  import { buildListRow } from '../lib/ficheViewModel.js';
  import { filterPopulation, lastGeneration } from '../../core/index.js';
  import ReproduceBar from '../components/ReproduceBar.svelte';
  import TimeBar from '../components/TimeBar.svelte';
  import FilterBar from '../components/FilterBar.svelte';

  const catalog = getCatalog();

  // Défaut dynamique : tant que le filtre génération n'a pas été touché, on affiche la dernière
  // génération recalculée à chaque avancée du temps (FR-011a / INV-G5).
  $: derniere = lastGeneration($population);
  $: effectiveGenerations =
    $generationTouched || derniere === null ? $criteria.generations : new Set<number>([derniere]);
  $: effectiveCriteria = { ...$criteria, generations: effectiveGenerations };
  // Année courante issue de la simulation (Feature 3) ; l'âge en découle.
  $: filtered = filterPopulation($population, effectiveCriteria, { currentYear: $currentYear });
  $: rows = filtered.map((p) => buildListRow(p, catalog, $currentYear));
</script>

<section>
  <h2>Population — {rows.length} / {$population.length} individu(s)</h2>

  {#if $population.length === 0}
    <p class="empty">Aucune population générée. Rendez-vous dans les paramètres pour générer.</p>
  {:else}
    <TimeBar />
    <ReproduceBar />
    <FilterBar />
    {#if rows.length === 0}
      <p class="empty">Aucun individu ne correspond aux filtres.</p>
    {/if}
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
  .pouvoir + .pouvoir {
    margin-top: 0.15rem;
  }
  .empty {
    color: var(--fg-muted);
  }
</style>
