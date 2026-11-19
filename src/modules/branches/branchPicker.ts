import * as vscode from 'vscode';
import { repoGit } from '../../api/git';
import { BRANCH_FORMAT, parseBranches, type Branch } from './parseBranches';
import { groupBranches, type BranchGroup } from './groupBranches';
import { favoriteBranches, toggleFavorite } from './favorites';
import { createBranch } from './createBranch';
import { showBranchActions } from './branchActions';

type BranchItem = vscode.QuickPickItem & { branch?: Branch; createNew?: boolean };

const ADD_FAVORITE = { iconPath: new vscode.ThemeIcon('star-empty'), tooltip: 'Add to Favorites' };
const REMOVE_FAVORITE = { iconPath: new vscode.ThemeIcon('star-full'), tooltip: 'Remove from Favorites' };

async function readBranches() {
  const output = await repoGit(['for-each-ref', '--sort=-committerdate', BRANCH_FORMAT, 'refs/heads', 'refs/remotes']);
  return parseBranches(output);
}

function branchIcon(branch: Branch) {
  if (branch.current) return '$(check)';
  return branch.remote ? '$(cloud)' : '$(git-branch)';
}

function trackingText(branch: Branch) {
  const parts: string[] = [];
  if (branch.ahead) parts.push(`↑${branch.ahead}`);
  if (branch.behind) parts.push(`↓${branch.behind}`);
  return parts.join(' ');
}

function branchDescription(branch: Branch) {
  const parts = [trackingText(branch), branch.current ? 'current' : branch.upstream];
  const filled = parts.filter(Boolean);
  return filled.join('  ');
}

function branchItem(favorites: Set<string>) {
  return function toItem(branch: Branch): BranchItem {
    const button = favorites.has(branch.name) ? REMOVE_FAVORITE : ADD_FAVORITE;
    return { label: `${branchIcon(branch)} ${branch.name}`, description: branchDescription(branch), branch, buttons: [button] };
  };
}

function buildItems(branches: Branch[]): BranchItem[] {
  const favorites = favoriteBranches();
  const items: BranchItem[] = [{ label: '$(add) New Branch...', createNew: true }];
  const toItem = branchItem(favorites);
  const groups = groupBranches(branches, favorites);
  for (const group of groups) items.push(...groupItems(group, toItem));
  return items;
}

function groupItems(group: BranchGroup, toItem: (branch: Branch) => BranchItem): BranchItem[] {
  const separator = { label: group.label, kind: vscode.QuickPickItemKind.Separator };
  return [separator, ...group.branches.map(toItem)];
}

function pickBranch(branches: Branch[]): Promise<BranchItem | undefined> {
  const picker = vscode.window.createQuickPick<BranchItem>();
  picker.title = 'Branches';
  picker.placeholder = 'Pick a branch to see its actions, or create a new one. ★ keeps a branch on top.';
  picker.matchOnDescription = true;
  picker.items = buildItems(branches);
  return new Promise(function listen(resolve) {
    picker.onDidTriggerItemButton(async function handleStar(event) {
      if (!event.item.branch) return;
      const name = event.item.branch.name;
      await toggleFavorite(name);
      picker.items = buildItems(branches);
      picker.activeItems = picker.items.filter(isItemOf(name));
    });
    picker.onDidAccept(function handleAccept() {
      resolve(picker.selectedItems[0]);
      picker.hide();
    });
    picker.onDidHide(function handleHide() {
      resolve(undefined);
      picker.dispose();
    });
    picker.show();
  });
}

function isItemOf(name: string) {
  return function isSameBranch(item: BranchItem) {
    return item.branch?.name === name;
  };
}

function isLocal(branch: Branch) {
  return !branch.remote;
}

function isCurrent(branch: Branch) {
  return branch.current;
}

function nameOf(branch: Branch) {
  return branch.name;
}

export async function showBranches() {
  const branches = await readBranches();
  const picked = await pickBranch(branches);
  if (!picked) return;
  if (picked.createNew) {
    await createBranch('HEAD', 'the current branch');
    return;
  }
  if (!picked.branch) return;
  const current = branches.find(isCurrent);
  const local = branches.filter(isLocal);
  await showBranchActions(picked.branch, current?.name ?? 'HEAD', new Set(local.map(nameOf)));
}
