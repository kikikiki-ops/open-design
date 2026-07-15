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

async function startFlowServer(payload: unknown): Promise<string> {
  server = http.createServer((request, response) => {
    expect(request.method).toBe('GET');
    expect(request.url).toBe('/api/conversations/conversation-1/flow');
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(payload));
  });
  await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('flow stub server has no address');
  return `http://127.0.0.1:${address.port}`;
}

describe('od flow CLI', () => {
  it('dispatches flow status before module initialization finishes', async () => {
    const payload = {
      conversationId: 'conversation-1',
      flow: {
        version: 1,
        shape: 'prototype',
        stages: [
          { id: 'clarify', state: 'active' },
          { id: 'research', state: 'pending' },
          { id: 'plan', state: 'pending' },
          { id: 'inspire', state: 'pending' },
          { id: 'generate', state: 'pending' },
          { id: 'deliver', state: 'pending' },
        ],
        activeStage: 'clarify',
        researchMode: 'basic',
        updatedAt: 1,
      },
    };
    const baseUrl = await startFlowServer(payload);
    const env = { ...process.env };
    delete env.NODE_OPTIONS;

    const result = await execFileP(
      process.execPath,
      [
        TSX_CLI,
        CLI_SRC,
        'flow',
        'status',
        'conversation-1',
        '--daemon-url',
        baseUrl,
        '--json',
      ],
      { cwd: DAEMON_ROOT, env, timeout: 15_000, maxBuffer: 8 * 1024 * 1024 },
    );

    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toEqual(payload);
  });

  it('prints human-readable stage icons without a module TDZ crash', async () => {
    const baseUrl = await startFlowServer({
      conversationId: 'conversation-1',
      flow: {
        version: 1,
        shape: 'prototype',
        stages: [
          { id: 'clarify', state: 'active' },
          { id: 'research', state: 'pending' },
        ],
        activeStage: 'clarify',
        researchMode: 'basic',
        updatedAt: 1,
      },
    });
    const env = { ...process.env };
    delete env.NODE_OPTIONS;

    const result = await execFileP(
      process.execPath,
      [
        TSX_CLI,
        CLI_SRC,
        'flow',
        'status',
        'conversation-1',
        '--daemon-url',
        baseUrl,
      ],
      { cwd: DAEMON_ROOT, env, timeout: 15_000, maxBuffer: 8 * 1024 * 1024 },
    );

    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('[flow] shape prototype · research basic');
    expect(result.stdout).toContain('◔ clarify');
    expect(result.stdout).toContain('○ research');
  });
});
