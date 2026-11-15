function laneColor(lane) {
  return COLORS[lane % COLORS.length];
}

function laneX(lane) {
  return lane * LANE_WIDTH + LANE_WIDTH / 2;
}

function rowY(row) {
  return row * ROW_HEIGHT + ROW_HEIGHT / 2;
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
  if (graphFiltered) return 1;
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
  if (!graphFiltered) {
    for (let i = 0; i < rows.length; i++) drawEdges(graph, rows[i], i);
  }
  for (let i = 0; i < rows.length; i++) {
    const col = colOf(rows[i]);
    const dot = { cx: laneX(col), cy: rowY(i), r: 4, fill: laneColor(col) };
    graph.append(createSvg('circle', dot));
  }
  return graph;
}
