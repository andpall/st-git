const PICK_LINE = /^(?:pick|p) (\S+)/;

function pickedHash(line: string) {
  const match = PICK_LINE.exec(line);
  return match?.[1];
}

function isSelected(hashes: string[], shortHash: string) {
  for (const hash of hashes) {
    if (hash.startsWith(shortHash)) return true;
  }
  return false;
}

function withCommand(line: string, command: string) {
  return line.replace(/^\S+/, command);
}

function toFixup(line: string) {
  return withCommand(line, 'fixup');
}

function amendCommand(msgFile: string) {
  const unixPath = msgFile.replace(/\\/g, '/');
  return `exec git commit --amend -F "${unixPath}"`;
}

function selectedPicks(lines: string[], hashes: string[]) {
  const picks: string[] = [];
  for (const line of lines) {
    const hash = pickedHash(line);
    if (hash && isSelected(hashes, hash)) picks.push(line);
  }
  if (picks.length !== hashes.length) throw new Error(`st-git: found ${picks.length} of ${hashes.length} commits in rebase todo`);
  return picks;
}

export function squashTodo(todo: string, hashes: string[], msgFile: string): string {
  const lines = todo.split('\n');
  const picks = selectedPicks(lines, hashes);
  const [target, ...rest] = picks;
  const fixups = rest.map(toFixup);
  const squashGroup = [target, ...fixups, amendCommand(msgFile)];
  const output: string[] = [];
  for (const line of lines) {
    if (line === target) output.push(...squashGroup);
    else if (!picks.includes(line)) output.push(line);
  }
  return output.join('\n');
}

export function rewordTodo(todo: string, hashes: string[], msgFile: string): string {
  const lines = todo.split('\n');
  const [target] = selectedPicks(lines, hashes);
  const output: string[] = [];
  for (const line of lines) {
    output.push(line);
    if (line === target) output.push(amendCommand(msgFile));
  }
  return output.join('\n');
}

export function dropTodo(todo: string, hashes: string[]): string {
  const lines = todo.split('\n');
  const [target] = selectedPicks(lines, hashes);
  const output: string[] = [];
  for (const line of lines) output.push(line === target ? withCommand(line, 'drop') : line);
  return output.join('\n');
}
