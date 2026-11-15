export interface Branch { ref: string; name: string; remote: boolean; current: boolean; upstream: string }

export const BRANCH_FORMAT = '--format=%(refname)%1f%(refname:short)%1f%(HEAD)%1f%(upstream:short)';

function parseBranchLine(line: string): Branch {
  const [ref, name, head, upstream] = line.split('\x1f');
  return { ref, name, remote: ref.startsWith('refs/remotes/'), current: head === '*', upstream };
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
