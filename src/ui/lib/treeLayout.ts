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
const BUS = 26; // hauteur de la « barre horizontale » au-dessus des enfants (équerre)
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
  marriedIn: boolean; // conjoint « pièce rapportée » (grisé) — pas les ascendants
  vivant: boolean; // false ⇒ rendu « décédé »
}
export interface LayoutMark {
  key: string;
  x: number;
  y: number;
  ex: boolean;
}
/** Lien tracé en poly-ligne (suite de points) : segments membre↔⚭ et filiation en équerre. */
export interface LayoutLink {
  key: string;
  points: { x: number; y: number }[];
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
  src: Pick<TreeNodeLite, 'id' | 'nom' | 'age' | 'vivant' | 'pouvoirs'>,
  x: number,
  y: number,
  showAge: boolean,
  isRoot: boolean,
  dashed: boolean,
  marriedIn: boolean,
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
    marriedIn,
    vivant: src.vivant,
  });
}

// --- Descendance (vers le bas) ---

interface DMeasure {
  node: TreeNode;
  spouses: { conjointId: string; conjoint: TreeNodeLite; ex: boolean }[];
  // `unionIds` = conjoints dont l'union inclut cet enfant ; > 1 ⇒ enfant d'un groupe de > 2 parents.
  children: { m: DMeasure; unionIds: string[]; ex: boolean }[];
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

  // Regroupe chaque enfant par l'ENSEMBLE des unions qui le revendiquent (BUG-006 : > 2 parents).
  const byChild = new Map<string, string[]>();
  for (const u of node.unions) {
    for (const cid of u.enfantsCommuns) {
      const list = byChild.get(cid) ?? [];
      list.push(u.conjointId);
      byChild.set(cid, list);
    }
  }
  const children = node.descendants.map((d) => {
    const unionIds = byChild.get(d.id) ?? [];
    // « ex » seulement pour un enfant rattaché à une SEULE union « ex » (groupe ⇒ trait plein).
    const ex =
      unionIds.length === 1 &&
      node.unions.find((u) => u.conjointId === unionIds[0])?.statut === 'ex';
    return { m: measureDown(d), unionIds, ex };
  });

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
  const yc = y + CARD_H / 2;
  const clusterLeft = left + (m.width - m.selfWidth) / 2;
  const nodeX = clusterLeft;
  pushBox(out, m.node, nodeX, y, showAge, isRoot, dashedSelf, false);

  const unionMark = new Map<string, { x: number; y: number }>();
  let cx = nodeX;
  for (const s of m.spouses) {
    const markX = cx + CARD_W + COUPLE_GAP / 2;
    const spouseX = cx + CARD_W + COUPLE_GAP;
    out.marks.push({ key: `m${out.seq++}`, x: markX, y: yc, ex: s.ex });
    // Conjoint = « pièce rapportée » (grisé) ; pointillés si « ex ».
    pushBox(out, s.conjoint, spouseX, y, showAge, false, s.ex, true);
    // Lien de couple en 2 segments dont le ⚭ est le sommet (BUG-006).
    out.links.push({
      key: `c${out.seq++}`,
      points: [
        { x: cx + CARD_W, y: yc },
        { x: markX, y: yc },
        { x: spouseX, y: yc },
      ],
      ex: s.ex,
    });
    unionMark.set(s.conjointId, { x: markX, y: y + CARD_H });
    cx = spouseX;
  }

  const childrenLeft = left + (m.width - m.childrenWidth) / 2;
  let clx = childrenLeft;
  for (const c of m.children) {
    const childCenterX = placeDown(c.m, clx, depth + 1, out, showAge, false, c.ex);
    // Origine de la filiation : centre du GROUPE de parents (toutes les unions de l'enfant), sinon
    // bas de la case du nœud (enfant sans conjoint identifié) — BUG-006.
    const marks = c.unionIds
      .map((id) => unionMark.get(id))
      .filter((v): v is { x: number; y: number } => !!v);
    const from =
      marks.length > 0
        ? {
            x: marks.reduce((s, p) => s + p.x, 0) / marks.length,
            y: Math.max(...marks.map((p) => p.y)),
          }
        : { x: nodeX + CARD_W / 2, y: y + CARD_H };
    const childTopY = (depth + 1) * LEVEL;
    const busY = childTopY - BUS;
    // Filiation en équerre (3 segments) : ⚭ ↓ barre ↓ enfant (BUG-005).
    out.links.push({
      key: `l${out.seq++}`,
      points: [
        { x: from.x, y: from.y },
        { x: from.x, y: busY },
        { x: childCenterX, y: busY },
        { x: childCenterX, y: childTopY },
      ],
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
  const ycUp = yUp + CARD_H / 2;

  // « ex » du couple parental classique (2 parents) ⇒ pointillés des cases + filiation.
  const coupleEx =
    parents.length === 2 ? coupleStatut(parents[0].node, parents[1].node) === 'ex' : false;

  let px = nodeCenterX - blockWidth / 2;
  const cardLefts: number[] = [];
  const centers: number[] = [];
  for (const p of parents) {
    const cardLeft = px + (p.width - CARD_W) / 2;
    // Ascendants = ancêtres directs (jamais grisés) ; pointillés si couple parental binaire « ex ».
    pushBox(out, p.node, cardLeft, yUp, showAge, false, coupleEx, false);
    cardLefts.push(cardLeft);
    centers.push(cardLeft + CARD_W / 2);
    placeUp(p, cardLeft + CARD_W / 2, yUp, out, showAge); // grands-parents au-dessus
    px += p.width + H_GAP;
  }

  // ⚭ entre CHAQUE paire consécutive de parents en union (BUG-006), avec lien en 2 segments.
  for (let i = 0; i < parents.length - 1; i++) {
    const st = coupleStatut(parents[i].node, parents[i + 1].node);
    if (st === null) continue;
    const pairEx = st === 'ex';
    const markX = (centers[i] + centers[i + 1]) / 2;
    out.marks.push({ key: `m${out.seq++}`, x: markX, y: ycUp, ex: pairEx });
    out.links.push({
      key: `c${out.seq++}`,
      points: [
        { x: cardLefts[i] + CARD_W, y: ycUp },
        { x: markX, y: ycUp },
        { x: cardLefts[i + 1], y: ycUp },
      ],
      ex: pairEx,
    });
  }

  // Filiation en équerre depuis le centre du GROUPE parental vers le seul enfant de la lignée.
  const groupX = (centers[0] + centers[centers.length - 1]) / 2;
  const busY = nodeY - BUS;
  out.links.push({
    key: `l${out.seq++}`,
    points: [
      { x: groupX, y: yUp + CARD_H },
      { x: groupX, y: busY },
      { x: nodeCenterX, y: busY },
      { x: nodeCenterX, y: nodeY },
    ],
    ex: coupleEx,
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
    for (const p of lk.points) consider(p.x, p.y);
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
    for (const p of lk.points) {
      p.x += dx;
      p.y += dy;
    }
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
