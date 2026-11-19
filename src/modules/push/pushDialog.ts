import * as vscode from 'vscode';
import { createDialogPanel, dialogHtml } from '../../ui/dialogPanel';
import type { PushPlan } from './pushPlan';

export type TagMode = 'none' | 'follow' | 'all';
export interface PushChoice { action: 'push' | 'pull'; remote: string; branch: string; tags: TagMode; force: boolean }
export interface PushDialogOptions { title: string; source: string; remotes: string[]; remote: string; branch: string }
type PlanFor = (remote: string, branch: string) => Promise<PushPlan>;
type DialogMessage =
  | { type: 'ready' }
  | { type: 'target'; remote: string; branch: string }
  | { type: 'push'; remote: string; branch: string; tags: TagMode; force: boolean }
  | { type: 'pull' }
  | { type: 'cancel' };

const BODY = `<form class="dialog push" id="dialog">
<h2 id="title"></h2>
<div class="target"><span id="source"></span><span>→</span>
<select id="remote" aria-label="Remote"></select><span>:</span>
<input id="branch" aria-label="Target branch" spellcheck="false"></div>
<div id="commits" class="commits" tabindex="0"></div>
<div id="note" class="note" hidden></div>
<label class="tags">Push tags <select id="tags">
<option value="none">No tags</option><option value="follow">Tags of pushed commits</option><option value="all">All tags</option>
</select></label>
<div class="footer"><span class="hint">⌘/Ctrl+Enter to push, Esc to cancel</span>
<button type="button" id="cancel" class="secondary">Cancel</button>
<button type="button" id="pull" class="secondary" hidden>Pull First</button>
<button type="button" id="force" class="secondary">Force Push</button>
<button type="submit" id="push">Push</button></div>
</form>`;

function postPlan(panel: vscode.WebviewPanel, plan: PushPlan, remote: string, branch: string) {
  panel.webview.postMessage({ type: 'plan', remote, branch, ...plan });
}

async function sendPlan(panel: vscode.WebviewPanel, planFor: PlanFor, remote: string, branch: string) {
  try {
    postPlan(panel, await planFor(remote, branch), remote, branch);
  } catch (error) {
    panel.webview.postMessage({ type: 'error', text: (error as Error).message });
  }
}

function waitForChoice(panel: vscode.WebviewPanel, options: PushDialogOptions, planFor: PlanFor): Promise<PushChoice | undefined> {
  return new Promise(function listen(resolve) {
    panel.webview.onDidReceiveMessage(async function handleMessage(message: DialogMessage) {
      if (message.type === 'ready') {
        panel.webview.postMessage({ type: 'init', ...options });
        await sendPlan(panel, planFor, options.remote, options.branch);
      }
      if (message.type === 'target') await sendPlan(panel, planFor, message.remote, message.branch);
      if (message.type === 'push') resolve({ action: 'push', remote: message.remote, branch: message.branch, tags: message.tags, force: message.force });
      if (message.type === 'pull') resolve({ action: 'pull', remote: options.remote, branch: options.branch, tags: 'none', force: false });
      if (message.type === 'cancel') resolve(undefined);
    });
    panel.onDidDispose(function handleDispose() {
      resolve(undefined);
    });
  });
}

export async function showPushDialog(options: PushDialogOptions, planFor: PlanFor) {
  const panel = createDialogPanel('st-git.pushDialog', options.title);
  panel.webview.html = dialogHtml(panel.webview, BODY, ['dialog.css', 'push.css'], 'push.js');
  const choice = await waitForChoice(panel, options, planFor);
  panel.dispose();
  return choice;
}
