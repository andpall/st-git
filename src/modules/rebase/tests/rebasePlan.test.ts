import * as assert from 'assert';
import { applyPlan, buildTodo, parseRebaseCommits, planProblem, type PlanEntry } from '../rebasePlan';

const output = 'aaa\x1fAnn\x1f100\x1ffirst\n\nbody\n\x1e\nbbb\x1fBob\x1f200\x1fsecond\n\x1e\n';
assert.deepStrictEqual(parseRebaseCommits(output), [
  { hash: 'aaa', author: 'Ann', date: 100, message: 'first\n\nbody' },
  { hash: 'bbb', author: 'Bob', date: 200, message: 'second' },
]);

function messageFile(entry: PlanEntry) {
  return `C:\\tmp\\${entry.hash}.txt`;
}

const plan: PlanEntry[] = [
  { hash: 'aaa', action: 'reword', message: 'new first' },
  { hash: 'ccc', action: 'pick' },
  { hash: 'bbb', action: 'fixup' },
  { hash: 'ddd', action: 'drop' },
];
const todo = buildTodo(plan, messageFile);
assert.strictEqual(todo, 'pick aaa\nexec git commit --amend --allow-empty -F "C:/tmp/aaa.txt"\npick ccc\nfixup bbb\ndrop ddd\n');

assert.strictEqual(planProblem(plan), undefined);
assert.match(planProblem([{ hash: 'aaa', action: 'drop' }, { hash: 'bbb', action: 'squash' }]) ?? '', /oldest kept commit/);
assert.match(planProblem([{ hash: 'aaa', action: 'reword', message: ' ' }]) ?? '', /needs a message/);

const gitTodo = 'pick aaa first\npick bbb second\npick ccc third\npick ddd fourth\n\n# Rebase ...\n';
assert.strictEqual(applyPlan(gitTodo, todo), todo);
function applyToChangedBranch() {
  return applyPlan('pick aaa first\n', todo);
}
assert.throws(applyToChangedBranch, /branch changed/);
