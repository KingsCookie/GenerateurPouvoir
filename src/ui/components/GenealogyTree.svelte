<script lang="ts">
  import type { TreeNode } from '../../core/index.js';
  import { cellLines, powersLabel } from '../lib/treeViewModel.js';

  export let node: TreeNode;
  /** Affiche l'âge dans les cases (page dédiée) ; masqué sur la fiche (FR-003b). */
  export let showAge = false;
  /** Clic gauche sur une case : ouverture de fiche (fiche) ou recentrage (page dédiée). */
  export let onSelect: (id: string) => void = () => {};
  /** Racine = composant viewport (pan/zoom) ; sinon nœud récursif. */
  export let root = true;
  /** Affiche les unions (conjoints) du nœud — masqué pour les ancêtres (déjà couples affichés). */
  export let showUnions = true;

  // --- Viewport pan/zoom (FR-002b) : uniquement au niveau racine ---
  let scale = 1;
  let tx = 0;
  let ty = 0;
  const MIN_SCALE = 0.2;
  const MAX_SCALE = 4;
  let viewportEl: HTMLDivElement;
  const pointers = new Map<number, { x: number; y: number }>();
  let panning = false;
  let lastX = 0;
  let lastY = 0;
  let pinchDist0 = 0;
  let scale0 = 1;

  const clamp = (v: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));

  function pinchDistance(): number {
    const pts = [...pointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    scale = clamp(scale * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
  }

  function onPointerDown(e: PointerEvent) {
    viewportEl.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      // Début d'un pincement : on fige la distance/échelle de référence.
      panning = false;
      pinchDist0 = pinchDistance();
      scale0 = scale;
    } else if (pointers.size === 1 && (e.pointerType !== 'mouse' || e.button === 2)) {
      // Pan : doigt (tactile) ou clic droit (souris).
      panning = true;
      lastX = e.clientX;
      lastY = e.clientY;
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size >= 2) {
      const d = pinchDistance();
      if (pinchDist0 > 0) scale = clamp(scale0 * (d / pinchDist0));
    } else if (panning) {
      tx += e.clientX - lastX;
      ty += e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
    }
  }

  function onPointerUp(e: PointerEvent) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist0 = 0;
    if (pointers.size === 0) panning = false;
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
  }

  // Empêche le menu contextuel pendant le pan au clic droit (FR-002b).
  function onContextMenu(e: MouseEvent) {
    e.preventDefault();
  }
</script>

{#if root}
  <div
    class="viewport"
    role="application"
    aria-label="Arbre généalogique interactif (zoom et déplacement)"
    bind:this={viewportEl}
    on:wheel={onWheel}
    on:pointerdown={onPointerDown}
    on:pointermove={onPointerMove}
    on:pointerup={onPointerUp}
    on:pointercancel={onPointerUp}
    on:contextmenu={onContextMenu}
  >
    <button type="button" class="reset" on:click={resetView} title="Recentrer la vue">⟳</button>
    <div class="canvas" style="transform: translate({tx}px, {ty}px) scale({scale});">
      <svelte:self {node} {showAge} {onSelect} root={false} />
    </div>
  </div>
{:else}
  <div class="branch">
    {#if node.ancestors.length > 0}
      <div class="level ancestors">
        {#each node.ancestors as a (a.id)}
          <svelte:self node={a} {showAge} {onSelect} root={false} showUnions={false} />
        {/each}
      </div>
    {/if}

    <div class="self-row">
      <button
        type="button"
        class="cell"
        on:click={() => onSelect(node.id)}
        title="Centrer / ouvrir"
      >
        <strong class="nom">{node.nom || '—'}</strong>
        {#each cellLines(node, showAge) as line}
          <span class="line">{line}</span>
        {/each}
      </button>

      {#if showUnions}
        {#each node.unions as u (u.conjointId + u.statut)}
          <div class="union" title={`${u.enfantsCommuns.length} enfant(s) en commun`}>
            <span class="lien">{u.statut === 'actuel' ? '⚭' : '⚮'}</span>
            <button type="button" class="cell spouse" on:click={() => onSelect(u.conjointId)}>
              <strong class="nom">{u.conjoint.nom || '—'}</strong>
              {#if showAge}<span class="line">{u.conjoint.age} an(s)</span>{/if}
              <span class="line">{powersLabel(u.conjoint)}</span>
              {#if u.enfantsCommuns.length > 0}
                <span class="line muted">{u.enfantsCommuns.length} enfant(s)</span>
              {/if}
            </button>
          </div>
        {/each}
      {/if}
    </div>

    {#if node.descendants.length > 0}
      <div class="level descendants">
        {#each node.descendants as d (d.id)}
          <svelte:self node={d} {showAge} {onSelect} root={false} />
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .viewport {
    position: relative;
    width: 100%;
    height: clamp(18rem, 45vh, 32rem);
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg-elev);
    touch-action: none; /* gestes personnalisés (pan/pinch) */
    cursor: grab;
    user-select: none;
  }
  .canvas {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform-origin: top center;
    display: inline-block;
    will-change: transform;
  }
  .reset {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    z-index: 2;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    line-height: 1;
    cursor: pointer;
  }
  .branch {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
  }
  .level {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    justify-content: center;
    gap: 1rem;
  }
  .level.descendants {
    align-items: flex-start;
  }
  .self-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .cell {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 7rem;
    max-width: 12rem;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    text-align: center;
    cursor: pointer;
  }
  .cell:hover {
    border-color: var(--accent);
  }
  .cell .nom {
    font-size: 0.9rem;
  }
  .cell .line {
    font-size: 0.72rem;
    color: var(--fg-muted);
    overflow-wrap: anywhere;
  }
  .cell.spouse {
    border-style: dashed;
  }
  .union {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }
  .lien {
    color: var(--fg-muted);
  }
  .muted {
    color: var(--fg-muted);
  }
</style>
