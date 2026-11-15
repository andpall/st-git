import * as vscode from 'vscode';
import { repoGit } from '../../api/git';
import { BRANCH_FORMAT, parseBranches, type Branch } from './parseBranches';
import { createBranch } from './createBranch';
import { showBranchActions } from './branchActions';

type BranchItem = vscode.QuickPickItem & { branch?: Branch; createNew?: boolean };

async function readBranches() {
  const output = await repoGit(['for-each-ref', '--sort=-committerdate', BRANCH_FORMAT, 'refs/heads', 'refs/remotes']);
  return parseBranches(output);
}

function separator(label: string): BranchItem {
  return { label, kind: vscode.QuickPickItemKind.Separator };
}

function branchIcon(branch: Branch) {
  if (branch.current) return '$(check)';
  return branch.remote ? '$(cloud)' : '$(git-branch)';
}

function branchItem(branch: Branch): BranchItem {
  const description = branch.current ? 'current' : branch.upstream;
  return { label: `${branchIcon(branch)} ${branch.name}`, description, branch };
}

function isLocal(branch: Branch) {
  return !branch.remote;
}

function isRemote(branch: Branch) {
  return branch.remote;
}

function isCurrent(branch: Branch) {
  return branch.current;
}

function nameOf(branch: Branch) {
  return branch.name;
}

export async function showBranches() {
  const branches = await readBranches();
  const local = branches.filter(isLocal);
  const remote = branches.filter(isRemote);
  const items: BranchItem[] = [{ label: '$(add) New Branch...', createNew: true }, separator('Local Branches'), ...local.map(branchItem)];
  if (remote.length) items.push(separator('Remote Branches'), ...remote.map(branchItem));
  const picked = await vscode.window.showQuickPick(items, { title: 'Branches', placeHolder: 'Pick a branch to see its actions, or create a new one', matchOnDescription: true });
  if (!picked) return;
  if (picked.createNew) {
    await createBranch('HEAD', 'the current branch');
    return;
  }
  if (!picked.branch) return;
  const current = branches.find(isCurrent);
  await showBranchActions(picked.branch, current?.name ?? 'HEAD', new Set(local.map(nameOf)));
}
