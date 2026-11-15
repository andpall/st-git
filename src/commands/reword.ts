import { repoGit } from '../api/git';
import { confirmIfPushed } from '../ui/confirm';
import { askCommitMessage } from '../ui/messageDialog';
import type { CommitContext } from '../modules/log/provider';
import { ensureNoMergesSince, ensureOnCurrentBranch, rebaseStart, rewriteWithRebase, writeMessageFile } from './historyRewrite';

export async function rewordCommit({ hash }: CommitContext) {
  await ensureOnCurrentBranch(hash, 'Editing a commit message');
  const currentOutput = await repoGit(['log', '-1', '--format=%B', hash]);
  const current = currentOutput.trim();
  const message = await askCommitMessage({ title: `Edit message of ${hash.slice(0, 8)}`, action: 'Save', text: current });
  if (!message || message.trim() === current) return;
  if (!(await confirmIfPushed('Edit commit message?', hash))) return;
  const headOutput = await repoGit(['rev-parse', 'HEAD']);
  if (headOutput.trim() === hash) {
    await repoGit(['commit', '--amend', '--only', '-m', message]);
    return;
  }
  const start = await rebaseStart(hash);
  await ensureNoMergesSince(start);
  await rewriteWithRebase(start, 'reword', [hash], writeMessageFile(message));
}
