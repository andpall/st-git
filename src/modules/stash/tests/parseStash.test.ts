import * as assert from 'assert';
import { parseStashes } from '../parseStash';

const output = 'stash@{0}\x1fOn main: wip login\x1f1700000000\nstash@{1}\x1fWIP on fix: abc123 hotfix\x1f1690000000\n';
assert.deepStrictEqual(parseStashes(output), [
  { ref: 'stash@{0}', message: 'On main: wip login', date: 1700000000 },
  { ref: 'stash@{1}', message: 'WIP on fix: abc123 hotfix', date: 1690000000 },
]);
assert.deepStrictEqual(parseStashes(''), []);
