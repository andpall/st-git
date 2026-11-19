import * as assert from 'assert';
import { parsePushCommits } from '../parsePushCommits';

const output = 'abc123\x1ffix: a | b\x1fAnn\x1f1700000000\ndef456\x1ffeat\x1fBob\x1f1700000100\n';
assert.deepStrictEqual(parsePushCommits(output), [
  { hash: 'abc123', subject: 'fix: a | b', author: 'Ann', date: 1700000000 },
  { hash: 'def456', subject: 'feat', author: 'Bob', date: 1700000100 },
]);
assert.deepStrictEqual(parsePushCommits(''), []);
