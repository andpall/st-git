import * as vscode from 'vscode';
import { registerGitContent } from './api/gitContent';
import { setDialogAssets } from './ui/messageDialog';
import { guarded } from './guarded';
import { refreshAll, watchRepository } from './refresh';
import { registerGitLog, getSelection } from './modules/log/provider';
import { registerChanges, showCommitChanges, showComparison } from './modules/changes/provider';
import { openDiff } from './modules/changes/openDiff';
import { registerConflicts } from './modules/conflicts/provider';
import { acceptCurrent, acceptIncoming, openMerge } from './modules/conflicts/resolve';
import { registerLocalChanges, checkedChanges } from './modules/commit/localChanges';
import { registerCommitPanel } from './modules/commit/commitPanel';
import { openLocalDiff } from './modules/commit/openLocalDiff';
import { rollback } from './modules/commit/rollback';
import { registerBranchStatus } from './modules/branches/statusBar';
import { showBranches } from './modules/branches/branchPicker';
import { checkoutCommit, newBranchFromCommit } from './modules/branches/commitActions';
import { registerStashes } from './modules/stash/provider';
import { applyStash, dropStash, popStash, stashChanges } from './modules/stash/actions';
import { commitChanges } from './commands/commitChanges';
import { undoCommit } from './commands/undoCommit';
import { amendCommit } from './commands/amendCommit';
import { rewordCommit } from './commands/reword';
import { squash } from './commands/squash';
import { dropCommit } from './commands/dropCommit';
import { cherryPick, revertCommit } from './commands/cherryPick';
import { resetToHere } from './commands/resetToHere';
import { rebaseOnto } from './commands/rebase';
import { continueOperation, abortOperation } from './commands/operation';
import { push } from './commands/push';
import { pull, fetchAll } from './commands/pull';

const GUARDED_COMMANDS: Record<string, (...args: never[]) => Promise<unknown>> = {
  'st-git.acceptCurrent': acceptCurrent,
  'st-git.acceptIncoming': acceptIncoming,
  'st-git.branches': showBranches,
  'st-git.checkoutCommit': checkoutCommit,
  'st-git.newBranch': newBranchFromCommit,
  'st-git.compareWithCurrent': showComparison,
  'st-git.rollback': rollback,
  'st-git.stashChanges': stashChanges,
  'st-git.applyStash': applyStash,
  'st-git.popStash': popStash,
  'st-git.dropStash': dropStash,
  'st-git.undoCommit': undoCommit,
  'st-git.amendCommit': amendCommit,
  'st-git.rewordCommit': rewordCommit,
  'st-git.squash': squashSelection,
  'st-git.dropCommit': dropCommit,
  'st-git.cherryPick': cherryPick,
  'st-git.revertCommit': revertCommit,
  'st-git.resetToHere': resetToHere,
  'st-git.rebaseOnto': rebaseOnto,
  'st-git.continueOperation': continueOperation,
  'st-git.abortOperation': abortOperation,
  'st-git.push': push,
  'st-git.pull': pull,
  'st-git.fetch': fetchAll,
};

export function activate(context: vscode.ExtensionContext) {
  setDialogAssets(context.extensionUri);
  context.subscriptions.push(
    registerGitContent(),
    registerChanges(),
    registerConflicts(),
    registerLocalChanges(),
    registerStashes(),
    registerBranchStatus(),
    registerCommitPanel(context, guarded(commitChecked)),
    registerGitLog(context, showCommitChanges),
    watchRepository(),
    vscode.commands.registerCommand('st-git.refresh', refreshAll),
    vscode.commands.registerCommand('st-git.openDiff', openDiff),
    vscode.commands.registerCommand('st-git.openLocalDiff', openLocalDiff),
    vscode.commands.registerCommand('st-git.openMerge', openMerge),
  );
  for (const [id, action] of Object.entries(GUARDED_COMMANDS)) {
    context.subscriptions.push(vscode.commands.registerCommand(id, guarded(action)));
  }
  refreshAll();
}

export function deactivate() {}

function squashSelection() {
  return squash(getSelection());
}

function commitChecked(message: string, amend: boolean) {
  return commitChanges(message, amend, checkedChanges());
}
