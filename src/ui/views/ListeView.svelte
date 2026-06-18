<script lang="ts">
  import { population, currentYear, catalog, selectPerson } from '../stores/appState.js';
  import { criteria, generationTouched } from '../stores/filters.js';
  import { buildListRow } from '../lib/ficheViewModel.js';
  import { paginate } from '../lib/pagination.js';
  import { listePage, listePageSize, setListePageSize, type PageSize } from '../stores/ui.js';
  import { filterPopulation, lastGeneration } from '../../core/index.js';
  import TimeBar from '../components/TimeBar.svelte';
  import FilterBar from '../components/FilterBar.svelte';
  import Paginator from '../components/Paginator.svelte';

  // Défaut dynamique : tant que le filtre génération n'a pas été touché, on affiche la dernière
  // génération recalculée à chaque avancée du temps (FR-011a / INV-G5).
  $: derniere = lastGeneration($population);
  $: effectiveGenerations =
    $generationTouched || derniere === null ? $criteria.generations : new Set<number>([derniere]);
  $: effectiveCriteria = { ...$criteria, generations: effectiveGenerations };
  // Année courante issue de la simulation (Feature 3) ; l'âge en découle.
  $: filtered = filterPopulation($population, effectiveCriteria, { currentYear: $currentYear });
  $: rows = filtered.map((p) => buildListRow(p, $catalog, $currentYear));

  // Pagination présentationnelle sur la liste filtrée (FR-016 ; INV-UI4).
  $: pageInfo = paginate(rows, $listePage, $listePageSize);
  // Garde-fou : si la page courante dépasse (filtre réduit la liste), on la réaligne.
  $: if (pageInfo.page !== $listePage) listePage.set(pageInfo.page);

  function onSize(e: CustomEvent<PageSize>) {
    setListePageSize(e.detail);
  }
  function onPage(e: CustomEvent<number>) {
    listePage.set(e.detail);
  }
</script>

<section>
  {#if $population.length === 0}
    <h2>Population</h2>
    <p class="empty">Aucune population générée. Rendez-vous dans les paramètres pour générer.</p>
  {:else}
    <TimeBar />
    <FilterBar />

    <div class="results-head">
      <h2>Population</h2>
      <span class="count">{rows.length} / {$population.length} individu(s)</span>
    </div>

    {#if rows.length === 0}
      <p class="empty">Aucun individu ne correspond aux filtres.</p>
    {:else}
      <Paginator
        pageSize={$listePageSize}
        page={pageInfo.page}
        nbPages={pageInfo.nbPages}
        from={pageInfo.from}
        to={pageInfo.to}
        total={pageInfo.total}
        on:sizechange={onSize}
        on:pagechange={onPage}
      />

      <div class="table" role="table" aria-label="Population">
        <div class="thead" role="row">
          <span role="columnheader">Nom</span>
          <span role="columnheader">Date de naissance</span>
          <span role="columnheader">Âge</span>
          <span role="columnheader">Pouvoir(s)</span>
        </div>
        {#each pageInfo.pageItems as row (row.id)}
          <div
            class="trow"
            role="button"
            tabindex="0"
            on:click={() => selectPerson(row.id)}
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectPerson(row.id)}
          >
            <span class="name-cell">
              <span class="name">
                {row.nom}
                {#if !row.vivant}<span class="dead" title="décédé">†</span>{/if}
              </span>
              <span class="sub">{row.especeId} · génération {row.generation}</span>
            </span>
            <span class="mono">{row.dateNaissance}</span>
            <span>{row.age}</span>
            <span class="powers">
              {#if row.pouvoirs.length === 0}
                <span class="muted">—</span>
              {:else}
                {#each row.pouvoirs as pouvoir}
                  <span class="chip">{pouvoir}</span>
                {/each}
              {/if}
            </span>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</section>

<style>
  .results-head {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    margin: 0.5rem 0 0.75rem;
  }
  .results-head h2 {
    margin: 0;
    font-size: 17px;
  }
  .count {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--fg-faint);
  }

  .table {
    display: flex;
    flex-direction: column;
  }
  .thead,
  .trow {
    display: grid;
    grid-template-columns: 1.6fr 1fr 0.5fr 2fr;
    gap: 0.6rem;
    align-items: center;
    padding: 0.55rem 0.6rem;
  }
  .thead {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: var(--label-transform);
    color: var(--fg-faint);
    border-bottom: 1px solid var(--border);
  }
  .trow {
    border-bottom: 1px solid var(--row-border);
    cursor: pointer;
    text-align: left;
    width: 100%;
  }
  .trow:hover,
  .trow:focus-visible {
    background: var(--hover-bg);
  }
  .name-cell {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .name {
    font-weight: 600;
  }
  .dead {
    color: var(--danger);
    margin-left: 4px;
  }
  .sub {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--fg-faint);
  }
  .mono {
    font-family: var(--mono);
    font-size: 13px;
  }
  .powers {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .muted {
    color: var(--fg-muted);
  }
  .empty {
    color: var(--fg-muted);
  }
  @media (max-width: 640px) {
    .thead {
      display: none;
    }
    .trow {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
