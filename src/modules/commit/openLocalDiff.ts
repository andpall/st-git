import * as vscode from 'vscode';
import * as path from 'path';
import { gitUri } from '../../api/gitContent';
import type { Change } from '../../utils/nameStatus';

export async function openLocalDiff(change: Change, repoPath: string) {
  const before = gitUri(change.oldPath ?? change.path, 'HEAD');
  if (change.status === 'D') {
    await vscode.commands.executeCommand('vscode.open', before);
    return;
  }
  const after = vscode.Uri.file(path.join(repoPath, change.path));
  const title = `${path.basename(change.path)} (working tree)`;
  await vscode.commands.executeCommand('vscode.diff', before, after, title);
}
