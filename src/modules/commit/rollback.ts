import * as vscode from 'vscode';
import * as path from 'path';
import { repoGit } from '../../api/git';
import type { Change } from '../../utils/nameStatus';
import type { TreeNode } from '../../utils/fileTree';
import { changesFor, currentRepoPath } from './localChanges';

const ROLLBACK = 'Rollback';
const ROLLBACK_AND_DELETE = 'Rollback and Delete New Files';
const NEW_STATUSES = ['?', 'A'];

function isNew(change: Change) {
  return NEW_STATUSES.includes(change.status);
}

function isTracked(change: Change) {
  return !isNew(change);
}

function isStagedNew(change: Change) {
  return change.status === 'A';
}

function trackedPaths(change: Change) {
  return change.oldPath ? [change.oldPath] : [change.path];
}

function addedPaths(change: Change) {
  return change.oldPath || isStagedNew(change) ? [change.path] : [];
}

function newFilePath(change: Change) {
  return isNew(change) || change.oldPath ? [change.path] : [];
}

async function deleteToTrash(relativePath: string) {
  const fileUri = vscode.Uri.file(path.join(currentRepoPath(), relativePath));
  await vscode.workspace.fs.delete(fileUri, { useTrash: true });
}

export async function rollback(node?: TreeNode) {
  const changes = changesFor(node);
  if (!changes.length) throw new Error('Select files to roll back in Local Changes.');
  const newFiles = changes.flatMap(newFilePath);
  const buttons = newFiles.length ? [ROLLBACK, ROLLBACK_AND_DELETE] : [ROLLBACK];
  const detail = newFiles.length
    ? `Changes in tracked files will be lost. ${newFiles.length} new file(s) can stay on disk as unversioned or be moved to the Trash.`
    : 'Your changes in these files will be lost.';
  const choice = await vscode.window.showWarningMessage(`Roll back ${changes.length} file(s)?`, { modal: true, detail }, ...buttons);
  if (!choice) return;
  const unstage = changes.flatMap(addedPaths);
  if (unstage.length) await repoGit(['rm', '--cached', '--quiet', '--', ...unstage]);
  const tracked = changes.filter(isTracked);
  const restore = tracked.flatMap(trackedPaths);
  if (restore.length) await repoGit(['restore', '--source=HEAD', '--staged', '--worktree', '--', ...restore]);
  if (choice !== ROLLBACK_AND_DELETE) return;
  for (const file of newFiles) await deleteToTrash(file);
}
