import * as vscode from 'vscode';
import * as path from 'path';
import { repoGit, repoRoot } from '../../api/git';
import { updateRebaseState } from '../../ui/rebaseState';
import { parseConflicts, type Conflict } from './parseConflicts';

const ALL_RESOLVED = 'All conflicts are resolved. Press Continue Rebase.';
const CONFLICT_LABELS: Record<string, string> = {
  UU: 'both modified', AA: 'both added', DD: 'both deleted',
  DU: 'deleted in current', UD: 'deleted in incoming', AU: 'added in current', UA: 'added in incoming',
};

const treeChanged = new vscode.EventEmitter<void>();
let treeView: vscode.TreeView<Conflict>;
let conflicts: Conflict[] = [];
let repoPath = '';

export function registerConflicts() {
  treeView = vscode.window.createTreeView('st-git.conflicts', {
    treeDataProvider: { getTreeItem, getChildren, onDidChangeTreeData: treeChanged.event },
  });
  return vscode.Disposable.from(treeView, treeChanged);
}

function getChildren() {
  return conflicts;
}

function getTreeItem(conflict: Conflict) {
  const item = new vscode.TreeItem(vscode.Uri.file(path.join(repoPath, conflict.path)));
  item.iconPath = vscode.ThemeIcon.File;
  item.description = CONFLICT_LABELS[conflict.code] ?? conflict.code;
  item.contextValue = 'conflict';
  item.command = { command: 'st-git.openMerge', title: 'Merge...', arguments: [conflict] };
  return item;
}

async function readConflicts() {
  const output = await repoGit(['--no-optional-locks', 'status', '--porcelain', '-z', '--untracked-files=no']);
  return parseConflicts(output);
}

export async function refreshConflicts() {
  const rebasing = await updateRebaseState();
  conflicts = [];
  treeView.message = undefined;
  try {
    repoPath = await repoRoot();
    conflicts = await readConflicts();
    if (rebasing && !conflicts.length) treeView.message = ALL_RESOLVED;
  } catch (error) {
    treeView.message = (error as Error).message;
  }
  await vscode.commands.executeCommand('setContext', 'st-git.hasConflicts', conflicts.length > 0);
  treeChanged.fire();
  return conflicts.length;
}

export async function focusConflicts() {
  await vscode.commands.executeCommand('st-git.conflicts.focus');
}
