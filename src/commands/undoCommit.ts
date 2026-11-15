import { repoGit } from '../api/git';
import { confirmRewrite } from '../ui/confirm';
import type { CommitContext } from '../modules/log/provider';

export async function undoCommit({ hash }: CommitContext) {
  const headOutput = await repoGit(['rev-parse', 'HEAD']);
  const head = headOutput.trim();
  if (hash !== head) throw new Error('Only the last commit (HEAD) can be undone.');
  const confirmed = await confirmRewrite('Undo last commit? Its changes will stay staged.', head);
  if (confirmed) await repoGit(['reset', '--soft', 'HEAD~1']);
}
