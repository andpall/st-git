import * as vscode from 'vscode';
import { repoGit } from '../../api/git';
import type { StashNode } from './provider';

export async function stashChanges() {
  const message = await vscode.window.showInputBox({ title: 'Stash Changes', prompt: 'Optional description', placeHolder: 'work in progress' });
  if (message === undefined) return;
  const messageArgs = message.trim() ? ['-m', message] : [];
  await repoGit(['stash', 'push', '--include-untracked', ...messageArgs]);
}

export async function applyStash(node: StashNode) {
  await repoGit(['stash', 'apply', node.stash.ref]);
}

export async function popStash(node: StashNode) {
  await repoGit(['stash', 'pop', node.stash.ref]);
}

export async function dropStash(node: StashNode) {
  const choice = await vscode.window.showWarningMessage(`Drop stash "${node.stash.message}"?`, { modal: true, detail: 'The stashed changes will be lost.' }, 'Drop');
  if (choice === 'Drop') await repoGit(['stash', 'drop', node.stash.ref]);
}
