const FILTER_DELAY_MS = 300;
const toolbar = document.getElementById('toolbar');
const searchInput = document.getElementById('search');
const branchSelect = document.getElementById('branch');
const authorInput = document.getElementById('author');
const authorList = document.getElementById('authors');
const sinceSelect = document.getElementById('since');
const pathChip = document.getElementById('pathChip');
const pathLabel = document.getElementById('pathLabel');
const clearPathButton = document.getElementById('clearPath');
let currentPath = '';
let filterTimer;

function sendFilters() {
  clearTimeout(filterTimer);
  filterTimer = undefined;
  const filters = { text: searchInput.value.trim(), branch: branchSelect.value, author: authorInput.value.trim(), since: sinceSelect.value, path: currentPath };
  vscode.postMessage({ type: 'filter', filters });
}

function scheduleFilters() {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(sendFilters, FILTER_DELAY_MS);
}

function clearPath() {
  currentPath = '';
  pathChip.hidden = true;
  sendFilters();
}

function createOption(value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

function fillBranches(names) {
  const current = branchSelect.value;
  const options = [createOption('', 'All branches')];
  for (const name of names) options.push(createOption(name, name));
  branchSelect.replaceChildren(...options);
  branchSelect.value = names.includes(current) ? current : '';
}

function authorOf(row) {
  return row.author;
}

function fillAuthors() {
  const authors = new Set(rows.map(authorOf));
  const options = [];
  for (const author of authors) options.push(createOption(author, author));
  authorList.replaceChildren(...options);
}

function isEditingToolbar() {
  return filterTimer !== undefined || toolbar.contains(document.activeElement);
}

function applyFilters(filters) {
  currentPath = filters.path;
  pathChip.hidden = !filters.path;
  pathLabel.textContent = filters.path;
  if (isEditingToolbar()) return;
  searchInput.value = filters.text;
  branchSelect.value = filters.branch;
  authorInput.value = filters.author;
  sinceSelect.value = filters.since;
}

function listenToToolbar() {
  searchInput.addEventListener('input', scheduleFilters);
  authorInput.addEventListener('input', scheduleFilters);
  branchSelect.addEventListener('change', sendFilters);
  sinceSelect.addEventListener('change', sendFilters);
  clearPathButton.addEventListener('click', clearPath);
}
