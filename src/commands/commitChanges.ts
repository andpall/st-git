import { repoGit } from '../api/git';
import { confirmIfPushed } from '../ui/confirm';
import type { Change } from '../utils/nameStatus';

function pathsOf(change: Change) {
  return change.oldPath ? [change.path, change.oldPath] : [change.path];
}

function isUnversioned(change: Change) {
  return change.status === '?';
}

export async function commitChanges(message: string, amend: boolean, changes: Change[]) {
  if (!message.trim()) throw new Error('Enter a commit message.');
  if (!amend && !changes.length) throw new Error('Select files to commit in Local Changes.');
  if (amend && !(await confirmIfPushed('Amend last commit?', 'HEAD'))) return false;
  const unversioned = changes.filter(isUnversioned);
  const newFiles = unversioned.flatMap(pathsOf);
  if (newFiles.length) await repoGit(['add', '--', ...newFiles]);
  const paths = changes.flatMap(pathsOf);
  const amendFlag = amend ? ['--amend'] : [];
  await repoGit(['commit', ...amendFlag, '--only', '-m', message, '--', ...paths]);
  return true;
}
