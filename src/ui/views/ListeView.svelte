<script lang="ts">
  import { population, parameters, getCatalog, selectPerson } from '../stores/appState.js';
  import { buildListRow } from '../lib/ficheViewModel.js';

  const catalog = getCatalog();
  // En Feature 1, l'année courante = année de naissance ⇒ âge 0 pour tous.
  $: currentYear = $parameters.birthYear;
  $: rows = $population.map((p) => buildListRow(p, catalog, currentYear));
</script>

<section>
  <h2>Population — {$population.length} individu(s)</h2>

  {#if $population.length === 0}
    <p class="empty">Aucune population générée. Rendez-vous dans les paramètres pour générer.</p>
  {:else}
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
          <tr on:click={() => selectPerson(row.id)} tabindex="0" role="button">
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
