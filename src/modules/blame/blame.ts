import * as vscode from 'vscode';
import * as path from 'path';
import { git, repoRoot } from '../../api/git';
import { parseBlame, type BlameLine } from './parseBlame';

const LABEL_LENGTH = 26;
const UNCOMMITTED = /^0+$/;
const BLANK = ' ';

const decoration = vscode.window.createTextEditorDecorationType({
  before: { color: new vscode.ThemeColor('editorLineNumber.foreground'), width: `${LABEL_LENGTH}ch`, margin: '0 1.5em 0 0' },
});
const annotated = new Set<string>();

function formatDay(time: number) {
  const date = new Date(time * 1000);
  const iso = date.toISOString();
  return iso.slice(0, 10);
}

function label(line: BlameLine) {
  if (UNCOMMITTED.test(line.hash)) return 'Not committed yet';
  const text = `${formatDay(line.time)} ${line.author}`;
  return text.slice(0, LABEL_LENGTH);
}

function hover(line: BlameLine) {
  const markdown = new vscode.MarkdownString();
  if (UNCOMMITTED.test(line.hash)) return markdown.appendText('Not committed yet');
  const args = encodeURIComponent(JSON.stringify([line.hash]));
  markdown.appendText(line.summary);
  markdown.appendMarkdown('\n\n');
  markdown.appendText(`${line.hash.slice(0, 10)} · ${line.author} · ${formatDay(line.time)}`);
  markdown.appendMarkdown(`\n\n[Show in Log](command:st-git.revealCommit?${args})`);
  markdown.isTrusted = { enabledCommands: ['st-git.revealCommit'] };
  return markdown;
}

function decorationsFor(lines: BlameLine[]) {
  const options: vscode.DecorationOptions[] = [];
  let previousHash = '';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const contentText = line.hash === previousHash ? BLANK : label(line);
    previousHash = line.hash;
    options.push({ range: new vscode.Range(i, 0, i, 0), renderOptions: { before: { contentText } }, hoverMessage: hover(line) });
  }
  return options;
}

async function annotate(editor: vscode.TextEditor) {
  const root = await repoRoot();
  const relative = path.relative(root, editor.document.uri.fsPath);
  const output = await git(root, ['blame', '--porcelain', '--', relative]);
  editor.setDecorations(decoration, decorationsFor(parseBlame(output)));
}

function isAnnotated(editor: vscode.TextEditor) {
  return annotated.has(editor.document.uri.toString());
}

export async function toggleBlame() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.uri.scheme !== 'file') throw new Error('Open a file from the repository to annotate it.');
  const key = editor.document.uri.toString();
  if (annotated.delete(key)) {
    editor.setDecorations(decoration, []);
    return;
  }
  annotated.add(key);
  try {
    await annotate(editor);
  } catch (error) {
    annotated.delete(key);
    throw error;
  }
}

async function refreshVisible() {
  const editors = vscode.window.visibleTextEditors;
  const targets = editors.filter(isAnnotated);
  for (const editor of targets) await annotate(editor);
}

function hideWhileEditing(event: vscode.TextDocumentChangeEvent) {
  if (!annotated.has(event.document.uri.toString()) || !event.contentChanges.length) return;
  for (const editor of vscode.window.visibleTextEditors) {
    if (editor.document === event.document) editor.setDecorations(decoration, []);
  }
}

export function registerBlame() {
  return vscode.Disposable.from(
    decoration,
    vscode.window.onDidChangeVisibleTextEditors(refreshVisible),
    vscode.workspace.onDidSaveTextDocument(refreshVisible),
    vscode.workspace.onDidChangeTextDocument(hideWhileEditing),
  );
}
