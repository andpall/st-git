export interface Change { status: string; path: string; oldPath?: string }

const TWO_PATH_STATUSES = ['R', 'C'];

export function parseNameStatus(output: string): Change[] {
  const tokens = output.split('\0');
  const changes: Change[] = [];
  let i = 0;
  while (i < tokens.length) {
    const code = tokens[i];
    if (!code) {
      i++;
      continue;
    }
    const status = code[0];
    if (TWO_PATH_STATUSES.includes(status)) {
      changes.push({ status, oldPath: tokens[i + 1], path: tokens[i + 2] });
      i += 3;
    } else {
      changes.push({ status, path: tokens[i + 1] });
      i += 2;
    }
  }
  return changes;
}
