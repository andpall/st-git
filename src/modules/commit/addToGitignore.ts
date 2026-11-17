import * as vscode from 'vscode';
import * as path from 'path';
import type { TreeNode } from '../../utils/fileTree';
import { changesFor, currentRepoPath, isUnversioned } from './localChanges';
import { appendIgnoreLines, ignorePattern } from './ignorePattern';

async function readText(uri: vscode.Uri) {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch {
    return '';
  }
}

export async function addToGitignore(node?: TreeNode) {
  if (!node) throw new Error('Right-click an unversioned file in Local Changes.');
  const changes = changesFor(node);
  if (!changes.every(isUnversioned)) throw new Error('Only unversioned files can be added to .gitignore.');
  const gitignoreUri = vscode.Uri.file(path.join(currentRepoPath(), '.gitignore'));
  const content = await readText(gitignoreUri);
  const pattern = ignorePattern(node.path, node.kind === 'folder');
  const updated = appendIgnoreLines(content, [pattern]);
  const encoder = new TextEncoder();
  await vscode.workspace.fs.writeFile(gitignoreUri, encoder.encode(updated));
}
