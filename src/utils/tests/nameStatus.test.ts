import * as assert from 'assert';
import { parseNameStatus } from '../nameStatus';

const output = 'M\0src/a.ts\0R087\0old.ts\0new.ts\0A\0файл.ts\0D\0gone.ts\0';
assert.deepStrictEqual(parseNameStatus(output), [
  { status: 'M', path: 'src/a.ts' },
  { status: 'R', oldPath: 'old.ts', path: 'new.ts' },
  { status: 'A', path: 'файл.ts' },
  { status: 'D', path: 'gone.ts' },
]);
assert.deepStrictEqual(parseNameStatus(''), []);
