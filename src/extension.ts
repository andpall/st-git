import * as vscode from 'vscode';
import { registerGitContent } from './api/gitContent';
import { startAskpass } from './api/askpass';
import { setDialogAssets } from './ui/dialogPanel';
import { guarded } from './guarded';
import { refreshAll, watchRepository } from './refresh';
import { registerGitLog, getSelection, revealCommit } from './modules/log/provider';
import { showFileHistory } from './modules/log/fileHistory';
import { registerBlame, toggleBlame } from './modules/blame/blame';
import { registerChanges, showCommitChanges, showComparison } from './modules/changes/provider';
import { openDiff } from './modules/changes/openDiff';
import { registerConflicts } from './modules/conflicts/provider';
import { acceptCurrent, acceptIncoming, openMerge } from './modules/conflicts/resolve';
import { registerLocalChanges, checkedChanges } from './modules/commit/localChanges';
import { registerCommitPanel } from './modules/commit/commitPanel';
import { openLocalDiff } from './modules/commit/openLocalDiff';
import { rollback } from './modules/commit/rollback';
import { addToGitignore } from './modules/commit/addToGitignore';
import { registerBranchStatus } from './modules/branches/statusBar';
import { showBranches } from './modules/branches/branchPicker';
import { checkoutCommit, mergeCommit, newBranchFromCommit, rebaseOntoBranch } from './modules/branches/commitActions';
import { registerStashes } from './modules/stash/provider';
import { applyStash, dropStash, popStash, stashChanges } from './modules/stash/actions';
import { deleteTag, newTag, pushTag } from './modules/tags/tagActions';
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
import { push } from './modules/push/push';
import { pull, fetchAll } from './commands/pull';

const GUARDED_COMMANDS: Record<string, (...args: never[]) => Promise<unknown>> = {
  'st-git.acceptCurrent': acceptCurrent,
  'st-git.acceptIncoming': acceptIncoming,
  'st-git.branches': showBranches,
  'st-git.checkoutCommit': checkoutCommit,
  'st-git.newBranch': newBranchFromCommit,
  'st-git.compareWithCurrent': showComparison,
  'st-git.rollback': rollback,
  'st-git.addToGitignore': addToGitignore,
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
  'st-git.mergeCommit': mergeCommit,
  'st-git.rebaseOntoBranch': rebaseOntoBranch,
  'st-git.newTag': newTag,
  'st-git.pushTag': pushTag,
  'st-git.deleteTag': deleteTag,
  'st-git.continueOperation': continueOperation,
  'st-git.abortOperation': abortOperation,
  'st-git.push': push,
  'st-git.pull': pull,
  'st-git.fetch': fetchAll,
  'st-git.toggleBlame': toggleBlame,
  'st-git.showFileHistory': showFileHistory,
  'st-git.revealCommit': revealCommit,
};

export async function activate(context: vscode.ExtensionContext) {
  setDialogAssets(context.extensionUri);
  context.subscriptions.push(await startAskpass(context.globalStorageUri.fsPath));
  context.subscriptions.push(
    registerGitContent(),
    registerChanges(),
    registerConflicts(),
    registerLocalChanges(),
    registerStashes(),
    registerBlame(),
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
