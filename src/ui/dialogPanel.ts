import * as vscode from 'vscode';

let assetsRoot: vscode.Uri;

export function setDialogAssets(extensionUri: vscode.Uri) {
  assetsRoot = vscode.Uri.joinPath(extensionUri, 'webview');
}

export function dialogAsset(webview: vscode.Webview, file: string) {
  const fileUri = vscode.Uri.joinPath(assetsRoot, file);
  return webview.asWebviewUri(fileUri);
}

export function createDialogPanel(viewType: string, title: string) {
  return vscode.window.createWebviewPanel(viewType, title, vscode.ViewColumn.Active, {
    enableScripts: true,
    localResourceRoots: [assetsRoot],
  });
}

export function dialogHtml(webview: vscode.Webview, body: string, styles: string[], script: string) {
  const source = webview.cspSource;
  const links: string[] = [];
  for (const style of styles) links.push(`<link rel="stylesheet" href="${dialogAsset(webview, style)}">`);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${source}; script-src ${source};">
${links.join('\n')}</head>
<body>${body}<script src="${dialogAsset(webview, script)}"></script></body></html>`;
}
