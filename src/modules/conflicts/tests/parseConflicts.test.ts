import * as assert from 'assert';
import { parseConflicts } from '../parseConflicts';

const output = 'UU src/a.ts\0M  clean.ts\0R  new.ts\0old.ts\0DU gone.ts\0AA both.ts\0';
assert.deepStrictEqual(parseConflicts(output), [
  { code: 'UU', path: 'src/a.ts' },
  { code: 'DU', path: 'gone.ts' },
  { code: 'AA', path: 'both.ts' },
]);
assert.deepStrictEqual(parseConflicts(''), []);
