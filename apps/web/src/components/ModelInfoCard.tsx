// ModelInfoCard — hover/focus details card for an AgentModelOption.
//
// The model catalog (daemon `/api/agents`, `/api/provider/models`,
// `/api/amr/models`) now enriches model options with description, context
// window, pricing, speed tier, tags, recommended modes, and deprecation.
// This file owns the read-side rendering of that metadata:
//
//   - `ModelSpeedBadge`   — tiny tier pill rendered inline in model rows.
//   - `ModelInfoCard`     — the card body (pure presentational).
//   - `ModelInfoTrigger`  — keyboard-accessible info affordance that floats
//     the card next to its anchor via a document.body portal, following the
//     same fixed-position pattern as the searchable model-select popover.
//
// Every field is optional: a bare `{ id, label }` model renders only the
// label plus a "no details" hint, so un-enriched agents keep working.

import { createPortal } from 'react-dom';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { AgentModelOption, ModelSpeedTier } from '@open-design/contracts';
import { Button } from '@open-design/components';
import { useT } from '../i18n';
import { Icon } from './Icon';
import styles from './ModelInfoCard.module.css';

const CARD_WIDTH = 288;

/** True when the option carries any catalog metadata beyond id/label. */
export function modelHasDetails(model: AgentModelOption): boolean {
  return Boolean(
    model.description ||
      model.contextWindow != null ||
      model.maxOutputTokens != null ||
      (model.pricing &&
        (model.pricing.inputPer1M != null ||
          model.pricing.outputPer1M != null ||
          model.pricing.cacheReadPer1M != null)) ||
      model.speedTier ||
      (model.tags && model.tags.length > 0) ||
      (model.recommendedFor && model.recommendedFor.length > 0) ||
      model.deprecated,
  );
}

/** 200000 -> "200K", 1048576 -> "1M". */
export function formatContextTokens(value: number): string {
  const rounded = Math.max(0, Math.round(value));
  if (rounded >= 1_000_000) return `${trimFixed(rounded / 1_000_000)}M`;
  if (rounded >= 1000) return `${trimFixed(rounded / 1000)}K`;
  return String(rounded);
}

function trimFixed(value: number): string {
  return value >= 10 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, '');
}

/** 3 -> "$3", 0.3 -> "$0.30", 3.5 -> "$3.50". */
function formatUsd(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `$${Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2)}`;
}

const SPEED_CLASS: Record<ModelSpeedTier, string | undefined> = {
  fast: styles.speedFast,
  balanced: styles.speedBalanced,
  powerful: styles.speedPowerful,
};

export function ModelSpeedBadge({
  tier,
  className,
}: {
  tier: ModelSpeedTier;
  className?: string;
}) {
  const t = useT();
  const label =
    tier === 'fast'
      ? t('modelCard.speedFast')
      : tier === 'powerful'
        ? t('modelCard.speedPowerful')
        : t('modelCard.speedBalanced');
  return (
    <span
      className={joinClasses(styles.speedBadge, SPEED_CLASS[tier], className)}
      data-testid={`model-speed-badge-${tier}`}
    >
      {label}
    </span>
  );
}

/** Maps `recommendedFor` values (ChatSessionMode ids) to the mode names the
 * session-mode toggle uses in the UI: chat -> Ask, plan -> Plan,
 * design -> Design. Unknown values pass through verbatim. */
function recommendedModeLabel(
  t: ReturnType<typeof useT>,
  mode: string,
): string {
  switch (mode) {
    case 'chat':
      return t('modelCard.modeChat');
    case 'plan':
      return t('modelCard.modePlan');
    case 'design':
      return t('modelCard.modeDesign');
    default:
      return mode;
  }
}

export function ModelInfoCard({
  model,
  id,
  className,
}: {
  model: AgentModelOption;
  id?: string;
  className?: string;
}) {
  const t = useT();
  const pricing = model.pricing;
  const inputPrice = pricing?.inputPer1M;
  const outputPrice = pricing?.outputPer1M;
  const cachePrice = pricing?.cacheReadPer1M;
  const pricingLine =
    inputPrice != null && outputPrice != null
      ? t('modelCard.pricingInOut', {
          input: formatUsd(inputPrice),
          output: formatUsd(outputPrice),
        })
      : inputPrice != null
        ? t('modelCard.pricingInputOnly', { input: formatUsd(inputPrice) })
        : outputPrice != null
          ? t('modelCard.pricingOutputOnly', { output: formatUsd(outputPrice) })
          : null;
  const hasMeta =
    model.contextWindow != null ||
    model.maxOutputTokens != null ||
    pricingLine != null ||
    cachePrice != null;
  const hasDetails = modelHasDetails(model);

  return (
    <div
      className={joinClasses(styles.card, className)}
      id={id}
      role="tooltip"
      data-testid="model-info-card"
    >
      <div className={styles.header}>
        <span className={styles.title}>{model.label}</span>
        {model.speedTier ? <ModelSpeedBadge tier={model.speedTier} /> : null}
      </div>

      {model.deprecated ? (
        <div className={styles.deprecated} data-testid="model-info-deprecated">
          <Icon name="alert-triangle" size={12} />
          <span>{t('modelCard.deprecated')}</span>
        </div>
      ) : null}

      {model.description ? (
        <p className={styles.description}>{model.description}</p>
      ) : null}

      {hasMeta ? (
        <div className={styles.meta}>
          {model.contextWindow != null ? (
            <span className={styles.metaRow}>
              {t('modelCard.contextWindow', {
                tokens: formatContextTokens(model.contextWindow),
              })}
            </span>
          ) : null}
          {model.maxOutputTokens != null ? (
            <span className={styles.metaRow}>
              {t('modelCard.maxOutput', {
                tokens: formatContextTokens(model.maxOutputTokens),
              })}
            </span>
          ) : null}
          {pricingLine ? (
            <span className={styles.metaRow}>{pricingLine}</span>
          ) : null}
          {cachePrice != null ? (
            <span className={styles.metaRow}>
              {t('modelCard.pricingCache', { price: formatUsd(cachePrice) })}
            </span>
          ) : null}
        </div>
      ) : null}

      {model.tags && model.tags.length > 0 ? (
        <div className={styles.tags}>
          {model.tags.map((tag) => (
            <span className={styles.tag} key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {model.recommendedFor && model.recommendedFor.length > 0 ? (
        <div className={styles.recommended}>
          <span className={styles.recommendedLabel}>
            {t('modelCard.recommendedFor')}
          </span>
          {model.recommendedFor.map((mode) => (
            <span className={styles.modeChip} key={mode}>
              {recommendedModeLabel(t, mode)}
            </span>
          ))}
        </div>
      ) : null}

      {!hasDetails ? (
        <p className={styles.noDetails}>{t('modelCard.noDetails')}</p>
      ) : null}
    </div>
  );
}

interface ModelInfoTriggerProps {
  model: AgentModelOption;
  className?: string;
  'data-testid'?: string;
}

/**
 * Small info button that floats a ModelInfoCard next to itself while hovered
 * or focused. The card portals onto document.body with fixed positioning
 * (same pattern as the model-select popover) so it escapes any overflow
 * clipping in dropdown lists; it stays mounted through the 140ms exit
 * transition so dismissal animates instead of snapping.
 */
export function ModelInfoTrigger({
  model,
  className,
  'data-testid': testId,
}: ModelInfoTriggerProps) {
  const t = useT();
  const cardId = useId();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);

  const show = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // Prefer the right side of the anchor; flip left when it would clip.
    let left = rect.right + 10;
    if (left + CARD_WIDTH > viewportWidth - 8) {
      left = rect.left - CARD_WIDTH - 10;
    }
    if (left < 8) {
      left = Math.min(Math.max(8, rect.left), Math.max(8, viewportWidth - CARD_WIDTH - 8));
    }
    const top = Math.min(Math.max(8, rect.top - 8), Math.max(8, viewportHeight - 240));
    setPosition({ top, left, maxHeight: Math.max(160, viewportHeight - top - 12) });
    setMounted(true);
    // Let the hidden state paint first so the enter transition plays.
    window.requestAnimationFrame(() => setVisible(true));
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    // Keep the node mounted through the exit transition (~140ms).
    hideTimerRef.current = window.setTimeout(() => {
      setMounted(false);
      hideTimerRef.current = null;
    }, 160);
  }, []);

  useEffect(
    () => () => {
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    },
    [],
  );

  // The card is fixed-positioned, so any scroll would detach it from its
  // anchor; dismiss instead of chasing the anchor.
  useEffect(() => {
    if (!visible) return;
    const onScroll = () => hide();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [visible, hide]);

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className={joinClasses(styles.infoTrigger, className)}
        aria-label={t('modelCard.detailsAria', { model: model.label })}
        aria-describedby={mounted ? cardId : undefined}
        data-testid={testId}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (visible) hide();
          else show();
        }}
      >
        <Icon name="info" size={12} />
      </Button>
      {mounted && position
        ? createPortal(
            <div
              className={joinClasses(
                styles.cardFloat,
                visible ? styles.cardFloatVisible : undefined,
              )}
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${CARD_WIDTH}px`,
                maxHeight: `${position.maxHeight}px`,
              }}
            >
              <ModelInfoCard model={model} id={cardId} />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function joinClasses(...classes: Array<string | undefined | false>): string {
  return classes.filter(Boolean).join(' ');
}
