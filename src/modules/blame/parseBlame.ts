export interface BlameLine { hash: string; author: string; time: number; summary: string }

const HEADER = /^([0-9a-f]{40}) \d+ (\d+)/;

function applyField(commit: BlameLine, line: string) {
  const space = line.indexOf(' ');
  const key = line.slice(0, space);
  const value = line.slice(space + 1);
  if (key === 'author') commit.author = value;
  if (key === 'author-time') commit.time = Number(value);
  if (key === 'summary') commit.summary = value;
}

export function parseBlame(output: string): BlameLine[] {
  const lines = output.split('\n');
  const commits = new Map<string, BlameLine>();
  const result: BlameLine[] = [];
  let current: BlameLine | undefined;
  let finalLine = 0;
  for (const line of lines) {
    if (line.startsWith('\t')) {
      if (current) result[finalLine - 1] = current;
      continue;
    }
    const header = HEADER.exec(line);
    if (header) {
      finalLine = Number(header[2]);
      current = commits.get(header[1]) ?? { hash: header[1], author: '', time: 0, summary: '' };
      commits.set(header[1], current);
      continue;
    }
    if (current) applyField(current, line);
  }
  return result;
}
