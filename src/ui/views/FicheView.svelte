<script lang="ts">
  import {
    selectedPerson,
    currentYear,
    population,
    couples,
    getCatalog,
    backToList,
    killPerson,
    setCoupleReproPct,
  } from '../stores/appState.js';
  import { buildFicheView } from '../lib/ficheViewModel.js';

  const catalog = getCatalog();
  $: fiche = $selectedPerson ? buildFicheView($selectedPerson, catalog, $currentYear) : null;

  // Couple actuel de l'individu (réactif sur la liste des couples).
  $: couple =
    $selectedPerson != null
      ? ($couples.find((c) => c.memberIds.includes($selectedPerson.id)) ?? null)
      : null;

  // Libellés de noms pour afficher les conjoints.
  $: nameById = new Map($population.map((p) => [p.id, p.nom]));

  // Mort manuelle (cause obligatoire).
  let cause = '';
  let killError: string | null = null;
  function onKill() {
    if (!$selectedPerson) return;
    const err = killPerson($selectedPerson.id, cause);
    killError = err;
    if (!err) cause = '';
  }

  // Édition du % de reproduction du couple (vide ⇒ hérité de la gaussienne).
  function onReproPct(e: Event) {
    if (!couple) return;
    const raw = (e.target as HTMLInputElement).value.trim();
    setCoupleReproPct(couple.id, raw === '' ? null : Number(raw));
  }
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

    <h3>Cycle de vie</h3>
    <div class="vie">
      {#if $selectedPerson && $selectedPerson.conjoints.length > 0}
        <div class="conjoints">
          <span class="dt">Conjoints</span>
          <ul>
            {#each $selectedPerson.conjoints as c (c.id + c.statut)}
              <li>
                {nameById.get(c.id) ?? c.id}
                <span class="badge-statut {c.statut}"
                  >{c.statut === 'actuel' ? 'actuel' : 'ex'}</span
                >
              </li>
            {/each}
          </ul>
        </div>
      {:else}
        <p class="muted">Aucun conjoint.</p>
      {/if}

      {#if couple}
        <div class="couple">
          <label for="reproPct">% de reproduction du couple</label>
          <input
            id="reproPct"
            type="number"
            min="0"
            max="100"
            placeholder="hérité de la gaussienne"
            value={couple.reproPct ?? ''}
            on:change={onReproPct}
          />
          <span class="muted">Laisser vide ⇒ dérivé de la gaussienne d'espèce.</span>
        </div>
      {/if}

      {#if fiche.vivant}
        <div class="kill">
          <label for="cause">Cause du décès</label>
          <div class="kill-row">
            <input id="cause" type="text" bind:value={cause} placeholder="cause obligatoire" />
            <button type="button" class="danger" on:click={onKill}>Tuer</button>
          </div>
          {#if killError}<p class="error">{killError}</p>{/if}
        </div>
      {/if}
    </div>

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
  .vie {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-bottom: 0.5rem;
  }
  .vie .dt {
    color: var(--fg-muted);
    font-size: 0.8rem;
  }
  .conjoints ul {
    margin: 0.2rem 0 0;
    padding-left: 1.2rem;
  }
  .badge-statut {
    font-size: 0.7rem;
    border-radius: 999px;
    padding: 0 0.4rem;
    border: 1px solid var(--border);
    color: var(--fg-muted);
  }
  .badge-statut.actuel {
    color: var(--accent);
    border-color: var(--accent);
  }
  .couple,
  .kill {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-width: 28rem;
  }
  .couple label,
  .kill label {
    color: var(--fg-muted);
    font-size: 0.85rem;
  }
  .kill-row {
    display: flex;
    gap: 0.5rem;
  }
  .kill-row input {
    flex: 1;
  }
  .danger {
    background: #b3261e;
    color: #fff;
    border: none;
    border-radius: var(--radius);
    padding: 0 0.8rem;
    cursor: pointer;
  }
  .error {
    color: #b3261e;
    font-size: 0.85rem;
    margin: 0;
  }
  .mono {
    font-family: ui-monospace, monospace;
  }
  .muted {
    color: var(--fg-muted);
  }
</style>
