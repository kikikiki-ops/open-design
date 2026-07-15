import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import express from 'express';
import http from 'node:http';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { registerTaskRoutes } from '../src/routes/tasks.js';
import {
  closeDatabase,
  insertConversation,
  insertProject,
  openDatabase,
  upsertMessage,
} from '../src/db.js';

describe('task routes', () => {
  let tempDir: string;
  let db: ReturnType<typeof openDatabase>;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'od-task-routes-'));
    const dataDir = path.join(tempDir, '.od');
    const projectsRoot = path.join(dataDir, 'projects');
    mkdirSync(projectsRoot, { recursive: true });
    db = openDatabase(projectsRoot, { dataDir });
    insertProject(db, {
      id: 'project-1',
      name: 'Task Project',
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

  async function getTasks(conversationId: string) {
    const app = express();
    registerTaskRoutes(app, { db });
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as { port: number };
    try {
      const res = await fetch(
        `http://127.0.0.1:${port}/api/conversations/${conversationId}/tasks`,
      );
      const body = res.status === 200 ? await res.json() : null;
      return { status: res.status, body };
    } finally {
      server.close();
    }
  }

  it('404s for an unknown conversation', async () => {
    const { status } = await getTasks('missing');
    expect(status).toBe(404);
  });

  it('projects each assistant round into ordered task steps', async () => {
    upsertMessage(db, 'conv-1', { id: 'u1', role: 'user', content: 'Make a deck' });
    upsertMessage(db, 'conv-1', {
      id: 'a1',
      role: 'assistant',
      content: 'Working',
      runId: 'run-1',
      runStatus: 'succeeded',
      events: [
        { kind: 'tool_use', id: 't1', name: 'WebSearch', input: { query: 'pitch decks' } },
        { kind: 'tool_result', toolUseId: 't1', content: 'ok', isError: false },
        { kind: 'tool_use', id: 't2', name: 'Write', input: { file_path: 'deck.html' } },
        { kind: 'tool_result', toolUseId: 't2', content: 'ok', isError: false },
      ],
    });
    upsertMessage(db, 'conv-1', { id: 'u2', role: 'user', content: 'Edit slide 2' });
    upsertMessage(db, 'conv-1', {
      id: 'a2',
      role: 'assistant',
      content: 'Editing',
      runId: 'run-2',
      runStatus: 'running',
      events: [
        { kind: 'tool_use', id: 't3', name: 'Edit', input: { file_path: 'deck.html' } },
      ],
    });

    const { status, body } = await getTasks('conv-1');

    expect(status).toBe(200);
    expect(body.conversationId).toBe('conv-1');
    expect(body.rounds).toHaveLength(2);

    const [first, second] = body.rounds;
    expect(first).toMatchObject({ index: 0, runId: 'run-1', status: 'succeeded' });
    expect(first.steps.map((s: { kind: string }) => s.kind)).toEqual(['search', 'write']);
    expect(first.steps[0]).toMatchObject({ target: 'pitch decks', status: 'done' });

    // The edit round is a separate task, still live, with an unresolved step.
    expect(second).toMatchObject({ index: 1, runId: 'run-2', status: 'running' });
    expect(second.steps[0]).toMatchObject({ kind: 'edit', status: 'running' });
  });
});
