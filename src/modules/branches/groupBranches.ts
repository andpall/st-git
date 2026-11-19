import type { Branch } from './parseBranches';

export interface BranchGroup { label: string; branches: Branch[] }

function prefixOf(name: string) {
  const slash = name.indexOf('/');
  return slash === -1 ? '' : name.slice(0, slash + 1);
}

function groupLabel(branch: Branch) {
  if (branch.remote) return `Remote · ${prefixOf(branch.name)}`;
  const prefix = prefixOf(branch.name);
  return prefix ? `Local · ${prefix}` : 'Local Branches';
}

function compareGroups(a: BranchGroup, b: BranchGroup) {
  const aRemote = a.label.startsWith('Remote');
  const bRemote = b.label.startsWith('Remote');
  if (aRemote !== bRemote) return aRemote ? 1 : -1;
  if (a.label === 'Local Branches') return -1;
  if (b.label === 'Local Branches') return 1;
  return a.label.localeCompare(b.label);
}

export function groupBranches(branches: Branch[], favorites: Set<string>): BranchGroup[] {
  const favoriteGroup: BranchGroup = { label: 'Favorites', branches: [] };
  const groups = new Map<string, BranchGroup>();
  for (const branch of branches) {
    if (favorites.has(branch.name)) {
      favoriteGroup.branches.push(branch);
      continue;
    }
    const label = groupLabel(branch);
    const group = groups.get(label) ?? { label, branches: [] };
    group.branches.push(branch);
    groups.set(label, group);
  }
  const sorted = [...groups.values()];
  sorted.sort(compareGroups);
  return favoriteGroup.branches.length ? [favoriteGroup, ...sorted] : sorted;
}
