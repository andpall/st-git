import { repoGit } from '../../api/git';
import { parseNameStatus, type Change } from './nameStatus';

async function firstParent(hash: string) {
  const output = await repoGit(['rev-list', '--parents', '-n', '1', hash]);
  const trimmed = output.trim();
  const ids = trimmed.split(' ');
  return ids[1];
}

export async function readChanges(hash: string): Promise<Change[]> {
  const parent = await firstParent(hash);
  const range = parent ? [parent, hash] : ['--root', '--no-commit-id', hash];
  const output = await repoGit(['diff-tree', '-r', '-z', '-M', '--name-status', ...range]);
  return parseNameStatus(output);
}
