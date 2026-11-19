const DATE_FORMAT = { dateStyle: 'short', timeStyle: 'short' };

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

function isBranchRef(ref) {
  return !ref.startsWith('tag: ') && !ref.startsWith('HEAD') && !ref.endsWith('/HEAD');
}

function hasBranchRef(row) {
  const refs = row.refs ? row.refs.split(', ') : [];
  return refs.some(isBranchRef);
}

function createRow(row, index) {
  const element = document.createElement('div');
  const headClass = /\bHEAD\b/.test(row.refs) ? ' head' : '';
  const selectedClass = isSelected(row) ? ' sel' : '';
  element.className = 'row' + selectedClass + headClass;
  element.dataset.i = index;
  const context = { webviewSection: 'commit', hash: row.hash, hasBranch: hasBranchRef(row), preventDefaultContextMenuItems: true };
  element.dataset.vscodeContext = JSON.stringify(context);
  const date = new Date(row.date * 1000);
  element.append(createSubject(row), createCell('author', row.author), createCell('date', date.toLocaleString(undefined, DATE_FORMAT)));
  return element;
}

function requestMore() {
  vscode.postMessage({ type: 'more' });
}

function createLoadMore() {
  const button = document.createElement('button');
  button.className = 'load-more';
  button.textContent = 'Load more commits';
  button.addEventListener('click', requestMore);
  return button;
}

function render() {
  if (!rows.length) {
    list.replaceChildren(createCell('empty', 'No commits match the filters.'));
    return;
  }
  const lanes = laneCount();
  list.replaceChildren(drawGraph(lanes), ...createDividers());
  for (let i = 0; i < rows.length; i++) list.append(createRow(rows[i], i));
  if (hasMore) list.append(createLoadMore());
  measureLanes();
  fitGraph();
}
