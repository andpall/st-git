import * as vscode from 'vscode';
import * as path from 'path';
import { repoGit, repoRoot } from '../../api/git';
import type { Conflict } from './parseConflicts';

const MERGEABLE_CODES = ['UU', 'AA'];
const DELETED_ON_ONE_SIDE = 'This file was deleted on one side: choose Accept Current or Accept Incoming.';

async function takeVersion(file: string, side: '--ours' | '--theirs') {
  try {
    await repoGit(['checkout', side, '--', file]);
  } catch {
    await repoGit(['rm', '--quiet', '--', file]);
    return;
  }
  await repoGit(['add', '--', file]);
}

export async function acceptCurrent(conflict: Conflict) {
  await takeVersion(conflict.path, '--ours');
}

export async function acceptIncoming(conflict: Conflict) {
  await takeVersion(conflict.path, '--theirs');
}

export async function openMerge(conflict: Conflict) {
  if (!MERGEABLE_CODES.includes(conflict.code)) {
    await vscode.window.showInformationMessage(DELETED_ON_ONE_SIDE);
    return;
  }
  const root = await repoRoot();
  const fileUri = vscode.Uri.file(path.join(root, conflict.path));
  try {
    await vscode.commands.executeCommand('git.openMergeEditor', fileUri);
  } catch {
    await vscode.commands.executeCommand('vscode.open', fileUri);
  }
}
