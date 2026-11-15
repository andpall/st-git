export interface Stash { ref: string; message: string; date: number }

export const STASH_FORMAT = '--format=%gd%x1f%gs%x1f%ct';

function parseStashLine(line: string): Stash {
  const [ref, message, date] = line.split('\x1f');
  return { ref, message, date: Number(date) };
}

export function parseStashes(output: string): Stash[] {
  const lines = output.split('\n');
  const nonEmpty = lines.filter(Boolean);
  return nonEmpty.map(parseStashLine);
}
