import { spawn } from 'node:child_process';
import http from 'node:http';
import { dirname, resolve as pathResolve } from 'node:path';
import { Writable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DAEMON_ROOT = pathResolve(__dirname, '..');
const REPO_ROOT = pathResolve(__dirname, '../../..');
const CLI_SRC = pathResolve(__dirname, '../src/cli.ts');
const TSX_CLI = pathResolve(REPO_ROOT, 'node_modules/tsx/dist/cli.mjs');

describe('od skills CLI', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const body = 'x'.repeat(90_000);
    server = http.createServer((req, res) => {
      if (req.method === 'GET' && req.url === '/api/skills/large-skill') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ id: 'large-skill', body }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'not found' }));
    });
    await new Promise<void>((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('stub server has no address');
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolveClose, rejectClose) => {
      server.close((error) => (error ? rejectClose(error) : resolveClose()));
    });
  });

  it('flushes a large skill JSON body before the CLI exits', async () => {
    const env = { ...process.env };
    delete env.NODE_OPTIONS;
    const child = spawn(
      process.execPath,
      [
        TSX_CLI,
        CLI_SRC,
        'skills',
        'show',
        'large-skill',
        '--daemon-url',
        baseUrl,
        '--json',
      ],
      {
        cwd: DAEMON_ROOT,
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    const chunks: Buffer[] = [];
    const slowSink = new Writable({
      highWaterMark: 1,
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        setTimeout(callback, 25);
      },
    });
    child.stdout.pipe(slowSink);
    child.stderr.resume();

    const timeout = setTimeout(() => child.kill(), 15_000);
    const [code] = await Promise.all([
      new Promise<number | null>((resolveExit, rejectExit) => {
        child.once('error', rejectExit);
        child.once('close', resolveExit);
      }),
      new Promise<void>((resolveFinish, rejectFinish) => {
        slowSink.once('error', rejectFinish);
        slowSink.once('finish', resolveFinish);
      }),
    ]);
    clearTimeout(timeout);

    expect(code).toBe(0);
    const stdout = Buffer.concat(chunks).toString('utf8');

    expect(JSON.parse(stdout)).toEqual({ id: 'large-skill', body: 'x'.repeat(90_000) });
  });
});
