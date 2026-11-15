import * as vscode from 'vscode';
import { repoRoot } from '../../api/git';
import { updateOperationState } from '../../ui/operationState';
import { layout } from './graph';
import { EMPTY_FILTERS, isFiltered, readBranchNames, readLog, type LogFilters } from './readLog';
import { readCommitDetails } from './details';
import { renderLogHtml } from './logHtml';

export type CommitContext = { hash: string };
type WebviewMessage =
  | { type: 'ready' }
  | { type: 'more' }
  | { type: 'select'; hashes: string[] }
  | { type: 'filter'; filters: LogFilters }
  | { type: 'revealMissing'; hash: string };

const PAGE_SIZE = 500;

let view: vscode.WebviewView | undefined;
let webviewRoot: vscode.Uri;
let selection: string[] = [];
let filters: LogFilters = EMPTY_FILTERS;
let limit = PAGE_SIZE;
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
  webviewView.webview.html = renderLogHtml(webviewView.webview, webviewRoot);
  webviewView.webview.onDidReceiveMessage(handleMessage);
  webviewView.onDidChangeVisibility(handleVisibilityChange);
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

async function applyFilters(next: LogFilters) {
  filters = next;
  limit = PAGE_SIZE;
  await refreshGitLog();
}

async function handleMessage(message: WebviewMessage) {
  switch (message.type) {
    case 'select':
      selection = message.hashes;
      await onSelectionChange(selection);
      await postDetails();
      return;
    case 'filter':
      await applyFilters(message.filters);
      return;
    case 'more':
      limit += PAGE_SIZE;
      await refreshGitLog();
      return;
    case 'revealMissing':
      await applyFilters({ ...EMPTY_FILTERS, text: message.hash });
      return;
    case 'ready':
      await refreshGitLog();
  }
}

async function handleVisibilityChange() {
  if (view?.visible) await refreshGitLog();
}

export async function showPathHistory(relativePath: string) {
  await vscode.commands.executeCommand('st-git.graph.focus');
  await applyFilters({ ...EMPTY_FILTERS, path: relativePath });
}

export async function revealCommit(hash: string) {
  await vscode.commands.executeCommand('st-git.graph.focus');
  await view?.webview.postMessage({ type: 'reveal', hash });
}

export async function refreshGitLog() {
  await updateOperationState();
  if (!view) return;
  try {
    const root = await repoRoot();
    const commits = await readLog(root, filters, limit);
    const branches = await readBranchNames(root);
    const hasMore = commits.length === limit;
    await view.webview.postMessage({ type: 'rows', rows: layout(commits), filtered: isFiltered(filters), hasMore, branches, filters });
  } catch (error) {
    await view.webview.postMessage({ type: 'error', text: (error as Error).message });
  }
}
