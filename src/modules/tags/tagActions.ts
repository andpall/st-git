import * as vscode from 'vscode';
import { repoGit } from '../../api/git';
import type { CommitContext } from '../log/provider';

const DELETE_LOCAL = 'Delete Locally';
const DELETE_EVERYWHERE = 'Delete Locally and on Remote';

async function listLines(args: string[]) {
  const output = await repoGit(args);
  const lines = output.split('\n');
  return lines.filter(Boolean);
}

async function validateTagName(name: string) {
  if (!name.trim()) return 'Enter a tag name.';
  try {
    await repoGit(['check-ref-format', `refs/tags/${name}`]);
  } catch {
    return 'This is not a valid tag name.';
  }
  const existing = await listLines(['tag', '--list', name]);
  return existing.length ? `Tag "${name}" already exists.` : undefined;
}

async function pickTagAt(hash: string, title: string) {
  const tags = await listLines(['tag', '--points-at', hash]);
  if (!tags.length) throw new Error('This commit has no tags.');
  if (tags.length === 1) return tags[0];
  return vscode.window.showQuickPick(tags, { title });
}

async function pickRemote(title: string) {
  const remotes = await listLines(['remote']);
  if (!remotes.length) throw new Error('No remotes configured. Add one with "git remote add origin <url>".');
  if (remotes.length === 1) return remotes[0];
  return vscode.window.showQuickPick(remotes, { title });
}

export async function newTag({ hash }: CommitContext) {
  const name = await vscode.window.showInputBox({ title: 'New Tag', prompt: `Tag commit ${hash.slice(0, 8)}`, placeHolder: 'v1.0.0', validateInput: validateTagName });
  if (!name) return;
  const message = await vscode.window.showInputBox({ title: `New Tag "${name}"`, prompt: 'Message for an annotated tag. Leave empty for a lightweight tag.' });
  if (message === undefined) return;
  const args = message ? ['tag', '-a', name, '-m', message, hash] : ['tag', name, hash];
  await repoGit(args);
}

export async function pushTag({ hash }: CommitContext) {
  const tag = await pickTagAt(hash, 'Push Tag');
  if (!tag) return;
  const remote = await pickRemote(`Push "${tag}" to`);
  if (remote) await repoGit(['push', remote, `refs/tags/${tag}`]);
}

export async function deleteTag({ hash }: CommitContext) {
  const tag = await pickTagAt(hash, 'Delete Tag');
  if (!tag) return;
  const remotes = await listLines(['remote']);
  const buttons = remotes.length ? [DELETE_LOCAL, DELETE_EVERYWHERE] : [DELETE_LOCAL];
  const choice = await vscode.window.showWarningMessage(`Delete tag "${tag}"?`, { modal: true }, ...buttons);
  if (!choice) return;
  if (choice === DELETE_EVERYWHERE) {
    const remote = await pickRemote(`Delete "${tag}" on`);
    if (!remote) return;
    await repoGit(['push', remote, '--delete', `refs/tags/${tag}`]);
  }
  await repoGit(['tag', '-d', tag]);
}
