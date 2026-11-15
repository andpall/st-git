import * as vscode from 'vscode';
import { repoGit } from '../api/git';
import { confirmIfPushed, confirmRewrite } from '../ui/confirm';
import type { CommitContext } from '../modules/log/provider';

type ResetMode = vscode.QuickPickItem & { flag: string };

const MODES: ResetMode[] = [
  { label: 'Soft', description: 'keep all changes, staged', flag: '--soft' },
  { label: 'Mixed', description: 'keep all changes, unstaged', flag: '--mixed' },
  { label: 'Hard', description: 'discard all changes, including uncommitted ones', flag: '--hard' },
  { label: 'Keep', description: 'keep local changes, stop if they conflict', flag: '--keep' },
];

export async function resetToHere({ hash }: CommitContext) {
  const branchOutput = await repoGit(['rev-parse', '--abbrev-ref', 'HEAD']);
  const target = `"${branchOutput.trim()}" to ${hash.slice(0, 8)}`;
  const mode = await vscode.window.showQuickPick(MODES, { title: `Reset ${target}`, placeHolder: 'What should happen to your changes?' });
  if (!mode) return;
  const question = `Reset ${target} (${mode.label})?`;
  const confirmed = mode.flag === '--hard'
    ? await confirmRewrite(`${question} All uncommitted changes will be lost.`, 'HEAD')
    : await confirmIfPushed(question, 'HEAD');
  if (confirmed) await repoGit(['reset', mode.flag, hash]);
}
