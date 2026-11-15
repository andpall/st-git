import * as vscode from 'vscode';
import { isRebasing } from '../api/git';

export async function updateRebaseState() {
  const rebasing = await isRebasing();
  await vscode.commands.executeCommand('setContext', 'st-git.rebasing', rebasing);
  return rebasing;
}
