import * as assert from 'assert';
import { buildFileTree, type TreeNode } from '../fileTree';

function describeNode(node: TreeNode): unknown {
  if (node.kind === 'file') return node.path;
  return { [node.path]: node.children.map(describeNode) };
}

function nameOf(node: TreeNode) {
  return node.name;
}

const compacted = buildFileTree([
  { status: 'M', path: 'packages/app/src/index.ts' },
  { status: 'M', path: 'packages/app/src/ui/button.ts' },
  { status: 'A', path: 'docs/guide/intro.md' },
]);
assert.deepStrictEqual(compacted.map(describeNode), [
  { 'docs/guide': ['docs/guide/intro.md'] },
  { 'packages/app/src': [{ 'packages/app/src/ui': ['packages/app/src/ui/button.ts'] }, 'packages/app/src/index.ts'] },
]);
assert.deepStrictEqual(compacted.map(nameOf), ['docs/guide', 'packages/app/src']);

const changes = [
  { status: 'M', path: 'readme.md' },
  { status: 'A', path: 'src/log/graph.ts' },
  { status: 'M', path: 'src/extension.ts' },
  { status: 'D', path: 'src/api/git.ts' },
];
const tree = buildFileTree(changes);
assert.deepStrictEqual(tree.map(describeNode), [
  { src: [{ 'src/api': ['src/api/git.ts'] }, { 'src/log': ['src/log/graph.ts'] }, 'src/extension.ts'] },
  'readme.md',
]);
