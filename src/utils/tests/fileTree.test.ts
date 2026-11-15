import * as assert from 'assert';
import { buildFileTree, type TreeNode } from '../fileTree';

function describeNode(node: TreeNode): unknown {
  if (node.kind === 'file') return node.path;
  return { [node.path]: node.children.map(describeNode) };
}

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
