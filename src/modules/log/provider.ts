import * as vscode from 'vscode';
import { repoRoot } from '../../api/git';
import { updateOperationState } from '../../ui/operationState';
import { layout } from './graph';
import { readLog } from './readLog';
import { readCommitDetails } from './details';

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
  webviewRoot = vscode.Uri.joinPath(context.extensionUri, 'webview', 'log');
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

const SCRIPTS = ['state.js', 'graph.js', 'rows.js', 'details.js', 'selection.js', 'main.js'];

function scriptTags(webview: vscode.Webview) {
  const tags: string[] = [];
  for (const file of SCRIPTS) tags.push(`<script src="${assetUri(webview, file)}"></script>`);
  return tags.join('\n');
}

function renderHtml(webview: vscode.Webview) {
  const source = webview.cspSource;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${source}; script-src ${source};">
<link rel="stylesheet" href="${assetUri(webview, 'log.css')}"></head>
<body><div id="list"></div><div id="details" hidden></div>
${scriptTags(webview)}</body></html>`;
}

async function handleMessage(message: WebviewMessage) {
  if (message.type === 'select') {
    selection = message.hashes;
    await onSelectionChange(selection);
    await postDetails();
    return;
  }
  await refreshGitLog();
}

async function postDetails() {
  if (selection.length !== 1) {
    await view?.webview.postMessage({ type: 'details', details: null });
    return;
  }
  try {
    await view?.webview.postMessage({ type: 'details', details: await readCommitDetails(selection[0]) });
  } catch {
    await view?.webview.postMessage({ type: 'details', details: null });
  }
}

async function handleVisibilityChange() {
  if (view?.visible) await refreshGitLog();
}

export async function refreshGitLog() {
  await updateOperationState();
  if (!view) return;
  try {
    const root = await repoRoot();
    const commits = await readLog(root);
    await view.webview.postMessage({ type: 'rows', rows: layout(commits) });
  } catch (error) {
    await view.webview.postMessage({ type: 'error', text: (error as Error).message });
  }
}
