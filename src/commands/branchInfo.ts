import { repoGit } from '../api/git';

export async function currentBranch() {
  const output = await repoGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const branch = output.trim();
  if (branch === 'HEAD') throw new Error('Detached HEAD: check out a branch first.');
  return branch;
}

export async function upstreamOf() {
  try {
    const output = await repoGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
    return output.trim();
  } catch {
    return undefined;
  }
}

export async function countCommits(range: string) {
  const output = await repoGit(['rev-list', '--count', range]);
  return Number(output.trim());
}
