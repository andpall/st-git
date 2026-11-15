import * as vscode from 'vscode';
import * as path from 'path';
import { repoGit, repoRoot } from '../../api/git';
import { parseNameStatus, type Change } from '../../utils/nameStatus';
import { parseStashes, STASH_FORMAT, type Stash } from './parseStash';

export type StashNode = { kind: 'stash'; stash: Stash } | { kind: 'file'; stash: Stash; change: Change };

const STATUS_LABELS: Record<string, string> = { A: 'added', M: 'modified', D: 'deleted', R: 'renamed' };
const treeChanged = new vscode.EventEmitter<void>();
let treeView: vscode.TreeView<StashNode>;
let stashes: Stash[] = [];
let repoPath = '';

export function registerStashes() {
  treeView = vscode.window.createTreeView('st-git.stashes', {
    treeDataProvider: { getTreeItem, getChildren, onDidChangeTreeData: treeChanged.event },
  });
  return vscode.Disposable.from(treeView, treeChanged);
}

function stashNode(stash: Stash): StashNode {
  return { kind: 'stash', stash };
}

async function stashFiles(stash: Stash) {
  const output = await repoGit(['stash', 'show', '-z', '--name-status', stash.ref]);
  const changes = parseNameStatus(output);
  const nodes: StashNode[] = [];
  for (const change of changes) nodes.push({ kind: 'file', stash, change });
  return nodes;
}

async function getChildren(node?: StashNode) {
  if (!node) return stashes.map(stashNode);
  return node.kind === 'stash' ? stashFiles(node.stash) : [];
}

function getTreeItem(node: StashNode) {
  if (node.kind === 'stash') {
    const item = new vscode.TreeItem(node.stash.message, vscode.TreeItemCollapsibleState.Collapsed);
    const date = new Date(node.stash.date * 1000);
    item.description = date.toLocaleString();
    item.tooltip = node.stash.ref;
    item.iconPath = new vscode.ThemeIcon('archive');
    item.contextValue = 'stash';
    return item;
  }
  const item = new vscode.TreeItem(vscode.Uri.file(path.join(repoPath, node.change.path)));
  item.iconPath = vscode.ThemeIcon.File;
  item.description = STATUS_LABELS[node.change.status] ?? node.change.status;
  item.command = { command: 'st-git.openDiff', title: 'Open Diff', arguments: [`${node.stash.ref}^1`, node.stash.ref, node.change] };
  return item;
}

export async function refreshStashes() {
  try {
    repoPath = await repoRoot();
    const output = await repoGit(['stash', 'list', STASH_FORMAT]);
    stashes = parseStashes(output);
    treeView.message = stashes.length ? undefined : 'No stashes.';
  } catch (error) {
    stashes = [];
    treeView.message = (error as Error).message;
  }
  treeChanged.fire();
}
