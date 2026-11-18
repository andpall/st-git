import * as vscode from 'vscode';
import { repoGit } from '../../api/git';
import type { CommitContext } from '../log/provider';
import { checkout } from './checkout';
import { createBranch } from './createBranch';
import { currentBranch } from '../../commands/branchInfo';

const DETACHED_DETAIL = 'No local branch points to this commit. You will be in "detached HEAD" state: new commits will not belong to any branch.';

async function branchesAt(hash: string, ...refPrefixes: string[]) {
  const output = await repoGit(['for-each-ref', '--points-at', hash, '--format=%(refname:short)', ...refPrefixes]);
  const lines = output.split('\n');
  return lines.filter(Boolean);
}

async function checkoutDetached(hash: string) {
  const choice = await vscode.window.showWarningMessage(`Checkout revision ${hash.slice(0, 8)}?`, { modal: true, detail: DETACHED_DETAIL }, 'Checkout');
  if (choice === 'Checkout') await checkout([hash]);
}

export async function checkoutCommit({ hash }: CommitContext) {
  const branches = await branchesAt(hash, 'refs/heads');
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

function isMergeable(current: string) {
  return function isOtherBranch(name: string) {
    return name !== current && !name.endsWith('/HEAD');
  };
}

export async function mergeCommit({ hash }: CommitContext) {
  const current = await currentBranch();
  const branches = await branchesAt(hash, 'refs/heads', 'refs/remotes');
  const candidates = branches.filter(isMergeable(current));
  const source = candidates.length > 1
    ? await vscode.window.showQuickPick(candidates, { title: `Merge into '${current}'` })
    : candidates[0] ?? hash;
  if (source) await repoGit(['merge', '--no-edit', source]);
}
