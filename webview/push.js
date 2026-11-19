const vscode = acquireVsCodeApi();
const form = document.getElementById('dialog');
const title = document.getElementById('title');
const source = document.getElementById('source');
const remote = document.getElementById('remote');
const branch = document.getElementById('branch');
const commits = document.getElementById('commits');
const note = document.getElementById('note');
const tags = document.getElementById('tags');
const pushButton = document.getElementById('push');
const forceButton = document.getElementById('force');
const pullButton = document.getElementById('pull');
const cancelButton = document.getElementById('cancel');
const TARGET_DELAY = 300;
let targetTimer;
let plan = { commits: [], behind: 0, newBranch: false };

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function createOption(name) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  return option;
}

function createCommitRow(commit) {
  const row = createElement('div', 'commit', '');
  const date = new Date(commit.date * 1000);
  row.title = commit.hash;
  row.append(createElement('span', 'hash', commit.hash.slice(0, 8)), createElement('span', 'subject', commit.subject),
    createElement('span', 'author', commit.author), createElement('span', 'date', date.toLocaleDateString()));
  return row;
}

function describeNote() {
  if (plan.behind) return `${remote.value}/${branch.value} has ${plan.behind} commit(s) that are not here. A normal push will be rejected: pull first, or Force Push (uses --force-with-lease and stops if someone else pushed since your last fetch).`;
  if (plan.newBranch) return `New branch "${branch.value}" will be created on ${remote.value}.`;
  return '';
}

function canPush() {
  return Boolean(branch.value.trim()) && (plan.commits.length > 0 || plan.newBranch || tags.value !== 'none');
}

function renderPlan() {
  const rows = plan.commits.map(createCommitRow);
  const empty = createElement('div', 'empty', 'Nothing to push: the remote branch already has these commits.');
  commits.replaceChildren(...(rows.length ? rows : [empty]));
  const noteText = describeNote();
  note.textContent = noteText;
  note.hidden = !noteText;
  note.classList.toggle('warning', plan.behind > 0);
  pushButton.disabled = !canPush() || plan.behind > 0;
  forceButton.disabled = !canPush() || plan.newBranch;
  pullButton.hidden = !plan.behind;
}

function requestPlan() {
  clearTimeout(targetTimer);
  targetTimer = setTimeout(postTarget, TARGET_DELAY);
}

function postTarget() {
  vscode.postMessage({ type: 'target', remote: remote.value, branch: branch.value.trim() });
}

function sendPush(force) {
  vscode.postMessage({ type: 'push', remote: remote.value, branch: branch.value.trim(), tags: tags.value, force });
}

function submitPush(event) {
  event.preventDefault();
  if (!pushButton.disabled) sendPush(false);
}

function submitForce() {
  sendPush(true);
}

function sendPull() {
  vscode.postMessage({ type: 'pull' });
}

function sendCancel() {
  vscode.postMessage({ type: 'cancel' });
}

function handleKey(event) {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) submitPush(event);
  if (event.key === 'Escape') sendCancel();
}

function showInit(message) {
  title.textContent = message.title;
  source.textContent = message.source;
  const options = message.remotes.map(createOption);
  remote.replaceChildren(...options);
  remote.value = message.remote;
  branch.value = message.branch;
  pushButton.focus();
}

function handleMessage(event) {
  const message = event.data;
  if (message.type === 'init') showInit(message);
  if (message.type === 'error') commits.replaceChildren(createElement('div', 'empty', message.text));
  if (message.type !== 'plan' || message.remote !== remote.value || message.branch !== branch.value.trim()) return;
  plan = message;
  renderPlan();
}

window.addEventListener('message', handleMessage);
document.addEventListener('keydown', handleKey);
form.addEventListener('submit', submitPush);
remote.addEventListener('change', postTarget);
branch.addEventListener('input', requestPlan);
tags.addEventListener('change', renderPlan);
forceButton.addEventListener('click', submitForce);
pullButton.addEventListener('click', sendPull);
cancelButton.addEventListener('click', sendCancel);
vscode.postMessage({ type: 'ready' });
