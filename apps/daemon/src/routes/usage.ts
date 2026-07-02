// /api/usage/* — read-side aggregation over the usage_ledger table
// (model/cost/usage transparency spec §L2). The write side is
// `usage-ledger.ts#recordUsageLedgerOnRunEnd`; the DTOs live in
// `packages/contracts/src/api/usage.ts` and are shared with the Settings →
// Usage dashboard, the in-chat conversation cost chip, and `od usage`.

import type { Express, Request, Response } from 'express';
import type Database from 'better-sqlite3';
import type {
  ConversationUsageResponse,
  UsageBucket,
  UsageGroupBy,
  UsageRange,
  UsageSummaryResponse,
  UsageTotals,
} from '@open-design/contracts';
import {
  aggregateUsageLedger,
  getConversation,
  totalizeUsageLedger,
  type UsageLedgerBucketRow,
  type UsageLedgerTotalsRow,
  type UsageLedgerWindow,
} from '../db.js';
import { sendApiError } from '../http/api-errors.js';
import { computeUsageCacheSavingsUsd } from '../usage-ledger.js';

type SqliteDb = Database.Database;

export interface RegisterUsageRoutesDeps {
  db: SqliteDb;
}

const USAGE_RANGES: readonly UsageRange[] = ['today', '7d', '30d'];
const USAGE_GROUP_BYS: readonly UsageGroupBy[] = [
  'day',
  'model',
  'agent',
  'project',
  'conversation',
];

const DAY_MS = 24 * 60 * 60 * 1000;

function parseUsageRange(value: unknown): UsageRange | null {
  if (value === undefined) return '7d';
  return typeof value === 'string' && (USAGE_RANGES as readonly string[]).includes(value)
    ? (value as UsageRange)
    : null;
}

function parseUsageGroupBy(value: unknown): UsageGroupBy | null {
  if (value === undefined) return 'day';
  return typeof value === 'string' && (USAGE_GROUP_BYS as readonly string[]).includes(value)
    ? (value as UsageGroupBy)
    : null;
}

/**
 * Unix-ms window for a usage range. 'today' starts at the daemon machine's
 * local midnight (matching the ledger's local-day bucketing); '7d'/'30d' are
 * rolling windows ending now.
 */
export function usageRangeWindow(
  range: UsageRange,
  now: number = Date.now(),
): { since: number; until: number } {
  if (range === 'today') {
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    return { since: startOfDay.getTime(), until: now };
  }
  const days = range === '30d' ? 30 : 7;
  return { since: now - days * DAY_MS, until: now };
}

function toUsageBucket(row: UsageLedgerBucketRow): UsageBucket {
  return {
    key: row.key,
    ...(row.label ? { label: row.label } : {}),
    runs: row.runs,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    cacheReadTokens: row.cacheReadTokens,
    cacheWriteTokens: row.cacheWriteTokens,
    costUsd: row.costUsd,
    estimatedCostUsd: row.estimatedCostUsd,
    durationMs: row.durationMs,
  };
}

function toUsageTotals(
  totals: UsageLedgerTotalsRow,
  cacheSavingsUsd: number | null,
): UsageTotals {
  // Contract semantics: cacheReadTokens / (inputTokens + cacheReadTokens)
  // over rows that carried cache counters; null when no row did.
  const cacheDenominator = totals.cacheRowsInputTokens + totals.cacheRowsReadTokens;
  return {
    runs: totals.runs,
    inputTokens: totals.inputTokens,
    outputTokens: totals.outputTokens,
    cacheReadTokens: totals.cacheReadTokens,
    cacheWriteTokens: totals.cacheWriteTokens,
    costUsd: totals.costUsd,
    estimatedCostUsd: totals.estimatedCostUsd,
    cacheHitRatio:
      totals.cacheRows > 0 && cacheDenominator > 0
        ? totals.cacheRowsReadTokens / cacheDenominator
        : null,
    cacheSavingsUsd,
  };
}

function buildUsageTotals(
  db: SqliteDb,
  window: UsageLedgerWindow,
  modelBuckets: UsageLedgerBucketRow[],
): UsageTotals {
  const totalsRow = totalizeUsageLedger(db, window);
  const cacheSavingsUsd = computeUsageCacheSavingsUsd(modelBuckets);
  return toUsageTotals(totalsRow, cacheSavingsUsd);
}

export function registerUsageRoutes(app: Express, deps: RegisterUsageRoutesDeps): void {
  const { db } = deps;

  app.get('/api/usage/summary', (req: Request, res: Response) => {
    const range = parseUsageRange(req.query.range);
    if (!range) {
      return sendApiError(res, 400, 'BAD_REQUEST', `invalid range (expected ${USAGE_RANGES.join(' | ')})`);
    }
    const groupBy = parseUsageGroupBy(req.query.groupBy);
    if (!groupBy) {
      return sendApiError(res, 400, 'BAD_REQUEST', `invalid groupBy (expected ${USAGE_GROUP_BYS.join(' | ')})`);
    }
    const window = usageRangeWindow(range);
    // Model buckets are always needed: cacheSavingsUsd prices each model's
    // cache-read sum through the catalog, whatever the requested grouping.
    const modelBuckets = aggregateUsageLedger(db, 'model', window);
    const buckets = groupBy === 'model'
      ? modelBuckets
      : aggregateUsageLedger(db, groupBy, window);
    const body: UsageSummaryResponse = {
      range,
      groupBy,
      since: window.since,
      until: window.until,
      totals: buildUsageTotals(db, window, modelBuckets),
      buckets: buckets.map(toUsageBucket),
    };
    res.json(body);
  });

  app.get('/api/usage/conversations/:id', (req: Request, res: Response) => {
    const conversationId = typeof req.params.id === 'string' ? req.params.id : '';
    if (!conversationId) {
      return sendApiError(res, 400, 'BAD_REQUEST', 'conversation id missing');
    }
    const window: UsageLedgerWindow = {
      since: 0,
      until: Date.now(),
      conversationId,
    };
    const models = aggregateUsageLedger(db, 'model', window);
    if (models.length === 0 && !getConversation(db, conversationId)) {
      return sendApiError(res, 404, 'NOT_FOUND', 'conversation not found');
    }
    const body: ConversationUsageResponse = {
      conversationId,
      totals: buildUsageTotals(db, window, models),
      models: models.map(toUsageBucket),
    };
    res.json(body);
  });
}
