<script lang="ts">
  import { traitMode, setTraitMode, type TraitMode } from '../stores/ui.js';

  const MODES: { value: TraitMode; label: string; title: string }[] = [
    { value: 1, label: 'Mode 1', title: 'Pouvoirs seuls' },
    { value: 2, label: 'Mode 2', title: 'Pouvoirs + traits actifs' },
    { value: 3, label: 'Mode 3', title: 'Pouvoirs + traits actifs + inactifs + résilience' },
  ];
</script>

<div class="modes" role="group" aria-label="Mode d'affichage des traits">
  {#each MODES as m (m.value)}
    <button
      type="button"
      class="nav-item"
      class:is-active={$traitMode === m.value}
      title={m.title}
      on:click={() => setTraitMode(m.value)}
    >
      {m.label}
    </button>
  {/each}
</div>

<style>
  .modes {
    display: inline-flex;
    gap: 0.3rem;
  }
  .nav-item {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--fg-muted);
    border-radius: var(--chip-radius);
    padding: 5px 12px;
    font-size: 13px;
  }
  /* .is-active fourni par app.css (chip en A, aplat en B). */
</style>
