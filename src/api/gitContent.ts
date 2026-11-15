import * as vscode from 'vscode';
import { repoGit } from './git';

const GIT_SCHEME = 'st-git';

export function gitUri(file: string, ref: string) {
  return vscode.Uri.from({ scheme: GIT_SCHEME, path: `/${file}`, query: ref });
}

async function provideTextDocumentContent(uri: vscode.Uri) {
  const file = uri.path.slice(1);
  try {
    return await repoGit(['show', `${uri.query}:${file}`]);
  } catch {
    return '';
  }
}

export function registerGitContent() {
  return vscode.workspace.registerTextDocumentContentProvider(GIT_SCHEME, { provideTextDocumentContent });
}
