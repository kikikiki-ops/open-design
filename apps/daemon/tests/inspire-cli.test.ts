import { execFile } from 'node:child_process';
import http from 'node:http';
import { dirname, resolve as pathResolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileP = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const DAEMON_ROOT = pathResolve(__dirname, '..');
const REPO_ROOT = pathResolve(__dirname, '../../..');
const CLI_SRC = pathResolve(__dirname, '../src/cli.ts');
const TSX_CLI = pathResolve(REPO_ROOT, 'node_modules/tsx/dist/cli.mjs');

let server: http.Server | null = null;

afterEach(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => (error ? reject(error) : resolve()));
  });
  server = null;
});

async function startInspireServer(
  inspectBody: (body: unknown) => void,
): Promise<string> {
  server = http.createServer((request, response) => {
    expect(request.method).toBe('POST');
    expect(request.url).toBe('/api/conversations/conversation-1/flow/inspire');
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      inspectBody(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({
        conversationId: 'conversation-1',
        flow: {
          version: 1,
          shape: 'prototype',
          stages: [],
          activeStage: 'generate',
          researchMode: 'basic',
          updatedAt: 2,
        },
      }));
    });
  });
  await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('inspire stub server has no address');
  return `http://127.0.0.1:${address.port}`;
}

describe('od inspire CLI', () => {
  it('combines template and design-system selections in one apply request', async () => {
    let requestBody: unknown;
    const baseUrl = await startInspireServer((body) => {
      requestBody = body;
    });
    const env = { ...process.env };
    delete env.NODE_OPTIONS;

    const result = await execFileP(
      process.execPath,
      [
        TSX_CLI,
        CLI_SRC,
        'inspire',
        'apply',
        '--conversation',
        'conversation-1',
        '--template',
        'editorial-deck',
        '--design-system',
        'vercel',
        '--daemon-url',
        baseUrl,
        '--json',
      ],
      { cwd: DAEMON_ROOT, env, timeout: 15_000, maxBuffer: 8 * 1024 * 1024 },
    );

    expect(result.stderr).toBe('');
    expect(requestBody).toEqual({
      action: 'apply',
      templateId: 'editorial-deck',
      designSystemId: 'vercel',
    });
  });
});
