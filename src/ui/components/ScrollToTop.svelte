<script lang="ts">
  // Bouton « remonter en haut » (FR-010) : visible au-delà de ~300 px de défilement.
  // Respecte prefers-reduced-motion (pas d'animation). N'utilise PAS scrollIntoView.
  import { onMount } from 'svelte';
  import { showScrollTop } from '../stores/ui.js';

  onMount(() => {
    const onScroll = () => showScrollTop.set(window.scrollY > 300);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  function toTop(): void {
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }
</script>

{#if $showScrollTop}
  <button type="button" class="scroll-top" on:click={toTop} aria-label="Remonter en haut">↑</button>
{/if}

<style>
  .scroll-top {
    position: fixed;
    bottom: 28px;
    right: 28px;
    width: 50px;
    height: 50px;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: var(--accent);
    color: var(--accent-fg);
    font-size: 20px;
    line-height: 1;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.28);
    z-index: 50;
  }
</style>
