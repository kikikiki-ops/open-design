// Settings → Usage dashboard (spec: model-cost-usage-transparency L3).
//
// Reads GET /api/usage/summary and renders:
//   - a range switch (Today / 7d / 30d) + big-number header (cost / tokens /
//     runs) with a provider-$ vs estimated-≈$ legend,
//   - a "Saved by caching ≈$X" line from totals.cacheSavingsUsd,
//   - an Open Design Cloud (AMR) block ABOVE the breakdown: balance + plan +
//     Recharge/Manage when signed in, a compact promo card with the three
//     benefit chips + sign-in when signed out,
//   - group-by tabs (Model / Project / Conversation / Day) with pure-CSS
//     horizontal bar rows (no chart lib).
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import type {
  AmrWalletSnapshot,
  UsageBucket,
  UsageGroupBy,
  UsageRange,
  UsageSummaryResponse,
} from '@open-design/contracts';
import { Button } from '@open-design/components';
import { useAnalytics } from '../analytics/provider';
import { getResolvedDeviceId } from '../analytics/client';
import {
  amrHandoffDeviceId,
  attributedAmrUrl,
  recordAmrEntry,
} from '../analytics/amr-attribution';
import { useI18n } from '../i18n';
import type { Dict } from '../i18n/types';
import {
  fetchAmrWalletSnapshot,
  fetchUsageSummary,
  fetchVelaLoginStatus,
  formatVelaBalanceUsd,
  type VelaLoginStatus,
} from '../providers/daemon';
import {
  amrConsoleUrlForProfile,
  amrRechargeUrlForProfile,
} from '../runtime/amr-guidance';
import { AmrLoginPill } from './AmrLoginPill';
import { Icon } from './Icon';
import { PlanBadge } from './PlanBadge';
import styles from './UsagePanel.module.css';

/** The subset of UsageGroupBy the dashboard exposes as tabs. */
type UsagePanelGroupBy = Extract<
  UsageGroupBy,
  'model' | 'project' | 'conversation' | 'day'
>;

const RANGE_OPTIONS: ReadonlyArray<{ id: UsageRange; labelKey: keyof Dict }> = [
  { id: 'today', labelKey: 'usagePanel.rangeToday' },
  { id: '7d', labelKey: 'usagePanel.range7d' },
  { id: '30d', labelKey: 'usagePanel.range30d' },
];

const GROUP_TABS: ReadonlyArray<{ id: UsagePanelGroupBy; labelKey: keyof Dict }> = [
  { id: 'model', labelKey: 'usagePanel.groupModel' },
  { id: 'project', labelKey: 'usagePanel.groupProject' },
  { id: 'conversation', labelKey: 'usagePanel.groupConversation' },
  { id: 'day', labelKey: 'usagePanel.groupDay' },
];

function bucketTotalCost(bucket: Pick<UsageBucket, 'costUsd' | 'estimatedCostUsd'>): number {
  return bucket.costUsd + bucket.estimatedCostUsd;
}

function bucketTotalTokens(
  bucket: Pick<
    UsageBucket,
    'inputTokens' | 'outputTokens' | 'cacheReadTokens' | 'cacheWriteTokens'
  >,
): number {
  return (
    bucket.inputTokens +
    bucket.outputTokens +
    bucket.cacheReadTokens +
    bucket.cacheWriteTokens
  );
}

export interface UsagePanelProps {
  metricsConsent?: boolean;
  installationId?: string | null;
}

export function UsagePanel({ metricsConsent = false, installationId }: UsagePanelProps) {
  const { locale, t } = useI18n();
  const analytics = useAnalytics();

  const [range, setRange] = useState<UsageRange>('today');
  const [groupBy, setGroupBy] = useState<UsagePanelGroupBy>('model');
  const [summary, setSummary] = useState<UsageSummaryResponse | null>(null);
  const [summaryReady, setSummaryReady] = useState(false);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setSummaryReady(false);
    setSummaryFailed(false);
    void fetchUsageSummary({ range, groupBy }).then((next) => {
      if (cancelled) return;
      setSummary(next);
      setSummaryFailed(next === null);
      setSummaryReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [range, groupBy, reloadNonce]);

  // AMR account block. Same read path as the Settings AMR card: login status
  // first (its live account projection usually carries the balance), wallet
  // snapshot as the fallback source.
  const [amrStatus, setAmrStatus] = useState<VelaLoginStatus | null>(null);
  const [amrStatusReady, setAmrStatusReady] = useState(false);
  const [amrWallet, setAmrWallet] = useState<AmrWalletSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchVelaLoginStatus().then((next) => {
      if (cancelled) return;
      setAmrStatus(next);
      setAmrStatusReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const amrLoggedIn = amrStatus?.loggedIn === true;

  useEffect(() => {
    if (!amrLoggedIn) {
      setAmrWallet(null);
      return;
    }
    let cancelled = false;
    void fetchAmrWalletSnapshot().then((next) => {
      if (!cancelled) setAmrWallet(next);
    });
    return () => {
      cancelled = true;
    };
  }, [amrLoggedIn, amrStatus?.profile, amrStatus?.user?.id]);

  const formatUsd = useCallback(
    (value: number) => {
      const abs = Math.abs(value);
      // Sub-dollar totals need more precision than cents ($0.0034), while
      // dollar-scale totals read best as plain currency.
      const maximumFractionDigits = abs > 0 && abs < 1 ? 4 : 2;
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits,
      }).format(value);
    },
    [locale],
  );
  const compactNumber = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    [locale],
  );
  const plainNumber = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const costLabel = useCallback(
    (costUsd: number, estimatedCostUsd: number) => {
      const approx = estimatedCostUsd > 0;
      return `${approx ? '≈' : ''}${formatUsd(costUsd + estimatedCostUsd)}`;
    },
    [formatUsd],
  );

  const totals = summary?.totals ?? null;
  const totalTokens = totals ? bucketTotalTokens(totals) : 0;
  const buckets = summary?.buckets ?? [];
  const maxBucketCost = buckets.reduce(
    (max, bucket) => Math.max(max, bucketTotalCost(bucket)),
    0,
  );
  const maxBucketTokens = buckets.reduce(
    (max, bucket) => Math.max(max, bucketTotalTokens(bucket)),
    0,
  );
  const bucketBarRatio = (bucket: UsageBucket): number => {
    if (maxBucketCost > 0) return bucketTotalCost(bucket) / maxBucketCost;
    if (maxBucketTokens > 0) return bucketTotalTokens(bucket) / maxBucketTokens;
    return 0;
  };

  const cacheSavingsLabel =
    totals && totals.cacheSavingsUsd !== null
      ? t('usagePanel.cacheSavings', {
          amount: formatUsd(totals.cacheSavingsUsd),
        })
      : null;
  const cacheHitLabel =
    totals && totals.cacheHitRatio !== null
      ? t('usagePanel.cacheHitRatio', {
          percent: Math.round(totals.cacheHitRatio * 100),
        })
      : null;

  const amrProfile = amrStatus?.profile;
  const amrBalanceLabel = amrLoggedIn
    ? formatVelaBalanceUsd(amrStatus?.account?.balanceUsd) ??
      (amrWallet?.status === 'available'
        ? formatVelaBalanceUsd(amrWallet.balanceUsd)
        : null)
    : null;
  const amrPlanRaw = amrLoggedIn ? amrStatus?.account?.plan?.trim() || null : null;
  const amrPlanLabel = amrPlanRaw
    ? amrPlanRaw.charAt(0).toUpperCase() + amrPlanRaw.slice(1)
    : null;

  // Recharge / Manage links carry the standard AMR entry attribution: record
  // the entry click, then rewrite the anchor href with the attributed URL just
  // before the browser follows it (same pattern as AvatarMenu's Upgrade link).
  const handleAmrLinkClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>, baseUrl: string) => {
      const attribution = recordAmrEntry(analytics.track, 'usage_panel', new Date(), {
        metricsConsent,
      });
      const deviceId = amrHandoffDeviceId({
        metricsConsent,
        resolvedDeviceId: getResolvedDeviceId(),
        installationId: installationId ?? null,
      });
      event.currentTarget.href = attributedAmrUrl(baseUrl, attribution, deviceId);
    },
    [analytics.track, installationId, metricsConsent],
  );

  const amrBenefitChips = [
    t('settings.amrBenefitOfficial'),
    t('settings.amrBenefitLowerPrice'),
    t('settings.amrBenefitManyModels'),
  ];

  return (
    <div className={styles.panel} data-testid="settings-usage-panel">
      <div className={styles.headerRow}>
        <div
          className={styles.rangeSwitch}
          role="tablist"
          aria-label={t('usagePanel.rangeAria')}
        >
          {RANGE_OPTIONS.map((option) => {
            const active = range === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${styles.rangeBtn}${active ? ` ${styles.rangeBtnActive}` : ''}`}
                onClick={() => setRange(option.id)}
              >
                {t(option.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.bigNumbers}>
        <div className={styles.bigNumber}>
          <span className={styles.bigNumberLabel}>{t('usagePanel.totalCost')}</span>
          <span className={styles.bigNumberValue} data-testid="usage-total-cost">
            {totals ? costLabel(totals.costUsd, totals.estimatedCostUsd) : '—'}
          </span>
          <span className={styles.bigNumberHint}>{t('usagePanel.costLegend')}</span>
        </div>
        <div className={styles.bigNumber}>
          <span className={styles.bigNumberLabel}>{t('usagePanel.totalTokens')}</span>
          <span className={styles.bigNumberValue}>
            {totals ? compactNumber.format(totalTokens) : '—'}
          </span>
          <span className={styles.bigNumberHint}>
            {totals
              ? `${t('usagePanel.tokensIn', {
                  count: compactNumber.format(
                    totals.inputTokens + totals.cacheReadTokens,
                  ),
                })} · ${t('usagePanel.tokensOut', {
                  count: compactNumber.format(totals.outputTokens),
                })}`
              : ''}
          </span>
        </div>
        <div className={styles.bigNumber}>
          <span className={styles.bigNumberLabel}>{t('usagePanel.runs')}</span>
          <span className={styles.bigNumberValue}>
            {totals ? plainNumber.format(totals.runs) : '—'}
          </span>
        </div>
      </div>

      {/* Kept mounted; visibility toggled by class so the line doesn't pop. */}
      <p
        className={`${styles.cacheSavings}${cacheSavingsLabel ? ` ${styles.cacheSavingsVisible}` : ''}`}
        aria-hidden={cacheSavingsLabel ? undefined : true}
      >
        <Icon name="sparkles" size={13} />
        <span>
          {cacheSavingsLabel}
          {cacheSavingsLabel && cacheHitLabel ? ` · ${cacheHitLabel}` : ''}
        </span>
      </p>

      {amrStatusReady ? (
        amrLoggedIn ? (
          <section
            className={styles.amrCard}
            aria-label={t('usagePanel.amrBlockTitle')}
            data-testid="usage-amr-signed-in"
          >
            <div className={styles.amrCardMain}>
              <span className={styles.amrCardTitle}>
                {t('usagePanel.amrBlockTitle')}
                <PlanBadge plan={amrPlanLabel} size="sm" />
              </span>
              <span className={styles.amrBalanceValue}>
                {amrBalanceLabel ?? t('common.loading')}
              </span>
              <span className={styles.amrBalanceLabel}>
                {t('settings.amrBalance')}
                {amrStatus?.user?.email ? ` · ${amrStatus.user.email}` : ''}
              </span>
            </div>
            <div className={styles.amrCardActions}>
              <a
                className={styles.amrActionPrimary}
                href={amrRechargeUrlForProfile(amrProfile)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) =>
                  handleAmrLinkClick(event, amrRechargeUrlForProfile(amrProfile))
                }
              >
                {t('usagePanel.amrRecharge')}
              </a>
              <a
                className={styles.amrActionSecondary}
                href={amrConsoleUrlForProfile(amrProfile)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) =>
                  handleAmrLinkClick(event, amrConsoleUrlForProfile(amrProfile))
                }
              >
                {t('usagePanel.amrManage')}
                <Icon name="external-link" size={12} />
              </a>
            </div>
          </section>
        ) : (
          <section
            className={`${styles.amrCard} ${styles.amrPromo}`}
            aria-label={t('usagePanel.amrBlockTitle')}
            data-testid="usage-amr-signed-out"
          >
            <div className={styles.amrCardMain}>
              <span className={styles.amrCardTitle}>
                {t('usagePanel.amrBlockTitle')}
                <span className={styles.amrChips} aria-hidden="true">
                  {amrBenefitChips.map((chip) => (
                    <span key={chip} className={styles.amrChip}>
                      {chip}
                    </span>
                  ))}
                </span>
              </span>
              <span className={styles.amrPromoBody}>{t('usagePanel.amrPromoBody')}</span>
            </div>
            <div className={styles.amrCardActions}>
              <AmrLoginPill
                className={styles.amrLoginPill}
                hideSignedOutStatus
                hideSignedInStatus
                initialStatus={amrStatus}
                skipInitialRefresh
                signInLabel={t('settings.amrSignIn')}
                amrEntrySourceDetail="usage_panel"
                metricsConsent={metricsConsent}
                installationId={installationId}
                onStatusChange={setAmrStatus}
              />
            </div>
          </section>
        )
      ) : null}

      <div
        className={styles.groupTabs}
        role="tablist"
        aria-label={t('usagePanel.breakdownAria')}
      >
        {GROUP_TABS.map((tab) => {
          const active = groupBy === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.groupTab}${active ? ` ${styles.groupTabActive}` : ''}`}
              onClick={() => setGroupBy(tab.id)}
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {!summaryReady ? (
        <div className={styles.stateRow} role="status" aria-busy="true">
          <Icon name="spinner" size={14} className="icon-spin" />
          <span>{t('common.loading')}</span>
        </div>
      ) : summaryFailed ? (
        <div className={styles.stateRow} role="alert">
          <span>{t('usagePanel.loadError')}</span>
          <Button
            variant="subtle"
            onClick={() => setReloadNonce((nonce) => nonce + 1)}
          >
            {t('usagePanel.retry')}
          </Button>
        </div>
      ) : buckets.length === 0 ? (
        <p className={styles.emptyState}>{t('usagePanel.empty')}</p>
      ) : (
        <ul className={styles.bucketList} data-testid="usage-bucket-list">
          {buckets.map((bucket) => (
            <li key={bucket.key} className={styles.bucketRow}>
              <div className={styles.bucketMeta}>
                <span className={styles.bucketLabel} title={bucket.label ?? bucket.key}>
                  {bucket.label?.trim() || bucket.key}
                </span>
                <span className={styles.bucketStats}>
                  <span className={styles.bucketCost}>
                    {costLabel(bucket.costUsd, bucket.estimatedCostUsd)}
                  </span>
                  <span className={styles.bucketTokens}>
                    {t('usagePanel.bucketTokens', {
                      count: compactNumber.format(bucketTotalTokens(bucket)),
                    })}
                  </span>
                  <span className={styles.bucketRuns}>
                    {t('usagePanel.bucketRuns', {
                      count: plainNumber.format(bucket.runs),
                    })}
                  </span>
                </span>
              </div>
              <div className={styles.bucketBarTrack} aria-hidden="true">
                <div
                  className={styles.bucketBarFill}
                  style={{ width: `${Math.max(bucketBarRatio(bucket) * 100, 1.5)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
