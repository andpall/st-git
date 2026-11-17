import * as assert from 'assert';
import { appendIgnoreLines, ignorePattern } from '../ignorePattern';

assert.strictEqual(ignorePattern('build/out.log', false), '/build/out.log');
assert.strictEqual(ignorePattern('dist', true), '/dist/');
assert.strictEqual(ignorePattern('#notes[1]*.txt', false), '/#notes\\[1]\\*.txt');

assert.strictEqual(appendIgnoreLines('', ['/a']), '/a\n');
assert.strictEqual(appendIgnoreLines('node_modules', ['/a']), 'node_modules\n/a\n');
assert.strictEqual(appendIgnoreLines('/a\n', ['/a', '/b/']), '/a\n/b/\n');
assert.strictEqual(appendIgnoreLines('/a\n', ['/a']), '/a\n');
