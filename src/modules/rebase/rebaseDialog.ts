import * as vscode from 'vscode';
import { createDialogPanel, dialogHtml } from '../../ui/dialogPanel';
import { planProblem, type PlanEntry, type RebaseCommit } from './rebasePlan';

interface RebaseDialogOptions { title: string; newestFirst: RebaseCommit[] }
type DialogMessage = { type: 'ready' } | { type: 'start'; newestFirst: PlanEntry[] } | { type: 'cancel' };

const BODY = `<form class="dialog rebase" id="dialog">
<h2 id="title"></h2>
<div class="toolbar"><button type="button" id="up" class="secondary" title="Move Up (Alt+↑)">↑</button>
<button type="button" id="down" class="secondary" title="Move Down (Alt+↓)">↓</button>
<span class="hint">Newest commit on top. Squash and fixup meld a commit into the one below it.</span></div>
<div id="commits" class="commits" tabindex="0" role="listbox" aria-label="Commits to rebase"></div>
<label for="message" id="messageLabel">Commit message</label>
<textarea id="message" rows="5" spellcheck="false" readonly></textarea>
<div id="problem" class="problem" hidden></div>
<div class="footer"><span class="hint">⌘/Ctrl+Enter to start, Esc to cancel</span>
<button type="button" id="cancel" class="secondary">Cancel</button><button type="submit" id="start">Start Rebasing</button></div>
</form>`;

function waitForPlan(panel: vscode.WebviewPanel, options: RebaseDialogOptions): Promise<PlanEntry[] | undefined> {
  return new Promise(function listen(resolve) {
    panel.webview.onDidReceiveMessage(function handleMessage(message: DialogMessage) {
      if (message.type === 'ready') panel.webview.postMessage({ type: 'init', ...options });
      if (message.type === 'cancel') resolve(undefined);
      if (message.type !== 'start') return;
      const oldestFirst = [...message.newestFirst].reverse();
      const problem = planProblem(oldestFirst);
      if (problem) panel.webview.postMessage({ type: 'problem', text: problem });
      else resolve(oldestFirst);
    });
    panel.onDidDispose(function handleDispose() {
      resolve(undefined);
    });
  });
}

export async function showRebaseDialog(options: RebaseDialogOptions) {
  const panel = createDialogPanel('st-git.rebaseDialog', options.title);
  panel.webview.html = dialogHtml(panel.webview, BODY, ['dialog.css', 'rebase.css'], 'rebase.js');
  const plan = await waitForPlan(panel, options);
  panel.dispose();
  return plan;
}
