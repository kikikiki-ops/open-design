// Pinned per-round task-progress card (specs/current/task-progress-and-computer-
// replay.zh-CN.md §3.1). Lives ABOVE the composer (sibling of QueuedSendStrip),
// always visible, and shows only the CURRENT round's top-level steps. It is a
// thin wrapper around FlowProgressCard: it owns the collapsible header (Computer
// entry · current step · N/M · Live) and lets the card body render headless.
//
// The card is a pure renderer — all advancement lives in the daemon flow tracker
// and reaches here via the conversation FlowSnapshot.

import { useState } from 'react';
import type { FlowSnapshot, FlowStageId } from '@open-design/contracts';
import { useT } from '../i18n';
import type { FlowStageArtifactPaths } from '../runtime/flow-artifacts';
import { FlowProgressCard, flowProgressSummary } from './FlowProgressCard';
import styles from './PinnedTaskProgress.module.css';

export type PinnedTaskRunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | null;

export function PinnedTaskProgress({
  flow,
  live,
  status = null,
  stageArtifactPaths,
  stageActions,
  onOpenArtifact,
  onOpenComputer,
}: {
  flow: FlowSnapshot;
  /** True while this round's run is still active (drives the green Live pill). */
  live: boolean;
  /** Terminal run status for this round; drives the ended-state badge once the
   * Live pill goes away, giving an unmistakable completion cue (spec §3.3). */
  status?: PinnedTaskRunStatus;
  stageArtifactPaths?: FlowStageArtifactPaths;
  stageActions?: Partial<Record<FlowStageId, () => void>>;
  onOpenArtifact?: (path: string) => void;
  /** Opens the replayable Computer panel. Rendered as a thumbnail entry when
   * provided; omitted (static glyph) until the Computer panel ships (M2). */
  onOpenComputer?: () => void;
}) {
  const t = useT();
  const [collapsed, setCollapsed] = useState(false);
  const { current, total, activeStage } = flowProgressSummary(flow);
  const currentStepLabel = activeStage
    ? t(activeStage.labelKey)
    : t('flow.state.complete');
  const currentGlyph = activeStage ? '◔' : '✓';

  return (
    <div className={styles.root} data-testid="pinned-task-progress" data-live={live}>
      <div className={styles.head}>
        {onOpenComputer ? (
          <button
            type="button"
            className={styles.computer}
            onClick={onOpenComputer}
            aria-label={t('flow.title')}
            data-testid="pinned-task-computer-entry"
          >
            <ComputerGlyph />
          </button>
        ) : (
          <span className={styles.computer} aria-hidden>
            <ComputerGlyph />
          </span>
        )}
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t('designFiles.expandGroup') : t('designFiles.collapseGroup')}
          onClick={() => setCollapsed((c) => !c)}
        >
          <span className={styles.title}>
            {collapsed ? (
              <>
                <span className={styles.currentGlyph} aria-hidden>
                  {currentGlyph}
                </span>
                <span className={styles.currentLabel}>{currentStepLabel}</span>
              </>
            ) : (
              t('flow.title')
            )}
          </span>
          <span className={styles.spacer} />
          {live ? (
            <span className={styles.live} data-testid="pinned-task-live">
              <span className={styles.liveDot} aria-hidden />
              {t('designs.badgeLive')}
            </span>
          ) : status === 'succeeded' ? (
            <span
              className={`${styles.terminal} ${styles.done}`}
              data-testid="pinned-task-status"
            >
              <span aria-hidden>✓</span>
              {t('designs.status.succeeded')}
            </span>
          ) : status === 'failed' || status === 'canceled' ? (
            <span
              className={`${styles.terminal} ${styles.failed}`}
              data-testid="pinned-task-status"
            >
              <span aria-hidden>✕</span>
              {t('designs.status.failed')}
            </span>
          ) : null}
          <span className={styles.stepOf}>{t('flow.stepOf', { current, total })}</span>
          <span
            className={styles.chevron}
            data-collapsed={collapsed}
            aria-hidden
          >
            ⌄
          </span>
        </button>
      </div>
      <div
        className={`accordion-collapsible ${styles.body}${collapsed ? '' : ' open'}`}
      >
        <div className="accordion-collapsible-inner">
          <div className={styles.bodyInner}>
            <FlowProgressCard
              flow={flow}
              hideHead
              stageArtifactPaths={stageArtifactPaths}
              stageActions={stageActions}
              onOpenArtifact={onOpenArtifact}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ComputerGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 14h5M8 11.5V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
