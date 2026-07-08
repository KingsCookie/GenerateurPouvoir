<script lang="ts">
  import { population, genesisYear, getCatalog } from '../stores/appState.js';
  import {
    criteria,
    generationTouched,
    setNameQuery,
    toggleInSet,
    setTraitScope,
    setPowerPresence,
    setTraitPresence,
    resetFilters,
  } from '../stores/filters.js';
  import { resetSort, type ListName } from '../stores/ui.js';
  import {
    computeGeneration,
    yearOf,
    lastGeneration,
    TRAIT_TYPES,
    type PowerPresence,
    type TraitScope,
    type TraitPresence,
  } from '../../core/index.js';

  // Liste hôte : détermine quel état de tri « Réinitialiser » remet à zéro (FR-018).
  export let list: ListName = 'population';

  const catalog = getCatalog();

  // Générations présentes dans la population (triées).
  $: generations = [
    ...new Set($population.map((p) => computeGeneration(yearOf(p.dateNaissance), $genesisYear))),
  ].sort((a, b) => a - b);
  // Espèces présentes (triées).
  $: especes = [...new Set($population.map((p) => p.especeId))].sort();
  // Dernière génération (pour l'indication du défaut dynamique).
  $: derniere = lastGeneration($population, $genesisYear);

  // Catalogue de traits (ordre canonique des types) : {id, label}.
  const traits: { id: string; label: string }[] = TRAIT_TYPES.flatMap((t) =>
    catalog.byType[t].map((tr) => ({ id: tr.id, label: tr.label })),
  );

  const POWER_OPTIONS: { value: Exclude<PowerPresence, null>; label: string }[] = [
    { value: 'any', label: 'A un pouvoir' },
    { value: 'none', label: 'Aucun pouvoir' },
  ];
  const SCOPES: { value: TraitScope; label: string }[] = [
    { value: 'actifs', label: 'actifs' },
    { value: 'inactifs', label: 'inactifs' },
    { value: 'tous', label: 'tous' },
  ];

  // Présence de trait (mono-sélection ; re-clic ⇒ null) — Feature 010.
  const PRESENCE_OPTIONS: { value: Exclude<TraitPresence, null>; label: string }[] = [
    { value: 'none-active', label: 'aucun trait actif' },
    { value: 'some-active', label: 'au moins un trait actif' },
    { value: 'some-inactive', label: 'au moins un trait inactif' },
    { value: 'some-any', label: 'au moins un trait' },
  ];

  function onPower(v: Exclude<PowerPresence, null>) {
    setPowerPresence($criteria.powerPresence === v ? null : v);
  }
  function onPresence(v: Exclude<TraitPresence, null>) {
    setTraitPresence($criteria.traitPresence === v ? null : v);
  }
  function onReset() {
    resetFilters();
    resetSort(list); // « Réinitialiser » remet aussi le tri de la liste concernée (FR-018).
  }
</script>

<div class="filters">
  <div class="row">
    <label class="search">
      <span>Recherche par nom</span>
      <input
        type="text"
        value={$criteria.nameQuery}
        placeholder="nom (casse/accents ignorés)"
        on:input={(e) => setNameQuery((e.target as HTMLInputElement).value)}
      />
    </label>
    <button type="button" class="reset" on:click={onReset}>Réinitialiser</button>
  </div>

  <div class="dims">
    <fieldset>
      <legend>Génération</legend>
      {#if !$generationTouched && derniere !== null}
        <p class="hint">Défaut : dernière génération ({derniere})</p>
      {/if}
      <div class="chips">
        {#each generations as g (g)}
          <label class="chip">
            <input
              type="checkbox"
              checked={$criteria.generations.has(g)}
              on:change={() => toggleInSet('generations', g)}
            />
            {g}
          </label>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>Espèce</legend>
      <div class="chips">
        {#each especes as e (e)}
          <label class="chip">
            <input
              type="checkbox"
              checked={$criteria.especeIds.has(e)}
              on:change={() => toggleInSet('especeIds', e)}
            />
            {e}
          </label>
        {/each}
      </div>
    </fieldset>

    <fieldset>
      <legend>Statut</legend>
      <div class="chips">
        <label class="chip">
          <input
            type="checkbox"
            checked={$criteria.statuses.has('vivant')}
            on:change={() => toggleInSet('statuses', 'vivant')}
          />
          vivant
        </label>
        <label class="chip">
          <input
            type="checkbox"
            checked={$criteria.statuses.has('décédé')}
            on:change={() => toggleInSet('statuses', 'décédé')}
          />
          décédé
        </label>
      </div>
    </fieldset>

    <fieldset>
      <legend>Pouvoir</legend>
      <div class="chips">
        {#each POWER_OPTIONS as o (o.value)}
          <label class="chip">
            <input
              type="checkbox"
              checked={$criteria.powerPresence === o.value}
              on:change={() => onPower(o.value)}
            />
            {o.label}
          </label>
        {/each}
      </div>
    </fieldset>

    <fieldset class="trait-fs">
      <legend>Trait</legend>
      <div class="presence">
        {#each PRESENCE_OPTIONS as o (o.value)}
          <label class="chip">
            <input
              type="checkbox"
              checked={$criteria.traitPresence === o.value}
              on:change={() => onPresence(o.value)}
            />
            {o.label}
          </label>
        {/each}
      </div>
      <div class="scope">
        <span>Portée :</span>
        {#each SCOPES as s (s.value)}
          <label class="radio">
            <input
              type="radio"
              name="traitScope"
              checked={$criteria.traitScope === s.value}
              on:change={() => setTraitScope(s.value)}
            />
            {s.label}
          </label>
        {/each}
      </div>
      <details>
        <summary>{$criteria.traitIds.size} trait(s) sélectionné(s)</summary>
        <div class="chips scroll">
          {#each traits as t (t.id)}
            <label class="chip">
              <input
                type="checkbox"
                checked={$criteria.traitIds.has(t.id)}
                on:change={() => toggleInSet('traitIds', t.id)}
              />
              {t.label}
            </label>
          {/each}
        </div>
      </details>
    </fieldset>
  </div>
</div>

<style>
  .filters {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 18px 20px;
    margin-bottom: 1rem;
    background: var(--bg-elev);
  }
  .row {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }
  .search {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    max-width: 22rem;
  }
  .search span {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: var(--label-transform);
    color: var(--fg-faint);
  }
  .dims {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  fieldset {
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.5rem 0.7rem;
    min-width: 8rem;
  }
  legend {
    font-family: var(--mono);
    font-size: 11px;
    text-transform: var(--label-transform);
    color: var(--fg-faint);
    padding: 0 0.3rem;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.6rem;
  }
  .chips.scroll {
    max-height: 12rem;
    overflow-y: auto;
    margin-top: 0.3rem;
  }
  .chip,
  .radio {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.82rem;
    cursor: pointer;
    padding: 2px 8px;
    border-radius: var(--chip-radius);
    border: 1px solid transparent;
  }
  /* Chip filtre sélectionné : teinte d'accent NETTE (BUG-001) — bordure d'accent + fond marqué,
     visible aussi en style A (Atelier). */
  .chip:has(input:checked) {
    background: color-mix(in srgb, var(--accent) 28%, var(--bg-elev));
    border-color: var(--accent);
    color: var(--accent-text);
    font-weight: 600;
  }
  .presence {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.6rem;
    margin-bottom: 0.45rem;
  }
  .scope {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    margin-bottom: 0.3rem;
  }
  .hint {
    margin: 0 0 0.3rem;
    font-size: 0.74rem;
    color: var(--fg-muted);
  }
  /* US5 : la section des filtres de trait occupe sa **propre ligne** (saut de ligne dans le flex). */
  .trait-fs {
    flex: 1 0 100%;
    min-width: 14rem;
  }
  summary {
    cursor: pointer;
    font-size: 0.82rem;
  }
</style>
