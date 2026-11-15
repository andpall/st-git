import { repoGit } from '../api/git';
import { confirmIfPushed } from '../ui/confirm';
import { askCommitMessage } from '../ui/messageDialog';
import { ensureNoMergesSince, ensureOnCurrentBranch, rebaseStart, rewriteWithRebase, writeMessageFile } from './historyRewrite';

function trimText(text: string) {
  return text.trim();
}

async function combinedMessage(selection: string[]) {
  const oldestFirst = [...selection].reverse();
  const output = await repoGit(['log', '--no-walk=unsorted', '--format=%B%x00', ...oldestFirst]);
  const messages = output.split('\0');
  const trimmed = messages.map(trimText);
  const nonEmpty = trimmed.filter(Boolean);
  return nonEmpty.join('\n\n');
}

export async function squash(selection: string[]) {
  if (selection.length < 2) throw new Error('Select 2 or more commits (Cmd/Ctrl+click or Shift+click).');
  const oldest = selection[selection.length - 1];
  for (const hash of selection) await ensureOnCurrentBranch(hash, 'Squash');
  const start = await rebaseStart(oldest);
  await ensureNoMergesSince(start);
  const title = `Squash ${selection.length} commits`;
  const message = await askCommitMessage({ title, action: 'Squash', text: await combinedMessage(selection) });
  if (!message) return;
  const confirmed = await confirmIfPushed(`${title}?`, oldest);
  if (confirmed) await rewriteWithRebase(start, 'squash', selection, writeMessageFile(message));
}
