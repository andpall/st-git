function handleMessage(event) {
  const message = event.data;
  if (message.type === 'details') {
    renderDetails(message.details);
    return;
  }
  if (message.type === 'error') {
    list.textContent = message.text;
    return;
  }
  rows = message.rows;
  const stillSelected = rows.filter(isSelected);
  const selectionChanged = stillSelected.length !== selected.size;
  selected = new Set(stillSelected.map(hashOf));
  render();
  if (selectionChanged) postSelection();
}

window.addEventListener('message', handleMessage);
list.addEventListener('click', handleClick);
list.addEventListener('contextmenu', handleContextMenu);
vscode.postMessage({ type: 'ready' });
