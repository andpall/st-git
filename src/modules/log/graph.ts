export interface Commit { hash: string; parents: string[]; author: string; date: number; refs: string; subject: string }
export interface Edge { parent: string; lane: number; toRow: number; toCol: number }
export interface Row extends Commit { col: number; edges: Edge[] }

type Lanes = (string | null)[];

function freeLane(lanes: Lanes) {
  const index = lanes.indexOf(null);
  return index === -1 ? lanes.push(null) - 1 : index;
}

function releaseLanes(lanes: Lanes, hash: string) {
  for (let i = 0; i < lanes.length; i++) {
    if (lanes[i] === hash) lanes[i] = null;
  }
}

function trimLanes(lanes: Lanes) {
  while (lanes.length && lanes[lanes.length - 1] === null) lanes.pop();
}

function placeCommit(lanes: Lanes, commit: Commit): Row {
  const waitingLane = lanes.indexOf(commit.hash);
  const col = waitingLane === -1 ? freeLane(lanes) : waitingLane;
  releaseLanes(lanes, commit.hash);
  const edges: Edge[] = [];
  for (let k = 0; k < commit.parents.length; k++) {
    const parent = commit.parents[k];
    const reserved = k === 0 ? col : lanes.indexOf(parent);
    const lane = reserved === -1 ? freeLane(lanes) : reserved;
    lanes[lane] = parent;
    edges.push({ parent, lane, toRow: -1, toCol: lane });
  }
  trimLanes(lanes);
  return { ...commit, col, edges };
}

function connectEdges(rows: Row[]) {
  const rowOf = new Map<string, number>();
  for (let i = 0; i < rows.length; i++) rowOf.set(rows[i].hash, i);
  for (const row of rows) {
    for (const edge of row.edges) {
      const parentRow = rowOf.get(edge.parent);
      if (parentRow === undefined) continue;
      edge.toRow = parentRow;
      edge.toCol = rows[parentRow].col;
    }
  }
}

export function layout(commits: Commit[]): Row[] {
  const lanes: Lanes = [];
  const rows: Row[] = [];
  for (const commit of commits) rows.push(placeCommit(lanes, commit));
  connectEdges(rows);
  return rows;
}
