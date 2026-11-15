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
  list.replaceChildren(drawGraph(lanes));
  for (let i = 0; i < rows.length; i++) list.append(createRow(rows[i], i, lanes));
  if (hasMore) list.append(createLoadMore());
}
