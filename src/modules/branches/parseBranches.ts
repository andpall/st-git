export interface Branch { ref: string; name: string; remote: boolean; current: boolean; upstream: string; ahead: number; behind: number }

export const BRANCH_FORMAT = '--format=%(refname)%1f%(refname:short)%1f%(HEAD)%1f%(upstream:short)%1f%(upstream:track,nobracket)';

function countIn(track: string, word: string) {
  const match = new RegExp(`${word} (\\d+)`).exec(track);
  return match ? Number(match[1]) : 0;
}

function parseBranchLine(line: string): Branch {
  const [ref, name, head, upstream, track = ''] = line.split('\x1f');
  const ahead = countIn(track, 'ahead');
  const behind = countIn(track, 'behind');
  return { ref, name, remote: ref.startsWith('refs/remotes/'), current: head === '*', upstream, ahead, behind };
}

function isRealBranch(branch: Branch) {
  return !branch.ref.endsWith('/HEAD');
}

export function parseBranches(output: string): Branch[] {
  const lines = output.split('\n');
  const nonEmpty = lines.filter(Boolean);
  const branches = nonEmpty.map(parseBranchLine);
  return branches.filter(isRealBranch);
}
