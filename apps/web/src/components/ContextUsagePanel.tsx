import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { ContextUsageSegmentId, ContextUsageSummary } from '../runtime/context-usage';
import type { Dict } from '../i18n/types';
import { Icon } from './Icon';
import styles from './ContextUsagePanel.module.css';

type TranslateFn = (key: keyof Dict, vars?: Record<string, string | number>) => string;

interface ContextUsageControlProps {
  summary: ContextUsageSummary;
  t: TranslateFn;
}

interface ContextUsageWarningProps {
  summary: ContextUsageSummary;
  t: TranslateFn;
  onNewConversation?: () => void;
  newConversationDisabled?: boolean;
  onContinue: () => void;
}

const SEGMENT_COLORS: Record<ContextUsageSegmentId, string> = {
  system: '#a8a8a8',
  cache: '#6f9f5f',
  tools: '#a66be8',
  rules: '#4bb26d',
  skills: '#efb457',
  mcp: '#c697c8',
  designContext: '#5aa9c9',
  attachments: '#4d8fd7',
  conversation: '#7ec7d6',
  output: '#d78b4d',
  other: '#8c8c8c',
};

const SEGMENT_LABEL_KEYS: Record<ContextUsageSegmentId, keyof Dict> = {
  system: 'chat.contextUsage.systemPrompt',
  cache: 'settings.amrWalletCached',
  tools: 'chat.contextUsage.toolDefinitions',
  rules: 'chat.contextUsage.rules',
  skills: 'chat.contextUsage.skills',
  mcp: 'chat.contextUsage.mcp',
  designContext: 'chat.contextUsage.designContext',
  attachments: 'chat.contextUsage.attachments',
  conversation: 'chat.contextUsage.conversation',
  output: 'chat.contextUsage.output',
  other: 'chat.contextUsage.other',
};

const PANEL_GAP = 8;
const VIEWPORT_GUTTER = 12;
const PANEL_MIN_HEIGHT = 180;

interface PanelPosition {
  left: number;
  top: number;
  maxHeight: number;
}

export function ContextUsageControl({ summary, t }: ContextUsageControlProps) {
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const percent = Math.round(summary.usedRatio * 100);
  const panelId = useId();

  useLayoutEffect(() => {
    if (!open) {
      setPanelPosition(null);
      return undefined;
    }

    const updatePanelPosition = () => {
      const root = rootRef.current;
      const panel = panelRef.current;
      if (!root || !panel) return;

      const triggerRect = root.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const panelWidth = Math.min(
        panelRect.width,
        Math.max(0, viewportWidth - VIEWPORT_GUTTER * 2),
      );
      const maxLeft = Math.max(VIEWPORT_GUTTER, viewportWidth - panelWidth - VIEWPORT_GUTTER);
      const left = clamp(
        triggerRect.right - panelWidth,
        VIEWPORT_GUTTER,
        maxLeft,
      );

      const spaceAbove = Math.max(0, triggerRect.top - PANEL_GAP - VIEWPORT_GUTTER);
      const spaceBelow = Math.max(0, viewportHeight - triggerRect.bottom - PANEL_GAP - VIEWPORT_GUTTER);
      const preferAbove =
        spaceAbove >= Math.min(panelRect.height, PANEL_MIN_HEIGHT) || spaceAbove >= spaceBelow;
      const viewportMaxHeight = Math.max(0, viewportHeight - VIEWPORT_GUTTER * 2);
      const availableHeight = Math.max(
        0,
        Math.min(
          viewportMaxHeight,
          Math.max(PANEL_MIN_HEIGHT, preferAbove ? spaceAbove : spaceBelow),
        ),
      );
      const renderedHeight = Math.min(panelRect.height, availableHeight);
      const top = preferAbove
        ? Math.max(VIEWPORT_GUTTER, triggerRect.top - PANEL_GAP - renderedHeight)
        : Math.min(
            triggerRect.bottom + PANEL_GAP,
            viewportHeight - VIEWPORT_GUTTER - renderedHeight,
          );

      setPanelPosition((prev) => {
        const next = {
          left: Math.round(left),
          top: Math.round(top),
          maxHeight: Math.round(availableHeight),
        };
        return prev
          && prev.left === next.left
          && prev.top === next.top
          && prev.maxHeight === next.maxHeight
          ? prev
          : next;
      });
    };

    updatePanelPosition();
    const frame = window.requestAnimationFrame(updatePanelPosition);
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePanelPosition);
      window.removeEventListener('scroll', updatePanelPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
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

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={[
          styles.trigger,
          summary.warningLevel === 'warning' ? styles.triggerWarning : '',
          summary.warningLevel === 'critical' ? styles.triggerCritical : '',
        ].filter(Boolean).join(' ')}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={t('chat.contextUsage.openPanel')}
        title={t('chat.contextUsage.openPanel')}
        data-tooltip={t('chat.contextUsage.openPanel')}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          className={styles.triggerRing}
          style={{ '--context-usage-percent': `${Math.min(100, percent)}%` } as CSSProperties}
          aria-hidden
        />
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              className={styles.panel}
              style={panelStyle(panelPosition)}
              role="dialog"
              aria-label={t('chat.contextUsage.title')}
            >
              <div className={styles.panelHead}>
                <div>
                  <div className={styles.title}>{t('chat.contextUsage.title')}</div>
                  <div className={styles.subtitle} data-testid="context-usage-model">
                    {summary.modelLabel}
                    {' · '}
                    {compactTokens(summary.contextWindow)}
                    {summary.contextWindowEstimated
                      ? ` · ${t('chat.contextUsage.estimatedWindow')}`
                      : ''}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.close}
                  onClick={() => setOpen(false)}
                  aria-label={t('chat.contextUsage.closePanel')}
                >
                  <Icon name="close" size={13} />
                </button>
              </div>

              <div className={styles.summaryLine}>
                <span>{t('chat.contextUsage.fullLabel', { percent })}</span>
                <span>{formatTokenPair(summary)}</span>
              </div>
              <StackedMeter summary={summary} />
              <div className={styles.metaLine}>
                <span>
                  {summary.source === 'provider'
                    ? t('chat.contextUsage.providerMeasured')
                    : t('chat.contextUsage.estimated')}
                </span>
                {summary.latestInputTokens != null ? (
                  <span>
                    {t('chat.contextUsage.latestRun', {
                      input: compactTokens(summary.latestInputTokens),
                      output: compactTokens(summary.latestOutputTokens ?? 0),
                    })}
                  </span>
                ) : null}
              </div>

              <div className={styles.segmentList}>
                {summary.segments.map((segment) => (
                  <div className={styles.segmentRow} key={segment.id}>
                    <span
                      className={styles.swatch}
                      style={{ backgroundColor: SEGMENT_COLORS[segment.id] }}
                      aria-hidden
                    />
                    <span className={styles.segmentLabel}>{t(SEGMENT_LABEL_KEYS[segment.id])}</span>
                    <span className={styles.segmentValue}>{compactTokens(segment.tokens)}</span>
                  </div>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function panelStyle(position: PanelPosition | null): CSSProperties {
  return position
    ? {
        left: position.left,
        top: position.top,
        maxHeight: position.maxHeight,
        visibility: 'visible',
      }
    : {
        left: VIEWPORT_GUTTER,
        top: VIEWPORT_GUTTER,
        maxHeight: `calc(100vh - ${VIEWPORT_GUTTER * 2}px)`,
        visibility: 'visible',
      };
}

export function ContextUsageWarning({
  summary,
  t,
  onNewConversation,
  newConversationDisabled = false,
  onContinue,
}: ContextUsageWarningProps) {
  const percent = Math.round(summary.usedRatio * 100);
  const copy = contextUsageNoticeCopy(summary);
  return (
    <div
      className={[
        styles.warning,
        summary.autoCompaction ? styles.warningAutoCompaction : '',
        summary.warningLevel === 'critical' && !summary.autoCompaction ? styles.warningCritical : '',
      ].filter(Boolean).join(' ')}
      role="status"
      data-testid="context-usage-warning"
    >
      <span className={styles.warningIcon} aria-hidden>
        <Icon name="alert-triangle" size={16} />
      </span>
      <span className={styles.warningCopy}>
        <strong>{t(copy.titleKey)}</strong>
        <span>
          {t(copy.bodyKey, {
            percent,
            limit: compactTokens(summary.contextWindow),
            beforePercent: summary.autoCompactionBeforeTokens
              ? Math.round((summary.autoCompactionBeforeTokens / summary.contextWindow) * 100)
              : percent,
          })}
        </span>
      </span>
      <span className={styles.warningActions}>
        {onNewConversation ? (
          <button
            type="button"
            className={styles.warningPrimary}
            disabled={newConversationDisabled}
            onClick={onNewConversation}
          >
            {t('chat.newConversation')}
          </button>
        ) : null}
        <button type="button" className={styles.warningSecondary} onClick={onContinue}>
          {t('questions.continue')}
        </button>
      </span>
    </div>
  );
}

function contextUsageNoticeCopy(
  summary: ContextUsageSummary,
): { titleKey: keyof Dict; bodyKey: keyof Dict } {
  if (summary.autoCompactionStatus === 'completed') {
    return {
      titleKey: 'chat.contextUsage.autoCompactionCompletedTitle',
      bodyKey: 'chat.contextUsage.autoCompactionCompletedBody',
    };
  }
  if (summary.autoCompactionStatus === 'running') {
    return {
      titleKey: 'chat.contextUsage.autoCompactionRunningTitle',
      bodyKey: 'chat.contextUsage.autoCompactionRunningBody',
    };
  }
  if (summary.autoCompaction) {
    return {
      titleKey: 'chat.contextUsage.autoCompactionWarningTitle',
      bodyKey: 'chat.contextUsage.autoCompactionWarningBody',
    };
  }
  return {
    titleKey: 'chat.contextUsage.warningTitle',
    bodyKey: 'chat.contextUsage.warningBody',
  };
}

function StackedMeter({ summary }: { summary: ContextUsageSummary }) {
  const total = summary.contextWindow || summary.usedTokens || 1;
  return (
    <div className={styles.meter} aria-hidden>
      {summary.segments.map((segment) => (
        <span
          key={segment.id}
          className={styles.meterSegment}
          style={{
            flex: '0 0 auto',
            backgroundColor: SEGMENT_COLORS[segment.id],
            width: `${Math.max(0, (segment.tokens / total) * 100)}%`,
          }}
        />
      ))}
    </div>
  );
}

function compactTokens(value: number): string {
  const rounded = Math.max(0, Math.round(value));
  if (rounded >= 1_000_000) return `${trimFixed(rounded / 1_000_000)}M`;
  if (rounded >= 1000) return `${trimFixed(rounded / 1000)}K`;
  return String(rounded);
}

function formatTokenPair(summary: ContextUsageSummary): string {
  const estimatePrefix = summary.source === 'estimated' ? '~' : '';
  return `${estimatePrefix}${compactTokens(summary.usedTokens)} / ${compactTokens(summary.contextWindow)} tokens`;
}

function trimFixed(value: number): string {
  return value >= 10 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, '');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
