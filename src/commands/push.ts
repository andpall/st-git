import * as vscode from 'vscode';
import { repoGit } from '../api/git';
import { countCommits, currentBranch, upstreamOf } from './branchInfo';
import { pull } from './pull';

const MAX_LISTED_COMMITS = 15;
const PUSH = 'Push';
const FORCE_PUSH = 'Force Push';
const PULL_FIRST = 'Pull First';

async function outgoingCommits(range: string[]) {
  const output = await repoGit(['log', '--format=• %h %s', ...range]);
  const lines = output.split('\n');
  return lines.filter(Boolean);
}

function listCommits(commits: string[]) {
  const listed = commits.slice(0, MAX_LISTED_COMMITS);
  const more = commits.length - listed.length;
  return more > 0 ? [...listed, `…and ${more} more`].join('\n') : listed.join('\n');
}

async function pickRemote() {
  const output = await repoGit(['remote']);
  const lines = output.split('\n');
  const remotes = lines.filter(Boolean);
  if (!remotes.length) throw new Error('No remotes configured. Add one with "git remote add origin <url>".');
  if (remotes.length === 1) return remotes[0];
  return vscode.window.showQuickPick(remotes, { title: 'Push to remote' });
}

async function pushNewBranch(branch: string) {
  const remote = await pickRemote();
  if (!remote) return;
  const commits = await outgoingCommits(['HEAD', '--not', '--remotes']);
  const detail = commits.length ? listCommits(commits) : 'No new commits: the branch points to an existing commit.';
  const choice = await vscode.window.showInformationMessage(`Push new branch "${branch}" to ${remote}?`, { modal: true, detail }, PUSH);
  if (choice === PUSH) await repoGit(['push', '--set-upstream', remote, branch]);
}

export async function push() {
  const branch = await currentBranch();
  const upstream = await upstreamOf();
  if (!upstream) {
    await pushNewBranch(branch);
    return;
  }
  const ahead = await countCommits(`${upstream}..HEAD`);
  const behind = await countCommits(`HEAD..${upstream}`);
  if (!ahead) {
    await vscode.window.showInformationMessage(`Nothing to push: "${branch}" has no new commits for ${upstream}.`);
    return;
  }
  const remote = upstream.slice(0, upstream.indexOf('/'));
  const remoteBranch = upstream.slice(upstream.indexOf('/') + 1);
  const refspec = `HEAD:${remoteBranch}`;
  const commits = listCommits(await outgoingCommits([`${upstream}..HEAD`]));
  const divergedNote = `\n\n${upstream} has ${behind} commit(s) that are not in "${branch}" (the history was rewritten or someone else pushed). A normal push will be rejected. Force Push uses --force-with-lease and stops if someone else pushed since your last fetch.`;
  const detail = behind ? commits + divergedNote : commits;
  const buttons = behind ? [FORCE_PUSH, PULL_FIRST] : [PUSH];
  const choice = await vscode.window.showInformationMessage(`Push ${ahead} commit(s) to ${upstream}?`, { modal: true, detail }, ...buttons);
  if (choice === PUSH) await repoGit(['push', remote, refspec]);
  if (choice === FORCE_PUSH) await repoGit(['push', '--force-with-lease', remote, refspec]);
  if (choice === PULL_FIRST) await pull();
}
