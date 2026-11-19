import * as fs from 'fs';
import { dropTodo, rewordTodo, squashTodo } from './todoRewrites';
import { applyPlan } from '../modules/rebase/rebasePlan';

function planTodo(todo: string, _hashes: string[], planFile: string) {
  return applyPlan(todo, fs.readFileSync(planFile, 'utf8'));
}

const REWRITES: Record<string, (todo: string, hashes: string[], msgFile: string) => string> = {
  squash: squashTodo,
  reword: rewordTodo,
  drop: dropTodo,
  plan: planTodo,
};

if (require.main === module) {
  const todoFile = process.argv[2];
  const todo = fs.readFileSync(todoFile, 'utf8');
  const rewrite = REWRITES[process.env.ST_GIT_ACTION!];
  const hashes = process.env.ST_GIT_HASHES!.split(',');
  fs.writeFileSync(todoFile, rewrite(todo, hashes, process.env.ST_GIT_MSG ?? ''));
}
