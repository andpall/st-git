import * as fs from 'fs';
import * as vscode from 'vscode';
import { currentOperation, repoGit } from '../../api/git';
import { currentBranch } from '../../commands/branchInfo';
import { ensureNoMergesSince, ensureOnCurrentBranch, rebaseStart, rewriteWithRebase, writeMessageFile } from '../../commands/historyRewrite';
import { confirmIfPushed } from '../../ui/confirm';
import type { CommitContext } from '../log/provider';
import { buildTodo, parseRebaseCommits, REBASE_COMMIT_FORMAT, type PlanEntry, type RebaseCommit } from './rebasePlan';
import { showRebaseDialog } from './rebaseDialog';

async function readCommits(start: string[]) {
  const range = start[0] === '--root' ? 'HEAD' : `${start[0]}..HEAD`;
  const output = await repoGit(['log', '--reverse', REBASE_COMMIT_FORMAT, range]);
  return parseRebaseCommits(output);
}

function isUnchanged(plan: PlanEntry[], oldestFirst: RebaseCommit[]) {
  for (let i = 0; i < plan.length; i++) {
    if (plan[i].hash !== oldestFirst[i].hash || plan[i].action !== 'pick') return false;
  }
  return true;
}

async function removeWhenDone(files: string[]) {
  if (await currentOperation()) return;
  for (const file of files) fs.rmSync(file, { force: true });
}

async function runPlan(start: string[], plan: PlanEntry[]) {
  const messageFiles: string[] = [];
  const todo = buildTodo(plan, function messageFileOf(entry) {
    const file = writeMessageFile(entry.message ?? '');
    messageFiles.push(file);
    return file;
  });
  try {
    await rewriteWithRebase(start, 'plan', [], writeMessageFile(todo));
  } finally {
    await removeWhenDone(messageFiles);
  }
}

export async function interactiveRebase({ hash }: CommitContext) {
  await ensureOnCurrentBranch(hash, 'Interactive rebase');
  const start = await rebaseStart(hash);
  await ensureNoMergesSince(start);
  const oldestFirst = await readCommits(start);
  const branch = await currentBranch();
  const newestFirst = [...oldestFirst].reverse();
  const plan = await showRebaseDialog({ title: `Rebase "${branch}" from ${hash.slice(0, 8)}`, newestFirst });
  if (!plan || isUnchanged(plan, oldestFirst)) return;
  if (!(await confirmIfPushed(`Rewrite ${plan.length} commit(s) of "${branch}"?`, hash))) return;
  await runPlan(start, plan);
  if (await currentOperation()) vscode.window.showInformationMessage('Rebase stopped for editing. Amend the commit or change files, then press Continue in the Log.');
}
