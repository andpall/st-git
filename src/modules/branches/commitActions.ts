import * as vscode from 'vscode';
import { repoGit } from '../../api/git';
import type { CommitContext } from '../log/provider';
import { checkout } from './checkout';
import { createBranch } from './createBranch';

const DETACHED_DETAIL = 'No local branch points to this commit. You will be in "detached HEAD" state: new commits will not belong to any branch.';

async function branchesAt(hash: string) {
  const output = await repoGit(['for-each-ref', '--points-at', hash, '--format=%(refname:short)', 'refs/heads']);
  const lines = output.split('\n');
  return lines.filter(Boolean);
}

async function checkoutDetached(hash: string) {
  const choice = await vscode.window.showWarningMessage(`Checkout revision ${hash.slice(0, 8)}?`, { modal: true, detail: DETACHED_DETAIL }, 'Checkout');
  if (choice === 'Checkout') await checkout([hash]);
}

export async function checkoutCommit({ hash }: CommitContext) {
  const branches = await branchesAt(hash);
  if (!branches.length) {
    await checkoutDetached(hash);
    return;
  }
  const branch = branches.length === 1 ? branches[0] : await vscode.window.showQuickPick(branches, { title: 'Checkout Branch' });
  if (branch) await checkout([branch]);
}

export async function newBranchFromCommit({ hash }: CommitContext) {
  await createBranch(hash, `commit ${hash.slice(0, 8)}`);
}
