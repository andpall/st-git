function highlightRow(element) {
  element.classList.toggle('sel', isSelected(rows[element.dataset.i]));
}

function postSelection() {
  const selectedRows = rows.filter(isSelected);
  vscode.postMessage({ type: 'select', hashes: selectedRows.map(hashOf) });
}

function updateSelection() {
  const rowElements = list.querySelectorAll('.row');
  rowElements.forEach(highlightRow);
  postSelection();
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

function revealRow(hash) {
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i].hash.startsWith(hash)) continue;
    select(i, {});
    const element = list.querySelector(`.row[data-i="${i}"]`);
    element.scrollIntoView({ block: 'center' });
    return true;
  }
  return false;
}
