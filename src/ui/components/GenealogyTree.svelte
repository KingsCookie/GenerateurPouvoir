<script lang="ts">
  import type { TreeNode } from '../../core/index.js';
  import { cellLines, powersLabel } from '../lib/treeViewModel.js';

  export let node: TreeNode;
  /** Affiche l'âge dans les cases (page dédiée) ; masqué sur la fiche (FR-003b). */
  export let showAge = false;
  /** Clic (sans glisser) sur une case : ouverture de fiche (fiche) ou recentrage (page dédiée). */
  export let onSelect: (id: string) => void = () => {};
  /** Racine = composant viewport (pan/zoom) ; sinon nœud récursif. */
  export let root = true;
  /** Affiche les unions (conjoints) du nœud — masqué pour les ancêtres. */
  export let showUnions = true;
  /** Nœud central (l'individu dont on consulte l'arbre) ⇒ couleur distincte (FR-003c). */
  export let isRoot = false;
  /** Case en pointillés (enfant issu d'une union avec un ex — FR-003c). */
  export let dashed = false;

  // --- Viewport pan/zoom (FR-002b/FR-002d) : uniquement au niveau racine ---
  const THRESHOLD = 5; // px : en deçà = clic (navigation) ; au-delà = pan (déplacement)
  const MIN_SCALE = 0.2;
  const MAX_SCALE = 4;
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let viewportEl: HTMLDivElement;
  const pointers = new Map<number, { x: number; y: number }>();
  let panId: number | null = null;
  let startX = 0;
  let startY = 0;
  let baseTx = 0;
  let baseTy = 0;
  let panActive = false;
  let didPan = false;
  let pinching = false;
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
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      // Pincement : on fige la distance/échelle de référence (et on annule un éventuel pan).
      pinching = true;
      panActive = false;
      panId = null;
      pinchDist0 = pinchDistance();
      scale0 = scale;
    } else if (pointers.size === 1 && (e.pointerType !== 'mouse' || e.button === 0)) {
      // Candidat au pan au clic gauche / doigt — sans capturer ni paner tant que le seuil n'est pas
      // franchi (préserve le clic simple des cases et du bouton ⟳).
      panId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      baseTx = tx;
      baseTy = ty;
      panActive = false;
      didPan = false;
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinching && pointers.size >= 2) {
      const d = pinchDistance();
      if (pinchDist0 > 0) scale = clamp(scale0 * (d / pinchDist0));
      return;
    }
    if (panId === e.pointerId) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!panActive && Math.hypot(dx, dy) > THRESHOLD) {
        // Seuil franchi : c'est un glisser ⇒ on démarre le pan et on capture le pointeur.
        panActive = true;
        try {
          viewportEl.setPointerCapture(e.pointerId);
        } catch {
          /* capture indisponible : pan dégradé sans capture */
        }
      }
      if (panActive) {
        tx = baseTx + dx;
        ty = baseTy + dy;
        didPan = true;
      }
    }
  }

  function onPointerUp(e: PointerEvent) {
    pointers.delete(e.pointerId);
    if (panId === e.pointerId) {
      if (panActive) {
        try {
          viewportEl.releasePointerCapture(e.pointerId);
        } catch {
          /* rien */
        }
      }
      panId = null;
      panActive = false;
    }
    if (pointers.size < 2) {
      pinching = false;
      pinchDist0 = 0;
    }
  }

  // Après un glisser, neutralise le clic synthétique pour ne pas déclencher la navigation.
  function onClickCapture(e: MouseEvent) {
    if (didPan) {
      e.preventDefault();
      e.stopPropagation();
      didPan = false;
    }
  }

  function resetView() {
    scale = 1;
    tx = 0;
    ty = 0;
  }

  // Regroupement des descendants par union (pour tracer les liens ⚭ → enfants communs).
  $: unionChildIds = new Set(node.unions.flatMap((u) => u.enfantsCommuns));
  $: otherDescendants = node.descendants.filter((d) => !unionChildIds.has(d.id));
  function childrenOf(ids: string[]): TreeNode[] {
    const s = new Set(ids);
    return node.descendants.filter((d) => s.has(d.id));
  }
</script>

{#if root}
  <!-- Zone de visualisation à interaction personnalisée (pan/zoom) ; rôle applicatif assumé. La
       gestion clavier passe par les boutons internes (cases, ⟳) ; le handler de la zone ne sert qu'à
       neutraliser le clic synthétique après un glisser. -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_click_events_have_key_events -->
  <div
    class="viewport"
    role="application"
    aria-label="Arbre généalogique interactif (zoom molette/pincement, déplacement par glisser)"
    bind:this={viewportEl}
    on:wheel={onWheel}
    on:pointerdown={onPointerDown}
    on:pointermove={onPointerMove}
    on:pointerup={onPointerUp}
    on:pointercancel={onPointerUp}
    on:click|capture={onClickCapture}
  >
    <button type="button" class="reset" on:click={resetView} title="Recentrer la vue">⟳</button>
    <div class="canvas" style="transform: translate(calc(-50% + {tx}px), {ty}px) scale({scale});">
      <svelte:self {node} {showAge} {onSelect} root={false} isRoot={true} />
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
        class:root={isRoot}
        class:dashed
        on:click={() => onSelect(node.id)}
      >
        <strong class="nom">{node.nom || '—'}</strong>
        {#each cellLines(node, showAge) as line}
          <span class="line">{line}</span>
        {/each}
      </button>

      {#if showUnions}
        {#each node.unions as u (u.conjointId + u.statut)}
          <span class="lien" title={u.statut === 'actuel' ? 'union actuelle' : 'ex-union'}>⚭</span>
          <button
            type="button"
            class="cell spouse"
            class:dashed={u.statut === 'ex'}
            on:click={() => onSelect(u.conjointId)}
          >
            <strong class="nom">{u.conjoint.nom || '—'}</strong>
            {#if showAge}<span class="line">{u.conjoint.age} an(s)</span>{/if}
            <span class="line">{powersLabel(u.conjoint)}</span>
          </button>
        {/each}
      {/if}
    </div>

    {#if showUnions}
      {#each node.unions as u (u.conjointId + u.statut + '-children')}
        {#if childrenOf(u.enfantsCommuns).length > 0}
          <div class="union-children" class:ex={u.statut === 'ex'}>
            <span
              class="union-marker"
              title={u.statut === 'actuel' ? 'enfants de l’union' : 'enfants de l’ex-union'}>⚭</span
            >
            <div class="children-row" class:single={childrenOf(u.enfantsCommuns).length === 1}>
              {#each childrenOf(u.enfantsCommuns) as child (child.id)}
                <div class="child-wrap">
                  <svelte:self
                    node={child}
                    {showAge}
                    {onSelect}
                    root={false}
                    dashed={u.statut === 'ex'}
                  />
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    {/if}

    {#if otherDescendants.length > 0}
      <div class="union-children">
        <div class="children-row" class:single={otherDescendants.length === 1}>
          {#each otherDescendants as child (child.id)}
            <div class="child-wrap">
              <svelte:self node={child} {showAge} {onSelect} root={false} />
            </div>
          {/each}
        </div>
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
  /* Racine (individu consulté) : couleur distincte (FR-003c). */
  .cell.root {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 22%, var(--bg));
    color: var(--fg);
  }
  /* Ex-conjoint et enfants d'ex : pointillés (FR-003c). */
  .cell.dashed {
    border-style: dashed;
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
    background: var(--bg-elev);
  }
  .lien {
    color: var(--fg-muted);
    font-size: 1.1rem;
  }

  /* Liens de filiation : un trait part du ⚭ et relie tous les enfants communs (FR-003c). */
  .union-children {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .union-marker {
    color: var(--fg-muted);
    font-size: 1rem;
    line-height: 1;
  }
  .union-marker::after {
    content: '';
    display: block;
    width: 0;
    height: 0.7rem;
    margin: 0 auto;
    border-left: 2px solid var(--border);
  }
  .union-children.ex .union-marker::after {
    border-left-style: dashed;
  }
  .children-row {
    display: flex;
    justify-content: center;
    gap: 1rem;
    position: relative;
    padding-top: 0.7rem;
  }
  /* Barre horizontale reliant les enfants (masquée s'il n'y en a qu'un). */
  .children-row::before {
    content: '';
    position: absolute;
    top: 0;
    left: 25%;
    right: 25%;
    border-top: 2px solid var(--border);
  }
  .children-row.single::before {
    display: none;
  }
  .union-children.ex .children-row::before {
    border-top-style: dashed;
  }
  .child-wrap {
    position: relative;
    display: flex;
    justify-content: center;
  }
  /* Descente verticale vers chaque enfant. */
  .child-wrap::before {
    content: '';
    position: absolute;
    top: -0.7rem;
    left: 50%;
    height: 0.7rem;
    border-left: 2px solid var(--border);
  }
  .union-children.ex .child-wrap::before {
    border-left-style: dashed;
  }
</style>
