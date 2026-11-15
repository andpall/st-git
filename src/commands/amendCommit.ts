import { repoGit } from '../api/git';
import { confirmIfPushed } from '../ui/confirm';
import { askCommitMessage } from '../ui/messageDialog';
import type { CommitContext } from '../modules/log/provider';

async function stagedSummary() {
  const output = await repoGit(['diff', '--cached', '--name-only', '-z']);
  const files = output.split('\0');
  const staged = files.filter(Boolean);
  if (!staged.length) return 'message only, nothing staged';
  return staged.length === 1 ? '1 staged file' : `${staged.length} staged files`;
}

export async function amendCommit(context?: CommitContext) {
  const headOutput = await repoGit(['rev-parse', 'HEAD']);
  const head = headOutput.trim();
  if (context && context.hash !== head) throw new Error('Only the last commit (HEAD) can be amended.');
  const currentMessage = await repoGit(['log', '-1', '--format=%B', head]);
  const title = `Amend last commit (${await stagedSummary()})`;
  const message = await askCommitMessage({ title, action: 'Amend', text: currentMessage.trim() });
  if (!message) return;
  const confirmed = await confirmIfPushed(`${title}?`, head);
  if (confirmed) await repoGit(['commit', '--amend', '-m', message]);
}
