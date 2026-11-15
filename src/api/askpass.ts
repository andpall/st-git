import * as vscode from 'vscode';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

const SECRET_PROMPT = /password|passphrase|token/i;
const GITHUB_PASSWORD = /password for 'https:\/\/[^']*github\.com/i;
const GITHUB_HINT = 'GitHub needs a personal access token here, not your account password';
const ASKPASS_MAIN = path.join(__dirname, '..', 'askpassMain.js');

let askpassEnv: Record<string, string> = {};

export function askpassEnvironment() {
  return askpassEnv;
}

function scriptText() {
  return `#!/bin/sh\nELECTRON_RUN_AS_NODE=1 exec "${process.execPath}" "${ASKPASS_MAIN}" "$@"\n`;
}

async function askUser(prompt: string) {
  const placeHolder = GITHUB_PASSWORD.test(prompt) ? GITHUB_HINT : undefined;
  return vscode.window.showInputBox({ title: 'Git authentication', prompt, placeHolder, password: SECRET_PROMPT.test(prompt), ignoreFocusOut: true });
}

function handleConnection(socket: net.Socket) {
  let prompt = '';
  socket.setEncoding('utf8');
  socket.on('data', async function receive(chunk: string) {
    prompt += chunk;
    if (!prompt.includes('\n')) return;
    const answer = await askUser(prompt.trim());
    socket.end(JSON.stringify({ answer }));
  });
}

function listen(server: net.Server, pipe: string) {
  return new Promise<void>(function start(resolve, reject) {
    server.once('error', reject);
    server.listen(pipe, resolve);
  });
}

export async function startAskpass(storageDir: string) {
  if (process.platform === 'win32') return new vscode.Disposable(function nothingToStop() {});
  fs.mkdirSync(storageDir, { recursive: true });
  const script = path.join(storageDir, 'askpass.sh');
  fs.writeFileSync(script, scriptText(), { mode: 0o700 });
  fs.chmodSync(script, 0o700);
  const token = crypto.randomBytes(6);
  const pipe = path.join(os.tmpdir(), `st-git-${process.pid}-${token.toString('hex')}.sock`);
  const server = net.createServer(handleConnection);
  await listen(server, pipe);
  askpassEnv = { GIT_ASKPASS: script, SSH_ASKPASS: script, SSH_ASKPASS_REQUIRE: 'force', DISPLAY: process.env.DISPLAY ?? ':0', ST_GIT_ASKPASS_PIPE: pipe };
  return new vscode.Disposable(function stop() {
    server.close();
    fs.rmSync(pipe, { force: true });
  });
}
