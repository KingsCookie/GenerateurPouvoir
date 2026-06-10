<script lang="ts">
  import {
    treeRootId,
    treeDepth,
    setTreeDepth,
    recenterTree,
    arbreToFiche,
    population,
    currentYear,
    getCatalog,
  } from '../stores/appState.js';
  import { buildGenealogyTree } from '../../core/index.js';
  import GenealogyTree from '../components/GenealogyTree.svelte';

  const catalog = getCatalog();

  $: byId = new Map($population.map((p) => [p.id, p]));
  // Page dédiée : profondeur N réglable (≥ 1, sans plafond) ; cases nom + âge + pouvoirs (FR-003b).
  $: tree =
    $treeRootId != null
      ? buildGenealogyTree($treeRootId, byId, $treeDepth, { currentYear: $currentYear, catalog })
      : null;
  $: centre = $treeRootId != null ? (byId.get($treeRootId) ?? null) : null;
</script>

<section>
  <div class="head">
    <button type="button" class="back" on:click={arbreToFiche}>← Retour à la fiche</button>
    <label class="depth">
      Profondeur
      <input
        type="number"
        min="1"
        step="1"
        value={$treeDepth}
        on:input={(e) => setTreeDepth(Number((e.target as HTMLInputElement).value))}
      />
    </label>
  </div>

  {#if !tree}
    <p class="muted">Aucun individu sélectionné pour l'arbre.</p>
  {:else}
    <h2>Arbre de {centre?.nom ?? tree.nom}</h2>
    <p class="muted hint">
      Cliquez une case pour recentrer l'arbre. Molette / pincement = zoom ; clic droit / doigt =
      déplacement.
    </p>
    {#key $treeRootId}
      <GenealogyTree node={tree} showAge={true} onSelect={recenterTree} />
    {/key}
  {/if}
</section>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
  }
  .depth {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: var(--fg-muted);
  }
  .depth input {
    width: 4.5rem;
  }
  .hint {
    font-size: 0.78rem;
    margin: 0 0 0.5rem;
  }
  .muted {
    color: var(--fg-muted);
  }
</style>
