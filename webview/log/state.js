const vscode = acquireVsCodeApi();
const ROW_HEIGHT = 24;
const LANE_WIDTH = 14;
const SVG_NS = 'http://www.w3.org/2000/svg';
const COLORS = ['#4c9be8', '#e8a33d', '#5fb35f', '#d9534f', '#a974d6', '#3dbdb0', '#e86fa8', '#9e9e9e'];
const list = document.getElementById('list');
const detailsPanel = document.getElementById('details');
let rows = [];
let selected = new Set();
let anchor = -1;
let graphFiltered = false;
let hasMore = false;

function hashOf(row) {
  return row.hash;
}

function isSelected(row) {
  return selected.has(row.hash);
}

function colOf(row) {
  return graphFiltered ? 0 : row.col;
}
