<script lang="ts">
  import { currentView, goToParametres, backToList, population } from './stores/appState.js';
  import ParametresView from './views/ParametresView.svelte';
  import ListeView from './views/ListeView.svelte';
  import FicheView from './views/FicheView.svelte';
  import ArbreView from './views/ArbreView.svelte';
  import StateIO from './components/StateIO.svelte';
</script>

<header>
  <h1>Générateur de Pouvoir</h1>
  <nav>
    <button type="button" class:active={$currentView === 'parametres'} on:click={goToParametres}>
      Paramètres
    </button>
    <button
      type="button"
      class:active={$currentView === 'liste' ||
        $currentView === 'fiche' ||
        $currentView === 'arbre'}
      on:click={backToList}
      disabled={$population.length === 0}
    >
      Population
    </button>
  </nav>
</header>

<div class="io-bar">
  <StateIO />
</div>

<main>
  {#if $currentView === 'parametres'}
    <ParametresView />
  {:else if $currentView === 'fiche'}
    <FicheView />
  {:else if $currentView === 'arbre'}
    <ArbreView />
  {:else}
    <ListeView />
  {/if}
</main>

<style>
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 1rem;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
  }
  h1 {
    font-size: 1.4rem;
    margin: 0;
  }
  nav {
    display: flex;
    gap: 0.5rem;
  }
  nav button.active {
    border-color: var(--accent);
    color: var(--accent);
  }
  .io-bar {
    margin-bottom: 1rem;
  }
</style>
