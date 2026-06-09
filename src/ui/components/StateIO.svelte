<script lang="ts">
  import { buildStateJson, applyImport, importError, population } from '../stores/appState.js';

  let fileInput: HTMLInputElement;

  function exportState() {
    const json = buildStateJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generateur-pouvoir.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    applyImport(text);
    input.value = ''; // permet de réimporter le même fichier
  }
</script>

<div class="io">
  <button type="button" on:click={exportState} disabled={$population.length === 0}>
    ⬇ Exporter l'état
  </button>
  <button type="button" on:click={() => fileInput.click()}>⬆ Importer un état</button>
  <input
    bind:this={fileInput}
    type="file"
    accept="application/json,.json"
    on:change={onFile}
    hidden
  />
</div>

{#if $importError}
  <p class="error" role="alert">Import refusé : {$importError}</p>
{/if}

<style>
  .io {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .error {
    color: var(--danger);
    margin: 0.5rem 0 0;
  }
</style>
