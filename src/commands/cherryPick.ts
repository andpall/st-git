import { repoGit } from '../api/git';
import type { CommitContext } from '../modules/log/provider';

async function mainlineArgs(hash: string) {
  const output = await repoGit(['rev-list', '--parents', '-n', '1', hash]);
  const trimmed = output.trim();
  const ids = trimmed.split(' ');
  return ids.length > 2 ? ['-m', '1'] : [];
}

export async function cherryPick({ hash }: CommitContext) {
  const mainline = await mainlineArgs(hash);
  await repoGit(['cherry-pick', ...mainline, hash]);
}

export async function revertCommit({ hash }: CommitContext) {
  const mainline = await mainlineArgs(hash);
  await repoGit(['revert', '--no-edit', ...mainline, hash]);
}
