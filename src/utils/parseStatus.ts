import type { Change } from './nameStatus';

const CODES_WITH_SOURCE_PATH = ['R', 'C'];
const BOTH_SIDES_CONFLICTS = ['AA', 'DD'];

function statusOf(index: string, worktree: string) {
  if (index === '?') return '?';
  if (index === 'U' || worktree === 'U' || BOTH_SIDES_CONFLICTS.includes(index + worktree)) return 'U';
  if (index === 'A') return 'A';
  if (index === 'D' || worktree === 'D') return 'D';
  return worktree === ' ' ? index : worktree;
}

export function parseStatus(output: string): Change[] {
  const entries = output.split('\0');
  const changes: Change[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    const index = entry[0];
    const path = entry.slice(3);
    if (CODES_WITH_SOURCE_PATH.includes(index)) {
      changes.push({ status: index, path, oldPath: entries[i + 1] });
      i++;
      continue;
    }
    changes.push({ status: statusOf(index, entry[1]), path });
  }
  return changes;
}
