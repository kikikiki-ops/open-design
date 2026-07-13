import type { Express } from 'express';
import type Database from 'better-sqlite3';
import type { FlowStatusResponse } from '@open-design/contracts';

import { getConversation, getConversationFlow } from '../db.js';

export interface RegisterFlowRoutesDeps {
  db: Database.Database;
}

/**
 * Staged-flow read surface (specs/current/staged-flow-north-star.zh-CN.md).
 *
 * The daemon advances a conversation's `FlowSnapshot` live over the chat SSE
 * stream (`flow_stage` agent events); this endpoint is the durable recovery
 * path — page refresh, CLI (`od flow status`), and any consumer that missed
 * the stream read the same persisted snapshot.
 */
export function registerFlowRoutes(app: Express, deps: RegisterFlowRoutesDeps): void {
  const { db } = deps;

  app.get('/api/conversations/:id/flow', (req, res) => {
    const id = String(req.params.id ?? '');
    const conversation = getConversation(db, id);
    if (!conversation) {
      res.status(404).json({ error: 'conversation not found' });
      return;
    }
    const body: FlowStatusResponse = {
      conversationId: id,
      flow: getConversationFlow(db, id),
    };
    res.json(body);
  });
}
