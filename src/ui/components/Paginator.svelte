<script lang="ts">
  // Contrôle de pagination réutilisable (Liste & Sandbox) — purement présentationnel (FR-016).
  import { createEventDispatcher } from 'svelte';
  import type { PageSize } from '../stores/ui.js';

  export let pageSize: PageSize;
  export let page: number;
  export let nbPages: number;
  export let from: number;
  export let to: number;
  export let total: number;

  const dispatch = createEventDispatcher<{ sizechange: PageSize; pagechange: number }>();

  const SIZES: { value: PageSize; label: string }[] = [
    { value: 50, label: '50' },
    { value: 100, label: '100' },
    { value: 250, label: '250' },
    { value: 1000, label: '1000' },
    { value: 'all', label: 'Tous' },
  ];

  $: atFirst = page <= 1;
  $: atLast = page >= nbPages;
</script>

<div class="paginator">
  <div class="sizes">
    <span class="field-label">Lignes par page</span>
    <div class="segments">
      {#each SIZES as s (s.value)}
        <button
          type="button"
          class="seg nav-item"
          class:is-active={pageSize === s.value}
          on:click={() => dispatch('sizechange', s.value)}>{s.label}</button
        >
      {/each}
    </div>
  </div>

  <div class="nav">
    <span class="range">{from}–{to} sur {total}</span>
    <button
      type="button"
      class="arrow"
      disabled={atFirst}
      aria-label="Page précédente"
      on:click={() => dispatch('pagechange', page - 1)}>‹</button
    >
    <button
      type="button"
      class="arrow"
      disabled={atLast}
      aria-label="Page suivante"
      on:click={() => dispatch('pagechange', page + 1)}>›</button
    >
  </div>
</div>

<style>
  .paginator {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 0.6rem;
  }
  .sizes {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .segments {
    display: inline-flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .seg {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--fg-muted);
    border-radius: var(--chip-radius);
    padding: 4px 11px;
    font-size: 13px;
  }
  /* .is-active fourni par app.css. */
  .nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .range {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--fg-faint);
  }
  .arrow {
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: var(--radius-sm);
    font-size: 16px;
    line-height: 1;
  }
  .arrow:disabled {
    opacity: 0.35;
  }
</style>
