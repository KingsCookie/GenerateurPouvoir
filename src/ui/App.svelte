<script lang="ts">
  import { tick } from 'svelte';
  import { currentView, goToParametres, backToList, population } from './stores/appState.js';
  import { enterSandbox } from './stores/sandboxStore.js';
  import ParametresView from './views/ParametresView.svelte';
  import ListeView from './views/ListeView.svelte';
  import FicheView from './views/FicheView.svelte';
  import ArbreView from './views/ArbreView.svelte';
  import SandboxView from './views/SandboxView.svelte';
  import StateIO from './components/StateIO.svelte';
  import ThemeControls from './components/ThemeControls.svelte';
  import AppFooter from './components/AppFooter.svelte';
  import ScrollToTop from './components/ScrollToTop.svelte';

  // À l'ouverture d'une fiche (ou de la page arbre), remettre le défilement en haut (FR-011).
  $: scrollTopOnView($currentView);
  function scrollTopOnView(view: string) {
    if (view === 'fiche' || view === 'arbre') {
      tick().then(() => window.scrollTo({ top: 0 }));
    }
  }

  $: hasPopulation = $population.length > 0;
  // « Population » regroupe liste/fiche/arbre ; ces vues partagent l'onglet actif.
  $: populationActive =
    $currentView === 'liste' || $currentView === 'fiche' || $currentView === 'arbre';
</script>

<header class="app-header">
  <div class="brand">
    <span class="logo" aria-hidden="true">P</span>
    <span class="title">Générateur de Pouvoir</span>
  </div>
  <nav aria-label="Navigation principale">
    <button
      type="button"
      class="nav-item"
      class:is-active={$currentView === 'parametres'}
      on:click={goToParametres}
    >
      Paramètres
    </button>
    <button
      type="button"
      class="nav-item"
      class:is-active={populationActive}
      on:click={backToList}
      disabled={!hasPopulation}
    >
      Population
    </button>
    <button
      type="button"
      class="nav-item"
      class:is-active={$currentView === 'sandbox'}
      on:click={enterSandbox}
      disabled={!hasPopulation}
    >
      Sandbox
    </button>
    <span class="sep" aria-hidden="true"></span>
    <ThemeControls variant="toggle" />
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
  {:else if $currentView === 'sandbox'}
    <SandboxView />
  {:else}
    <ListeView />
  {/if}
</main>

<AppFooter />
<ScrollToTop />

<style>
  .app-header {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    justify-content: space-between;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    padding: 12px 2px;
    margin-bottom: 0;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .logo {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--logo-radius);
    background: var(--accent);
    color: var(--accent-fg);
    font-family: var(--mono);
    font-weight: 700;
    font-size: 15px;
  }
  .title {
    font-weight: 600;
    font-size: 17px;
  }
  nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .nav-item {
    background: transparent;
    border: 1px solid transparent;
    color: var(--fg-muted);
    border-radius: var(--chip-radius);
    padding: 7px 14px;
  }
  /* .is-active : style fourni par app.css (chip en A, aplat en B). */
  .sep {
    width: 1px;
    height: 22px;
    background: var(--border);
    margin: 0 4px;
  }
  .io-bar {
    background: var(--tint-bg);
    border-bottom: 1px solid var(--border);
    padding: 12px 2px;
    margin: 0 0 1rem;
    /* déborde légèrement pour occuper la largeur sous l'en-tête collant */
  }
</style>
