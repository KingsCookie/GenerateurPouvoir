<script lang="ts">
  // Pied de page de version persistant (FR-009), présent sur toutes les vues.
  // Version injectée au build (déterministe) ; indicateur « hors-ligne » (PWA précachée).
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
</script>

<footer class="app-footer">
  <span>Générateur de Pouvoir</span>
  <span class="meta">v{version} · fonctionne hors-ligne</span>
</footer>

<style>
  .app-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 28px;
    padding: 14px 2px;
    border-top: 1px solid var(--border);
    font-family: var(--mono);
    font-size: 12px;
    color: var(--fg-faint);
  }
</style>
