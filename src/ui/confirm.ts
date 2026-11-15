import * as vscode from 'vscode';
import { repoGit } from '../api/git';

const PUSHED_WARNING = 'These commits are already pushed: you will need to force-push afterwards.';

export async function confirmRewrite(text: string, rewritten: string) {
  const remoteBranches = await repoGit(['branch', '-r', '--contains', rewritten]);
  const detail = remoteBranches.trim() ? PUSHED_WARNING : undefined;
  const choice = await vscode.window.showWarningMessage(text, { modal: true, detail }, 'Continue');
  return choice === 'Continue';
}
