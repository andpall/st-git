import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);
const MAX_OUTPUT_BYTES = 64 << 20;

export async function git(cwd: string, args: string[], env?: NodeJS.ProcessEnv): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', args, { cwd, env: { ...process.env, ...env }, maxBuffer: MAX_OUTPUT_BYTES });
    return stdout;
  } catch (error) {
    const { stderr, message } = error as { stderr?: string; message: string };
    throw new Error(stderr?.trim() || message);
  }
}

export async function repoRoot() {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) throw new Error('Open a folder with a git repository.');
  const root = await git(folder.uri.fsPath, ['rev-parse', '--show-toplevel']);
  return root.trim();
}

export async function repoGit(args: string[], env?: NodeJS.ProcessEnv) {
  const root = await repoRoot();
  return git(root, args, env);
}

export async function isRebasing() {
  try {
    const root = await repoRoot();
    const rebaseDir = await git(root, ['rev-parse', '--git-path', 'rebase-merge']);
    return fs.existsSync(path.resolve(root, rebaseDir.trim()));
  } catch {
    return false;
  }
}
