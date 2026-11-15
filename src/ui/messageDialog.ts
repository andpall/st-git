import * as vscode from 'vscode';

interface DialogOptions { title: string; action: string; text: string }
type DialogMessage = { type: 'ready' } | { type: 'submit'; text: string } | { type: 'cancel' };

let assetsRoot: vscode.Uri;

export function setDialogAssets(extensionUri: vscode.Uri) {
  assetsRoot = vscode.Uri.joinPath(extensionUri, 'webview');
}

function assetUri(webview: vscode.Webview, file: string) {
  const fileUri = vscode.Uri.joinPath(assetsRoot, file);
  return webview.asWebviewUri(fileUri);
}

function renderHtml(webview: vscode.Webview) {
  const source = webview.cspSource;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${source}; script-src ${source};">
<link rel="stylesheet" href="${assetUri(webview, 'dialog.css')}"></head>
<body><form class="dialog" id="dialog">
<h2 id="title"></h2>
<label for="message">Commit message</label>
<textarea id="message" rows="12" spellcheck="false"></textarea>
<div class="footer"><span class="hint">⌘/Ctrl+Enter to confirm, Esc to cancel</span>
<button type="button" id="cancel" class="secondary">Cancel</button><button type="submit" id="submit"></button></div>
</form><script src="${assetUri(webview, 'dialog.js')}"></script></body></html>`;
}

function waitForAnswer(panel: vscode.WebviewPanel, options: DialogOptions): Promise<string | undefined> {
  return new Promise(function listen(resolve) {
    panel.webview.onDidReceiveMessage(function handleMessage(message: DialogMessage) {
      if (message.type === 'ready') panel.webview.postMessage(options);
      if (message.type === 'submit') resolve(message.text);
      if (message.type === 'cancel') resolve(undefined);
    });
    panel.onDidDispose(function handleDispose() {
      resolve(undefined);
    });
  });
}

export async function askCommitMessage(options: DialogOptions) {
  const panel = vscode.window.createWebviewPanel('st-git.messageDialog', options.title, vscode.ViewColumn.Active, {
    enableScripts: true,
    localResourceRoots: [assetsRoot],
  });
  panel.webview.html = renderHtml(panel.webview);
  const answer = await waitForAnswer(panel, options);
  panel.dispose();
  return answer;
}
