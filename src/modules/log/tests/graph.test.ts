import * as assert from 'assert';
import { layout, type Edge, type Row } from '../graph';

function commit(hash: string, parents: string[]) {
  return { hash, parents, author: '', date: 0, refs: '', subject: '' };
}

function colOf(row: Row) {
  return row.col;
}

function edgeSummary(edge: Edge) {
  return [edge.lane, edge.toRow, edge.toCol];
}

const rows = layout([commit('D', ['B', 'C']), commit('C', ['A']), commit('B', ['A']), commit('A', [])]);
assert.deepStrictEqual(rows.map(colOf), [0, 1, 0, 0]);
assert.deepStrictEqual(rows[0].edges.map(edgeSummary), [[0, 2, 0], [1, 1, 1]]);
assert.deepStrictEqual(rows[1].edges.map(edgeSummary), [[1, 3, 0]]);
