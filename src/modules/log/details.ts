import { repoGit } from '../../api/git';

export interface CommitDetails { hash: string; author: string; email: string; date: number; message: string; branches: string[] }

const DETAILS_FORMAT = '--format=%H%x1f%an%x1f%ae%x1f%at%x1f%B';

export async function readCommitDetails(hash: string): Promise<CommitDetails> {
  const output = await repoGit(['show', '-s', DETAILS_FORMAT, hash]);
  const [fullHash, author, email, at, message] = output.split('\x1f');
  const branchOutput = await repoGit(['branch', '-a', '--contains', hash, '--format=%(refname:short)']);
  const branchLines = branchOutput.split('\n');
  return { hash: fullHash, author, email, date: Number(at), message: message.trim(), branches: branchLines.filter(Boolean) };
}
