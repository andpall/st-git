import * as assert from 'assert';
import { dropTodo, rewordTodo, squashTodo } from '../todoRewrites';

const todo = 'pick aaa1 one\npick bbb2 two\npick ccc3 three\npick ddd4 four\n\n# comment';

function squashUnknownHash() {
  return squashTodo(todo, ['zzz'], 'm');
}

assert.strictEqual(squashTodo(todo, ['bbb2ff', 'aaa1ff'], 'C:\\tmp\\m'),
  'pick aaa1 one\nfixup bbb2 two\nexec git commit --amend -F "C:/tmp/m"\npick ccc3 three\npick ddd4 four\n\n# comment');
assert.strictEqual(squashTodo(todo, ['ddd4ff', 'bbb2ff'], '/tmp/m'),
  'pick aaa1 one\npick bbb2 two\nfixup ddd4 four\nexec git commit --amend -F "/tmp/m"\npick ccc3 three\n\n# comment');
assert.throws(squashUnknownHash);

assert.strictEqual(rewordTodo(todo, ['bbb2ff'], '/tmp/m'),
  'pick aaa1 one\npick bbb2 two\nexec git commit --amend -F "/tmp/m"\npick ccc3 three\npick ddd4 four\n\n# comment');
assert.strictEqual(dropTodo(todo, ['ccc3ff']),
  'pick aaa1 one\npick bbb2 two\ndrop ccc3 three\npick ddd4 four\n\n# comment');
