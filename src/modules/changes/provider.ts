import * as vscode from 'vscode';
import * as path from 'path';
import { isMissingCommitError, repoRoot } from '../../api/git';
import { countCommits } from '../../commands/branchInfo';
import { buildFileTree, type FileNode, type FolderNode, type TreeNode } from '../../utils/fileTree';
import type { Change } from '../../utils/nameStatus';
import { readChanges, readRangeChanges } from './readChanges';

const SELECT_HINT = 'Select a commit in the Log to see its files.';
const COMMIT_GONE = 'This commit no longer exists: the history was rewritten. Select a commit again.';
const STATUS_LABELS: Record<string, string> = { A: 'added', M: 'modified', D: 'deleted', R: 'renamed', C: 'copied', T: 'type changed' };

const treeChanged = new vscode.EventEmitter<void>();
let treeView: vscode.TreeView<TreeNode>;
let roots: TreeNode[] = [];
let repoPath = '';
let diffBefore = '';
let diffAfter = '';

export function registerChanges() {
  treeView = vscode.window.createTreeView('st-git.changes', {
    treeDataProvider: { getTreeItem, getChildren, onDidChangeTreeData: treeChanged.event },
  });
  treeView.message = SELECT_HINT;
  return vscode.Disposable.from(treeView, treeChanged);
}

function getChildren(node?: TreeNode) {
  if (!node) return roots;
  return node.kind === 'folder' ? node.children : [];
}

function getTreeItem(node: TreeNode) {
  return node.kind === 'folder' ? folderItem(node) : fileItem(node);
}

function workspaceUri(relativePath: string) {
  return vscode.Uri.file(path.join(repoPath, relativePath));
}

function folderItem(node: FolderNode) {
  const item = new vscode.TreeItem(node.name, vscode.TreeItemCollapsibleState.Expanded);
  item.resourceUri = workspaceUri(node.path);
  item.iconPath = vscode.ThemeIcon.Folder;
  return item;
}

function fileItem(node: FileNode) {
  const item = new vscode.TreeItem(workspaceUri(node.path));
  item.iconPath = vscode.ThemeIcon.File;
  item.description = STATUS_LABELS[node.change.status] ?? node.change.status;
  item.command = { command: 'st-git.openDiff', title: 'Open Diff', arguments: [diffBefore, diffAfter, node.change] };
  return item;
}

function show(message: string | undefined, changes: Change[], description?: string) {
  roots = buildFileTree(changes);
  treeView.message = message;
  treeView.description = description;
  treeChanged.fire();
}

export async function showCommitChanges(hashes: string[]) {
  if (hashes.length !== 1) {
    show(hashes.length ? `${hashes.length} commits selected.` : SELECT_HINT, []);
    return;
  }
  try {
    repoPath = await repoRoot();
    const changes = await readChanges(hashes[0]);
    diffBefore = `${hashes[0]}^`;
    diffAfter = hashes[0];
    show(changes.length ? undefined : 'No file changes in this commit.', changes, hashes[0].slice(0, 8));
  } catch (error) {
    show(isMissingCommitError(error) ? COMMIT_GONE : (error as Error).message, []);
  }
}

export async function showComparison(ref: string) {
  repoPath = await repoRoot();
  const changes = await readRangeChanges('HEAD', ref);
  const ahead = await countCommits(`HEAD..${ref}`);
  const behind = await countCommits(`${ref}..HEAD`);
  diffBefore = 'HEAD';
  diffAfter = ref;
  show(`"${ref}" has ${ahead} commit(s) not in HEAD; HEAD has ${behind} not in "${ref}". Files below differ.`, changes, `HEAD ↔ ${ref}`);
  await vscode.commands.executeCommand('st-git.changes.focus');
}
