import * as assert from 'assert';
import { parseStatus } from '../parseStatus';

const output = ' M src/a.ts\0M  staged.ts\0AM new.ts\0?? untracked.ts\0 D gone.ts\0R  renamed.ts\0old.ts\0UU conflict.ts\0';
assert.deepStrictEqual(parseStatus(output), [
  { status: 'M', path: 'src/a.ts' },
  { status: 'M', path: 'staged.ts' },
  { status: 'A', path: 'new.ts' },
  { status: '?', path: 'untracked.ts' },
  { status: 'D', path: 'gone.ts' },
  { status: 'R', path: 'renamed.ts', oldPath: 'old.ts' },
  { status: 'U', path: 'conflict.ts' },
]);
assert.deepStrictEqual(parseStatus(''), []);
