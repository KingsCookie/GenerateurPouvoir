<script lang="ts">
  // Légende des symboles et couleurs de l'arbre (FR-003e) — affichée sur la fiche et la page dédiée.
</script>

<ul class="legend" aria-label="Légende de l'arbre généalogique">
  <li><span class="sym">⚭</span> union actuelle</li>
  <li><span class="sym">⚮</span> ex (lien/bordure en pointillés)</li>
  <li><span class="swatch root"></span> personne observée</li>
  <li><span class="swatch marriedin"></span> conjoint (pièce rapportée)</li>
  <li><span class="swatch dead"></span> † décédé</li>
</ul>

<style>
  .legend {
    list-style: none;
    margin: 0.4rem 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
    font-size: 0.78rem;
    color: var(--fg-muted);
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .sym {
    font-size: 1rem;
    color: var(--fg-muted);
  }
  .swatch {
    width: 1.1rem;
    height: 0.8rem;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--bg);
    display: inline-block;
  }
  .swatch.root {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 24%, var(--bg));
  }
  .swatch.marriedin {
    background: color-mix(in srgb, var(--fg-muted) 26%, var(--bg));
  }
  .swatch.dead {
    border-color: #c98bdb;
  }
</style>
