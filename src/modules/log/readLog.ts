import { git } from '../../api/git';
import type { Commit } from './graph';

const MAX_COMMITS = '500';
const FORMAT = '--format=%H%x1f%P%x1f%an%x1f%at%x1f%D%x1f%s';

function parseCommitLine(line: string): Commit {
  const [hash, parents, author, at, refs, subject] = line.split('\x1f');
  return { hash, parents: parents ? parents.split(' ') : [], author, date: Number(at), refs, subject };
}

export async function readLog(cwd: string): Promise<Commit[]> {
  const out = await git(cwd, ['log', '--exclude=refs/stash', '--all', '--topo-order', '-n', MAX_COMMITS, FORMAT]);
  const lines = out.split('\n');
  const nonEmpty = lines.filter(Boolean);
  return nonEmpty.map(parseCommitLine);
}
