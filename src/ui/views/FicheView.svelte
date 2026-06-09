<script lang="ts">
  import { selectedPerson, parameters, getCatalog, backToList } from '../stores/appState.js';
  import { buildFicheView } from '../lib/ficheViewModel.js';

  const catalog = getCatalog();
  $: currentYear = $parameters.birthYear;
  $: fiche = $selectedPerson ? buildFicheView($selectedPerson, catalog, currentYear) : null;
</script>

<section>
  <button type="button" class="back" on:click={backToList}>← Retour à la liste</button>

  {#if !fiche}
    <p class="muted">Aucun individu sélectionné.</p>
  {:else}
    <h2>{fiche.nom}</h2>

    <dl class="infos">
      <div>
        <dt>Identifiant</dt>
        <dd class="mono">{fiche.id}</dd>
      </div>
      <div>
        <dt>Date de naissance</dt>
        <dd class="mono">{fiche.dateNaissance}</dd>
      </div>
      <div>
        <dt>Âge</dt>
        <dd>{fiche.age}</dd>
      </div>
      <div>
        <dt>Génération</dt>
        <dd>{fiche.generation}</dd>
      </div>
      <div>
        <dt>Espèce</dt>
        <dd>{fiche.especeId}</dd>
      </div>
      <div>
        <dt>Genre</dt>
        <dd>{fiche.genreId}</dd>
      </div>
      <div>
        <dt>Statut</dt>
        <dd>
          {fiche.vivant ? 'Vivant' : `Décédé${fiche.raisonDeces ? ` (${fiche.raisonDeces})` : ''}`}
        </dd>
      </div>
    </dl>

    <h3>Pouvoir(s)</h3>
    {#if fiche.pouvoirs.length === 0}
      <p class="muted">Cet individu ne possède aucun pouvoir.</p>
    {:else}
      {#each fiche.pouvoirs as pv (pv.label)}
        <div class="pouvoir">
          <div class="pouvoir-head">
            <strong>{pv.label}</strong>
            <span class="badge">{pv.template}</span>
          </div>
          <div class="stats">
            <span>Puissance : <strong>{pv.puissance}</strong></span>
            <span>Maîtrise : <strong>{pv.maitrise}</strong></span>
          </div>
        </div>
      {/each}
    {/if}

    <h3>ADN — traits actifs</h3>
    {#if fiche.traitsActifs.length === 0}
      <p class="muted">Aucun trait actif.</p>
    {:else}
      <ul class="traits">
        {#each fiche.traitsActifs as t (t.traitId)}
          <li>{t.label} <span class="muted">— résilience {t.resilience} %</span></li>
        {/each}
      </ul>
    {/if}

    <h3>ADN — traits inactifs</h3>
    {#if fiche.traitsInactifs.length === 0}
      <p class="muted">Aucun trait inactif.</p>
    {:else}
      <ul class="traits inactifs">
        {#each fiche.traitsInactifs as t (t.traitId)}
          <li>{t.label} <span class="muted">— résilience {t.resilience} %</span></li>
        {/each}
      </ul>
    {/if}
  {/if}
</section>

<style>
  .back {
    margin-bottom: 1rem;
  }
  .infos {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 0.5rem 1.5rem;
    margin: 0 0 1rem;
  }
  .infos div {
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.3rem;
  }
  dt {
    color: var(--fg-muted);
    font-size: 0.8rem;
  }
  dd {
    margin: 0;
  }
  .pouvoir {
    background: var(--bg-elev);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.6rem 0.8rem;
    margin-bottom: 0.5rem;
  }
  .pouvoir-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: space-between;
  }
  .badge {
    background: var(--accent);
    color: var(--accent-fg);
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
  }
  .stats {
    display: flex;
    gap: 1.5rem;
    margin-top: 0.3rem;
    color: var(--fg-muted);
  }
  .traits {
    margin: 0;
    padding-left: 1.2rem;
  }
  .traits.inactifs {
    opacity: 0.7;
  }
  .mono {
    font-family: ui-monospace, monospace;
  }
  .muted {
    color: var(--fg-muted);
  }
</style>
