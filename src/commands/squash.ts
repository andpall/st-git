import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { repoGit } from '../api/git';
import { confirmRewrite } from '../ui/confirm';

const SEQUENCE_EDITOR_SCRIPT = path.join(__dirname, 'seqEditor.js');
const RUN_VSCODE_AS_NODE = { ELECTRON_RUN_AS_NODE: '1' };

async function ensureOnCurrentBranch(hash: string) {
  try {
    await repoGit(['merge-base', '--is-ancestor', hash, 'HEAD']);
  } catch {
    throw new Error('Squash works only on commits of the current branch.');
  }
}

async function ensureAllOnCurrentBranch(selection: string[]) {
  for (const hash of selection) await ensureOnCurrentBranch(hash);
}

async function parentOf(hash: string) {
  try {
    const parent = await repoGit(['rev-parse', `${hash}^`]);
    return parent.trim();
  } catch {
    throw new Error('Cannot squash the root commit.');
  }
}

async function ensureNoMerges(base: string) {
  const merges = await repoGit(['rev-list', '--merges', `${base}..HEAD`]);
  if (merges.trim()) throw new Error('Cannot squash: there are merge commits between the selection and HEAD.');
}

async function askMessage(count: number, oldest: string) {
  const subject = await repoGit(['log', '-1', '--format=%s', oldest]);
  return vscode.window.showInputBox({ prompt: `Message for the squashed commit (${count} commits)`, value: subject.trim() });
}

async function squashWithRebase(selection: string[], base: string, message: string) {
  const msgFile = path.join(os.tmpdir(), `st-git-msg-${Date.now()}.txt`);
  fs.writeFileSync(msgFile, message);
  await repoGit(['rebase', '-i', '--autostash', base], {
    ...RUN_VSCODE_AS_NODE,
    GIT_SEQUENCE_EDITOR: `"${process.execPath}" "${SEQUENCE_EDITOR_SCRIPT}"`,
    GIT_EDITOR: 'true',
    ST_GIT_SQUASH: selection.join(','),
    ST_GIT_MSG: msgFile,
  });
  fs.rmSync(msgFile, { force: true });
}

export async function squash(selection: string[]) {
  if (selection.length < 2) throw new Error('Select 2 or more commits (Cmd/Ctrl+click or Shift+click).');
  const oldest = selection[selection.length - 1];
  await ensureAllOnCurrentBranch(selection);
  const base = await parentOf(oldest);
  await ensureNoMerges(base);
  const message = await askMessage(selection.length, oldest);
  if (!message) return;
  const confirmed = await confirmRewrite(`Squash ${selection.length} commits?`, oldest);
  if (confirmed) await squashWithRebase(selection, base, message);
}
