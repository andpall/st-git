import * as vscode from 'vscode';
import { currentOperation, repoGit } from '../../api/git';
import { OPERATION_LABELS } from '../../ui/operationState';

let item: vscode.StatusBarItem;

export function registerBranchStatus() {
  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  item.command = 'st-git.branches';
  item.tooltip = 'st-git: checkout or create a branch';
  return item;
}

export async function refreshBranchStatus() {
  try {
    const operation = await currentOperation();
    if (operation) {
      item.text = `$(sync~spin) ${OPERATION_LABELS[operation]} in progress`;
      item.show();
      return;
    }
    const output = await repoGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    const branch = output.trim();
    item.text = `$(git-branch) ${branch === 'HEAD' ? 'detached HEAD' : branch}`;
    item.show();
  } catch {
    item.hide();
  }
}
