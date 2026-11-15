const vscode = acquireVsCodeApi();
const ROW_HEIGHT = 24;
const LANE_WIDTH = 14;
const SVG_NS = 'http://www.w3.org/2000/svg';
const COLORS = ['#4c9be8', '#e8a33d', '#5fb35f', '#d9534f', '#a974d6', '#3dbdb0', '#e86fa8', '#9e9e9e'];
const list = document.getElementById('list');
let rows = [];
let selected = new Set();
let anchor = -1;

function laneColor(lane) {
  return COLORS[lane % COLORS.length];
}

function laneX(lane) {
  return lane * LANE_WIDTH + LANE_WIDTH / 2;
}

function rowY(row) {
  return row * ROW_HEIGHT + ROW_HEIGHT / 2;
}

function hashOf(row) {
  return row.hash;
}

function isSelected(row) {
  return selected.has(row.hash);
}

function createSvg(tag, attributes) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const name in attributes) element.setAttribute(name, attributes[name]);
  return element;
}

function curve(fromLane, fromRow, toLane, toRow) {
  const middleY = (rowY(fromRow) + rowY(toRow)) / 2;
  return ` C${laneX(fromLane)} ${middleY} ${laneX(toLane)} ${middleY} ${laneX(toLane)} ${rowY(toRow)}`;
}

function edgePath(fromRow, fromCol, lane, toRow, toCol) {
  const start = `M${laneX(fromCol)} ${rowY(fromRow)}`;
  if (toRow === fromRow + 1) return start + curve(fromCol, fromRow, toCol, toRow);
  const down = ` L${laneX(lane)} ${rowY(toRow - 1)}`;
  return start + curve(fromCol, fromRow, lane, fromRow + 1) + down + curve(lane, toRow - 1, toCol, toRow);
}

function laneCount() {
  let maxLane = 0;
  for (const row of rows) {
    maxLane = Math.max(maxLane, row.col);
    for (const edge of row.edges) maxLane = Math.max(maxLane, edge.lane);
  }
  return maxLane + 1;
}

function drawEdges(graph, row, index) {
  for (const edge of row.edges) {
    const toRow = edge.toRow === -1 ? rows.length : edge.toRow;
    const d = edgePath(index, row.col, edge.lane, toRow, edge.toCol);
    graph.append(createSvg('path', { d, stroke: laneColor(edge.lane), fill: 'none', 'stroke-width': 2 }));
  }
}

function drawGraph(lanes) {
  const graph = createSvg('svg', { width: lanes * LANE_WIDTH, height: rows.length * ROW_HEIGHT, class: 'graph' });
  for (let i = 0; i < rows.length; i++) drawEdges(graph, rows[i], i);
  for (let i = 0; i < rows.length; i++) {
    const dot = { cx: laneX(rows[i].col), cy: rowY(i), r: 4, fill: laneColor(rows[i].col) };
    graph.append(createSvg('circle', dot));
  }
  return graph;
}

function createCell(className, text) {
  const cell = document.createElement('span');
  cell.className = className;
  cell.textContent = text;
  return cell;
}

function createSubject(row) {
  const subject = createCell('subject', '');
  const refs = row.refs ? row.refs.split(', ') : [];
  for (const ref of refs) {
    const badgeClass = ref.startsWith('tag: ') ? 'ref tag' : 'ref';
    subject.append(createCell(badgeClass, ref));
  }
  subject.append(row.subject);
  return subject;
}

function createRow(row, index, lanes) {
  const element = document.createElement('div');
  const headClass = /\bHEAD\b/.test(row.refs) ? ' head' : '';
  const selectedClass = isSelected(row) ? ' sel' : '';
  element.className = 'row' + selectedClass + headClass;
  element.dataset.i = index;
  element.dataset.vscodeContext = JSON.stringify({ webviewSection: 'commit', hash: row.hash, preventDefaultContextMenuItems: true });
  element.style.paddingLeft = lanes * LANE_WIDTH + 6 + 'px';
  const date = new Date(row.date * 1000);
  element.append(createSubject(row), createCell('author', row.author), createCell('date', date.toLocaleString()));
  return element;
}

function render() {
  const lanes = laneCount();
  list.replaceChildren(drawGraph(lanes));
  for (let i = 0; i < rows.length; i++) list.append(createRow(rows[i], i, lanes));
}

function highlightRow(element) {
  element.classList.toggle('sel', isSelected(rows[element.dataset.i]));
}

function updateSelection() {
  const rowElements = list.querySelectorAll('.row');
  rowElements.forEach(highlightRow);
  const selectedRows = rows.filter(isSelected);
  vscode.postMessage({ type: 'select', hashes: selectedRows.map(hashOf) });
}

function selectRange(from, to) {
  const range = rows.slice(Math.min(from, to), Math.max(from, to) + 1);
  selected = new Set(range.map(hashOf));
}

function toggle(hash) {
  if (selected.has(hash)) selected.delete(hash);
  else selected.add(hash);
}

function select(index, modifiers) {
  const hash = rows[index].hash;
  if (modifiers.shiftKey && anchor >= 0) {
    selectRange(anchor, index);
  } else if (modifiers.metaKey || modifiers.ctrlKey) {
    toggle(hash);
    anchor = index;
  } else {
    selected = new Set([hash]);
    anchor = index;
  }
  updateSelection();
}

function rowIndexAt(event) {
  const element = event.target.closest('.row');
  return element ? Number(element.dataset.i) : -1;
}

function handleClick(event) {
  const index = rowIndexAt(event);
  if (index >= 0) select(index, event);
}

function handleContextMenu(event) {
  const index = rowIndexAt(event);
  if (index >= 0 && !isSelected(rows[index])) select(index, {});
}

function handleMessage(event) {
  const message = event.data;
  if (message.type === 'error') {
    list.textContent = message.text;
    return;
  }
  rows = message.rows;
  const stillSelected = rows.filter(isSelected);
  selected = new Set(stillSelected.map(hashOf));
  render();
}

window.addEventListener('message', handleMessage);
list.addEventListener('click', handleClick);
list.addEventListener('contextmenu', handleContextMenu);
vscode.postMessage({ type: 'ready' });
