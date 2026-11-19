import { repoGit } from '../../api/git';
import { currentBranch, upstreamOf } from '../../commands/branchInfo';
import { ensureOnCurrentBranch } from '../../commands/historyRewrite';
import { pull } from '../../commands/pull';
import type { CommitContext } from '../log/provider';
import { listRemotes, planPush } from './pushPlan';
import { showPushDialog, type PushChoice } from './pushDialog';

const TAG_FLAGS = { none: [], follow: ['--follow-tags'], all: ['--tags'] };

function splitUpstream(upstream: string) {
  const slash = upstream.indexOf('/');
  return { remote: upstream.slice(0, slash), branch: upstream.slice(slash + 1) };
}

function pushArgs(choice: PushChoice, source: string, setUpstream: boolean) {
  const args = ['push', ...TAG_FLAGS[choice.tags]];
  if (choice.force) args.push('--force-with-lease');
  if (setUpstream) args.push('--set-upstream');
  args.push(choice.remote, `${source}:refs/heads/${choice.branch}`);
  return args;
}

async function openPush(source: string, sourceLabel: string) {
  const branch = await currentBranch();
  const upstream = await upstreamOf();
  const remotes = await listRemotes();
  if (!remotes.length) throw new Error('No remotes configured. Add one with "git remote add origin <url>".');
  const target = upstream ? splitUpstream(upstream) : { remote: remotes[0], branch };
  const title = `Push ${sourceLabel}`;
  const choice = await showPushDialog({ title, source: sourceLabel, remotes, ...target }, function planFor(remote, targetBranch) {
    return planPush(source, remote, targetBranch);
  });
  if (!choice) return;
  if (choice.action === 'pull') {
    await pull();
    return;
  }
  const setUpstream = source === 'HEAD' && !upstream;
  await repoGit(pushArgs(choice, source, setUpstream));
}

export async function push() {
  const branch = await currentBranch();
  await openPush('HEAD', `"${branch}"`);
}

export async function pushUpToHere({ hash }: CommitContext) {
  await ensureOnCurrentBranch(hash, 'Push up to here');
  await openPush(hash, `up to ${hash.slice(0, 8)}`);
}
