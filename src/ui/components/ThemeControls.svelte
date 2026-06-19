<script lang="ts">
  // Pilote les 3 axes d'apparence (US1). Deux variantes :
  //   - 'full'   : 3 groupes de segments (Style / Palette / Apparence) — pour les Paramètres.
  //   - 'toggle' : un bouton rond clair/sombre — pour l'en-tête (accessible en permanence, FR-003).
  import {
    mode,
    palette,
    style,
    setMode,
    toggleMode,
    setPalette,
    setStyle,
    type Palette,
    type Style,
  } from '../stores/ui.js';

  export let variant: 'full' | 'toggle' = 'full';

  // 6 palettes (Feature 009 : + ambre / rose / bleu). swatch = couleur d'accent du mode sombre.
  const palettes: { id: Palette; label: string; swatch: string }[] = [
    { id: 'violet', label: 'Violet', swatch: '#9b7fe6' },
    { id: 'cyan', label: 'Cyan', swatch: '#2fcdbb' },
    { id: 'vert', label: 'Vert', swatch: '#86c057' },
    { id: 'ambre', label: 'Ambre', swatch: '#e0a13a' },
    { id: 'rose', label: 'Rose', swatch: '#e25d96' },
    { id: 'bleu', label: 'Bleu', swatch: '#2f86cc' },
  ];

  // 6 styles (Feature 009 : + C Éditorial / D Terminal / E Néo-brutaliste / F Organique).
  const styles: { id: Style; label: string }[] = [
    { id: 'a', label: 'A — Atelier' },
    { id: 'b', label: 'B — Signal' },
    { id: 'c', label: 'C — Éditorial' },
    { id: 'd', label: 'D — Terminal' },
    { id: 'e', label: 'E — Néo-brutaliste' },
    { id: 'f', label: 'F — Organique' },
  ];
</script>

{#if variant === 'toggle'}
  <button
    type="button"
    class="theme-toggle"
    on:click={toggleMode}
    title={$mode === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
    aria-label={$mode === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
  >
    <span class="half" aria-hidden="true"></span>
  </button>
{:else}
  <div class="theme-controls">
    <div class="group" role="group" aria-label="Style graphique">
      <span class="field-label">Style graphique</span>
      <div class="segments">
        {#each styles as s (s.id)}
          <button
            type="button"
            class="seg nav-item"
            class:is-active={$style === s.id}
            on:click={() => setStyle(s.id)}>{s.label}</button
          >
        {/each}
      </div>
    </div>

    <div class="group" role="group" aria-label="Thème de couleur">
      <span class="field-label">Thème de couleur</span>
      <div class="segments">
        {#each palettes as p (p.id)}
          <button
            type="button"
            class="seg nav-item"
            class:is-active={$palette === p.id}
            on:click={() => setPalette(p.id)}
          >
            <span class="swatch" style="background:{p.swatch}" aria-hidden="true"></span>
            {p.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="group" role="group" aria-label="Apparence">
      <span class="field-label">Apparence</span>
      <div class="segments">
        <button
          type="button"
          class="seg nav-item"
          class:is-active={$mode === 'dark'}
          on:click={() => setMode('dark')}>Sombre</button
        >
        <button
          type="button"
          class="seg nav-item"
          class:is-active={$mode === 'light'}
          on:click={() => setMode('light')}>Clair</button
        >
      </div>
    </div>
  </div>
{/if}

<style>
  .theme-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .segments {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .seg {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 13px;
    font-size: 13px;
    border: var(--border-width, 1px) solid var(--border);
    background: transparent;
    color: var(--fg-muted);
    border-radius: var(--chip-radius);
  }
  /* L'état actif (.is-active) est fourni par app.css (chip en A, aplat en B). */
  .swatch {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: 0 0 0 1px var(--border);
  }

  /* Toggle rond clair/sombre (en-tête). */
  .theme-toggle {
    width: 34px;
    height: 34px;
    padding: 0;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--bg-elev);
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .theme-toggle .half {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1.5px solid var(--accent-text);
    /* pastille « mi-pleine » : moitié remplie en accent-text. */
    background: linear-gradient(90deg, var(--accent-text) 0 50%, transparent 50% 100%);
  }
</style>
