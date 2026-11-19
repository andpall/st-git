import * as vscode from 'vscode';
import { createDialogPanel, dialogHtml } from './dialogPanel';

interface DialogOptions { title: string; action: string; text: string }
type DialogMessage = { type: 'ready' } | { type: 'submit'; text: string } | { type: 'cancel' };

const BODY = `<form class="dialog" id="dialog">
<h2 id="title"></h2>
<label for="message">Commit message</label>
<textarea id="message" rows="12" spellcheck="false"></textarea>
<div class="footer"><span class="hint">⌘/Ctrl+Enter to confirm, Esc to cancel</span>
<button type="button" id="cancel" class="secondary">Cancel</button><button type="submit" id="submit"></button></div>
</form>`;

function waitForAnswer(panel: vscode.WebviewPanel, options: DialogOptions): Promise<string | undefined> {
  return new Promise(function listen(resolve) {
    panel.webview.onDidReceiveMessage(function handleMessage(message: DialogMessage) {
      if (message.type === 'ready') panel.webview.postMessage(options);
      if (message.type === 'submit') resolve(message.text);
      if (message.type === 'cancel') resolve(undefined);
    });
    panel.onDidDispose(function handleDispose() {
      resolve(undefined);
    });
  });
}

export async function askCommitMessage(options: DialogOptions) {
  const panel = createDialogPanel('st-git.messageDialog', options.title);
  panel.webview.html = dialogHtml(panel.webview, BODY, ['dialog.css'], 'dialog.js');
  const answer = await waitForAnswer(panel, options);
  panel.dispose();
  return answer;
}
