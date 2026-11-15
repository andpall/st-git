import * as vscode from 'vscode';
import { repoGit } from '../../api/git';

type PanelMessage = { type: 'commit'; message: string; amend: boolean } | { type: 'amend'; enabled: boolean };
type CommitHandler = (message: string, amend: boolean) => Promise<boolean>;

let view: vscode.WebviewView | undefined;
let assetsRoot: vscode.Uri;
let onCommit: CommitHandler;

export function registerCommitPanel(context: vscode.ExtensionContext, commitHandler: CommitHandler) {
  assetsRoot = vscode.Uri.joinPath(context.extensionUri, 'webview');
  onCommit = commitHandler;
  return vscode.window.registerWebviewViewProvider('st-git.commit', { resolveWebviewView });
}

function assetUri(webview: vscode.Webview, file: string) {
  const fileUri = vscode.Uri.joinPath(assetsRoot, file);
  return webview.asWebviewUri(fileUri);
}

function renderHtml(webview: vscode.Webview) {
  const source = webview.cspSource;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${source}; script-src ${source};">
<link rel="stylesheet" href="${assetUri(webview, 'commit.css')}"></head>
<body><form id="form">
<textarea id="message" rows="4" placeholder="Commit message (⌘/Ctrl+Enter to commit)" aria-label="Commit message" spellcheck="false"></textarea>
<div class="actions"><label><input type="checkbox" id="amend"> Amend</label><button type="submit" id="submit">Commit</button></div>
</form><script src="${assetUri(webview, 'commit.js')}"></script></body></html>`;
}

function resolveWebviewView(webviewView: vscode.WebviewView) {
  view = webviewView;
  webviewView.webview.options = { enableScripts: true, localResourceRoots: [assetsRoot] };
  webviewView.webview.html = renderHtml(webviewView.webview);
  webviewView.webview.onDidReceiveMessage(handleMessage);
}

async function lastCommitMessage() {
  try {
    const message = await repoGit(['log', '-1', '--format=%B']);
    return message.trim();
  } catch {
    return '';
  }
}

async function handleMessage(message: PanelMessage) {
  if (message.type === 'amend') {
    if (message.enabled) await view?.webview.postMessage({ type: 'lastMessage', text: await lastCommitMessage() });
    return;
  }
  const committed = await onCommit(message.message, message.amend);
  if (committed) await view?.webview.postMessage({ type: 'committed' });
}
