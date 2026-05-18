import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { amrConnectorProvider } from '../src/connectors/amr.js';
import { ConnectorService } from '../src/connectors/service.js';
import { clearDefaultAmrCredentials, setDefaultAmrCredentials } from '../src/integrations/amr/credentials.js';
import { listConnectorTools } from '../src/tools/connectors.js';

const ORIGINAL_ENV = {
  AMR_TOKEN: process.env.AMR_TOKEN,
  AMR_API_KEY: process.env.AMR_API_KEY,
  AMR_GATEWAY_URL: process.env.AMR_GATEWAY_URL,
};
const originalFetch = globalThis.fetch;

function amrJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function toolGrant() {
  return {
    token: 'tool-token',
    projectId: 'project-1',
    runId: 'run-1',
    allowedEndpoints: [],
    allowedOperations: [],
    issuedAt: '2026-05-18T00:00:00.000Z',
    expiresAt: '2026-05-18T00:15:00.000Z',
  };
}

describe('AMR connector provider', () => {
  beforeEach(() => {
    delete process.env.AMR_TOKEN;
    delete process.env.AMR_API_KEY;
    delete process.env.AMR_GATEWAY_URL;
    setDefaultAmrCredentials({
      token: 'amr-token',
      gateway: 'https://amr.example.com',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    amrConnectorProvider.clearDiscoveryCache();
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
    clearDefaultAmrCredentials();
    amrConnectorProvider.clearDiscoveryCache();
  });

  it('lists AMR OAuth-backed connectors as connected and executable through the common tool API', async () => {
    const fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      expect(headers.get('authorization')).toBe('Bearer amr-token');
      if (url === 'https://amr.example.com/v1/connectors') {
        return amrJson({
          data: [
            {
              id: 'notion',
              name: 'Notion',
              category: 'documents',
              description: 'Read workspace pages through AMR.',
              tools: [
                {
                  name: 'search',
                  title: 'Search pages',
                  description: 'Read matching pages.',
                  input_schema: {
                    type: 'object',
                    properties: { query: { type: 'string' } },
                    required: ['query'],
                  },
                },
              ],
            },
          ],
        });
      }
      if (url === 'https://amr.example.com/v1/connectors/notion/call') {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toEqual({
          tool: 'search',
          input: { query: 'roadmap' },
        });
        return amrJson({ pages: [{ title: 'Roadmap' }], token: 'secret' });
      }
      return amrJson({ error: `unexpected ${url}` }, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new ConnectorService();
    await expect(service.listConnectors()).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'notion',
        provider: 'amr',
        status: 'connected',
        accountLabel: 'Notion',
        auth: { provider: 'none', configured: true },
      }),
    ]));

    await expect(listConnectorTools({
      grant: toolGrant(),
      projectsRoot: '/tmp/projects',
      service,
    })).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'notion',
        status: 'connected',
        tools: expect.arrayContaining([expect.objectContaining({ name: 'notion.search' })]),
      }),
    ]));

    await expect(service.execute(
      {
        connectorId: 'notion',
        toolName: 'notion.search',
        input: { query: 'roadmap' },
      },
      {
        projectId: 'project-1',
        runId: 'run-1',
        projectsRoot: '/tmp/projects',
      },
    )).resolves.toMatchObject({
      ok: true,
      connectorId: 'notion',
      toolName: 'notion.search',
      output: {
        pages: [{ title: 'Roadmap' }],
        token: '[redacted]',
      },
    });
  });

  it('discovers AMR connector tools on the agent hot path before settings prewarm', async () => {
    const fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
      expect(String(input)).toBe('https://amr.example.com/v1/connectors');
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer amr-token');
      return amrJson({
        connectors: [
          {
            id: 'notion',
            name: 'Notion',
            tools: [{ name: 'search', description: 'Search pages.' }],
          },
        ],
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(listConnectorTools({
      grant: toolGrant(),
      projectsRoot: '/tmp/projects',
    })).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'notion',
        provider: 'amr',
        status: 'connected',
        tools: expect.arrayContaining([expect.objectContaining({ name: 'notion.search' })]),
      }),
    ]));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
