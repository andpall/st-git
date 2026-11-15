import * as vscode from 'vscode';
import { repoGit } from '../api/git';
import { upstreamOf } from './branchInfo';

type PullMode = vscode.QuickPickItem & { flag: string };

const MODES: PullMode[] = [
  { label: '$(git-pull-request) Rebase', description: 'put your local commits on top of the incoming ones', flag: '--rebase' },
  { label: '$(git-merge) Merge', description: 'create a merge commit if histories diverged', flag: '--no-rebase' },
];

export async function pull() {
  const upstream = await upstreamOf();
  if (!upstream) throw new Error('The current branch has no upstream yet. Push it first.');
  const mode = await vscode.window.showQuickPick(MODES, { title: `Update from ${upstream}` });
  if (mode) await repoGit(['pull', mode.flag, '--autostash']);
}

export async function fetchAll() {
  await repoGit(['fetch', '--all', '--prune']);
  vscode.window.setStatusBarMessage('$(check) st-git: fetched all remotes', 3000);
}
