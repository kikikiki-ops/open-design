// Conversation-level cumulative cost chip (spec L3 "会话内强化"). Sits in the
// composer footer next to ContextUsageControl, reads the daemon usage ledger
// via GET /api/usage/conversations/:id lazily (mount + after each run
// completes — never on an interval), and toggles a small popover with the
// per-model UsageBucket breakdown on click.

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ConversationUsageResponse, UsageBucket } from '@open-design/contracts';

import { useT } from '../i18n';
import {
  combineCostUsd,
  fetchConversationUsage,
  formatTokenCountCompact,
  formatUsdCompact,
} from '../runtime/usage-client';
import styles from './ConversationCostChip.module.css';

interface ConversationCostChipProps {
  conversationId: string | null;
  /**
   * Bumped by the pane whenever a run reaches a terminal status; each bump
   * triggers exactly one refetch. No polling.
   */
  refreshSignal: number;
}

export function ConversationCostChip({
  conversationId,
  refreshSignal,
}: ConversationCostChipProps) {
  const t = useT();
  const [usage, setUsage] = useState<ConversationUsageResponse | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!conversationId) {
      setUsage(null);
      return;
    }
    let stale = false;
    void fetchConversationUsage(conversationId).then((next) => {
      // Ignore late responses after a conversation switch or a newer signal.
      if (!stale && next) setUsage(next);
    });
    return () => {
      stale = true;
    };
  }, [conversationId, refreshSignal]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  if (!conversationId || !usage || usage.totals.runs <= 0) return null;
  const { totalUsd, approximate } = combineCostUsd(usage.totals);
  if (totalUsd <= 0) return null;

  const costText = `${approximate ? '≈' : ''}$${formatUsdCompact(totalUsd)}`;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={t('chatUsage.chipAria')}
        title={t('chatUsage.chipAria')}
        data-testid="conversation-cost-chip"
        onClick={toggle}
      >
        <span className={styles.triggerText}>{costText}</span>
      </button>
      {open ? (
        <div
          className={styles.popover}
          id={popoverId}
          role="dialog"
          aria-label={t('chatUsage.popoverTitle')}
          data-testid="conversation-cost-popover"
        >
          <div className={styles.head}>
            <span className={styles.title}>{t('chatUsage.popoverTitle')}</span>
            <span className={styles.runs}>
              {t('chatUsage.runCount', { n: usage.totals.runs })}
            </span>
          </div>
          <div className={styles.totalLine}>
            <span>{t('chatUsage.totalLabel')}</span>
            <span className={styles.totalValue}>{costText}</span>
          </div>
          {usage.models.length > 0 ? (
            <ul className={styles.modelList}>
              {usage.models.map((bucket) => (
                <ModelRow key={bucket.key} bucket={bucket} />
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>{t('chatUsage.noBreakdown')}</p>
          )}
          {approximate ? (
            <p className={styles.hint}>{t('chatUsage.estimatedHint')}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ModelRow({ bucket }: { bucket: UsageBucket }) {
  const t = useT();
  const { totalUsd, approximate } = combineCostUsd(bucket);
  return (
    <li className={styles.modelRow}>
      <span className={styles.modelName} title={bucket.label ?? bucket.key}>
        {bucket.label ?? bucket.key}
      </span>
      <span className={styles.modelTokens}>
        {t('chatUsage.inTokens', { n: formatTokenCountCompact(bucket.inputTokens) })}
        {' · '}
        {t('chatUsage.outTokens', { n: formatTokenCountCompact(bucket.outputTokens) })}
      </span>
      <span className={styles.modelCost}>
        {totalUsd > 0 ? `${approximate ? '≈' : ''}$${formatUsdCompact(totalUsd)}` : '—'}
      </span>
    </li>
  );
}
