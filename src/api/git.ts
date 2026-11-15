import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { askpassEnvironment } from './askpass';

export type Operation = 'rebase' | 'merge' | 'cherry-pick' | 'revert';

const execFileAsync = promisify(execFile);
const MAX_OUTPUT_BYTES = 64 << 20;
const NO_TERMINAL_PROMPTS = { GIT_TERMINAL_PROMPT: '0' };
const MISSING_COMMIT = /bad object|not a valid (object|commit)|unknown revision/i;
const OPERATION_MARKERS: { marker: string; operation: Operation }[] = [
  { marker: 'rebase-merge', operation: 'rebase' },
  { marker: 'rebase-apply', operation: 'rebase' },
  { marker: 'MERGE_HEAD', operation: 'merge' },
  { marker: 'CHERRY_PICK_HEAD', operation: 'cherry-pick' },
  { marker: 'REVERT_HEAD', operation: 'revert' },
];

export async function git(cwd: string, args: string[], env?: NodeJS.ProcessEnv): Promise<string> {
  try {
    const options = { cwd, env: { ...process.env, ...NO_TERMINAL_PROMPTS, ...askpassEnvironment(), ...env }, maxBuffer: MAX_OUTPUT_BYTES };
    const { stdout } = await execFileAsync('git', args, options);
    return stdout;
  } catch (error) {
    const { stderr, message } = error as { stderr?: string; message: string };
    throw new Error(stderr?.trim() || message);
  }
}

export function isMissingCommitError(error: unknown) {
  return MISSING_COMMIT.test((error as Error).message);
}

export async function repoRoot() {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) throw new Error('Open a folder with a git repository.');
  const output = await git(folder.uri.fsPath, ['rev-parse', '--show-toplevel']);
  const root = output.trim();
  const sameDirectory = fs.realpathSync(folder.uri.fsPath) === fs.realpathSync(root);
  return sameDirectory ? folder.uri.fsPath : root;
}

export async function repoGit(args: string[], env?: NodeJS.ProcessEnv) {
  const root = await repoRoot();
  return git(root, args, env);
}

function gitPathArgs(entry: { marker: string }) {
  return ['--git-path', entry.marker];
}

export async function currentOperation(): Promise<Operation | undefined> {
  try {
    const root = await repoRoot();
    const args = OPERATION_MARKERS.flatMap(gitPathArgs);
    const output = await git(root, ['rev-parse', ...args]);
    const markerPaths = output.split('\n');
    for (let i = 0; i < OPERATION_MARKERS.length; i++) {
      if (fs.existsSync(path.resolve(root, markerPaths[i]))) return OPERATION_MARKERS[i].operation;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
