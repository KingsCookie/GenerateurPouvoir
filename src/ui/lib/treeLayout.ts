// Calcul de disposition de l'arbre généalogique (UI pur) — produit des positions absolues pour les
// cases, les symboles d'union ⚭ et les liens de filiation, afin de tracer des connecteurs SVG
// FIABLES et ALIGNÉS (BUG-004). Cartes de taille fixe ⇒ coordonnées déterministes, pas de mesure
// DOM. Symétrique : descendants (toutes les unions + enfants communs) ET ascendants (couple parental
// relié au seul enfant de la lignée). Statut actuel/ex du couple parental déduit des `unions` déjà
// portées par les nœuds (option (c) — aucun accès au cœur ni à `byId`).
import type { TreeNode, TreeNodeLite } from '../../core/index.js';
import { cellLines } from './treeViewModel.js';

export const CARD_W = 160;
export const CARD_H = 64;
const H_GAP = 28; // écart horizontal entre sous-arbres frères
const COUPLE_GAP = 34; // écart entre les deux membres d'un couple (place pour ⚭)
const V_GAP = 70; // écart vertical entre générations (place pour les liens)
const PAD = 24; // marge autour de l'arbre
const LEVEL = CARD_H + V_GAP;

export interface LayoutBox {
  key: string; // clé unique de rendu (un individu peut se répéter)
  refId: string; // id de la personne (navigation)
  x: number;
  y: number;
  nom: string;
  lines: string[];
  isRoot: boolean;
  dashed: boolean; // conjoint « ex » / enfant d'ex / parent d'un couple « ex »
}
export interface LayoutMark {
  key: string;
  x: number;
  y: number;
  ex: boolean;
}
export interface LayoutLink {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ex: boolean;
}
export interface TreeLayout {
  boxes: LayoutBox[];
  marks: LayoutMark[];
  links: LayoutLink[];
  width: number;
  height: number;
  rootCenter: { x: number; y: number };
}

interface Out {
  boxes: LayoutBox[];
  marks: LayoutMark[];
  links: LayoutLink[];
  seq: number;
}

/** Statut de l'union entre deux nœuds, déduit de leurs `unions` (option (c)). */
function coupleStatut(a: TreeNode, b: TreeNode): 'actuel' | 'ex' | null {
  const u =
    a.unions.find((x) => x.conjointId === b.id) ?? b.unions.find((x) => x.conjointId === a.id);
  return u ? u.statut : null;
}

function pushBox(
  out: Out,
  src: Pick<TreeNodeLite, 'id' | 'nom' | 'age' | 'pouvoirs'>,
  x: number,
  y: number,
  showAge: boolean,
  isRoot: boolean,
  dashed: boolean,
): void {
  out.boxes.push({
    key: `${src.id}#${out.seq++}`,
    refId: src.id,
    x,
    y,
    nom: src.nom || '—',
    lines: cellLines(src, showAge),
    isRoot,
    dashed,
  });
}

// --- Descendance (vers le bas) ---

interface DMeasure {
  node: TreeNode;
  spouses: { conjointId: string; conjoint: TreeNodeLite; ex: boolean }[];
  children: { m: DMeasure; unionId: string | null; ex: boolean }[];
  selfWidth: number;
  childrenWidth: number;
  width: number;
}

function measureDown(node: TreeNode): DMeasure {
  const spouses = node.unions.map((u) => ({
    conjointId: u.conjointId,
    conjoint: u.conjoint,
    ex: u.statut === 'ex',
  }));

  const claimed = new Set<string>();
  const children: { m: DMeasure; unionId: string | null; ex: boolean }[] = [];
  for (const u of node.unions) {
    for (const cid of u.enfantsCommuns) {
      const d = node.descendants.find((x) => x.id === cid);
      if (d) {
        children.push({ m: measureDown(d), unionId: u.conjointId, ex: u.statut === 'ex' });
        claimed.add(cid);
      }
    }
  }
  for (const d of node.descendants) {
    if (!claimed.has(d.id)) children.push({ m: measureDown(d), unionId: null, ex: false });
  }

  const childrenWidth =
    children.length > 0
      ? children.reduce((s, c) => s + c.m.width, 0) + H_GAP * (children.length - 1)
      : 0;
  const selfWidth = CARD_W + spouses.length * (COUPLE_GAP + CARD_W);
  const width = Math.max(selfWidth, childrenWidth, CARD_W);
  return { node, spouses, children, selfWidth, childrenWidth, width };
}

/** Place le sous-arbre descendant ; renvoie le centre X de la case du nœud. */
function placeDown(
  m: DMeasure,
  left: number,
  depth: number,
  out: Out,
  showAge: boolean,
  isRoot: boolean,
  dashedSelf: boolean,
): number {
  const y = depth * LEVEL;
  const clusterLeft = left + (m.width - m.selfWidth) / 2;
  const nodeX = clusterLeft;
  pushBox(out, m.node, nodeX, y, showAge, isRoot, dashedSelf);

  const unionMark = new Map<string, { x: number; y: number }>();
  let cx = nodeX;
  for (const s of m.spouses) {
    const markX = cx + CARD_W + COUPLE_GAP / 2;
    const spouseX = cx + CARD_W + COUPLE_GAP;
    out.marks.push({ key: `m${out.seq++}`, x: markX, y: y + CARD_H / 2, ex: s.ex });
    pushBox(out, s.conjoint, spouseX, y, showAge, false, s.ex);
    unionMark.set(s.conjointId, { x: markX, y: y + CARD_H });
    cx = spouseX;
  }

  const childrenLeft = left + (m.width - m.childrenWidth) / 2;
  let clx = childrenLeft;
  for (const c of m.children) {
    const childCenterX = placeDown(c.m, clx, depth + 1, out, showAge, false, c.ex);
    const from = (c.unionId && unionMark.get(c.unionId)) || {
      x: nodeX + CARD_W / 2,
      y: y + CARD_H,
    };
    out.links.push({
      key: `l${out.seq++}`,
      x1: from.x,
      y1: from.y,
      x2: childCenterX,
      y2: (depth + 1) * LEVEL,
      ex: c.ex,
    });
    clx += c.m.width + H_GAP;
  }
  return nodeX + CARD_W / 2;
}

// --- Ascendance (vers le haut) ---

interface UMeasure {
  node: TreeNode;
  parents: UMeasure[];
  width: number;
}

function measureUp(node: TreeNode): UMeasure {
  const parents = node.ancestors.map(measureUp);
  const block =
    parents.length > 0
      ? parents.reduce((s, p) => s + p.width, 0) + H_GAP * (parents.length - 1)
      : 0;
  return { node, parents, width: Math.max(block, CARD_W) };
}

/** Place les parents (et au-dessus) du nœud, centrés sur `nodeCenterX`, au-dessus de `nodeY`. */
function placeUp(
  m: UMeasure,
  nodeCenterX: number,
  nodeY: number,
  out: Out,
  showAge: boolean,
): void {
  const parents = m.parents;
  if (parents.length === 0) return;

  const blockWidth =
    parents.length > 1
      ? parents.reduce((s, p) => s + p.width, 0) + H_GAP * (parents.length - 1)
      : parents[0].width;
  const yUp = nodeY - LEVEL;

  // Statut du couple parental (pointillés si « ex »).
  const ex = parents.length === 2 ? coupleStatut(parents[0].node, parents[1].node) === 'ex' : false;

  let px = nodeCenterX - blockWidth / 2;
  const centers: number[] = [];
  for (const p of parents) {
    const cardLeft = px + (p.width - CARD_W) / 2;
    pushBox(out, p.node, cardLeft, yUp, showAge, false, ex);
    const center = cardLeft + CARD_W / 2;
    centers.push(center);
    placeUp(p, center, yUp, out, showAge); // grands-parents au-dessus
    px += p.width + H_GAP;
  }

  const markX = parents.length === 2 ? (centers[0] + centers[1]) / 2 : centers[0];
  if (parents.length === 2) {
    out.marks.push({ key: `m${out.seq++}`, x: markX, y: yUp + CARD_H / 2, ex });
  }
  // Lien du couple parental vers le seul enfant de la lignée (le nœud).
  out.links.push({
    key: `l${out.seq++}`,
    x1: markX,
    y1: yUp + CARD_H,
    x2: nodeCenterX,
    y2: nodeY,
    ex,
  });
}

/** Construit la disposition complète (ascendants + descendants) centrée sur la racine. */
export function layoutTree(root: TreeNode, showAge: boolean): TreeLayout {
  const out: Out = { boxes: [], marks: [], links: [], seq: 0 };

  const dm = measureDown(root);
  const rootCenterX = placeDown(dm, 0, 0, out, showAge, true, false);
  const um = measureUp(root);
  placeUp(um, rootCenterX, 0, out, showAge);

  // Normalisation : on décale tout pour que le coin haut-gauche soit (PAD, PAD).
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const consider = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (const b of out.boxes) {
    consider(b.x, b.y);
    consider(b.x + CARD_W, b.y + CARD_H);
  }
  for (const mk of out.marks) consider(mk.x, mk.y);
  for (const lk of out.links) {
    consider(lk.x1, lk.y1);
    consider(lk.x2, lk.y2);
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = CARD_W;
    maxY = CARD_H;
  }

  const dx = PAD - minX;
  const dy = PAD - minY;
  for (const b of out.boxes) {
    b.x += dx;
    b.y += dy;
  }
  for (const mk of out.marks) {
    mk.x += dx;
    mk.y += dy;
  }
  for (const lk of out.links) {
    lk.x1 += dx;
    lk.y1 += dy;
    lk.x2 += dx;
    lk.y2 += dy;
  }

  return {
    boxes: out.boxes,
    marks: out.marks,
    links: out.links,
    width: maxX - minX + 2 * PAD,
    height: maxY - minY + 2 * PAD,
    rootCenter: { x: rootCenterX + dx, y: CARD_H / 2 + dy },
  };
}
