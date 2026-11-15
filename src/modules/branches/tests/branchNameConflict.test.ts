import * as assert from 'assert';
import { branchNameConflict } from '../branchNameConflict';

const existing = ['main', 'feature', 'release/1.0'];
assert.strictEqual(branchNameConflict('fix', existing), undefined);
assert.strictEqual(branchNameConflict('main', existing), 'A branch with this name already exists.');
assert.match(branchNameConflict('feature/test', existing)!, /"feature"/);
assert.match(branchNameConflict('release', existing)!, /"release\/1.0"/);
assert.strictEqual(branchNameConflict('features', existing), undefined);
