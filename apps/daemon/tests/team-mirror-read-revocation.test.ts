import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type http from 'node:http';

import { startServer } from '../src/server.js';

// #2 (team collab): once a project is moved out of the team, a former member's
// pulled local mirror must stop serving its files. The pull gate stamps a
// non-destructive `teamMirrorRevokedAt` flag on the local project; the read
// routes must then refuse to serve it (the bytes stay on disk, so a re-share
// clears the flag and restores access). A member's own local project — which
// never carries the flag — must keep reading normally.
describe('team mirror read revocation', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const started = (await startServer({ port: 0, returnServer: true })) as {
      url: string;
      server: http.Server;
    };
    baseUrl = started.url;
    server = started.server;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  async function createProject(id: string, metadata?: Record<string, unknown>) {
    const res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, name: id, skillId: null, designSystemId: null, ...(metadata ? { metadata } : {}) }),
    });
    expect(res.status).toBe(200);
  }

  async function addIndexHtml(id: string) {
    const res = await fetch(`${baseUrl}/api/projects/${id}/files`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'index.html', content: '<h1>mirror</h1>' }),
    });
    expect(res.status).toBe(200);
  }

  it('serves a normal project but 404s reads of a revoked team mirror', async () => {
    const suffix = Date.now();
    const normalId = `mirror-normal-${suffix}`;
    const revokedId = `mirror-revoked-${suffix}`;

    await createProject(normalId);
    await addIndexHtml(normalId);
    // A revoked mirror still has its bytes on disk (addIndexHtml writes them);
    // only the read routes must refuse.
    await createProject(revokedId, { teamMirrorRevokedAt: suffix });
    await addIndexHtml(revokedId);

    // Control: the member's own (unflagged) project reads normally.
    expect((await fetch(`${baseUrl}/api/projects/${normalId}/raw/index.html`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/projects/${normalId}/files`)).status).toBe(200);
    expect((await fetch(`${baseUrl}/api/projects/${normalId}/files/index.html`)).status).toBe(200);

    // Revoked team mirror: every read route refuses.
    expect((await fetch(`${baseUrl}/api/projects/${revokedId}/raw/index.html`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/api/projects/${revokedId}/files`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/api/projects/${revokedId}/files/index.html`)).status).toBe(404);
  });
});
