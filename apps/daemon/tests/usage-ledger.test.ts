// L2 usage ledger: one SUM-able usage_ledger row per finished run, with
// provider → estimated → unknown cost resolution, plus the read-side
// aggregation helpers behind /api/usage/* and `od usage`.

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import { afterEach, test } from 'vitest';
import type {
  ConversationUsageResponse,
  UsageSummaryResponse,
} from '@open-design/contracts';
import type Database from 'better-sqlite3';
import {
  aggregateUsageLedger,
  closeDatabase,
  insertConversation,
  insertProject,
  insertUsageLedgerRow,
  openDatabase,
  totalizeUsageLedger,
} from '../src/db.js';
import { registerUsageRoutes } from '../src/routes/usage.js';
import {
  computeUsageCacheSavingsUsd,
  recordUsageLedgerOnRunEnd,
  type UsageLedgerRunLike,
} from '../src/usage-ledger.js';

const scratchDirs: string[] = [];

afterEach(() => {
  closeDatabase();
  for (const dir of scratchDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function openScratchDb() {
  const dir = mkdtempSync(join(tmpdir(), 'od-usage-ledger-'));
  scratchDirs.push(dir);
  const db = openDatabase(dir);
  insertProject(db, { id: 'p1', name: 'Proj One', createdAt: Date.now(), updatedAt: Date.now() });
  insertConversation(db, {
    id: 'c1',
    projectId: 'p1',
    title: 'Conv One',
    sessionMode: 'chat',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  insertConversation(db, {
    id: 'c-empty',
    projectId: 'p1',
    title: 'Conv Without Usage',
    sessionMode: 'chat',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return db;
}

function makeRun(overrides: Partial<UsageLedgerRunLike> = {}): UsageLedgerRunLike {
  return {
    id: 'run-1',
    agentId: 'claude',
    projectId: 'p1',
    conversationId: 'c1',
    assistantMessageId: 'm1',
    createdAt: Date.now() - 5_000,
    events: [
      {
        event: 'agent',
        data: {
          type: 'usage',
          usage: {
            input_tokens: 1_000,
            output_tokens: 500,
            cache_read_input_tokens: 800,
            cache_creation_input_tokens: 100,
          },
          costUsd: 0.1234,
          durationMs: 4_200,
        },
      },
    ],
    ...overrides,
  };
}

function immediateWaiter(status = 'succeeded') {
  return { wait: () => Promise.resolve({ status, updatedAt: Date.now() }) };
}

async function settleLedgerWrites() {
  // recordUsageLedgerOnRunEnd resolves through the microtask queue plus one
  // promise hop; two macrotask turns are ample.
  await new Promise((resolve) => setTimeout(resolve, 20));
}

const DAY_WINDOW = () => ({ since: Date.now() - 86_400_000, until: Date.now() + 1_000 });

test('provider-reported cost lands as cost_source=provider with all counters', async () => {
  const db = openScratchDb();
  recordUsageLedgerOnRunEnd(db, immediateWaiter(), makeRun(), {
    model: 'claude-sonnet-4-5',
    sessionMode: 'design',
  });
  await settleLedgerWrites();
  const rows = aggregateUsageLedger(db, 'model', DAY_WINDOW());
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.key, 'claude-sonnet-4-5');
  assert.equal(rows[0]?.runs, 1);
  assert.equal(rows[0]?.inputTokens, 1_000);
  assert.equal(rows[0]?.outputTokens, 500);
  assert.equal(rows[0]?.cacheReadTokens, 800);
  assert.equal(rows[0]?.cacheWriteTokens, 100);
  assert.equal(rows[0]?.costUsd, 0.1234);
  assert.equal(rows[0]?.estimatedCostUsd, 0);
  assert.equal(rows[0]?.durationMs, 4_200);
  const raw = db
    .prepare(`SELECT mode, exec_mode AS execMode, cost_source AS costSource FROM usage_ledger`)
    .get() as { mode: string; execMode: string; costSource: string };
  assert.equal(raw.mode, 'design');
  assert.equal(raw.execMode, 'daemon');
  assert.equal(raw.costSource, 'provider');
});

test('no provider cost falls back to catalog estimate, then unknown', async () => {
  const db = openScratchDb();
  const usageOnly = (usage: Record<string, number>) => [
    { event: 'agent', data: { type: 'usage', usage } },
  ];
  // Catalog-priced model → estimated.
  recordUsageLedgerOnRunEnd(
    db,
    immediateWaiter(),
    makeRun({ id: 'r-est', events: usageOnly({ input_tokens: 2_000, output_tokens: 1_000 }) }),
    { model: 'claude-sonnet-4-5' },
  );
  // Model unknown to the catalog → unknown, NULL cost.
  recordUsageLedgerOnRunEnd(
    db,
    immediateWaiter(),
    makeRun({ id: 'r-unk', events: usageOnly({ input_tokens: 10, output_tokens: 5 }) }),
    { model: 'totally-unpriced-model' },
  );
  await settleLedgerWrites();
  const rows = db
    .prepare(`SELECT model, cost_usd AS costUsd, cost_source AS costSource FROM usage_ledger ORDER BY model`)
    .all() as Array<{ model: string; costUsd: number | null; costSource: string }>;
  assert.equal(rows.length, 2);
  const estimated = rows.find((row) => row.model === 'claude-sonnet-4-5');
  assert.equal(estimated?.costSource, 'estimated');
  assert.ok(typeof estimated?.costUsd === 'number' && estimated.costUsd > 0);
  const unknown = rows.find((row) => row.model === 'totally-unpriced-model');
  assert.equal(unknown?.costSource, 'unknown');
  assert.equal(unknown?.costUsd, null);
});

test('mode falls back to the conversation session_mode; amr agent stamps exec_mode=amr', async () => {
  const db = openScratchDb();
  recordUsageLedgerOnRunEnd(db, immediateWaiter(), makeRun({ agentId: 'amr' }), {});
  await settleLedgerWrites();
  const raw = db
    .prepare(`SELECT mode, exec_mode AS execMode FROM usage_ledger`)
    .get() as { mode: string; execMode: string };
  assert.equal(raw.mode, 'chat'); // c1's session_mode
  assert.equal(raw.execMode, 'amr');
});

test('a dropped run (zero events) records no ledger row', async () => {
  const db = openScratchDb();
  recordUsageLedgerOnRunEnd(db, immediateWaiter('canceled'), makeRun({ events: [] }), {});
  await settleLedgerWrites();
  const count = db.prepare(`SELECT COUNT(*) AS n FROM usage_ledger`).get() as { n: number };
  assert.equal(count.n, 0);
});

test('totals expose cache-row sums for the cacheHitRatio contract', () => {
  const db = openScratchDb();
  insertUsageLedgerRow(db, {
    agentId: 'claude',
    conversationId: 'c1',
    model: 'claude-sonnet-4-5',
    inputTokens: 1_000,
    cacheReadTokens: 800,
    costUsd: 0.5,
    costSource: 'provider',
  });
  insertUsageLedgerRow(db, {
    agentId: 'codex',
    model: 'gpt-5-codex',
    inputTokens: 2_000,
    costUsd: 0.2,
    costSource: 'estimated',
  });
  const totals = totalizeUsageLedger(db, DAY_WINDOW());
  assert.equal(totals.runs, 2);
  assert.equal(totals.costUsd, 0.5);
  assert.equal(totals.estimatedCostUsd, 0.2);
  // Only the row that carried cache counters feeds the ratio denominator.
  assert.equal(totals.cacheRows, 1);
  assert.equal(totals.cacheRowsInputTokens, 1_000);
  assert.equal(totals.cacheRowsReadTokens, 800);
  // Conversation-scoped window only sees c1's row.
  const convTotals = totalizeUsageLedger(db, { ...DAY_WINDOW(), conversationId: 'c1' });
  assert.equal(convTotals.runs, 1);
});

test('project grouping joins the project name as the bucket label', () => {
  const db = openScratchDb();
  insertUsageLedgerRow(db, {
    agentId: 'claude',
    projectId: 'p1',
    inputTokens: 10,
    costSource: 'unknown',
  });
  const buckets = aggregateUsageLedger(db, 'project', DAY_WINDOW());
  assert.equal(buckets[0]?.key, 'p1');
  assert.equal(buckets[0]?.label, 'Proj One');
});

// ---------------------------------------------------------------------------
// /api/usage/* routes (routes/usage.ts) served over a real express listener.
// ---------------------------------------------------------------------------

async function withUsageServer<T>(
  db: Database.Database,
  run: (getJson: (route: string) => Promise<{ status: number; body: unknown }>) => Promise<T>,
): Promise<T> {
  const app = express();
  registerUsageRoutes(app, { db });
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as { port: number };
  const getJson = async (route: string) => {
    const res = await fetch(`http://127.0.0.1:${port}${route}`);
    return { status: res.status, body: (await res.json()) as unknown };
  };
  try {
    return await run(getJson);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

/** Seed two recent rows plus one 10-day-old row (outside 7d, inside 30d). */
function seedSummaryRows(db: Database.Database) {
  const now = Date.now();
  insertUsageLedgerRow(db, {
    agentId: 'claude',
    projectId: 'p1',
    conversationId: 'c1',
    model: 'claude-sonnet-4-5',
    inputTokens: 1_000,
    outputTokens: 500,
    cacheReadTokens: 800,
    cacheWriteTokens: 100,
    costUsd: 0.5,
    costSource: 'provider',
    durationMs: 4_200,
    createdAt: now,
  });
  insertUsageLedgerRow(db, {
    agentId: 'codex',
    conversationId: 'c-other',
    model: 'gpt-5',
    inputTokens: 2_000,
    outputTokens: 1_000,
    costUsd: 0.03,
    costSource: 'estimated',
    durationMs: 1_800,
    createdAt: now,
  });
  insertUsageLedgerRow(db, {
    agentId: 'claude',
    conversationId: 'c1',
    model: 'claude-sonnet-4-5',
    inputTokens: 10,
    outputTokens: 5,
    costUsd: 9.9,
    costSource: 'provider',
    createdAt: now - 10 * 86_400_000,
  });
}

test('GET /api/usage/summary aggregates totals and model buckets over the range window', async () => {
  const db = openScratchDb();
  seedSummaryRows(db);
  await withUsageServer(db, async (getJson) => {
    const res = await getJson('/api/usage/summary?range=7d&groupBy=model');
    assert.equal(res.status, 200);
    const body = res.body as UsageSummaryResponse;
    assert.equal(body.range, '7d');
    assert.equal(body.groupBy, 'model');
    assert.ok(body.since < body.until);

    // Totals: the 10-day-old row is filtered out by the 7d window.
    assert.equal(body.totals.runs, 2);
    assert.equal(body.totals.inputTokens, 3_000);
    assert.equal(body.totals.outputTokens, 1_500);
    assert.equal(body.totals.cacheReadTokens, 800);
    assert.equal(body.totals.cacheWriteTokens, 100);
    assert.ok(Math.abs(body.totals.costUsd - 0.5) < 1e-9);
    assert.ok(Math.abs(body.totals.estimatedCostUsd - 0.03) < 1e-9);
    // Only the sonnet row carried cache counters: 800 / (1000 + 800).
    assert.ok(
      body.totals.cacheHitRatio !== null &&
        Math.abs(body.totals.cacheHitRatio - 800 / 1_800) < 1e-9,
    );
    // 800 cache reads × ($3 in − $0.30 cache) per 1M on claude-sonnet-4-5.
    assert.ok(
      body.totals.cacheSavingsUsd !== null &&
        Math.abs(body.totals.cacheSavingsUsd - (800 * (3 - 0.3)) / 1_000_000) < 1e-9,
    );

    // Buckets sort by cost descending; costs stay split by cost_source.
    assert.deepEqual(
      body.buckets.map((bucket) => bucket.key),
      ['claude-sonnet-4-5', 'gpt-5'],
    );
    const [sonnet, gpt] = body.buckets;
    assert.equal(sonnet?.runs, 1);
    assert.equal(sonnet?.inputTokens, 1_000);
    assert.equal(sonnet?.cacheReadTokens, 800);
    assert.ok(Math.abs((sonnet?.costUsd ?? 0) - 0.5) < 1e-9);
    assert.equal(sonnet?.estimatedCostUsd, 0);
    assert.equal(sonnet?.durationMs, 4_200);
    assert.equal(gpt?.costUsd, 0);
    assert.ok(Math.abs((gpt?.estimatedCostUsd ?? 0) - 0.03) < 1e-9);
  });
});

test('GET /api/usage/summary range=30d includes the older row; defaults are 7d/day', async () => {
  const db = openScratchDb();
  seedSummaryRows(db);
  await withUsageServer(db, async (getJson) => {
    const wide = await getJson('/api/usage/summary?range=30d&groupBy=model');
    assert.equal(wide.status, 200);
    const wideBody = wide.body as UsageSummaryResponse;
    assert.equal(wideBody.totals.runs, 3);
    assert.ok(Math.abs(wideBody.totals.costUsd - 10.4) < 1e-9);

    const defaults = await getJson('/api/usage/summary');
    assert.equal(defaults.status, 200);
    const defaultsBody = defaults.body as UsageSummaryResponse;
    assert.equal(defaultsBody.range, '7d');
    assert.equal(defaultsBody.groupBy, 'day');
    // Both recent rows land on today's local-day bucket.
    assert.equal(defaultsBody.buckets.length, 1);
    assert.match(defaultsBody.buckets[0]?.key ?? '', /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(defaultsBody.buckets[0]?.runs, 2);

    const badRange = await getJson('/api/usage/summary?range=1y');
    assert.equal(badRange.status, 400);
    const badGroupBy = await getJson('/api/usage/summary?groupBy=hour');
    assert.equal(badGroupBy.status, 400);
  });
});

test('GET /api/usage/conversations/:id rolls up one conversation across all time', async () => {
  const db = openScratchDb();
  seedSummaryRows(db);
  await withUsageServer(db, async (getJson) => {
    const res = await getJson('/api/usage/conversations/c1');
    assert.equal(res.status, 200);
    const body = res.body as ConversationUsageResponse;
    assert.equal(body.conversationId, 'c1');
    // c1 has two rows (including the 10-day-old one — no range cutoff here);
    // the c-other row stays out.
    assert.equal(body.totals.runs, 2);
    assert.equal(body.totals.inputTokens, 1_010);
    assert.ok(Math.abs(body.totals.costUsd - 10.4) < 1e-9);
    assert.equal(body.models.length, 1);
    assert.equal(body.models[0]?.key, 'claude-sonnet-4-5');
    assert.equal(body.models[0]?.runs, 2);

    // Known conversation with zero ledger rows → empty rollup, not 404.
    const empty = await getJson('/api/usage/conversations/c-empty');
    assert.equal(empty.status, 200);
    assert.equal((empty.body as ConversationUsageResponse).totals.runs, 0);

    const missing = await getJson('/api/usage/conversations/nope');
    assert.equal(missing.status, 404);
  });
});

test('cache savings price cache reads via catalog pricing and return null when unpriceable', () => {
  const priced = computeUsageCacheSavingsUsd([
    { key: 'claude-sonnet-4-5', cacheReadTokens: 1_000_000 },
  ]);
  assert.ok(priced !== null && priced > 0);
  assert.equal(
    computeUsageCacheSavingsUsd([{ key: 'totally-unpriced-model', cacheReadTokens: 1_000_000 }]),
    null,
  );
  assert.equal(computeUsageCacheSavingsUsd([]), null);
});
