import { git } from '../../api/git';
import type { Commit } from './graph';

export interface LogFilters { text: string; branch: string; author: string; since: string; path: string }

export const EMPTY_FILTERS: LogFilters = { text: '', branch: '', author: '', since: '', path: '' };

const FORMAT = '--format=%H%x1f%P%x1f%an%x1f%at%x1f%D%x1f%s';
const HASH_LIKE = /^[0-9a-f]{4,40}$/i;
const REMOTE_PREFIX = 'refs/remotes/';

function parseCommitLine(line: string): Commit {
  const [hash, parents, author, at, refs, subject] = line.split('\x1f');
  return { hash, parents: parents ? parents.split(' ') : [], author, date: Number(at), refs, subject };
}

async function matchingCommit(cwd: string, text: string) {
  if (!HASH_LIKE.test(text)) return undefined;
  try {
    const output = await git(cwd, ['rev-parse', '--verify', '--quiet', `${text}^{commit}`]);
    return output.trim();
  } catch {
    return undefined;
  }
}

function filterArgs(filters: LogFilters) {
  const args: string[] = [];
  if (filters.author) args.push(`--author=${filters.author}`);
  if (filters.text) args.push(`--grep=${filters.text}`);
  if (filters.author || filters.text) args.push('--regexp-ignore-case', '--fixed-strings');
  if (filters.since) args.push(`--since=${filters.since}`);
  return args;
}

function revisionArgs(filters: LogFilters) {
  return filters.branch ? [filters.branch] : ['--exclude=refs/stash', '--all'];
}

function pathArgs(filters: LogFilters) {
  return filters.path ? ['--follow', '--', filters.path] : [];
}

export function isFiltered(filters: LogFilters) {
  return Boolean(filters.text || filters.author || filters.since || filters.path);
}

export async function readLog(cwd: string, filters: LogFilters, limit: number): Promise<Commit[]> {
  const commit = await matchingCommit(cwd, filters.text);
  const args = commit
    ? ['log', '-n', '1', FORMAT, commit]
    : ['log', '--topo-order', '-n', String(limit), FORMAT, ...filterArgs(filters), ...revisionArgs(filters), ...pathArgs(filters)];
  const out = await git(cwd, args);
  const lines = out.split('\n');
  const nonEmpty = lines.filter(Boolean);
  return nonEmpty.map(parseCommitLine);
}

function isRealRemote(ref: string) {
  return !ref.endsWith('/HEAD');
}

function shortRemote(ref: string) {
  return ref.slice(REMOTE_PREFIX.length);
}

export async function readBranchNames(cwd: string) {
  const localOutput = await git(cwd, ['for-each-ref', '--format=%(refname:short)', 'refs/heads']);
  const remoteOutput = await git(cwd, ['for-each-ref', '--format=%(refname)', 'refs/remotes']);
  const localLines = localOutput.split('\n');
  const remoteLines = remoteOutput.split('\n');
  const remoteRefs = remoteLines.filter(Boolean);
  const realRemotes = remoteRefs.filter(isRealRemote);
  return [...localLines.filter(Boolean), ...realRemotes.map(shortRemote)];
}
