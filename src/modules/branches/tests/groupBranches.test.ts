import * as assert from 'assert';
import { groupBranches, type BranchGroup } from '../groupBranches';
import type { Branch } from '../parseBranches';

function branch(name: string, remote = false): Branch {
  return { ref: name, name, remote, current: false, upstream: '', ahead: 0, behind: 0 };
}

function describeGroup(group: BranchGroup) {
  const names = group.branches.map(nameOf);
  return `${group.label}: ${names.join(' ')}`;
}

function nameOf(item: Branch) {
  return item.name;
}

const branches = [branch('main'), branch('feature/b'), branch('fix/x'), branch('feature/a'), branch('dev'), branch('origin/main', true), branch('upstream/dev', true)];
const groups = groupBranches(branches, new Set(['dev', 'origin/main']));
assert.deepStrictEqual(groups.map(describeGroup), [
  'Favorites: dev origin/main',
  'Local Branches: main',
  'Local · feature/: feature/b feature/a',
  'Local · fix/: fix/x',
  'Remote · upstream/: upstream/dev',
]);
