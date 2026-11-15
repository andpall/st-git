import * as vscode from 'vscode';
import { repoGit } from '../api/git';

const PUSHED_WARNING = 'These commits are already pushed: you will need to force-push afterwards.';

async function isPushed(commit: string) {
  const remoteBranches = await repoGit(['branch', '-r', '--contains', commit]);
  return Boolean(remoteBranches.trim());
}

export async function confirmRewrite(text: string, rewritten: string) {
  const pushed = await isPushed(rewritten);
  const detail = pushed ? PUSHED_WARNING : undefined;
  const choice = await vscode.window.showWarningMessage(text, { modal: true, detail }, 'Continue');
  return choice === 'Continue';
}

export async function confirmIfPushed(text: string, rewritten: string) {
  const pushed = await isPushed(rewritten);
  if (!pushed) return true;
  const choice = await vscode.window.showWarningMessage(text, { modal: true, detail: PUSHED_WARNING }, 'Continue');
  return choice === 'Continue';
}
