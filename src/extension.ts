import * as vscode from 'vscode';
import { isRebasing } from './api/git';
import { registerGitLog, refreshGitLog, getSelection } from './modules/log/provider';
import { undoCommit } from './commands/undoCommit';
import { squash } from './commands/squash';
import { openDiff } from './modules/changes/openDiff';
import { registerChanges, showCommitChanges } from './modules/changes/provider';
import { registerGitContent } from './modules/changes/contentProvider';
import { rebaseOnto, rebaseContinue, rebaseAbort } from './commands/rebase';

const ABORT_REBASE = 'Abort Rebase';
const OPEN_SOURCE_CONTROL = 'Open Source Control';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    registerGitContent(),
    registerChanges(),
    registerGitLog(context, showCommitChanges),
    vscode.commands.registerCommand('st-git.openDiff', openDiff),
    vscode.commands.registerCommand('st-git.refresh', refreshGitLog),
    vscode.commands.registerCommand('st-git.undoCommit', guarded(undoCommit)),
    vscode.commands.registerCommand('st-git.squash', guarded(squashSelection)),
    vscode.commands.registerCommand('st-git.rebaseOnto', guarded(rebaseOnto)),
    vscode.commands.registerCommand('st-git.rebaseContinue', guarded(rebaseContinue)),
    vscode.commands.registerCommand('st-git.rebaseAbort', guarded(rebaseAbort)),
  );
}

export function deactivate() {}

function squashSelection() {
  return squash(getSelection());
}

function guarded<Args extends unknown[]>(action: (...args: Args) => Promise<unknown>) {
  return async function guardedAction(...args: Args) {
    let failure: unknown;
    try {
      await action(...args);
    } catch (error) {
      failure = error;
    }
    await refreshGitLog();
    if (failure) await reportError(failure);
  };
}

async function reportError(error: unknown) {
  const rebasing = await isRebasing();
  const buttons = rebasing ? [ABORT_REBASE, OPEN_SOURCE_CONTROL] : [];
  const choice = await vscode.window.showErrorMessage((error as Error).message, ...buttons);
  if (choice === ABORT_REBASE) await guardedRebaseAbort();
  if (choice === OPEN_SOURCE_CONTROL) await vscode.commands.executeCommand('workbench.view.scm');
}

const guardedRebaseAbort = guarded(rebaseAbort);
