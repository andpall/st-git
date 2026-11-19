function showRows(message) {
  rows = message.rows;
  graphFiltered = message.filtered;
  hasMore = message.hasMore;
  fillBranches(message.branches);
  fillAuthors();
  applyFilters(message.filters);
  const stillSelected = rows.filter(isSelected);
  const selectionChanged = stillSelected.length !== selected.size;
  selected = new Set(stillSelected.map(hashOf));
  render();
  if (selectionChanged) postSelection();
}

function reveal(hash) {
  if (!revealRow(hash)) vscode.postMessage({ type: 'revealMissing', hash });
}

function handleMessage(event) {
  const message = event.data;
  if (message.type === 'details') renderDetails(message.details);
  if (message.type === 'error') list.textContent = message.text;
  if (message.type === 'reveal') reveal(message.hash);
  if (message.type === 'rows') showRows(message);
}

window.addEventListener('message', handleMessage);
list.addEventListener('click', handleClick);
list.addEventListener('contextmenu', handleContextMenu);
listenToToolbar();
listenToColumnResize();
vscode.postMessage({ type: 'ready' });
