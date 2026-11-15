import * as vscode from 'vscode';
import { repoGit } from '../../api/git';
import { checkout } from './checkout';

async function validateBranchName(name: string) {
  if (!name.trim()) return 'Enter a branch name.';
  try {
    await repoGit(['check-ref-format', '--branch', name]);
  } catch {
    return 'This is not a valid branch name.';
  }
  try {
    await repoGit(['rev-parse', '--verify', '--quiet', `refs/heads/${name}`]);
    return 'A branch with this name already exists.';
  } catch {
    return undefined;
  }
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
