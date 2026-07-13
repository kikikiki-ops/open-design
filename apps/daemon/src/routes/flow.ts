import type { Express } from 'express';
import type Database from 'better-sqlite3';
import type {
  FlowResearchMode,
  FlowStatusResponse,
  UpdateFlowResearchModeRequest,
} from '@open-design/contracts';

import { getConversation, getConversationFlow, setConversationFlow } from '../db.js';

export interface RegisterFlowRoutesDeps {
  db: Database.Database;
  now?: () => number;
}

const FLOW_RESEARCH_MODES = new Set<FlowResearchMode>(['deep', 'basic', 'off']);

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
  const now = deps.now ?? Date.now;

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

  app.patch('/api/conversations/:id/flow', (req, res) => {
    const id = String(req.params.id ?? '');
    const conversation = getConversation(db, id);
    if (!conversation) {
      res.status(404).json({ error: 'conversation not found' });
      return;
    }
    const request = (req.body ?? {}) as Partial<UpdateFlowResearchModeRequest>;
    if (!request.researchMode || !FLOW_RESEARCH_MODES.has(request.researchMode)) {
      res.status(400).json({ error: 'researchMode must be deep, basic, or off' });
      return;
    }
    const flow = getConversationFlow(db, id);
    if (!flow) {
      res.status(409).json({ error: 'conversation flow is not initialized' });
      return;
    }
    const next =
      flow.researchMode === request.researchMode
        ? flow
        : { ...flow, researchMode: request.researchMode, updatedAt: now() };
    if (next !== flow) setConversationFlow(db, id, next);
    const body: FlowStatusResponse = {
      conversationId: id,
      flow: next,
    };
    res.json(body);
  });
}
