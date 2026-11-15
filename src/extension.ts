import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('st-git.helloWorld', () => {
      vscode.window.showInformationMessage('Hello by st-git!');
    })
  );
}

export function deactivate() {}
