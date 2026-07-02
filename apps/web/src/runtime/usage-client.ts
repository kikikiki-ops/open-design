// Thin read-side client for the daemon usage ledger (`GET /api/usage/*`)
// plus the compact token/cost formatters shared by the in-chat usage
// surfaces (AssistantMessage footer, ConversationCostChip). Kept out of
// providers/daemon.ts on purpose: usage display is an additive read-only
// surface and this module stays dependency-light so it can be unit-tested
// without the provider layer.

import type { ConversationUsageResponse, UsageTotals } from '@open-design/contracts';

/**
 * Fetch the cumulative usage rollup for one conversation. Resolves `null`
 * on any failure (including a daemon that predates `/api/usage/*`), so
 * callers can simply render nothing instead of an error state.
 */
export async function fetchConversationUsage(
  conversationId: string,
): Promise<ConversationUsageResponse | null> {
  try {
    const resp = await fetch(
      `/api/usage/conversations/${encodeURIComponent(conversationId)}`,
      { cache: 'no-store' },
    );
    if (!resp.ok) return null;
    return (await resp.json()) as ConversationUsageResponse;
  } catch {
    return null;
  }
}

/**
 * Combine provider-reported and catalog-estimated cost into one displayable
 * number. `approximate` is true whenever any estimated cost contributes, in
 * which case the UI must render the amount with a `≈` prefix.
 */
export function combineCostUsd(
  totals: Pick<UsageTotals, 'costUsd' | 'estimatedCostUsd'>,
): { totalUsd: number; approximate: boolean } {
  const costUsd = Number.isFinite(totals.costUsd) ? totals.costUsd : 0;
  const estimatedCostUsd = Number.isFinite(totals.estimatedCostUsd)
    ? totals.estimatedCostUsd
    : 0;
  return {
    totalUsd: costUsd + estimatedCostUsd,
    approximate: estimatedCostUsd > 0,
  };
}

/**
 * Compact token count for one quiet footer line: 812 → "812",
 * 5230 → "5.2k", 1_240_000 → "1.24M". Trailing ".0" is stripped.
 */
export function formatTokenCountCompact(count: number): string {
  if (!Number.isFinite(count) || count < 0) return '0';
  if (count < 1000) return String(Math.round(count));
  if (count < 1_000_000) {
    return `${stripTrailingZero((count / 1000).toFixed(1))}k`;
  }
  return `${stripTrailingZero((count / 1_000_000).toFixed(2))}M`;
}

/**
 * Dollar amount with sub-cent precision for small totals ($0.0034) and
 * regular two-decimal formatting from $1 upward. No currency conversion —
 * the ledger reports USD only.
 */
export function formatUsdCompact(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '0.00';
  if (amount < 1) return stripTrailingZero(amount.toFixed(4));
  return amount.toFixed(2);
}

function stripTrailingZero(text: string): string {
  return text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;
}
