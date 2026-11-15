import * as vscode from 'vscode';
import { repoGit } from '../../api/git';
import { checkout } from './checkout';
import { branchNameConflict } from './branchNameConflict';

async function localBranchNames() {
  const output = await repoGit(['for-each-ref', '--format=%(refname:short)', 'refs/heads']);
  const lines = output.split('\n');
  return lines.filter(Boolean);
}

export async function validateBranchName(name: string) {
  if (!name.trim()) return 'Enter a branch name.';
  try {
    await repoGit(['check-ref-format', '--branch', name]);
  } catch {
    return 'This is not a valid branch name.';
  }
  return branchNameConflict(name, await localBranchNames());
}

export async function createBranch(startPoint: string, startLabel: string) {
  const name = await vscode.window.showInputBox({
    title: 'Create New Branch',
    prompt: `New branch from ${startLabel}`,
    placeHolder: 'feature/my-branch',
    validateInput: validateBranchName,
  });
  if (!name) return;
  await checkout(['-b', name, startPoint]);
}
