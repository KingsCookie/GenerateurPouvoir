<script lang="ts">
  import { parameters, regenerateSeed, setParam, generate } from '../stores/appState.js';
  import { statA, type Parameters } from '../../core/index.js';

  // Clés numériques éditables des paramètres (toutes sauf A, calculée).
  type NumKey = {
    [K in keyof Parameters]: Parameters[K] extends number ? K : never;
  }[keyof Parameters];

  function onSeed(e: Event) {
    setParam('seed', (e.target as HTMLInputElement).value.trim());
  }
  function onNumber(key: NumKey, e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    setParam(key, Number.isFinite(v) ? v : 0);
  }
  function onBool(key: 'genomeMalusEnabled', e: Event) {
    setParam(key, (e.target as HTMLInputElement).checked);
  }

  // A = 100 − 2·B − C (FR-030) : affichée en lecture seule.
  $: statAValue = statA($parameters);
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

  <h2>Moteur génétique (hérédité &amp; reproduction)</h2>
  <p class="hint">
    Ces paramètres pilotent l'hérédité, l'algorithme traits → pouvoirs et la naissance.
    L'organisation avancée (3 niveaux, courbes) viendra plus tard.
  </p>

  <div class="grid">
    <div class="field">
      <label for="initialResilience">Résilience initiale (%)</label>
      <input
        id="initialResilience"
        type="number"
        min="0"
        max="100"
        value={$parameters.initialResilience}
        on:input={(e) => onNumber('initialResilience', e)}
      />
    </div>
    <div class="field">
      <label for="resilienceMax">Résilience maximale (%)</label>
      <input
        id="resilienceMax"
        type="number"
        min="0"
        max="100"
        value={$parameters.resilienceMax}
        on:input={(e) => onNumber('resilienceMax', e)}
      />
    </div>
    <div class="field">
      <label for="duplicationD">Constante de duplication D</label>
      <input
        id="duplicationD"
        type="number"
        min="1"
        value={$parameters.duplicationD}
        on:input={(e) => onNumber('duplicationD', e)}
      />
    </div>
    <div class="field">
      <label for="generationK">Constante de génération K (%)</label>
      <input
        id="generationK"
        type="number"
        min="0"
        max="100"
        value={$parameters.generationK}
        on:input={(e) => onNumber('generationK', e)}
      />
    </div>
    <div class="field">
      <label for="bonusPoints">Bonus de résilience (points)</label>
      <input
        id="bonusPoints"
        type="number"
        min="0"
        value={$parameters.bonusPoints}
        on:input={(e) => onNumber('bonusPoints', e)}
      />
    </div>
    <div class="field">
      <label for="malusPoints">Malus de résilience (points)</label>
      <input
        id="malusPoints"
        type="number"
        min="0"
        value={$parameters.malusPoints}
        on:input={(e) => onNumber('malusPoints', e)}
      />
    </div>
    <div class="field">
      <label for="disappearThreshold">Seuil de disparition (%)</label>
      <input
        id="disappearThreshold"
        type="number"
        min="0"
        max="100"
        value={$parameters.disappearThreshold}
        on:input={(e) => onNumber('disappearThreshold', e)}
      />
    </div>
    <div class="field">
      <label for="strongMutationRatePct">Taux de mutation forte (%)</label>
      <input
        id="strongMutationRatePct"
        type="number"
        min="0"
        max="100"
        value={$parameters.strongMutationRatePct}
        on:input={(e) => onNumber('strongMutationRatePct', e)}
      />
    </div>
    <div class="field">
      <label for="noPowerRatePct">Taux de naissance sans pouvoir (%)</label>
      <input
        id="noPowerRatePct"
        type="number"
        min="0"
        max="100"
        value={$parameters.noPowerRatePct}
        on:input={(e) => onNumber('noPowerRatePct', e)}
      />
    </div>
    <div class="field">
      <label for="weakMutationGainPct">Mutation faible — gain (%)</label>
      <input
        id="weakMutationGainPct"
        type="number"
        min="0"
        max="100"
        value={$parameters.weakMutationGainPct}
        on:input={(e) => onNumber('weakMutationGainPct', e)}
      />
    </div>
    <div class="field">
      <label for="weakMutationLossPct">Mutation faible — perte (%)</label>
      <input
        id="weakMutationLossPct"
        type="number"
        min="0"
        max="100"
        value={$parameters.weakMutationLossPct}
        on:input={(e) => onNumber('weakMutationLossPct', e)}
      />
    </div>
    <div class="field">
      <label for="statB">B — moyenne ∓ 1 (%)</label>
      <input
        id="statB"
        type="number"
        min="0"
        max="100"
        value={$parameters.statB}
        on:input={(e) => onNumber('statB', e)}
      />
    </div>
    <div class="field">
      <label for="statC">C — moyenne (%)</label>
      <input
        id="statC"
        type="number"
        min="0"
        max="100"
        value={$parameters.statC}
        on:input={(e) => onNumber('statC', e)}
      />
    </div>
    <div class="field">
      <label for="statA">A — nouvelle valeur (%) <span class="ro">calculé</span></label>
      <input
        id="statA"
        type="number"
        value={statAValue}
        readonly
        disabled
        title="A = 100 − 2·B − C (lecture seule)"
      />
    </div>
  </div>

  <label class="check">
    <input
      type="checkbox"
      checked={$parameters.genomeMalusEnabled}
      on:change={(e) => onBool('genomeMalusEnabled', e)}
    />
    Appliquer un malus au génome lors des cas spéciaux (mutation forte / sans pouvoir)
  </label>

  <button class="primary generate" type="button" on:click={generate}>Générer la population</button>
</section>

<style>
  .parametres {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 48rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: 0.8rem 1.2rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .hint {
    color: var(--fg-muted);
    font-size: 0.85rem;
    margin: -0.3rem 0 0;
  }
  .ro {
    font-size: 0.7rem;
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 999px;
    padding: 0 0.4rem;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--fg-muted);
    font-size: 0.9rem;
  }
  input[readonly] {
    opacity: 0.7;
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
