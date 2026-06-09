<script lang="ts">
  import { selectedIds, reproduceSelected } from '../stores/appState.js';

  $: count = $selectedIds.size;

  function onReproduce() {
    reproduceSelected();
  }
</script>

<div class="repro-bar" role="region" aria-label="Reproduction">
  <span class="count">
    {count} individu{count > 1 ? 's' : ''} sélectionné{count > 1 ? 's' : ''}
  </span>
  <button class="primary" type="button" on:click={onReproduce} disabled={count === 0}>
    Reproduire
  </button>
</div>

<style>
  .repro-bar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 0.6rem 0.8rem;
    margin-bottom: 0.8rem;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .count {
    color: var(--fg-muted);
    font-size: 0.9rem;
  }
  button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
