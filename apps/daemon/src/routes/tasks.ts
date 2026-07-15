import type { Express } from 'express';
import type Database from 'better-sqlite3';
import {
  deriveTaskSteps,
  type PersistedAgentEvent,
  type TaskRoundsResponse,
  type TaskRoundSummary,
} from '@open-design/contracts';

import { getConversation, listMessages } from '../db.js';

export interface RegisterTaskRoutesDeps {
  db: Database.Database;
}

/**
 * Per-round task steps (specs/current/task-progress-and-computer-replay.zh-CN.md §6).
 *
 * The UI Computer panel derives steps client-side from streamed events; this
 * endpoint is the durable, CLI-facing surface: it replays each assistant round's
 * persisted `events_json` through the SAME `deriveTaskSteps` projection, so
 * `od task steps` and the Computer can never disagree. Read-only, no migration.
 */
export function registerTaskRoutes(app: Express, deps: RegisterTaskRoutesDeps): void {
  const { db } = deps;

  app.get('/api/conversations/:id/tasks', (req, res) => {
    const id = String(req.params.id ?? '');
    const conversation = getConversation(db, id);
    if (!conversation) {
      res.status(404).json({ error: 'conversation not found' });
      return;
    }
    const rounds: TaskRoundSummary[] = [];
    let index = 0;
    for (const message of listMessages(db, id)) {
      if (message.role !== 'assistant') continue;
      const events = (message.events ?? []) as PersistedAgentEvent[];
      rounds.push({
        index: index++,
        assistantMessageId: message.id,
        runId: message.runId ?? null,
        status: message.runStatus ?? (message.endedAt != null ? 'succeeded' : null),
        steps: deriveTaskSteps(events),
      });
    }
    const body: TaskRoundsResponse = { conversationId: id, rounds };
    res.json(body);
  });
}
