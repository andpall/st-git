import * as vscode from 'vscode';
import { isMissingCommitError, isRebasing } from './api/git';
import { registerGitLog, refreshGitLog, getSelection } from './modules/log/provider';
import { registerChanges, showCommitChanges } from './modules/changes/provider';
import { registerGitContent } from './api/gitContent';
import { openDiff } from './modules/changes/openDiff';
import { registerConflicts, refreshConflicts, focusConflicts } from './modules/conflicts/provider';
import { acceptCurrent, acceptIncoming, openMerge } from './modules/conflicts/resolve';
import { setDialogAssets } from './ui/messageDialog';
import { registerLocalChanges, refreshLocalChanges, checkedChanges } from './modules/commit/localChanges';
import { registerCommitPanel } from './modules/commit/commitPanel';
import { openLocalDiff } from './modules/commit/openLocalDiff';
import { commitChanges } from './commands/commitChanges';
import { registerBranchStatus, refreshBranchStatus } from './modules/branches/statusBar';
import { showBranches } from './modules/branches/branchPicker';
import { checkoutCommit, newBranchFromCommit } from './modules/branches/commitActions';
import { undoCommit } from './commands/undoCommit';
import { amendCommit } from './commands/amendCommit';
import { squash } from './commands/squash';
import { rebaseOnto, rebaseContinue, rebaseAbort } from './commands/rebase';

const ABORT_REBASE = 'Abort Rebase';
const REBASE_CONFLICT = 'Rebase stopped on conflicts. Resolve them in the Conflicts panel, then press Continue Rebase.';
const STALE_LOG = 'That commit no longer exists: the log was out of date and has been refreshed. Try again.';
const REFRESH_DELAY_MS = 300;

export function activate(context: vscode.ExtensionContext) {
  setDialogAssets(context.extensionUri);
  context.subscriptions.push(
    registerGitContent(),
    registerChanges(),
    registerConflicts(),
    registerLocalChanges(),
    registerBranchStatus(),
    registerCommitPanel(context, guarded(commitChecked)),
    registerGitLog(context, showCommitChanges),
    watchGitState(),
    watchWorkingTree(),
    vscode.commands.registerCommand('st-git.refresh', refreshAll),
    vscode.commands.registerCommand('st-git.openDiff', openDiff),
    vscode.commands.registerCommand('st-git.openLocalDiff', openLocalDiff),
    vscode.commands.registerCommand('st-git.openMerge', openMerge),
    vscode.commands.registerCommand('st-git.branches', guarded(showBranches)),
    vscode.commands.registerCommand('st-git.checkoutCommit', guarded(checkoutCommit)),
    vscode.commands.registerCommand('st-git.newBranch', guarded(newBranchFromCommit)),
    vscode.commands.registerCommand('st-git.acceptCurrent', guarded(acceptCurrent)),
    vscode.commands.registerCommand('st-git.acceptIncoming', guarded(acceptIncoming)),
    vscode.commands.registerCommand('st-git.undoCommit', guarded(undoCommit)),
    vscode.commands.registerCommand('st-git.amendCommit', guarded(amendCommit)),
    vscode.commands.registerCommand('st-git.squash', guarded(squashSelection)),
    vscode.commands.registerCommand('st-git.rebaseOnto', guarded(rebaseOnto)),
    vscode.commands.registerCommand('st-git.rebaseContinue', guarded(rebaseContinue)),
    vscode.commands.registerCommand('st-git.rebaseAbort', guarded(rebaseAbort)),
  );
  refreshAll();
}

export function deactivate() {}

function squashSelection() {
  return squash(getSelection());
}

function commitChecked(message: string, amend: boolean) {
  return commitChanges(message, amend, checkedChanges());
}

async function refreshAll() {
  await refreshGitLog();
  await refreshConflicts();
  await refreshLocalChanges();
  await refreshBranchStatus();
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

function watchWorkingTree() {
  const watcher = vscode.workspace.createFileSystemWatcher('**/*');
  watcher.onDidChange(scheduleLocalRefresh);
  watcher.onDidCreate(scheduleLocalRefresh);
  watcher.onDidDelete(scheduleLocalRefresh);
  return watcher;
}

function watchGitState() {
  const watcher = vscode.workspace.createFileSystemWatcher('**/.git/{index,HEAD}');
  watcher.onDidChange(scheduleRefresh);
  watcher.onDidCreate(scheduleRefresh);
  watcher.onDidDelete(scheduleRefresh);
  return watcher;
}

function guarded<Args extends unknown[]>(action: (...args: Args) => Promise<unknown>) {
  return async function guardedAction(...args: Args) {
    let failure: unknown;
    let result: unknown;
    try {
      result = await action(...args);
    } catch (error) {
      failure = error;
    }
    await refreshAll();
    if (failure) await reportError(failure);
    return !failure && result !== false;
  };
}

async function reportError(error: unknown) {
  const rebasing = await isRebasing();
  const conflictCount = await refreshConflicts();
  if (rebasing || conflictCount) await focusConflicts();
  const message = rebasing ? REBASE_CONFLICT : errorText(error);
  const buttons = rebasing ? [ABORT_REBASE] : [];
  const choice = await vscode.window.showErrorMessage(message, ...buttons);
  if (choice === ABORT_REBASE) await guardedRebaseAbort();
}

function errorText(error: unknown) {
  return isMissingCommitError(error) ? STALE_LOG : (error as Error).message;
}

const guardedRebaseAbort = guarded(rebaseAbort);
