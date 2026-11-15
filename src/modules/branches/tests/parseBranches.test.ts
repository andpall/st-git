import * as assert from 'assert';
import { parseBranches } from '../parseBranches';

const output = [
  'refs/heads/main\x1fmain\x1f*\x1forigin/main',
  'refs/heads/feature\x1ffeature\x1f \x1f',
  'refs/remotes/origin/HEAD\x1forigin\x1f \x1f',
  'refs/remotes/origin/main\x1forigin/main\x1f \x1f',
  '',
].join('\n');

assert.deepStrictEqual(parseBranches(output), [
  { ref: 'refs/heads/main', name: 'main', remote: false, current: true, upstream: 'origin/main' },
  { ref: 'refs/heads/feature', name: 'feature', remote: false, current: false, upstream: '' },
  { ref: 'refs/remotes/origin/main', name: 'origin/main', remote: true, current: false, upstream: '' },
]);
