import type { Change } from './nameStatus';

export interface FileNode { kind: 'file'; name: string; path: string; change: Change }
export interface FolderNode { kind: 'folder'; name: string; path: string; children: TreeNode[] }
export type TreeNode = FileNode | FolderNode;

function childFolder(parent: FolderNode, name: string): FolderNode {
  for (const child of parent.children) {
    if (child.kind === 'folder' && child.name === name) return child;
  }
  const path = parent.path ? `${parent.path}/${name}` : name;
  const folder: FolderNode = { kind: 'folder', name, path, children: [] };
  parent.children.push(folder);
  return folder;
}

function compareNodes(a: TreeNode, b: TreeNode) {
  if (a.kind !== b.kind) return a.kind === 'folder' ? -1 : 1;
  return a.name.localeCompare(b.name);
}

function sortTree(folder: FolderNode) {
  folder.children.sort(compareNodes);
  for (const child of folder.children) {
    if (child.kind === 'folder') sortTree(child);
  }
}

export function buildFileTree(changes: Change[]): TreeNode[] {
  const root: FolderNode = { kind: 'folder', name: '', path: '', children: [] };
  for (const change of changes) {
    const parts = change.path.split('/');
    const name = parts.pop()!;
    let folder = root;
    for (const part of parts) folder = childFolder(folder, part);
    folder.children.push({ kind: 'file', name, path: change.path, change });
  }
  sortTree(root);
  return root.children;
}
