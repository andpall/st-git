import * as vscode from 'vscode';
import * as path from 'path';
import { gitUri } from '../../api/gitContent';
import type { Change } from '../../utils/nameStatus';

export async function openDiff(hash: string, change: Change) {
  const before = gitUri(change.oldPath ?? change.path, `${hash}^`);
  const after = gitUri(change.path, hash);
  const title = `${path.basename(change.path)} (${hash.slice(0, 8)})`;
  await vscode.commands.executeCommand('vscode.diff', before, after, title);
}
