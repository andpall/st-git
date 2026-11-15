import * as net from 'net';

function main() {
  const socket = net.connect(process.env.ST_GIT_ASKPASS_PIPE!);
  let response = '';
  socket.setEncoding('utf8');
  socket.on('connect', function sendPrompt() {
    socket.write(`${process.argv[2] ?? ''}\n`);
  });
  socket.on('data', function collect(chunk: string) {
    response += chunk;
  });
  socket.on('end', function answer() {
    const parsed = JSON.parse(response) as { answer?: string };
    if (parsed.answer === undefined) process.exit(1);
    process.stdout.write(`${parsed.answer}\n`);
  });
  socket.on('error', function fail() {
    process.exit(1);
  });
}

if (require.main === module) main();
