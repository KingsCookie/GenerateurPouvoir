import { describe, it, expect } from 'vitest';
import {
  buildGenealogyTree,
  type TreeNode,
  type TreeContext,
} from '../../src/core/genealogy/tree.js';
import { defaultCatalog } from '../../src/core/catalog/defaultCatalog.js';
import { buildGenealogyFixture } from './_genealogyFixture.js';

const ctx: TreeContext = { currentYear: 100, catalog: defaultCatalog() };

/** Collecte tous les ids présents dans l'arbre (racine + ancêtres + descendants, récursif). */
function collectIds(node: TreeNode, acc: string[] = []): string[] {
  acc.push(node.id);
  for (const a of node.ancestors) collectIds(a, acc);
  for (const d of node.descendants) collectIds(d, acc);
  return acc;
}

describe('buildGenealogyTree — arbre généalogique (US1)', () => {
  it('borne la profondeur (ancêtres via parents, descendants via enfants)', () => {
    const { byId } = buildGenealogyFixture();

    const d1 = buildGenealogyTree('f1', byId, 1, ctx);
    // 1 niveau d'ancêtres : les parents de f1 (d1, e1) triés par date ; pas au-delà.
    expect(d1.ancestors.map((n) => n.id)).toEqual(['d1', 'e1']);
    expect(d1.ancestors[0].ancestors).toEqual([]);
    expect(d1.descendants).toEqual([]); // f1 n'a pas d'enfant

    const d2 = buildGenealogyTree('f1', byId, 2, ctx);
    // 2 niveaux : parents de d1 = cx (0020) puis b1 (0021), triés par date.
    const d1Node = d2.ancestors.find((n) => n.id === 'd1')!;
    expect(d1Node.ancestors.map((n) => n.id)).toEqual(['cx', 'b1']);
  });

  it('descend via enfants, triés par date de naissance (INV-G3)', () => {
    const { byId } = buildGenealogyFixture();
    const tree = buildGenealogyTree('a1', byId, 1, ctx);
    // Enfants de a1 : b1 (0021) puis b2 (0023).
    expect(tree.descendants.map((n) => n.id)).toEqual(['b1', 'b2']);
    expect(tree.ancestors).toEqual([]); // a1 n'a pas de parent renseigné
  });

  it('répète un individu atteint par plusieurs chemins et termine (consanguinité, INV-G1)', () => {
    const { byId } = buildGenealogyFixture();
    // f1 descend de a1/a2 par deux branches (b1 et b2) ⇒ a1 et a2 apparaissent deux fois.
    const tree = buildGenealogyTree('f1', byId, 4, ctx);
    const ids = collectIds(tree);
    expect(ids.filter((id) => id === 'a1')).toHaveLength(2);
    expect(ids.filter((id) => id === 'a2')).toHaveLength(2);
  });

  it('unions = conjoint (actuel/ex) + enfants communs uniquement (INV-G2)', () => {
    const { byId } = buildGenealogyFixture();
    const tree = buildGenealogyTree('b1', byId, 1, ctx);
    // Deux unions, triées par date du conjoint : cx (ex, 0020) puis cc (actuel, 0022).
    expect(tree.unions.map((u) => u.conjointId)).toEqual(['cx', 'cc']);
    expect(tree.unions.map((u) => u.statut)).toEqual(['ex', 'actuel']);
    const uCx = tree.unions.find((u) => u.conjointId === 'cx')!;
    const uCc = tree.unions.find((u) => u.conjointId === 'cc')!;
    expect(uCx.enfantsCommuns).toEqual(['d1']);
    // cc a aussi d3 (avec xo), qui NE doit PAS figurer comme enfant commun de b1+cc.
    expect(uCc.enfantsCommuns).toEqual(['d2']);
  });

  it('expose nom, âge, statut vivant et libellés de pouvoir des nœuds', () => {
    const { byId } = buildGenealogyFixture();
    const tree = buildGenealogyTree('cc', byId, 1, ctx);
    // cc a un enfant d3 (décédé, avec pouvoir DERIVE) — vérifie âge, vivant et libellé.
    const d3 = tree.descendants.find((n) => n.id === 'd3')!;
    expect(d3.age).toBe(100 - 40);
    expect(d3.vivant).toBe(false); // d3 décédé dans la fixture (BUG-005)
    expect(tree.vivant).toBe(true); // cc vivant
    expect(d3.pouvoirs).toEqual(['boule de feu']);
  });

  it('racine absente ⇒ nœud minimal vide', () => {
    const { byId } = buildGenealogyFixture();
    const tree = buildGenealogyTree('inconnu', byId, 3, ctx);
    expect(tree).toEqual({
      id: 'inconnu',
      nom: '',
      age: 0,
      vivant: false,
      pouvoirs: [],
      ancestors: [],
      descendants: [],
      unions: [],
    });
  });

  it('familles à plus de 2 parents : tous les parents en ascendance (BUG-006)', () => {
    const { byId } = buildGenealogyFixture();
    const tree = buildGenealogyTree('tri', byId, 1, ctx);
    // tri a 3 parents (pa, pb, pc) — tous présents en ancêtres, triés par date.
    expect(tree.ancestors.map((n) => n.id)).toEqual(['pa', 'pb', 'pc']);
    // Chaque parent est en union avec les deux autres (⚭ entre chaque paire côté UI).
    const pa = tree.ancestors.find((n) => n.id === 'pa')!;
    expect(pa.unions.map((u) => u.conjointId).sort()).toEqual(['pb', 'pc']);
  });

  it('co-parents non conjoints : deux parents en ascendance sans union mutuelle (BUG-007)', () => {
    const { byId } = buildGenealogyFixture();
    const tree = buildGenealogyTree('duo', byId, 1, ctx);
    // duo a 2 parents (qa, qb) présents en ascendance, triés par date.
    expect(tree.ancestors.map((n) => n.id)).toEqual(['qa', 'qb']);
    // Ni l'un ni l'autre n'est en union ⇒ le rendu relie les co-parents SANS symbole ⚭ (UI).
    const qa = tree.ancestors.find((n) => n.id === 'qa')!;
    const qb = tree.ancestors.find((n) => n.id === 'qb')!;
    expect(qa.unions).toEqual([]);
    expect(qb.unions).toEqual([]);
  });

  it('lecture seule : ne mute pas la population en entrée (INV-G6)', () => {
    const { population, byId } = buildGenealogyFixture();
    const before = JSON.stringify(population);
    buildGenealogyTree('f1', byId, 5, ctx);
    expect(JSON.stringify(population)).toBe(before);
  });
});
