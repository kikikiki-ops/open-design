import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import http from 'node:http';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { registerFlowRoutes } from '../src/routes/flow.js';
import {
  closeDatabase,
  getConversationFlow,
  insertConversation,
  insertProject,
  openDatabase,
  setConversationFlow,
} from '../src/db.js';
import { applyFlowMarker, createFlowSnapshot } from '@open-design/contracts';

describe('flow routes', () => {
  let tempDir: string;
  let db: ReturnType<typeof openDatabase>;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'od-flow-routes-'));
    const dataDir = path.join(tempDir, '.od');
    const projectsRoot = path.join(dataDir, 'projects');
    mkdirSync(projectsRoot, { recursive: true });
    db = openDatabase(projectsRoot, { dataDir });
    insertProject(db, {
      id: 'project-1',
      name: 'Flow Project',
      skillId: null,
      designSystemId: null,
      createdAt: 1,
      updatedAt: 1,
      metadata: { kind: 'deck' },
    });
    insertConversation(db, {
      id: 'conv-1',
      projectId: 'project-1',
      title: 'Deck run',
      createdAt: 1,
      updatedAt: 1,
    });
  });

  afterEach(() => {
    closeDatabase();
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function getFlow(conversationId: string) {
    const app = express();
    registerFlowRoutes(app, { db });
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as { port: number };
    try {
      const resp = await fetch(
        `http://127.0.0.1:${port}/api/conversations/${conversationId}/flow`,
      );
      return {
        status: resp.status,
        body: (await resp.json()) as {
          conversationId?: string;
          flow: import('@open-design/contracts').FlowSnapshot | null;
        },
      };
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  async function patchFlow(conversationId: string, body: unknown) {
    const app = express();
    app.use(express.json());
    registerFlowRoutes(app, { db, now: () => 50 });
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as { port: number };
    try {
      const response = await fetch(
        'http://127.0.0.1:' + port + '/api/conversations/' + conversationId + '/flow',
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      return {
        status: response.status,
        body: await response.json() as {
          error?: string;
          conversationId?: string;
          flow?: import('@open-design/contracts').FlowSnapshot | null;
        },
      };
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  it('404s for an unknown conversation', async () => {
    const { status } = await getFlow('missing');
    expect(status).toBe(404);
  });

  it('returns null flow for a conversation that never entered the staged flow', async () => {
    const { status, body } = await getFlow('conv-1');
    expect(status).toBe(200);
    expect(body).toEqual({ conversationId: 'conv-1', flow: null });
  });

  it('round-trips a persisted snapshot (refresh recovery path)', async () => {
    const snapshot = applyFlowMarker(
      createFlowSnapshot('deck', { now: 10 }),
      { stage: 'plan', state: 'active', detail: '正在写大纲' },
      11,
    );
    setConversationFlow(db, 'conv-1', snapshot);
    expect(getConversationFlow(db, 'conv-1')).toEqual(snapshot);

    const { status, body } = await getFlow('conv-1');
    expect(status).toBe(200);
    expect(body.flow?.activeStage).toBe('plan');
    expect(body.flow?.shape).toBe('deck');
    expect(body.flow?.stages.find((s: { id: string }) => s.id === 'plan')?.detail).toBe(
      '正在写大纲',
    );
  });

  it('patches research mode and keeps an exact retry idempotent', async () => {
    setConversationFlow(db, 'conv-1', createFlowSnapshot('deck', { now: 10 }));

    const updated = await patchFlow('conv-1', { researchMode: 'deep' });
    expect(updated.status).toBe(200);
    expect(updated.body.flow?.researchMode).toBe('deep');
    expect(updated.body.flow?.updatedAt).toBe(50);
    expect(getConversationFlow(db, 'conv-1')?.researchMode).toBe('deep');

    const retry = await patchFlow('conv-1', { researchMode: 'deep' });
    expect(retry.status).toBe(200);
    expect(retry.body.flow?.updatedAt).toBe(50);
  });

  it('rejects research-mode updates before flow initialization', async () => {
    const response = await patchFlow('conv-1', { researchMode: 'off' });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('conversation flow is not initialized');
  });

  it('validates research-mode updates', async () => {
    setConversationFlow(db, 'conv-1', createFlowSnapshot('deck', { now: 10 }));
    const response = await patchFlow('conv-1', { researchMode: 'turbo' });
    expect(response.status).toBe(400);
  });
});
