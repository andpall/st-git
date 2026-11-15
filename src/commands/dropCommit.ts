import { repoGit } from '../api/git';
import { confirmRewrite } from '../ui/confirm';
import type { CommitContext } from '../modules/log/provider';
import { ensureNoMergesSince, ensureOnCurrentBranch, rebaseStart, rewriteWithRebase } from './historyRewrite';

export async function dropCommit({ hash }: CommitContext) {
  await ensureOnCurrentBranch(hash, 'Drop');
  const start = await rebaseStart(hash);
  await ensureNoMergesSince(start);
  const subject = await repoGit(['log', '-1', '--format=%s', hash]);
  const confirmed = await confirmRewrite(`Drop commit "${subject.trim()}"? Its changes will be removed from the history.`, hash);
  if (confirmed) await rewriteWithRebase(start, 'drop', [hash]);
}
