const vscode = acquireVsCodeApi();
const form = document.getElementById('dialog');
const title = document.getElementById('title');
const list = document.getElementById('commits');
const message = document.getElementById('message');
const messageLabel = document.getElementById('messageLabel');
const problem = document.getElementById('problem');
const ACTIONS = ['pick', 'reword', 'edit', 'squash', 'fixup', 'drop'];
let entries = [];
let selected = 0;

function subjectOf(text) {
  const newline = text.indexOf('\n');
  return newline === -1 ? text : text.slice(0, newline);
}

function createSpan(className, text) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
}

function createOption(action) {
  const option = document.createElement('option');
  option.value = action;
  option.textContent = action;
  return option;
}

function changeAction(index) {
  return function handleChange(event) {
    entries[index].action = event.target.value;
    selectRow(index);
  };
}

function createActionSelect(entry, index) {
  const select = document.createElement('select');
  select.setAttribute('aria-label', `Action for ${entry.hash.slice(0, 8)}`);
  select.append(...ACTIONS.map(createOption));
  select.value = entry.action;
  select.addEventListener('change', changeAction(index));
  return select;
}

function createRow(entry, index) {
  const row = document.createElement('div');
  row.className = `commit ${entry.action}${index === selected ? ' sel' : ''}`;
  row.dataset.index = index;
  row.setAttribute('role', 'option');
  const date = new Date(entry.date * 1000);
  const text = entry.action === 'reword' ? entry.message : entry.original;
  row.append(createActionSelect(entry, index), createSpan('hash', entry.hash.slice(0, 8)), createSpan('subject', subjectOf(text)),
    createSpan('author', entry.author), createSpan('date', date.toLocaleDateString()));
  return row;
}

function renderMessage() {
  const entry = entries[selected];
  const editable = entry.action === 'reword';
  message.readOnly = !editable;
  message.value = editable ? entry.message : entry.original;
  messageLabel.textContent = editable ? 'New commit message' : 'Commit message (choose "reword" to edit)';
}

function render() {
  list.replaceChildren(...entries.map(createRow));
  renderMessage();
}

function selectRow(index) {
  selected = Math.max(0, Math.min(entries.length - 1, index));
  problem.hidden = true;
  render();
}

function move(offset) {
  const target = selected + offset;
  if (target < 0 || target >= entries.length) return;
  const [entry] = entries.splice(selected, 1);
  entries.splice(target, 0, entry);
  selectRow(target);
}

function moveUp() {
  move(-1);
}

function moveDown() {
  move(1);
}

function handleListClick(event) {
  const row = event.target.closest('.commit');
  if (row) selectRow(Number(row.dataset.index));
}

function updateMessage() {
  entries[selected].message = message.value;
  const row = list.querySelector(`.commit[data-index="${selected}"] .subject`);
  row.textContent = subjectOf(message.value);
}

function toPlanEntry(entry) {
  return { hash: entry.hash, action: entry.action, message: entry.message };
}

function start(event) {
  event.preventDefault();
  vscode.postMessage({ type: 'start', newestFirst: entries.map(toPlanEntry) });
}

function cancel() {
  vscode.postMessage({ type: 'cancel' });
}

function handleKey(event) {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) start(event);
  if (event.key === 'Escape') cancel();
  if (event.target === message) return;
  if (event.altKey && event.key === 'ArrowUp') moveUp();
  else if (event.altKey && event.key === 'ArrowDown') moveDown();
  else if (event.target === list && event.key === 'ArrowUp') selectRow(selected - 1);
  else if (event.target === list && event.key === 'ArrowDown') selectRow(selected + 1);
  else return;
  event.preventDefault();
}

function toEntry(commit) {
  return { ...commit, action: 'pick', original: commit.message };
}

function handleMessage(event) {
  const data = event.data;
  if (data.type === 'problem') {
    problem.textContent = data.text;
    problem.hidden = false;
  }
  if (data.type !== 'init') return;
  title.textContent = data.title;
  entries = data.newestFirst.map(toEntry);
  selectRow(0);
  list.focus();
}

window.addEventListener('message', handleMessage);
document.addEventListener('keydown', handleKey);
form.addEventListener('submit', start);
list.addEventListener('click', handleListClick);
message.addEventListener('input', updateMessage);
document.getElementById('up').addEventListener('click', moveUp);
document.getElementById('down').addEventListener('click', moveDown);
document.getElementById('cancel').addEventListener('click', cancel);
vscode.postMessage({ type: 'ready' });
