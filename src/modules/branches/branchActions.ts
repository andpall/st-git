import * as vscode from 'vscode';
import { rebaseOntoRef } from '../../commands/rebase';
import { checkout, checkoutRemote } from './checkout';
import { createBranch } from './createBranch';
import { checkoutAndRebase, deleteBranch, mergeIntoCurrent, renameBranch } from './branchOperations';
import type { Branch } from './parseBranches';

type BranchAction = 'checkout' | 'newBranch' | 'checkoutRebase' | 'compare' | 'rebaseOnto' | 'merge' | 'rename' | 'delete';
type ActionItem = vscode.QuickPickItem & { action: BranchAction };

function actionItems(branch: Branch, current: string): ActionItem[] {
  const name = `'${branch.name}'`;
  const items: ActionItem[] = [];
  if (!branch.current) items.push({ label: '$(check) Checkout', action: 'checkout' });
  items.push({ label: `$(add) New Branch from ${name}...`, action: 'newBranch' });
  if (!branch.current) {
    if (!branch.remote) items.push({ label: `$(git-pull-request) Checkout and Rebase onto '${current}'`, action: 'checkoutRebase' });
    items.push(
      { label: `$(diff) Compare with '${current}'`, action: 'compare' },
      { label: `$(git-pull-request) Rebase '${current}' onto ${name}`, action: 'rebaseOnto' },
      { label: `$(git-merge) Merge ${name} into '${current}'`, action: 'merge' },
    );
  }
  if (!branch.remote) items.push({ label: '$(edit) Rename...', action: 'rename' });
  if (!branch.current) items.push({ label: '$(trash) Delete', action: 'delete' });
  return items;
}

async function runAction(action: BranchAction, branch: Branch, current: string, localNames: Set<string>) {
  switch (action) {
    case 'checkout':
      if (branch.remote) await checkoutRemote(branch.name, localNames);
      else await checkout([branch.name]);
      return;
    case 'newBranch':
      await createBranch(branch.name, `'${branch.name}'`);
      return;
    case 'checkoutRebase':
      await checkoutAndRebase(branch, current);
      return;
    case 'compare':
      await vscode.commands.executeCommand('st-git.compareWithCurrent', branch.name);
      return;
    case 'rebaseOnto':
      await rebaseOntoRef(branch.name, `'${branch.name}'`);
      return;
    case 'merge':
      await mergeIntoCurrent(branch);
      return;
    case 'rename':
      await renameBranch(branch);
      return;
    case 'delete':
      await deleteBranch(branch);
  }
}

export async function showBranchActions(branch: Branch, current: string, localNames: Set<string>) {
  const picked = await vscode.window.showQuickPick(actionItems(branch, current), { title: branch.name });
  if (picked) await runAction(picked.action, branch, current, localNames);
}
