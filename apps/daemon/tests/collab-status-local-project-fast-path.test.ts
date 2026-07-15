import { afterEach, describe, expect, it } from 'vitest';
import express from 'express';
import http from 'node:http';
import {
  buildWorkspacePermissions,
  buildWorkspaceSeatSummary,
  type WorkspaceCollabContext,
} from '@open-design/contracts';
import { createCollabRuntime, type CollabRuntime } from '../src/collab/runtime.js';
import type { WorkspaceContextProvider } from '../src/collab/workspace-context.js';
import { registerCollabSyncRoutes } from '../src/routes/collab-sync.js';

let server: http.Server | null = null;

afterEach(async () => {
  if (server) {
    const toClose = server;
    server = null;
    await new Promise<void>((resolve) => toClose.close(() => resolve()));
  }
});

function memberContextProvider(workspaceMemberId: string): WorkspaceContextProvider {
  const context: WorkspaceCollabContext = {
    workspaceId: 'ws-1',
    workspaceType: 'team',
    teamId: 'team-1',
    workspaceMemberId,
    role: 'member',
    memberStatus: 'active',
    lifecycleState: 'active',
    billingState: 'active',
    planId: null,
    providerMode: 'platform_credits',
    seatSummary: buildWorkspaceSeatSummary({ seatLimit: 5, usedSeats: 1 }),
    permissions: buildWorkspacePermissions({ role: 'member', lifecycleState: 'active' }),
  };
  return { current: async () => context };
}

/**
 * A local-only, unowned project must NOT trigger the resource-hub published-head
 * lookup. That call is an uncached ~2s round-trip; running it on every status
 * poll made a member's own project sit in the front end's fail-closed
 * "shared read-only" state for seconds before /collab/status confirmed ownership.
 */
describe('collab/status local-only fast path', () => {
  it('skips publishedHead when the project is local-only and unowned', async () => {
    const runtime = createCollabRuntime() as CollabRuntime & {
      publishedHead: CollabRuntime['publishedHead'];
    };
    let headCalls = 0;
    const originalHead = runtime.publishedHead.bind(runtime);
    runtime.publishedHead = ((projectId: string, principal: unknown) => {
      headCalls += 1;
      return originalHead(projectId, principal as never);
    }) as CollabRuntime['publishedHead'];

    let ownerLookups = 0;
    const app = express();
    app.use(express.json());
    registerCollabSyncRoutes(app, {
      collab: runtime,
      resolveSharedProjectOwner: async () => {
        ownerLookups += 1;
        return null; // not shared to the team
      },
    });
    server = http.createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('no port');
    const base = `http://127.0.0.1:${address.port}`;

    const res = await fetch(`${base}/api/projects/my-local-project/collab/status`);
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.syncState).toBe('local_only');
    expect(body.ownerMemberId).toBeNull();
    expect(body.publishedVersion).toBeNull();
    // The cheap cached owner lookup ran; the expensive hub head lookup did not.
    expect(ownerLookups).toBe(1);
    expect(headCalls).toBe(0);
  });

  it('consults publishedHead for a NON-owner member of a shared project', async () => {
    const runtime = createCollabRuntime({
      workspaceContext: memberContextProvider('viewer-member'),
    }) as CollabRuntime & { publishedHead: CollabRuntime['publishedHead'] };
    let headCalls = 0;
    const originalHead = runtime.publishedHead.bind(runtime);
    runtime.publishedHead = ((projectId: string, principal: unknown) => {
      headCalls += 1;
      return originalHead(projectId, principal as never);
    }) as CollabRuntime['publishedHead'];

    const app = express();
    app.use(express.json());
    registerCollabSyncRoutes(app, {
      collab: runtime,
      resolveSharedProjectOwner: async () => 'member-owner', // someone else owns it
    });
    server = http.createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('no port');
    const base = `http://127.0.0.1:${address.port}`;

    const res = await fetch(`${base}/api/projects/shared-project/collab/status`);
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.ownerMemberId).toBe('member-owner');
    expect(body.syncState).toBe('synced');
    // A non-owner member needs the hub head for their auto-pull cursor.
    expect(headCalls).toBe(1);
  });

  it('skips publishedHead when the caller IS the owner of a shared project', async () => {
    const runtime = createCollabRuntime({
      workspaceContext: memberContextProvider('member-owner'),
    }) as CollabRuntime & { publishedHead: CollabRuntime['publishedHead'] };
    let headCalls = 0;
    const originalHead = runtime.publishedHead.bind(runtime);
    runtime.publishedHead = ((projectId: string, principal: unknown) => {
      headCalls += 1;
      return originalHead(projectId, principal as never);
    }) as CollabRuntime['publishedHead'];

    const app = express();
    app.use(express.json());
    registerCollabSyncRoutes(app, {
      collab: runtime,
      resolveSharedProjectOwner: async () => 'member-owner', // caller owns it
    });
    server = http.createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('no port');
    const base = `http://127.0.0.1:${address.port}`;

    const res = await fetch(`${base}/api/projects/my-shared-project/collab/status`);
    const body = (await res.json()) as Record<string, unknown>;

    expect(res.status).toBe(200);
    expect(body.ownerMemberId).toBe('member-owner');
    expect(body.syncState).toBe('synced');
    // The owner is the single writer and never auto-pulls, so the expensive hub
    // head lookup is skipped — their editable state resolves without waiting on it.
    expect(headCalls).toBe(0);
  });
});
