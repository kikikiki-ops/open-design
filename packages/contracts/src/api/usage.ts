// Usage ledger DTOs — the shared shapes behind GET /api/usage/* and the
// `od usage` CLI. The daemon writes one usage_ledger row per finished run
// (provider-reported usage when available, catalog-estimated otherwise);
// these types are the read-side aggregation contract consumed by the
// Settings → Usage dashboard, the in-chat conversation cost chip, and the
// CLI `--json` output. Keep this file free of daemon/web dependencies per
// the contracts purity rule.

/** Where a row's `costUsd` came from. Estimated costs render as `≈$`. */
export type UsageCostSource = 'provider' | 'estimated' | 'unknown';

export type UsageRange = 'today' | '7d' | '30d';

export type UsageGroupBy =
  | 'day'
  | 'model'
  | 'agent'
  | 'project'
  | 'conversation';

/**
 * One aggregated bucket (a day, a model, a project, …) of usage.
 * `key` is the group identity (ISO date, model id, project id …) and
 * `label` is the display name when one is known (project title,
 * conversation title). Token fields are sums over the bucket's rows.
 */
export interface UsageBucket {
  key: string;
  label?: string;
  runs: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  /** Sum of provider-reported cost over rows that reported one. */
  costUsd: number;
  /** Sum of catalog-estimated cost over rows without provider cost. */
  estimatedCostUsd: number;
  durationMs: number;
}

export interface UsageTotals {
  runs: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
  estimatedCostUsd: number;
  /**
   * cacheReadTokens / (inputTokens + cacheReadTokens) over rows where cache
   * data exists; null when no row carried cache counters.
   */
  cacheHitRatio: number | null;
  /**
   * Rough savings from prompt caching in USD, computed from catalog pricing
   * as cacheReadTokens × (inputPer1M − cacheReadPer1M) for rows whose model
   * has both prices. Null when nothing could be priced.
   */
  cacheSavingsUsd: number | null;
}

export interface UsageSummaryResponse {
  range: UsageRange;
  groupBy: UsageGroupBy;
  /** Unix ms boundaries actually used for the query window. */
  since: number;
  until: number;
  totals: UsageTotals;
  buckets: UsageBucket[];
}

/** Per-conversation rollup behind GET /api/usage/conversations/:id. */
export interface ConversationUsageResponse {
  conversationId: string;
  totals: UsageTotals;
  /** Per-model breakdown inside this conversation. */
  models: UsageBucket[];
}
