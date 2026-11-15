import * as vscode from 'vscode';

const SCRIPTS = ['state.js', 'graph.js', 'rows.js', 'details.js', 'selection.js', 'toolbar.js', 'main.js'];
const SINCE_OPTIONS = [
  ['', 'Any time'], ['1 day ago', 'Last 24 hours'], ['7 days ago', 'Last 7 days'], ['30 days ago', 'Last 30 days'], ['1 year ago', 'Last year'],
];

function assetUri(webview: vscode.Webview, root: vscode.Uri, file: string) {
  const fileUri = vscode.Uri.joinPath(root, file);
  return webview.asWebviewUri(fileUri);
}

function sinceOptions() {
  const options: string[] = [];
  for (const [value, label] of SINCE_OPTIONS) options.push(`<option value="${value}">${label}</option>`);
  return options.join('');
}

export function renderLogHtml(webview: vscode.Webview, root: vscode.Uri) {
  const source = webview.cspSource;
  const scripts: string[] = [];
  for (const file of SCRIPTS) scripts.push(`<script src="${assetUri(webview, root, file)}"></script>`);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${source}; script-src ${source};">
<link rel="stylesheet" href="${assetUri(webview, root, 'log.css')}"></head>
<body>
<div id="toolbar">
<input id="search" type="search" placeholder="Text or hash" aria-label="Search commits by text or hash">
<select id="branch" aria-label="Branch"><option value="">All branches</option></select>
<input id="author" list="authors" placeholder="User" aria-label="Filter by user"><datalist id="authors"></datalist>
<select id="since" aria-label="Date">${sinceOptions()}</select>
<span id="pathChip" hidden><span id="pathLabel"></span><button id="clearPath" type="button" aria-label="Clear path filter">×</button></span>
</div>
<div id="list"></div><div id="details" hidden></div>
${scripts.join('\n')}</body></html>`;
}
