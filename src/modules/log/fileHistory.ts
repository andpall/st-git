import * as vscode from 'vscode';
import * as path from 'path';
import { repoRoot } from '../../api/git';
import { showPathHistory } from './provider';

export async function showFileHistory(resource?: vscode.Uri) {
  const fileUri = resource ?? vscode.window.activeTextEditor?.document.uri;
  if (!fileUri || fileUri.scheme !== 'file') throw new Error('Open or select a file to see its history.');
  const root = await repoRoot();
  const relative = path.relative(root, fileUri.fsPath);
  const gitPath = relative.split(path.sep);
  await showPathHistory(gitPath.join('/'));
}
