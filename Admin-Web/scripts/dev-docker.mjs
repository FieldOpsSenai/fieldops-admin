import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const next = require.resolve('next/dist/bin/next');
const server = spawn(
  process.execPath,
  [next, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', '3001'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      FIELDOPS_DEV_TARGET: 'docker',
      FIELDOPS_API_INTERNAL_URL: 'http://127.0.0.1:8080/api/v1',
    },
  },
);

server.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
