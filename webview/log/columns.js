const DEFAULT_COLUMNS = { graph: 8 * LANE_WIDTH, author: 140, date: 150 };
const MIN_COLUMN_WIDTH = { graph: LANE_WIDTH, author: 30, date: 30 };
const RESIZE_ZONE = 4;
const CELL_GAP = 12;
const savedColumns = vscode.getState()?.columns;
const columns = { ...DEFAULT_COLUMNS, ...savedColumns };
let lanesAtRow = [];
let graphWidth = 0;
let drag = null;
let justResized = false;

function markLane(rowIndex, lane) {
  if (rowIndex < lanesAtRow.length) lanesAtRow[rowIndex] = Math.max(lanesAtRow[rowIndex], lane);
}

function markEdge(fromRow, edge) {
  const lastRow = edge.toRow === -1 ? rows.length - 1 : edge.toRow;
  for (let r = fromRow + 1; r < lastRow; r++) markLane(r, edge.lane);
  markLane(lastRow, edge.toCol);
}

function measureLanes() {
  lanesAtRow = new Array(rows.length).fill(0);
  if (graphFiltered) return;
  for (let i = 0; i < rows.length; i++) {
    markLane(i, rows[i].col);
    for (const edge of rows[i].edges) markEdge(i, edge);
  }
}

function visibleLaneCount() {
  const first = Math.floor(list.scrollTop / ROW_HEIGHT);
  const last = Math.ceil((list.scrollTop + list.clientHeight) / ROW_HEIGHT);
  const visible = lanesAtRow.slice(first, last + 1);
  return visible.length ? Math.max(...visible) + 1 : 1;
}

function placeDivider(column, left) {
  const divider = list.querySelector(`.divider[data-column="${column}"]`);
  if (divider) divider.style.left = left + 'px';
}

function cellOf(column) {
  return list.querySelector(`.row .${column}`);
}

function placeDividers() {
  placeDivider('graph', graphWidth);
  const author = cellOf('author');
  const date = cellOf('date');
  if (author) placeDivider('author', author.offsetLeft - CELL_GAP / 2);
  if (date) placeDivider('date', date.offsetLeft - CELL_GAP / 2);
}

function applyColumns() {
  list.style.setProperty('--graph-width', graphWidth + 'px');
  list.style.setProperty('--author-width', columns.author + 'px');
  list.style.setProperty('--date-width', columns.date + 'px');
  placeDividers();
}

function currentWidth(column) {
  if (column === 'graph') return graphWidth;
  const cell = cellOf(column);
  return cell ? cell.offsetWidth : columns[column];
}

function fitGraph() {
  graphWidth = Math.min(visibleLaneCount() * LANE_WIDTH, columns.graph);
  applyColumns();
}

function createDivider(column) {
  const divider = document.createElement('div');
  divider.className = 'divider';
  divider.dataset.column = column;
  divider.style.height = rows.length * ROW_HEIGHT + 'px';
  return divider;
}

function createDividers() {
  return ['graph', 'author', 'date'].map(createDivider);
}

function isNearPointer(clientX) {
  return function isNear(divider) {
    const rect = divider.getBoundingClientRect();
    return Math.abs(rect.left - clientX) <= RESIZE_ZONE;
  };
}

function dividerAt(event) {
  const dividers = [...list.querySelectorAll('.divider')];
  return dividers.find(isNearPointer(event.clientX));
}

function highlightDivider(divider) {
  for (const element of list.querySelectorAll('.divider.active')) element.classList.remove('active');
  if (divider) divider.classList.add('active');
  list.classList.toggle('on-divider', Boolean(divider));
}

function startResize(event) {
  const divider = event.button === 0 ? dividerAt(event) : undefined;
  if (!divider) return;
  const column = divider.dataset.column;
  drag = { column, startX: event.clientX, startWidth: currentWidth(column) };
  event.preventDefault();
}

function resize(event) {
  if (!drag) {
    highlightDivider(dividerAt(event));
    return;
  }
  const delta = event.clientX - drag.startX;
  const grown = drag.column === 'graph' ? drag.startWidth + delta : drag.startWidth - delta;
  const width = Math.max(MIN_COLUMN_WIDTH[drag.column], Math.round(grown));
  columns[drag.column] = width;
  if (drag.column === 'graph') graphWidth = width;
  applyColumns();
}

function stopResize() {
  if (!drag) return;
  drag = null;
  justResized = true;
  vscode.setState({ columns });
  fitGraph();
}

function swallowClickAfterResize(event) {
  if (!justResized) return;
  justResized = false;
  event.stopPropagation();
}

function listenToColumnResize() {
  list.addEventListener('scroll', fitGraph, { passive: true });
  list.addEventListener('mousedown', startResize);
  list.addEventListener('click', swallowClickAfterResize, true);
  window.addEventListener('mousemove', resize);
  window.addEventListener('mouseup', stopResize);
  window.addEventListener('resize', fitGraph);
}
