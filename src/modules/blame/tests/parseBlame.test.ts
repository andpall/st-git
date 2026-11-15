import * as assert from 'assert';
import { parseBlame } from '../parseBlame';

const a = 'a'.repeat(40);
const b = 'b'.repeat(40);
const output = [
  `${a} 1 1 2`, 'author Alice', 'author-time 1700000000', 'summary first commit', 'filename f', '\tline one',
  `${a} 2 2`, '\tline two',
  `${b} 1 3 1`, 'author Bob', 'author-time 1710000000', 'summary second commit', 'filename f', '\tline three',
  '',
].join('\n');

const lines = parseBlame(output);
assert.strictEqual(lines.length, 3);
assert.deepStrictEqual(lines[0], { hash: a, author: 'Alice', time: 1700000000, summary: 'first commit' });
assert.strictEqual(lines[1], lines[0]);
assert.deepStrictEqual(lines[2], { hash: b, author: 'Bob', time: 1710000000, summary: 'second commit' });
