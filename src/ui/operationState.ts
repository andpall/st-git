import * as vscode from 'vscode';
import { currentOperation, type Operation } from '../api/git';

export const OPERATION_LABELS: Record<Operation, string> = {
  rebase: 'Rebase', merge: 'Merge', 'cherry-pick': 'Cherry-pick', revert: 'Revert',
};

export async function updateOperationState() {
  const operation = await currentOperation();
  await vscode.commands.executeCommand('setContext', 'st-git.operation', operation ?? '');
  return operation;
}
