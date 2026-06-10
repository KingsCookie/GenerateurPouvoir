<script lang="ts">
  import { currentYear, advanceYears } from '../stores/appState.js';

  let years = 1;

  function onAdvance() {
    advanceYears(years);
  }
</script>

<div class="time-bar" role="region" aria-label="Avancement du temps">
  <span class="year">Année courante : <strong>{$currentYear}</strong></span>
  <div class="controls">
    <label for="years">Avancer de</label>
    <input id="years" type="number" min="1" bind:value={years} />
    <span class="unit">an(s)</span>
    <button class="primary" type="button" on:click={onAdvance} disabled={years < 1}>
      Avancer
    </button>
  </div>
</div>

<style>
  .time-bar {
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
  .year {
    color: var(--fg-muted);
    font-size: 0.9rem;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .controls label {
    color: var(--fg-muted);
    font-size: 0.9rem;
  }
  .controls input {
    width: 5rem;
  }
  .unit {
    color: var(--fg-muted);
    font-size: 0.85rem;
  }
  button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
