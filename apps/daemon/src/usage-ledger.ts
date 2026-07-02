// L2 usage ledger write point (model/cost/usage transparency spec §L2).
//
// The daemon already extracts per-run usage twice — once for the SSE `usage`
// event the UI renders, once for Langfuse via
// `scanRunEventsForUsageAnalytics`. This module reuses that SAME scan to
// persist exactly one SUM-able `usage_ledger` row per finished run, so the
// local ledger and the Langfuse export stay same-source. Read side lives in
// `routes/usage.ts` (`/api/usage/*`) and `od usage` in `cli.ts`.
//
// Cost resolution order per row:
//   1. provider-reported cost from the run's usage events → cost_source 'provider'
//   2. L1 catalog estimate (model-catalog.ts pricing × tokens) → 'estimated'
//   3. neither available → 'unknown' (cost_usd NULL)

import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  insertUsageLedgerRow,
  type UsageLedgerCostSource,
} from './db.js';
import { estimateCostUsd, lookupModelMeta } from './model-catalog.js';
import {
  hasExplicitRequestedModelForAnalytics,
  scanRunEventsForUsageAnalytics,
  type RunEventForAnalyticsObservability,
} from './run-analytics-observability.js';
import { countNewArtifacts } from './runtimes/run-artifacts.js';

type SqliteDb = Database.Database;

/**
 * Catalog-priced cost for a token bundle, or null when the model is unknown
 * to the catalog, unpriced, or the estimate is not a usable number. Thin
 * defensive wrapper over model-catalog's `estimateCostUsd`.
 */
export function estimateRunCostUsd(
  model: string | null | undefined,
  usage: { input?: number; output?: number; cacheRead?: number },
): number | null {
  if (!model) return null;
  try {
    const value = estimateCostUsd(model, usage);
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
      ? value
      : null;
  } catch {
    return null;
  }
}

/**
 * Rough prompt-caching savings in USD over per-model cache-read sums:
 * cacheReadTokens × (inputPer1M − cacheReadPer1M) for models whose catalog
 * pricing carries both prices. Null when no bucket could be priced — the
 * UsageTotals.cacheSavingsUsd contract.
 */
export function computeUsageCacheSavingsUsd(
  modelBuckets: ReadonlyArray<{ key: string; cacheReadTokens: number }>,
): number | null {
  let priced = false;
  let savings = 0;
  for (const bucket of modelBuckets) {
    if (!bucket.key || bucket.key === 'unknown' || bucket.cacheReadTokens <= 0) continue;
    const pricing = lookupModelMeta(bucket.key)?.pricing;
    const inputPer1M = pricing?.inputPer1M;
    const cacheReadPer1M = pricing?.cacheReadPer1M;
    if (typeof inputPer1M !== 'number' || typeof cacheReadPer1M !== 'number') continue;
    priced = true;
    savings += Math.max(
      0,
      (bucket.cacheReadTokens * (inputPer1M - cacheReadPer1M)) / 1_000_000,
    );
  }
  return priced ? savings : null;
}

// ---------------------------------------------------------------------------
// Run-end recorder
// ---------------------------------------------------------------------------

export interface UsageLedgerRunLike {
  id: string;
  agentId: string | null;
  projectId: string | null;
  conversationId: string | null;
  assistantMessageId: string | null;
  createdAt: number;
  events: RunEventForAnalyticsObservability[];
}

interface UsageLedgerRunWaitStatus {
  status: string;
  updatedAt?: number;
}

interface UsageLedgerRunService {
  wait(run: UsageLedgerRunLike): Promise<UsageLedgerRunWaitStatus>;
}

export interface RecordUsageLedgerOpts {
  /** The explicitly requested model from the run request body, when any. */
  model?: unknown;
  /** The run's chat session mode (chat | plan | design), when known. */
  sessionMode?: unknown;
}

// Reverse-scan the run's events for the provider-reported cost and duration.
// These ride on the SSE usage payload (`data.costUsd` / `data.durationMs`,
// see server.ts's usage persistence transform) rather than inside the token
// `usage` object, so the analytics scan does not surface them.
function lastProviderUsageSignals(
  events: ReadonlyArray<RunEventForAnalyticsObservability>,
): { costUsd?: number; durationMs?: number } {
  let costUsd: number | undefined;
  let durationMs: number | undefined;
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const ev = events[i];
    if (ev?.event !== 'agent') continue;
    const data = ev.data as
      | { type?: string; costUsd?: unknown; durationMs?: unknown }
      | null
      | undefined;
    if (data?.type !== 'usage') continue;
    if (
      costUsd === undefined &&
      typeof data.costUsd === 'number' &&
      Number.isFinite(data.costUsd) &&
      data.costUsd >= 0
    ) {
      costUsd = data.costUsd;
    }
    if (
      durationMs === undefined &&
      typeof data.durationMs === 'number' &&
      Number.isFinite(data.durationMs) &&
      data.durationMs >= 0
    ) {
      durationMs = data.durationMs;
    }
    if (costUsd !== undefined && durationMs !== undefined) break;
  }
  return {
    ...(costUsd !== undefined ? { costUsd } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
  };
}

function resolveLedgerMode(
  db: SqliteDb,
  conversationId: string | null,
  sessionMode: unknown,
): string | null {
  if (sessionMode === 'chat' || sessionMode === 'plan' || sessionMode === 'design') {
    return sessionMode;
  }
  if (!conversationId) return null;
  try {
    const row = db
      .prepare(`SELECT session_mode AS sessionMode FROM conversations WHERE id = ?`)
      .get(conversationId) as { sessionMode?: unknown } | undefined;
    const value = row?.sessionMode;
    return value === 'chat' || value === 'plan' || value === 'design' ? value : null;
  } catch {
    return null;
  }
}

/**
 * Arm the usage-ledger recorder for a freshly created run: when the run
 * reaches a terminal status, persist exactly one usage_ledger row derived
 * from the same run-event scan that feeds Langfuse. Call this once per run,
 * next to the other run-end bookkeeping (message reconciliation, analytics).
 *
 * Best-effort by design: a ledger failure must never affect the run itself.
 */
export function recordUsageLedgerOnRunEnd(
  db: SqliteDb,
  runs: UsageLedgerRunService,
  run: UsageLedgerRunLike,
  opts: RecordUsageLedgerOpts = {},
): void {
  void runs
    .wait(run)
    .then((finalStatus) => {
      // A run dropped before it ever started (routine slot lost, prepared-run
      // rollback) resolves with zero events; it consumed nothing and would
      // only add noise rows to every SUM.
      if (!Array.isArray(run.events) || run.events.length === 0) return;

      const usage = scanRunEventsForUsageAnalytics(run.events, opts.model, 0);
      const model = hasExplicitRequestedModelForAnalytics(opts.model)
        ? opts.model
        : usage.agent_reported_model;
      const provider = lastProviderUsageSignals(run.events);

      let costUsd: number | null = null;
      let costSource: UsageLedgerCostSource = 'unknown';
      if (provider.costUsd !== undefined) {
        costUsd = provider.costUsd;
        costSource = 'provider';
      } else {
        const estimated = estimateRunCostUsd(model, {
          ...(usage.input_tokens !== undefined ? { input: usage.input_tokens } : {}),
          ...(usage.output_tokens !== undefined ? { output: usage.output_tokens } : {}),
          ...(usage.cache_read_input_tokens !== undefined
            ? { cacheRead: usage.cache_read_input_tokens }
            : {}),
        });
        if (estimated !== null) {
          costUsd = estimated;
          costSource = 'estimated';
        }
      }

      let artifactCount: number | null = null;
      try {
        artifactCount = countNewArtifacts(run.events);
      } catch {
        artifactCount = null;
      }

      const endedAt =
        typeof finalStatus.updatedAt === 'number' && Number.isFinite(finalStatus.updatedAt)
          ? finalStatus.updatedAt
          : Date.now();

      insertUsageLedgerRow(db, {
        id: randomUUID(),
        projectId: run.projectId,
        conversationId: run.conversationId,
        messageId: run.assistantMessageId,
        agentId: run.agentId ?? 'unknown',
        model: model ?? null,
        mode: resolveLedgerMode(db, run.conversationId, opts.sessionMode),
        // The daemon spawns agent CLIs, so exec_mode is 'daemon' — except the
        // AMR cloud agent, whose runs bill against the Open Design Cloud
        // wallet. 'api' (BYOK) runs never pass through daemon run creation.
        execMode: run.agentId === 'amr' ? 'amr' : 'daemon',
        inputTokens: usage.input_tokens ?? null,
        outputTokens: usage.output_tokens ?? null,
        cacheReadTokens: usage.cache_read_input_tokens ?? null,
        cacheWriteTokens: usage.cache_creation_input_tokens ?? null,
        costUsd,
        costSource,
        durationMs: provider.durationMs ?? Math.max(0, endedAt - run.createdAt),
        artifactCount,
        createdAt: Date.now(),
      });
    })
    .catch((err) => {
      console.warn('[usage] ledger write failed', err);
    });
}
