// Advisor nudge banner (spec L4): one slim, non-blocking suggestion slot
// rendered directly above the chat composer. Trigger evaluation and
// per-conversation dedup live in runtime/advisor.ts; this component owns the
// pane-state plumbing, the one-shot AMR wallet fetch, and the enter/exit
// animation (element stays mounted; a class toggles per repo animation rules).

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@open-design/components';
import type { AmrWalletSnapshot, ChatSessionMode } from '@open-design/contracts';

import { useT } from '../i18n';
import type { AgentInfo, AppConfig, ChatMessage } from '../types';
import type { ContextUsageSummary } from '../runtime/context-usage';
import { amrRechargeUrlForProfile } from '../runtime/amr-guidance';
import {
  advisorNudgeAlreadyFired,
  advisorTurnsFromMessages,
  evaluateAdvisorNudges,
  markAdvisorNudgeFired,
  parseAmrBalanceUsd,
  resolveAdvisorModel,
  type AdvisorNudge,
} from '../runtime/advisor';
import { Icon } from './Icon';
import styles from './AdvisorBanner.module.css';

const AMR_PROFILE_ENV_KEY = 'OPEN_DESIGN_AMR_PROFILE';
const EXIT_ANIMATION_MS = 140;

interface AdvisorBannerProps {
  conversationId: string | null;
  sessionMode: ChatSessionMode;
  contextUsage: ContextUsageSummary;
  messages: ChatMessage[];
  config?: AppConfig;
  agentsById?: Map<string, AgentInfo>;
  onNewConversation?: () => void;
  newConversationDisabled?: boolean;
  /** Same pref-update path InlineModelSwitcher uses (App.handleAgentModelChange). */
  onAgentModelChange?: (
    agentId: string,
    choice: { model?: string; reasoning?: string },
  ) => void;
}

export function AdvisorBanner({
  conversationId,
  sessionMode,
  contextUsage,
  messages,
  config,
  agentsById,
  onNewConversation,
  newConversationDisabled = false,
  onAgentModelChange,
}: AdvisorBannerProps) {
  const t = useT();
  const [active, setActive] = useState<AdvisorNudge | null>(null);
  const [visible, setVisible] = useState(false);
  const [amrBalanceUsd, setAmrBalanceUsd] = useState<number | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // T4 input: fetch the AMR wallet snapshot ONCE per conversation open. The
  // pane is keyed by conversation id, so a mount === one conversation open.
  const walletFetchedRef = useRef(false);
  useEffect(() => {
    if (walletFetchedRef.current) return;
    if (config?.mode !== 'daemon' || config.agentId !== 'amr') return;
    walletFetchedRef.current = true;
    let stale = false;
    void fetchAmrWalletBalance().then((snapshot) => {
      if (stale || !snapshot || snapshot.status !== 'available') return;
      setAmrBalanceUsd(parseAmrBalanceUsd(snapshot.balanceUsd));
    });
    return () => {
      stale = true;
    };
  }, [config?.mode, config?.agentId]);

  const candidate = useMemo(() => {
    const { agentId, currentModel, agentModels } = resolveAdvisorModel(config, agentsById);
    const nudges = evaluateAdvisorNudges({
      sessionMode,
      contextRatio: contextUsage.usedRatio,
      // ChatPane already mounts ContextUsageWarning for the ≥90% critical
      // tier, so this banner only serves the 75% tier here.
      criticalContextCoveredElsewhere: true,
      agentId,
      currentModel,
      agentModels,
      recentTurns: advisorTurnsFromMessages(messages),
      amrBalanceUsd,
    });
    return nudges.find((nudge) => !advisorNudgeAlreadyFired(conversationId, nudge.id)) ?? null;
  }, [agentsById, amrBalanceUsd, config, contextUsage.usedRatio, conversationId, messages, sessionMode]);

  // Promote the first non-fired candidate into the visible slot. Firing is
  // recorded on impression so each trigger shows at most once per
  // conversation, even across pane remounts.
  useEffect(() => {
    if (!candidate || active) return;
    markAdvisorNudgeFired(conversationId, candidate.id);
    setActive(candidate);
    // Mount collapsed first, then flip the class next frame so the enter
    // transition actually plays (the element itself never unmounts).
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [active, candidate, conversationId]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    // Clear the content only after the 140ms exit transition finishes so the
    // banner doesn't blank out mid-collapse.
    exitTimerRef.current = setTimeout(() => setActive(null), EXIT_ANIMATION_MS + 40);
  };

  const runAction = () => {
    if (!active) return;
    if (active.id === 'context-new-session') {
      if (!newConversationDisabled) onNewConversation?.();
    } else if (active.id === 'model-overkill' || active.id === 'model-underpowered') {
      onAgentModelChange?.(active.agentId, { model: active.to.id });
    } else if (active.id === 'amr-low-balance') {
      const profile = config?.agentCliEnv?.amr?.[AMR_PROFILE_ENV_KEY] ?? null;
      window.open(amrRechargeUrlForProfile(profile), '_blank', 'noopener,noreferrer');
    }
    dismiss();
  };

  const copy = active ? nudgeCopy(active, t) : null;
  const emphasized =
    active?.id === 'amr-low-balance' ||
    (active?.id === 'context-new-session' && active.escalated);
  const actionDisabled =
    active?.id === 'context-new-session'
      ? newConversationDisabled || !onNewConversation
      : active?.id === 'model-overkill' || active?.id === 'model-underpowered'
        ? !onAgentModelChange
        : false;

  return (
    <div
      className={[styles.slot, visible && copy ? styles.slotActive : '']
        .filter(Boolean)
        .join(' ')}
      data-testid="advisor-banner-slot"
      aria-hidden={!visible || !copy}
    >
      <div className={styles.inner}>
        {copy ? (
          <div
            className={[styles.banner, emphasized ? styles.bannerEmphasized : '']
              .filter(Boolean)
              .join(' ')}
            role="status"
            data-testid="advisor-banner"
            data-advisor-trigger={active?.id}
          >
            <span className={styles.message}>{copy.message}</span>
            <span className={styles.actions}>
              <Button
                variant={emphasized ? 'primary' : 'primary-ghost'}
                className={styles.actionButton}
                disabled={actionDisabled}
                onClick={runAction}
                data-testid="advisor-banner-action"
              >
                {copy.action}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={styles.dismissButton}
                aria-label={t('advisor.dismissAria')}
                title={t('advisor.dismissAria')}
                onClick={dismiss}
                data-testid="advisor-banner-dismiss"
              >
                <Icon name="close" size={12} />
              </Button>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function nudgeCopy(
  nudge: AdvisorNudge,
  t: ReturnType<typeof useT>,
): { message: string; action: string } {
  switch (nudge.id) {
    case 'context-new-session':
      return nudge.escalated
        ? {
            message: t('advisor.contextCritical.message', { percent: nudge.percent }),
            action: t('advisor.contextHigh.action'),
          }
        : {
            message: t('advisor.contextHigh.message', { percent: nudge.percent }),
            action: t('advisor.contextHigh.action'),
          };
    case 'model-overkill':
      return {
        message: t('advisor.modelOverkill.message', {
          current: nudge.from.label,
          fast: nudge.to.label,
        }),
        action: t('advisor.modelSwitch.action', { model: nudge.to.label }),
      };
    case 'model-underpowered':
      return {
        message: t('advisor.modelUnderpowered.message', {
          current: nudge.from.label,
          powerful: nudge.to.label,
        }),
        action: t('advisor.modelSwitch.action', { model: nudge.to.label }),
      };
    case 'amr-low-balance':
      return {
        message: t('advisor.lowBalance.message', {
          balance: nudge.balanceUsd.toFixed(2),
        }),
        action: t('advisor.lowBalance.action'),
      };
  }
}

// Kept local (not in providers/daemon.ts) — that module is owned elsewhere,
// and this is the banner's only network dependency.
async function fetchAmrWalletBalance(): Promise<AmrWalletSnapshot | null> {
  try {
    const resp = await fetch('/api/integrations/vela/wallet', { cache: 'no-store' });
    if (!resp.ok) return null;
    return (await resp.json()) as AmrWalletSnapshot;
  } catch {
    return null;
  }
}
