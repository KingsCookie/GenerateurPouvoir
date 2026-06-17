<script lang="ts">
  import {
    buildConfigJson,
    buildDataJson,
    buildFullJson,
    applyImport,
    importError,
    population,
  } from '../stores/appState.js';

  let fileInput: HTMLInputElement;

  // Horodatage `YYYYMMDD-HHMMSS` généré CÔTÉ UI uniquement (l'horloge est interdite dans le cœur,
  // Principes I/IV). Sert à nommer les fichiers exportés (FR-014).
  function timestamp(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
      `-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
    );
  }

  function download(json: string, kind: 'config' | 'data' | 'full') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `royalcookie-${kind}-${timestamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const exportConfig = () => download(buildConfigJson(), 'config');
  const exportData = () => download(buildDataJson(), 'data');
  const exportFull = () => download(buildFullJson(), 'full');

  async function onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return; // annulation : aucune action, aucun message (edge case)
    const text = await file.text();
    applyImport(text); // détection automatique du type (config/data/full)
    input.value = ''; // permet de réimporter le même fichier
  }
</script>

<div class="io">
  <button type="button" on:click={exportConfig}>⬇ Exporter la configuration</button>
  <button type="button" on:click={exportData} disabled={$population.length === 0}>
    ⬇ Exporter les données
  </button>
  <button type="button" on:click={exportFull} disabled={$population.length === 0}>
    ⬇ Exporter tout (complet)
  </button>
  <button type="button" class="import" on:click={() => fileInput.click()}>
    ⬆ Importer un fichier
  </button>
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
  .io button {
    flex: 1 1 auto;
  }
  .import {
    flex-basis: 100%;
  }
  @media (min-width: 40rem) {
    .io button {
      flex: 0 0 auto;
    }
    .import {
      flex-basis: auto;
    }
  }
  .error {
    color: var(--danger);
    margin: 0.5rem 0 0;
  }
</style>
