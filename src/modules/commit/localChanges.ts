import * as vscode from 'vscode';
import * as path from 'path';
import { repoGit, repoRoot } from '../../api/git';
import { buildFileTree, type FileNode, type FolderNode, type TreeNode } from '../../utils/fileTree';
import { parseStatus } from '../../utils/parseStatus';
import type { Change } from '../../utils/nameStatus';

const STATUS_LABELS: Record<string, string> = {
  A: 'added', M: 'modified', D: 'deleted', R: 'renamed', C: 'copied', T: 'type changed', '?': 'unversioned', U: 'conflict',
};
const { Checked, Unchecked } = vscode.TreeItemCheckboxState;

const treeChanged = new vscode.EventEmitter<void>();
const unchecked = new Set<string>();
let treeView: vscode.TreeView<TreeNode>;
let roots: TreeNode[] = [];
let changes: Change[] = [];
let repoPath = '';

export function registerLocalChanges() {
  treeView = vscode.window.createTreeView('st-git.localChanges', {
    treeDataProvider: { getTreeItem, getChildren, onDidChangeTreeData: treeChanged.event },
  });
  treeView.onDidChangeCheckboxState(handleCheckboxChange);
  return vscode.Disposable.from(treeView, treeChanged);
}

function collectFiles(node: TreeNode, files: FileNode[]) {
  if (node.kind === 'file') {
    files.push(node);
    return files;
  }
  for (const child of node.children) collectFiles(child, files);
  return files;
}

export function isUnversioned(change: Change) {
  return change.status === '?';
}

function contextValueOf(node: TreeNode) {
  const files = collectFiles(node, []);
  const changesOfNode = files.map(changeOf);
  return changesOfNode.every(isUnversioned) ? 'localChange unversioned' : 'localChange';
}

function isChecked(change: Change) {
  return !unchecked.has(change.path);
}

function hasCheckedFile(folder: FolderNode) {
  const files = collectFiles(folder, []);
  for (const file of files) {
    if (isChecked(file.change)) return true;
  }
  return false;
}

function handleCheckboxChange(event: vscode.TreeCheckboxChangeEvent<TreeNode>) {
  for (const [node, state] of event.items) {
    const files = collectFiles(node, []);
    for (const file of files) {
      if (state === Checked) unchecked.delete(file.path);
      else unchecked.add(file.path);
    }
  }
  updateDescription();
  treeChanged.fire();
}

function getChildren(node?: TreeNode) {
  if (!node) return roots;
  return node.kind === 'folder' ? node.children : [];
}

function workspaceUri(relativePath: string) {
  return vscode.Uri.file(path.join(repoPath, relativePath));
}

function getTreeItem(node: TreeNode) {
  if (node.kind === 'folder') {
    const item = new vscode.TreeItem(node.name, vscode.TreeItemCollapsibleState.Expanded);
    item.resourceUri = workspaceUri(node.path);
    item.iconPath = vscode.ThemeIcon.Folder;
    item.checkboxState = hasCheckedFile(node) ? Checked : Unchecked;
    item.contextValue = contextValueOf(node);
    return item;
  }
  const item = new vscode.TreeItem(workspaceUri(node.path));
  item.iconPath = vscode.ThemeIcon.File;
  item.description = STATUS_LABELS[node.change.status] ?? node.change.status;
  item.checkboxState = isChecked(node.change) ? Checked : Unchecked;
  item.contextValue = contextValueOf(node);
  item.command = { command: 'st-git.openLocalDiff', title: 'Open Diff', arguments: [node.change, repoPath] };
  return item;
}

export function checkedChanges() {
  return changes.filter(isChecked);
}

function changeOf(file: FileNode) {
  return file.change;
}

export function changesFor(node?: TreeNode) {
  if (!node) return checkedChanges();
  const files = collectFiles(node, []);
  return files.map(changeOf);
}

function updateDescription() {
  const checkedCount = checkedChanges().length;
  treeView.description = changes.length ? `${checkedCount} of ${changes.length} selected` : undefined;
  treeView.badge = changes.length ? { value: changes.length, tooltip: `${changes.length} local changes` } : undefined;
}

export function currentRepoPath() {
  return repoPath;
}

export async function refreshLocalChanges() {
  try {
    repoPath = await repoRoot();
    const output = await repoGit(['--no-optional-locks', 'status', '--porcelain', '-z', '--untracked-files=all']);
    changes = parseStatus(output);
    treeView.message = changes.length ? undefined : 'No local changes.';
  } catch (error) {
    changes = [];
    treeView.message = (error as Error).message;
  }
  roots = buildFileTree(changes);
  updateDescription();
  treeChanged.fire();
}
