import * as vscode from 'vscode';
import { repoRoot } from '../../api/git';
import { updateRebaseState } from '../../ui/rebaseState';
import { layout } from './graph';
import { readLog } from './readLog';

export type CommitContext = { hash: string };
type WebviewMessage = { type: 'ready' } | { type: 'select'; hashes: string[] };

let view: vscode.WebviewView | undefined;
let webviewRoot: vscode.Uri;
let selection: string[] = [];
let onSelectionChange: (hashes: string[]) => Promise<void>;

export function getSelection() {
  return selection;
}

export function registerGitLog(context: vscode.ExtensionContext, selectionListener: typeof onSelectionChange) {
  onSelectionChange = selectionListener;
  webviewRoot = vscode.Uri.joinPath(context.extensionUri, 'webview');
  return vscode.window.registerWebviewViewProvider('st-git.graph', { resolveWebviewView });
}

function resolveWebviewView(webviewView: vscode.WebviewView) {
  view = webviewView;
  webviewView.webview.options = { enableScripts: true, localResourceRoots: [webviewRoot] };
  webviewView.webview.html = renderHtml(webviewView.webview);
  webviewView.webview.onDidReceiveMessage(handleMessage);
  webviewView.onDidChangeVisibility(handleVisibilityChange);
}

function assetUri(webview: vscode.Webview, file: string) {
  const fileUri = vscode.Uri.joinPath(webviewRoot, file);
  return webview.asWebviewUri(fileUri);
}

function renderHtml(webview: vscode.Webview) {
  const source = webview.cspSource;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${source}; script-src ${source};">
<link rel="stylesheet" href="${assetUri(webview, 'graph.css')}"></head>
<body><div id="list"></div><script src="${assetUri(webview, 'graph.js')}"></script></body></html>`;
}

async function handleMessage(message: WebviewMessage) {
  if (message.type === 'select') {
    selection = message.hashes;
    await onSelectionChange(selection);
    return;
  }
  await refreshGitLog();
}

async function handleVisibilityChange() {
  if (view?.visible) await refreshGitLog();
}

export async function refreshGitLog() {
  await updateRebaseState();
  if (!view) return;
  try {
    const root = await repoRoot();
    const commits = await readLog(root);
    await view.webview.postMessage({ type: 'rows', rows: layout(commits) });
  } catch (error) {
    await view.webview.postMessage({ type: 'error', text: (error as Error).message });
  }
}
