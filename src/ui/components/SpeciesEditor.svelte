<script lang="ts">
  import { GENRE_TOUT, validateEspece, type Espece } from '../../core/index.js';
  import {
    especes,
    espAdd,
    espRename,
    espRemove,
    espSetParam,
    espAddGenre,
    espRenameGenre,
    espRemoveGenre,
  } from '../stores/appState.js';
  import GaussianCurve from './GaussianCurve.svelte';

  let newEspece = '';
  const newGenre: Record<string, string> = {};

  function addEspece() {
    const label = newEspece.trim();
    if (!label) return;
    espAdd(label);
    newEspece = '';
  }

  function addGenre(especeId: string) {
    const label = (newGenre[especeId] ?? '').trim();
    if (!label) return;
    espAddGenre(especeId, label);
    newGenre[especeId] = '';
  }

  function num<K extends keyof Espece>(especeId: string, key: K, e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    espSetParam(especeId, key, (Number.isFinite(v) ? v : 0) as Espece[K]);
  }

  // Champs numériques de reproduction (libellé + clé + bornes affichées).
  const REPRO_FIELDS: { key: keyof Espece; label: string; min?: number; max?: number }[] = [
    { key: 'reproStartAge', label: 'Âge de début', min: 0 },
    { key: 'reproPeakAge', label: 'Âge du pic', min: 0 },
    { key: 'reproEndAge', label: 'Âge de fin', min: 0 },
    { key: 'reproPeakPct', label: 'Probabilité au pic (%)', min: 0, max: 100 },
    { key: 'reproSlope', label: 'Pente (écart-type)', min: 0 },
    { key: 'groupSize', label: 'Taille de groupe', min: 1 },
    { key: 'litterMin', label: 'Portée min (M)', min: 0 },
    { key: 'litterMax', label: 'Portée max (N)', min: 0 },
    { key: 'litterExtraPct', label: 'Enfant suppl. (X %)', min: 0, max: 100 },
    { key: 'divorcePct', label: 'Divorce (%/an)', min: 0, max: 100 },
  ];
</script>

<div class="species-editor">
  {#each $especes as espece (espece.id)}
    {@const validation = validateEspece(espece)}
    <details class="espece" open>
      <summary>
        <span class="esp-name">{espece.label}</span>
        {#if !validation.ok}<span class="warn" title={validation.error}>⚠</span>{/if}
      </summary>

      <div class="esp-head">
        <input
          class="esp-label"
          type="text"
          value={espece.label}
          on:change={(e) => espRename(espece.id, (e.target as HTMLInputElement).value)}
        />
        <button
          type="button"
          class="del"
          title="Supprimer (n'affecte pas les individus existants)"
          disabled={$especes.length <= 1}
          on:click={() => espRemove(espece.id)}>Supprimer l'espèce</button
        >
      </div>

      <!-- Genres -->
      <fieldset class="block">
        <legend>Genres</legend>
        <ul class="genres">
          {#each espece.genres as genre (genre.id)}
            <li>
              <input
                type="text"
                value={genre.label}
                on:change={(e) =>
                  espRenameGenre(espece.id, genre.id, (e.target as HTMLInputElement).value)}
              />
              {#if genre.id === GENRE_TOUT}
                <span class="locked" title="Genre spécial toujours présent">verrouillé</span>
              {:else}
                <button
                  type="button"
                  class="del"
                  on:click={() => espRemoveGenre(espece.id, genre.id)}>✕</button
                >
              {/if}
            </li>
          {/each}
        </ul>
        <div class="add">
          <input
            type="text"
            placeholder="Nouveau genre…"
            bind:value={newGenre[espece.id]}
            on:keydown={(e) => e.key === 'Enter' && addGenre(espece.id)}
          />
          <button type="button" on:click={() => addGenre(espece.id)}>+ Ajouter</button>
        </div>
      </fieldset>

      <!-- Reproduction -->
      <fieldset class="block">
        <legend>Reproduction</legend>
        <div class="repro">
          <div class="grid">
            {#each REPRO_FIELDS as f (f.key)}
              <label class="field">
                <span>{f.label}</span>
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  value={espece[f.key]}
                  on:input={(e) => num(espece.id, f.key, e)}
                />
              </label>
            {/each}
          </div>
          <GaussianCurve {espece} />
        </div>
        {#if !validation.ok}
          <p class="error">{validation.error}</p>
        {/if}
      </fieldset>
    </details>
  {/each}

  <div class="add add-espece">
    <input
      type="text"
      placeholder="Nouvelle espèce…"
      bind:value={newEspece}
      on:keydown={(e) => e.key === 'Enter' && addEspece()}
    />
    <button type="button" on:click={addEspece}>+ Ajouter une espèce</button>
  </div>
</div>

<style>
  .species-editor {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .espece {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.4rem 0.7rem 0.7rem;
  }
  summary {
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .warn {
    color: var(--danger, #c0392b);
  }
  .esp-head {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin: 0.5rem 0;
  }
  .esp-label {
    flex: 1;
  }
  .block {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin: 0.5rem 0 0;
    padding: 0.5rem 0.7rem 0.7rem;
  }
  legend {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--accent);
    padding: 0 0.4rem;
  }
  .genres {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .genres li {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }
  .genres input {
    flex: 1;
    max-width: 16rem;
  }
  .locked {
    font-size: 0.72rem;
    color: var(--fg-muted);
  }
  .repro {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: start;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 0.5rem 0.8rem;
    flex: 1;
    min-width: 16rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.78rem;
    color: var(--fg-muted);
  }
  .add {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }
  .add input {
    flex: 1;
  }
  .del {
    color: var(--danger, #c0392b);
  }
  .error {
    color: var(--danger, #c0392b);
    font-size: 0.8rem;
    margin: 0.4rem 0 0;
  }
</style>
