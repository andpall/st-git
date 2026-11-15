const vscode = acquireVsCodeApi();
const form = document.getElementById('dialog');
const title = document.getElementById('title');
const message = document.getElementById('message');
const submit = document.getElementById('submit');
const cancel = document.getElementById('cancel');

function updateSubmitState() {
  submit.disabled = !message.value.trim();
}

function sendSubmit(event) {
  event.preventDefault();
  if (submit.disabled) return;
  vscode.postMessage({ type: 'submit', text: message.value });
}

function sendCancel() {
  vscode.postMessage({ type: 'cancel' });
}

function handleKey(event) {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) sendSubmit(event);
  if (event.key === 'Escape') sendCancel();
}

function handleMessage(event) {
  const options = event.data;
  title.textContent = options.title;
  submit.textContent = options.action;
  message.value = options.text;
  updateSubmitState();
  message.focus();
}

window.addEventListener('message', handleMessage);
document.addEventListener('keydown', handleKey);
form.addEventListener('submit', sendSubmit);
message.addEventListener('input', updateSubmitState);
cancel.addEventListener('click', sendCancel);
vscode.postMessage({ type: 'ready' });
