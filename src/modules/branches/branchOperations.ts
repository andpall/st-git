import * as vscode from 'vscode';
import { repoGit } from '../../api/git';
import { confirmIfPushed } from '../../ui/confirm';
import { validateBranchName } from './createBranch';
import type { Branch } from './parseBranches';

const NOT_MERGED = /not fully merged/i;

export async function checkoutAndRebase(branch: Branch, current: string) {
  const confirmed = await confirmIfPushed(`Rebase "${branch.name}" onto "${current}"?`, branch.name);
  if (confirmed) await repoGit(['rebase', '--autostash', current, branch.name]);
}

export async function mergeIntoCurrent(branch: Branch) {
  await repoGit(['merge', '--no-edit', branch.name]);
}

export async function renameBranch(branch: Branch) {
  const name = await vscode.window.showInputBox({ title: `Rename "${branch.name}"`, value: branch.name, validateInput: validateBranchName });
  if (name) await repoGit(['branch', '-m', branch.name, name]);
}

async function deleteLocal(name: string) {
  try {
    await repoGit(['branch', '-d', name]);
  } catch (error) {
    if (!NOT_MERGED.test((error as Error).message)) throw error;
    const choice = await vscode.window.showWarningMessage(`"${name}" is not fully merged.`, { modal: true, detail: 'Its unmerged commits will only be reachable by hash.' }, 'Delete Anyway');
    if (choice === 'Delete Anyway') await repoGit(['branch', '-D', name]);
  }
}

async function deleteRemote(name: string) {
  const remote = name.slice(0, name.indexOf('/'));
  const remoteBranch = name.slice(name.indexOf('/') + 1);
  const choice = await vscode.window.showWarningMessage(`Delete "${remoteBranch}" on ${remote}?`, { modal: true, detail: 'The branch will be removed from the server for everyone.' }, 'Delete');
  if (choice === 'Delete') await repoGit(['push', remote, '--delete', remoteBranch]);
}

export async function deleteBranch(branch: Branch) {
  if (branch.remote) {
    await deleteRemote(branch.name);
    return;
  }
  const choice = await vscode.window.showWarningMessage(`Delete branch "${branch.name}"?`, { modal: true }, 'Delete');
  if (choice === 'Delete') await deleteLocal(branch.name);
}
