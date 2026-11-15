import { repoGit } from '../api/git';
import { confirmRewrite } from '../ui/confirm';
import type { CommitContext } from '../modules/log/provider';

export async function rebaseOnto({ hash }: CommitContext) {
  const branchOutput = await repoGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const branch = branchOutput.trim();
  if (branch === 'HEAD') throw new Error('Detached HEAD: check out a branch first.');
  const confirmed = await confirmRewrite(`Rebase "${branch}" onto ${hash.slice(0, 8)}?`, 'HEAD');
  if (confirmed) await repoGit(['rebase', '--autostash', hash]);
}

export async function rebaseContinue() {
  await repoGit(['rebase', '--continue'], { GIT_EDITOR: 'true' });
}

export async function rebaseAbort() {
  await repoGit(['rebase', '--abort']);
}
