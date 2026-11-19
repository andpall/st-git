export interface PushCommit { hash: string; subject: string; author: string; date: number }

export const PUSH_COMMIT_FORMAT = '--format=%H%x1f%s%x1f%an%x1f%at';

function parseCommitLine(line: string): PushCommit {
  const [hash, subject, author, at] = line.split('\x1f');
  return { hash, subject, author, date: Number(at) };
}

export function parsePushCommits(output: string) {
  const lines = output.split('\n');
  const nonEmpty = lines.filter(Boolean);
  return nonEmpty.map(parseCommitLine);
}
