import * as vscode from 'vscode';
import { currentOperation, repoGit, type Operation } from '../api/git';
import { OPERATION_LABELS } from '../ui/operationState';

const CONTINUE_ARGS: Record<Operation, string[]> = {
  rebase: ['rebase', '--continue'],
  merge: ['commit', '--no-edit'],
  'cherry-pick': ['cherry-pick', '--continue'],
  revert: ['revert', '--continue'],
};

async function requireOperation() {
  const operation = await currentOperation();
  if (!operation) throw new Error('No rebase, merge, cherry-pick or revert is in progress.');
  return operation;
}

export async function continueOperation() {
  const operation = await requireOperation();
  await repoGit(CONTINUE_ARGS[operation], { GIT_EDITOR: 'true' });
}

export async function abortOperation() {
  const operation = await requireOperation();
  const label = OPERATION_LABELS[operation];
  const choice = await vscode.window.showWarningMessage(`Abort ${label}?`, { modal: true, detail: 'Everything done during it, including resolved conflicts, will be discarded.' }, 'Abort');
  if (choice === 'Abort') await repoGit([operation, '--abort']);
}
