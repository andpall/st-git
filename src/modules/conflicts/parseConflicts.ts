export interface Conflict { code: string; path: string }

const UNMERGED_CODES = ['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU'];
const CODES_WITH_SOURCE_PATH = ['R', 'C'];

export function parseConflicts(output: string): Conflict[] {
  const entries = output.split('\0');
  const conflicts: Conflict[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    const code = entry.slice(0, 2);
    if (CODES_WITH_SOURCE_PATH.includes(code[0])) i++;
    if (UNMERGED_CODES.includes(code)) conflicts.push({ code, path: entry.slice(3) });
  }
  return conflicts;
}
