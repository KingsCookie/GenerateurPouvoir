<script lang="ts">
  import { parameters, regenerateSeed, setParam, generate } from '../stores/appState.js';

  function onSeed(e: Event) {
    setParam('seed', (e.target as HTMLInputElement).value.trim());
  }
  function onNumber(key: 'batchSize' | 'birthYear' | 'powerChancePct', e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    setParam(key, Number.isFinite(v) ? v : 0);
  }
</script>

<section class="parametres">
  <h2>Paramètres de génération</h2>

  <div class="field">
    <label for="seed">Graine (seed) — entier 64 bits</label>
    <div class="seed-row">
      <input id="seed" type="text" value={$parameters.seed} on:input={onSeed} spellcheck="false" />
      <button type="button" on:click={regenerateSeed} title="Tirer une nouvelle seed">
        ⟳ Régénérer
      </button>
    </div>
  </div>

  <div class="field">
    <label for="batchSize">Nombre d'individus</label>
    <input
      id="batchSize"
      type="number"
      min="0"
      value={$parameters.batchSize}
      on:input={(e) => onNumber('batchSize', e)}
    />
  </div>

  <div class="field">
    <label for="birthYear">Année de naissance</label>
    <input
      id="birthYear"
      type="number"
      value={$parameters.birthYear}
      on:input={(e) => onNumber('birthYear', e)}
    />
  </div>

  <div class="field">
    <label for="powerChancePct">Chance de pouvoir (%)</label>
    <input
      id="powerChancePct"
      type="number"
      min="0"
      max="100"
      value={$parameters.powerChancePct}
      on:input={(e) => onNumber('powerChancePct', e)}
    />
  </div>

  <button class="primary generate" type="button" on:click={generate}>Générer la population</button>
</section>

<style>
  .parametres {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 32rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  label {
    color: var(--fg-muted);
    font-size: 0.9rem;
  }
  .seed-row {
    display: flex;
    gap: 0.5rem;
  }
  .seed-row input {
    flex: 1;
    font-family: ui-monospace, monospace;
  }
  .generate {
    align-self: flex-start;
    margin-top: 0.5rem;
  }
</style>
