import { repoGit } from '../../api/git';
import { parseNameStatus, type Change } from '../../utils/nameStatus';

async function firstParent(hash: string) {
  const output = await repoGit(['rev-list', '--parents', '-n', '1', hash]);
  const trimmed = output.trim();
  const ids = trimmed.split(' ');
  return ids[1];
}

export async function readRangeChanges(before: string, after: string): Promise<Change[]> {
  const output = await repoGit(['diff-tree', '-r', '-z', '-M', '--name-status', before, after]);
  return parseNameStatus(output);
}

export async function readChanges(hash: string): Promise<Change[]> {
  const parent = await firstParent(hash);
  if (parent) return readRangeChanges(parent, hash);
  const output = await repoGit(['diff-tree', '-r', '-z', '-M', '--name-status', '--root', '--no-commit-id', hash]);
  return parseNameStatus(output);
}
