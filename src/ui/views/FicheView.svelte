<script lang="ts">
  import {
    selectedPerson,
    currentYear,
    population,
    couples,
    catalog,
    backToList,
    killPerson,
    setCoupleReproPct,
    selectPerson,
    goToArbre,
  } from '../stores/appState.js';
  import { buildFicheView } from '../lib/ficheViewModel.js';
  import { buildGenealogyTree } from '../../core/index.js';
  import { traitMode } from '../stores/ui.js';
  import GenealogyTree from '../components/GenealogyTree.svelte';
  import TraitModeSelector from '../components/TraitModeSelector.svelte';
  import TreeLegend from '../components/TreeLegend.svelte';

  // Réactif au catalogue éditable (Feature 5) : un trait renommé/supprimé se reflète aussitôt.
  // `population` résout les noms des enfants (FR-015).
  $: fiche = $selectedPerson
    ? buildFicheView($selectedPerson, $catalog, $currentYear, $population)
    : null;

  // Arbre de la fiche : profondeur FIXE 2 (FR-002a), cases nom + pouvoirs (showAge masqué, FR-003b).
  $: byId = new Map($population.map((p) => [p.id, p]));
  $: tree = $selectedPerson
    ? buildGenealogyTree($selectedPerson.id, byId, 2, {
        currentYear: $currentYear,
        catalog: $catalog,
      })
    : null;

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
  <button type="button" class="back contour" on:click={backToList}>← Retour à la liste</button>

  {#if !fiche}
    <p class="muted">Aucun individu sélectionné.</p>
  {:else}
    <!-- Arbre généalogique en haut, pleine largeur (FR-002c). Clic = ouvrir la fiche cliquée. -->
    {#if tree}
      <div class="card arbre-zone">
        <div class="arbre-head">
          <h3>Arbre généalogique</h3>
          <button
            type="button"
            class="explorer contour"
            on:click={() => $selectedPerson && goToArbre($selectedPerson.id)}
          >
            Explorer l'arbre →
          </button>
        </div>
        {#key $selectedPerson?.id}
          <GenealogyTree node={tree} showAge={false} onSelect={selectPerson} />
        {/key}
        <TreeLegend />
      </div>
    {/if}

    <header class="fiche-head">
      <h2>{fiche.nom}</h2>
      <span class="chip statut" class:dead={!fiche.vivant}>
        {fiche.vivant ? 'Vivant' : 'Décédé'}
      </span>
      <span class="sub">{fiche.especeId} · {fiche.genreId} · génération {fiche.generation}</span>
    </header>

    <div class="cols">
      <!-- Colonne 1 : Informations -->
      <div class="card">
        <h3>Informations</h3>
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
              {fiche.vivant
                ? 'Vivant'
                : `Décédé${fiche.raisonDeces ? ` (${fiche.raisonDeces})` : ''}`}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Colonne 2 : Cycle de vie -->
      <div class="card">
        <h3>Cycle de vie</h3>
        <div class="vie">
          {#if $selectedPerson && $selectedPerson.conjoints.length > 0}
            <div class="conjoints">
              <span class="field-label">Conjoints</span>
              <ul>
                {#each $selectedPerson.conjoints as c (c.id + c.statut)}
                  <li>
                    {nameById.get(c.id) ?? c.id}
                    <span class="badge-statut {c.statut}">
                      {c.statut === 'actuel' ? 'actuel' : 'ex'}
                    </span>
                  </li>
                {/each}
              </ul>
            </div>
          {:else}
            <p class="muted">Aucun conjoint.</p>
          {/if}

          {#if couple}
            <div class="couple">
              <label class="field-label" for="reproPct">% de reproduction du couple</label>
              <input
                id="reproPct"
                type="number"
                min="0"
                max="100"
                placeholder="auto (gaussienne)"
                value={couple.reproPct ?? ''}
                on:change={onReproPct}
              />
              <span class="muted">Laisser vide ⇒ dérivé de la gaussienne d'espèce.</span>
            </div>
          {/if}

          {#if fiche.vivant}
            <div class="kill">
              <label class="field-label" for="cause">Cause du décès</label>
              <div class="kill-row">
                <input id="cause" type="text" bind:value={cause} placeholder="cause obligatoire" />
                <button type="button" class="danger" on:click={onKill}>Tuer cet individu</button>
              </div>
              {#if killError}<p class="error-msg" role="alert">{killError}</p>{/if}
            </div>
          {/if}
        </div>
      </div>
    </div>

    <div class="traits-head">
      <h3>Traits &amp; pouvoirs</h3>
      <TraitModeSelector />
    </div>

    <!-- Mode 1 = pouvoirs seuls ; Mode 2 = + traits actifs ; Mode 3 = + inactifs + résilience. -->
    <h4>Pouvoir(s)</h4>
    {#if fiche.pouvoirs.length === 0}
      <p class="muted">Cet individu ne possède aucun pouvoir.</p>
    {:else}
      <div class="pouvoirs">
        {#each fiche.pouvoirs as pv (pv.label)}
          <div class="card pouvoir">
            <div class="pouvoir-head">
              <strong>{pv.label}</strong>
              <span class="badge-accent">{pv.template}</span>
            </div>
            <div class="stats">
              <span>Puissance : <strong>{pv.puissance}</strong> / 10</span>
              <span>Maîtrise : <strong>{pv.maitrise}</strong> / 10</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if $traitMode >= 2}
      <h4>ADN — traits actifs</h4>
      {#if fiche.traitsActifs.length === 0}
        <p class="muted">Aucun trait actif.</p>
      {:else}
        <ul class="traits">
          {#each fiche.traitsActifs as t (t.traitId)}
            <li>
              {t.label}
              {#if t.type}<span class="type-tag">{t.type}</span>{/if}
              {#if $traitMode >= 3}<span class="muted"> — résilience {t.resilience} %</span>{/if}
            </li>
          {/each}
        </ul>
      {/if}
    {/if}

    {#if $traitMode >= 3}
      <h4>ADN — traits inactifs</h4>
      {#if fiche.traitsInactifs.length === 0}
        <p class="muted">Aucun trait inactif.</p>
      {:else}
        <ul class="traits inactifs">
          {#each fiche.traitsInactifs as t (t.traitId)}
            <li>
              {t.label}
              {#if t.type}<span class="type-tag">{t.type}</span>{/if}
              <span class="muted"> — résilience {t.resilience} %</span>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}

    <!-- Liste des enfants (FR-015) — chips cliquables vers leur fiche. -->
    <h4>Enfants</h4>
    {#if fiche.enfants.length === 0}
      <p class="muted">Aucun enfant.</p>
    {:else}
      <div class="enfants">
        {#each fiche.enfants as enfant (enfant.id)}
          <button type="button" class="chip" on:click={() => selectPerson(enfant.id)}>
            {enfant.nom}
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</section>

<style>
  .back {
    margin-bottom: 1rem;
  }
  .arbre-zone {
    width: 100%;
    margin-bottom: 1.25rem;
  }
  .arbre-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.6rem;
  }
  .arbre-head h3 {
    margin: 0;
  }

  .fiche-head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin: 0 0 1rem;
  }
  .fiche-head h2 {
    margin: 0;
    font-size: 26px;
  }
  .statut.dead {
    background: color-mix(in srgb, var(--danger) 18%, var(--bg-elev));
    border-color: color-mix(in srgb, var(--danger) 45%, var(--bg));
    color: var(--danger);
  }
  .sub {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--fg-faint);
  }

  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-bottom: 1.25rem;
  }
  .card h3 {
    margin: 0 0 0.8rem;
    font-size: 15px;
  }
  .traits-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 1rem;
  }
  .traits-head h3 {
    margin: 0;
  }
  h4 {
    margin: 0.9rem 0 0.4rem;
    font-size: 14px;
  }
  .infos {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem 1.5rem;
    margin: 0;
  }
  .infos div {
    border-bottom: 1px solid var(--row-border);
    padding-bottom: 0.3rem;
  }
  dt {
    color: var(--fg-faint);
    font-size: 0.8rem;
  }
  dd {
    margin: 0;
  }
  .pouvoirs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 0.6rem;
  }
  .pouvoir-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: space-between;
  }
  .stats {
    display: flex;
    gap: 1.5rem;
    margin-top: 0.4rem;
    color: var(--fg-muted);
    font-size: 0.9rem;
  }
  .traits {
    margin: 0;
    padding-left: 1.2rem;
  }
  .traits.inactifs {
    opacity: 0.75;
  }
  .type-tag {
    font-family: var(--mono);
    font-size: 10px;
    text-transform: var(--label-transform);
    color: var(--accent-text);
    border: 1px solid var(--chip-border);
    border-radius: var(--chip-radius);
    padding: 0 6px;
    margin-left: 4px;
  }
  .vie {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  .conjoints ul {
    margin: 0.2rem 0 0;
    padding-left: 1.2rem;
  }
  .badge-statut {
    font-size: 0.7rem;
    border-radius: var(--chip-radius);
    padding: 0 0.4rem;
    border: 1px solid var(--border);
    color: var(--fg-muted);
  }
  .badge-statut.actuel {
    color: var(--accent-text);
    border-color: var(--chip-border);
    background: var(--chip-bg);
  }
  .couple,
  .kill {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .kill-row {
    display: flex;
    gap: 0.5rem;
  }
  .kill-row input {
    flex: 1;
  }
  .danger {
    background: transparent;
    border: 1px solid var(--danger);
    color: var(--danger);
    border-radius: var(--radius);
    padding: 0 0.8rem;
    white-space: nowrap;
  }
  .enfants {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .enfants .chip {
    cursor: pointer;
  }
  .mono {
    font-family: var(--mono);
  }
  .muted {
    color: var(--fg-muted);
  }
  @media (max-width: 720px) {
    .cols {
      grid-template-columns: 1fr;
    }
  }
</style>
