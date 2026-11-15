import * as fs from 'fs';

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

function toFixup(line: string) {
  return line.replace(/^\S+/, 'fixup');
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
  return picks;
}

export function rewriteTodo(todo: string, hashes: string[], msgFile: string): string {
  const lines = todo.split('\n');
  const picks = selectedPicks(lines, hashes);
  if (picks.length !== hashes.length) throw new Error(`st-git: found ${picks.length} of ${hashes.length} commits in rebase todo`);
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

if (require.main === module) {
  const todoFile = process.argv[2];
  const todo = fs.readFileSync(todoFile, 'utf8');
  const hashes = process.env.ST_GIT_SQUASH!.split(',');
  fs.writeFileSync(todoFile, rewriteTodo(todo, hashes, process.env.ST_GIT_MSG!));
}
