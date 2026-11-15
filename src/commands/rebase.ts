import { repoGit } from '../api/git';
import { confirmRewrite } from '../ui/confirm';
import type { CommitContext } from '../modules/log/provider';
import { currentBranch } from './branchInfo';

export async function rebaseOntoRef(ref: string, label: string) {
  const branch = await currentBranch();
  const confirmed = await confirmRewrite(`Rebase "${branch}" onto ${label}?`, 'HEAD');
  if (confirmed) await repoGit(['rebase', '--autostash', ref]);
}

export async function rebaseOnto({ hash }: CommitContext) {
  await rebaseOntoRef(hash, hash.slice(0, 8));
}
