import * as vscode from 'vscode';
import * as path from 'path';
import { gitUri } from '../../api/gitContent';
import type { Change } from '../../utils/nameStatus';

const FULL_HASH = /^[0-9a-f]{40}$/;

function shortRef(ref: string) {
  return FULL_HASH.test(ref) ? ref.slice(0, 8) : ref;
}

export async function openDiff(before: string, after: string, change: Change) {
  const beforeUri = gitUri(change.oldPath ?? change.path, before);
  const afterUri = gitUri(change.path, after);
  const title = `${path.basename(change.path)} (${shortRef(after)})`;
  await vscode.commands.executeCommand('vscode.diff', beforeUri, afterUri, title);
}
