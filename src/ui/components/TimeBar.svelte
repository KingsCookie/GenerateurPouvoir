<script lang="ts">
  import { currentYear, advanceYears } from '../stores/appState.js';

  let years = 1;

  function onAdvance() {
    advanceYears(years);
  }
</script>

<div class="time-bar" role="region" aria-label="Avancement du temps">
  <div class="year-block">
    <span class="field-label">Année courante</span>
    <span class="year-num">{$currentYear}</span>
  </div>
  <div class="controls">
    <label class="field-label" for="years">Avancer de</label>
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
    padding: 16px 20px;
    margin-bottom: 0.8rem;
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .year-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .year-num {
    font-family: var(--mono);
    font-size: 32px;
    font-weight: 600;
    line-height: 1;
    color: var(--accent-text);
    text-shadow: var(--year-shadow);
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .controls input {
    width: 5rem;
  }
  .unit {
    color: var(--fg-muted);
    font-size: 0.85rem;
  }
</style>
