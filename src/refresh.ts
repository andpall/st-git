import * as vscode from 'vscode';
import { refreshGitLog } from './modules/log/provider';
import { refreshConflicts } from './modules/conflicts/provider';
import { refreshLocalChanges } from './modules/commit/localChanges';
import { refreshBranchStatus } from './modules/branches/statusBar';
import { refreshStashes } from './modules/stash/provider';

const REFRESH_DELAY_MS = 300;

export async function refreshAll() {
  await refreshGitLog();
  await refreshConflicts();
  await refreshLocalChanges();
  await refreshBranchStatus();
  await refreshStashes();
}

function debounced(task: () => Promise<void>) {
  let timer: NodeJS.Timeout | undefined;
  return function schedule() {
    clearTimeout(timer);
    timer = setTimeout(task, REFRESH_DELAY_MS);
  };
}

const scheduleRefresh = debounced(refreshAll);
const scheduleLocalRefresh = debounced(refreshLocalChanges);

function watch(pattern: string, onChange: () => void) {
  const watcher = vscode.workspace.createFileSystemWatcher(pattern);
  watcher.onDidChange(onChange);
  watcher.onDidCreate(onChange);
  watcher.onDidDelete(onChange);
  return watcher;
}

export function watchRepository() {
  return vscode.Disposable.from(watch('**/.git/{index,HEAD}', scheduleRefresh), watch('**/*', scheduleLocalRefresh));
}
