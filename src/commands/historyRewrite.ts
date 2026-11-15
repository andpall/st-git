import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { repoGit } from '../api/git';

const SEQUENCE_EDITOR_SCRIPT = path.join(__dirname, 'seqEditor.js');
const RUN_VSCODE_AS_NODE = { ELECTRON_RUN_AS_NODE: '1' };

export async function ensureOnCurrentBranch(hash: string, action: string) {
  try {
    await repoGit(['merge-base', '--is-ancestor', hash, 'HEAD']);
  } catch {
    throw new Error(`${action} works only on commits of the current branch.`);
  }
}

export async function rebaseStart(hash: string) {
  try {
    const parent = await repoGit(['rev-parse', `${hash}^`]);
    return [parent.trim()];
  } catch {
    return ['--root'];
  }
}

export async function ensureNoMergesSince(start: string[]) {
  const range = start[0] === '--root' ? 'HEAD' : `${start[0]}..HEAD`;
  const merges = await repoGit(['rev-list', '--merges', range]);
  if (merges.trim()) throw new Error('Cannot rewrite history: there are merge commits between this commit and HEAD.');
}

export function writeMessageFile(message: string) {
  const msgFile = path.join(os.tmpdir(), `st-git-msg-${Date.now()}.txt`);
  fs.writeFileSync(msgFile, message);
  return msgFile;
}

export async function rewriteWithRebase(start: string[], action: string, hashes: string[], msgFile = '') {
  await repoGit(['rebase', '-i', '--autostash', ...start], {
    ...RUN_VSCODE_AS_NODE,
    GIT_SEQUENCE_EDITOR: `"${process.execPath}" "${SEQUENCE_EDITOR_SCRIPT}"`,
    GIT_EDITOR: 'true',
    ST_GIT_ACTION: action,
    ST_GIT_HASHES: hashes.join(','),
    ST_GIT_MSG: msgFile,
  });
  if (msgFile) fs.rmSync(msgFile, { force: true });
}
