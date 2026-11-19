import { repoGit } from '../../api/git';
import { countCommits } from '../../commands/branchInfo';
import { parsePushCommits, PUSH_COMMIT_FORMAT, type PushCommit } from './parsePushCommits';

export interface PushPlan { commits: PushCommit[]; behind: number; newBranch: boolean }

const MAX_COMMITS = 200;

export async function listRemotes() {
  const output = await repoGit(['remote']);
  const lines = output.split('\n');
  return lines.filter(Boolean);
}

async function remoteBranchExists(remote: string, branch: string) {
  try {
    await repoGit(['rev-parse', '--verify', '--quiet', `refs/remotes/${remote}/${branch}`]);
    return true;
  } catch {
    return false;
  }
}

async function readCommits(range: string[]) {
  const output = await repoGit(['log', `--max-count=${MAX_COMMITS}`, PUSH_COMMIT_FORMAT, ...range]);
  return parsePushCommits(output);
}

export async function planPush(source: string, remote: string, branch: string): Promise<PushPlan> {
  if (!branch.trim() || !(await remoteBranchExists(remote, branch))) {
    const commits = await readCommits([source, '--not', `--remotes=${remote}`]);
    return { commits, behind: 0, newBranch: true };
  }
  const target = `${remote}/${branch}`;
  const commits = await readCommits([`${target}..${source}`]);
  const behind = await countCommits(`${source}..${target}`);
  return { commits, behind, newBranch: false };
}
