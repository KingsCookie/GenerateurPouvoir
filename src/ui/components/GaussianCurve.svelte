<script lang="ts">
  import { reproProbability, type Espece } from '../../core/index.js';

  // Courbe de probabilité de reproduction (§9.4) tracée en **SVG sur-mesure** (aucune dépendance).
  export let espece: Espece;

  const W = 320;
  const H = 120;
  const PAD = 24;
  const SAMPLES = 80;

  // Échantillonnage réactif sur [début, fin]. Recalcule < 1 s (SC-004).
  $: start = espece.reproStartAge;
  $: end = Math.max(espece.reproEndAge, start + 1);
  $: span = end - start;
  $: maxP = Math.max(1, espece.reproPeakPct); // échelle Y : pic configuré (min 1 pour éviter /0)

  $: points = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const age = start + (span * i) / SAMPLES;
    const p = reproProbability(age, espece);
    const x = PAD + ((W - 2 * PAD) * i) / SAMPLES;
    const y = H - PAD - ((H - 2 * PAD) * p) / maxP;
    return { x, y };
  });

  $: path = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' ');
  $: area = `${path} L${(W - PAD).toFixed(1)},${H - PAD} L${PAD},${H - PAD} Z`;

  // Position de l'âge du pic (repère vertical).
  $: peakX = span > 0 ? PAD + ((W - 2 * PAD) * (espece.reproPeakAge - start)) / span : PAD;
</script>

<figure class="curve">
  <svg
    viewBox={`0 0 ${W} ${H}`}
    role="img"
    aria-label="Courbe de probabilité de reproduction par âge"
  >
    <!-- axes -->
    <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} class="axis" />
    <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} class="axis" />
    <!-- repère du pic -->
    {#if espece.reproPeakAge >= start && espece.reproPeakAge <= end}
      <line x1={peakX} y1={PAD} x2={peakX} y2={H - PAD} class="peak" />
    {/if}
    <!-- aire + courbe -->
    <path d={area} class="area" />
    <path d={path} class="line" />
    <!-- libellés -->
    <text x={PAD} y={H - 6} class="lbl">{start} ans</text>
    <text x={W - PAD} y={H - 6} class="lbl end">{end} ans</text>
    <text x={PAD - 4} y={PAD + 4} class="lbl y">{maxP}%</text>
  </svg>
  <figcaption>
    Probabilité de reproduction selon l'âge (pic à {espece.reproPeakAge} ans).
  </figcaption>
</figure>

<style>
  .curve {
    margin: 0;
  }
  svg {
    width: 100%;
    max-width: 22rem;
    height: auto;
    background: var(--bg-alt, rgba(127, 127, 127, 0.06));
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .axis {
    stroke: var(--border);
    stroke-width: 1;
  }
  .peak {
    stroke: var(--accent);
    stroke-width: 1;
    stroke-dasharray: 3 3;
    opacity: 0.6;
  }
  .area {
    fill: var(--accent);
    opacity: 0.15;
  }
  .line {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
  }
  .lbl {
    fill: var(--fg-muted);
    font-size: 9px;
  }
  .lbl.end {
    text-anchor: end;
  }
  .lbl.y {
    text-anchor: end;
  }
  figcaption {
    color: var(--fg-muted);
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
</style>
