import * as fs from 'fs';
import { dropTodo, rewordTodo, squashTodo } from './todoRewrites';

const REWRITES: Record<string, (todo: string, hashes: string[], msgFile: string) => string> = {
  squash: squashTodo,
  reword: rewordTodo,
  drop: dropTodo,
};

if (require.main === module) {
  const todoFile = process.argv[2];
  const todo = fs.readFileSync(todoFile, 'utf8');
  const rewrite = REWRITES[process.env.ST_GIT_ACTION!];
  const hashes = process.env.ST_GIT_HASHES!.split(',');
  fs.writeFileSync(todoFile, rewrite(todo, hashes, process.env.ST_GIT_MSG ?? ''));
}
