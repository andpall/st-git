const vscode = acquireVsCodeApi();
const form = document.getElementById('form');
const message = document.getElementById('message');
const amend = document.getElementById('amend');
const submit = document.getElementById('submit');

function saveState() {
  vscode.setState({ message: message.value, amend: amend.checked });
}

function updateButton() {
  submit.textContent = amend.checked ? 'Amend Commit' : 'Commit';
  submit.disabled = !message.value.trim();
  saveState();
}

function handleAmendToggle() {
  updateButton();
  vscode.postMessage({ type: 'amend', enabled: amend.checked });
}

function sendCommit(event) {
  event.preventDefault();
  if (submit.disabled) return;
  vscode.postMessage({ type: 'commit', message: message.value, amend: amend.checked });
}

function handleKey(event) {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) sendCommit(event);
}

function handleMessage(event) {
  const data = event.data;
  if (data.type === 'lastMessage' && !message.value.trim()) message.value = data.text;
  if (data.type === 'committed') {
    message.value = '';
    amend.checked = false;
  }
  updateButton();
}

function restoreState() {
  const saved = vscode.getState();
  if (!saved) return;
  message.value = saved.message;
  amend.checked = saved.amend;
}

restoreState();
updateButton();
window.addEventListener('message', handleMessage);
form.addEventListener('submit', sendCommit);
message.addEventListener('input', updateButton);
message.addEventListener('keydown', handleKey);
amend.addEventListener('change', handleAmendToggle);
