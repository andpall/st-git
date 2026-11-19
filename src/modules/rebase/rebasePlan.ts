export type RebaseAction = 'pick' | 'reword' | 'edit' | 'squash' | 'fixup' | 'drop';
export interface RebaseCommit { hash: string; author: string; date: number; message: string }
export interface PlanEntry { hash: string; action: RebaseAction; message?: string }

export const REBASE_COMMIT_FORMAT = '--format=%H%x1f%an%x1f%at%x1f%B%x1e';
const MELD_ACTIONS: RebaseAction[] = ['squash', 'fixup'];

function parseCommitRecord(record: string): RebaseCommit {
  const [hash, author, at, message] = record.split('\x1f');
  return { hash: hash.trim(), author, date: Number(at), message: message.trim() };
}

function hasHash(record: string) {
  return Boolean(record.trim());
}

export function parseRebaseCommits(output: string) {
  const records = output.split('\x1e');
  const filled = records.filter(hasHash);
  return filled.map(parseCommitRecord);
}

function isKept(entry: PlanEntry) {
  return entry.action !== 'drop';
}

export function planProblem(oldestFirst: PlanEntry[]) {
  const kept = oldestFirst.filter(isKept);
  if (kept.length && MELD_ACTIONS.includes(kept[0].action)) return 'The oldest kept commit cannot be squashed or fixed up: there is no earlier commit to meld it into.';
  for (const entry of oldestFirst) {
    if (entry.action === 'reword' && !entry.message?.trim()) return 'A reworded commit needs a message.';
  }
  return undefined;
}

export function buildTodo(oldestFirst: PlanEntry[], messageFileOf: (entry: PlanEntry) => string) {
  const lines: string[] = [];
  for (const entry of oldestFirst) {
    if (entry.action === 'reword') {
      const unixPath = messageFileOf(entry).replace(/\\/g, '/');
      lines.push(`pick ${entry.hash}`, `exec git commit --amend --allow-empty -F "${unixPath}"`);
      continue;
    }
    lines.push(`${entry.action} ${entry.hash}`);
  }
  return lines.join('\n') + '\n';
}

const TODO_COMMIT = /^(?:pick|p) (\S+)/;

function todoHash(line: string) {
  return TODO_COMMIT.exec(line)?.[1];
}

function startsAny(hashes: string[]) {
  return function isPlanned(shortHash: string) {
    for (const hash of hashes) {
      if (hash.startsWith(shortHash)) return true;
    }
    return false;
  };
}

export function applyPlan(todo: string, plan: string) {
  const todoLines = todo.split('\n');
  const todoHashes = todoLines.map(todoHash);
  const picked = todoHashes.filter(Boolean) as string[];
  const planLines = plan.split('\n');
  const planHashes = planLines.map(planHash);
  const planned = planHashes.filter(Boolean) as string[];
  const allPlanned = picked.every(startsAny(planned));
  if (!allPlanned || picked.length !== planned.length) throw new Error(`st-git: the branch changed since the rebase dialog was opened (${picked.length} commits in git, ${planned.length} planned)`);
  return plan;
}

const PLAN_COMMIT = /^(?:pick|reword|edit|squash|fixup|drop) (\S+)/;

function planHash(line: string) {
  return PLAN_COMMIT.exec(line)?.[1];
}
