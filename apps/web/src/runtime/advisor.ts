// Advisor nudges (spec L4, model-cost-usage-transparency): pure trigger
// evaluation plus per-conversation dedup for the slim non-blocking banner
// that AdvisorBanner renders above the chat composer. This module holds no
// React and no fetch — ChatPane/AdvisorBanner feed it plain data so every
// trigger is unit-testable.
//
// Implemented triggers:
//   T1 context-new-session — context window ≥75% used → suggest a fresh
//      session; escalates copy/styling at ≥90% unless the existing
//      ContextUsageWarning already owns the critical tier on this surface.
//   T2 model-overkill      — 'chat' mode on a 'powerful' model with ≥3
//      consecutive completed short turns → suggest the agent's 'fast' model.
//   T3 model-underpowered  — 'design' mode on a 'fast' model → suggest the
//      agent's 'powerful' model.
//   T4 amr-low-balance     — AMR wallet balance under $2 → recharge nudge.
//      TODO: also compare against 2× the 7-day daily-average spend once
//      /api/usage/summary data is plumbed into the chat pane.
//   T5 (OUT OF SCOPE for this pass) — "high local spend on non-AMR agents →
//      suggest Open Design Cloud" growth nudge. TODO(T5): add an
//      'amr-signup-savings' trigger fed by /api/usage/summary once the
//      usage dashboard lands.

import type {
  AgentInfo,
  AgentModelOption,
  AppConfig,
  ChatMessage,
} from '../types';
import type { ChatSessionMode } from '@open-design/contracts';

export const ADVISOR_CONTEXT_WARNING_RATIO = 0.75;
export const ADVISOR_CONTEXT_CRITICAL_RATIO = 0.9;
export const ADVISOR_SHORT_TURN_OUTPUT_TOKENS = 1000;
export const ADVISOR_SHORT_TURN_STREAK = 3;
export const ADVISOR_LOW_BALANCE_USD = 2;

export type AdvisorTriggerId =
  | 'context-new-session'
  | 'model-overkill'
  | 'model-underpowered'
  | 'amr-low-balance';

export type AdvisorNudge =
  | {
      id: 'context-new-session';
      /** True at the ≥90% tier — banner escalates copy + primary styling. */
      escalated: boolean;
      /** Rounded percent of the context window in use, for copy interpolation. */
      percent: number;
    }
  | {
      id: 'model-overkill';
      agentId: string;
      from: AgentModelOption;
      to: AgentModelOption;
    }
  | {
      id: 'model-underpowered';
      agentId: string;
      from: AgentModelOption;
      to: AgentModelOption;
    }
  | { id: 'amr-low-balance'; balanceUsd: number };

/** One completed-or-not assistant turn, reduced to what the triggers need. */
export interface AdvisorTurn {
  completed: boolean;
  outputTokens: number | null;
}

export interface AdvisorInput {
  sessionMode: ChatSessionMode;
  /** `ContextUsageSummary.usedRatio` for the active conversation. */
  contextRatio: number;
  /**
   * True when another surface (the existing ContextUsageWarning) already
   * renders the ≥90% critical warning: the banner then only serves the 75%
   * tier and stays silent at the critical tier instead of doubling up.
   */
  criticalContextCoveredElsewhere: boolean;
  agentId: string | null;
  /** Enriched catalog entry for the currently selected model, when known. */
  currentModel: AgentModelOption | null;
  /** The active agent's enriched model options (speedTier and friends). */
  agentModels: AgentModelOption[];
  /** Assistant turns in chronological order (oldest first). */
  recentTurns: AdvisorTurn[];
  /**
   * Parsed AMR wallet balance in USD. Callers pass null when the agent is
   * not AMR or the wallet hasn't been fetched — T4 only fires on a number.
   */
  amrBalanceUsd: number | null;
}

/**
 * Evaluate every advisor trigger against the current pane state and return
 * the matching nudges ordered most-urgent first. Dedup is NOT applied here —
 * callers filter through `advisorNudgeAlreadyFired` so the pure evaluation
 * stays deterministic and testable.
 */
export function evaluateAdvisorNudges(input: AdvisorInput): AdvisorNudge[] {
  const nudges: AdvisorNudge[] = [];

  const lowBalance = evaluateLowBalance(input);
  if (lowBalance) nudges.push(lowBalance);

  const context = evaluateContext(input);
  if (context) nudges.push(context);

  const underpowered = evaluateUnderpowered(input);
  if (underpowered) nudges.push(underpowered);

  const overkill = evaluateOverkill(input);
  if (overkill) nudges.push(overkill);

  return nudges;
}

function evaluateContext(input: AdvisorInput): AdvisorNudge | null {
  const ratio = input.contextRatio;
  if (!Number.isFinite(ratio) || ratio < ADVISOR_CONTEXT_WARNING_RATIO) return null;
  const percent = Math.round(ratio * 100);
  if (ratio >= ADVISOR_CONTEXT_CRITICAL_RATIO) {
    // The critical tier is already owned by ContextUsageWarning on surfaces
    // that mount it — showing a second banner would just double the noise.
    if (input.criticalContextCoveredElsewhere) return null;
    return { id: 'context-new-session', escalated: true, percent };
  }
  return { id: 'context-new-session', escalated: false, percent };
}

function evaluateOverkill(input: AdvisorInput): AdvisorNudge | null {
  if (input.sessionMode !== 'chat') return null;
  if (!input.agentId || !input.currentModel) return null;
  if (input.currentModel.speedTier !== 'powerful') return null;
  if (!hasShortTurnStreak(input.recentTurns)) return null;
  const to = firstModelWithTier(input.agentModels, 'fast', input.currentModel.id);
  if (!to) return null;
  return { id: 'model-overkill', agentId: input.agentId, from: input.currentModel, to };
}

function evaluateUnderpowered(input: AdvisorInput): AdvisorNudge | null {
  if (input.sessionMode !== 'design') return null;
  if (!input.agentId || !input.currentModel) return null;
  if (input.currentModel.speedTier !== 'fast') return null;
  const to = firstModelWithTier(input.agentModels, 'powerful', input.currentModel.id);
  if (!to) return null;
  return { id: 'model-underpowered', agentId: input.agentId, from: input.currentModel, to };
}

function evaluateLowBalance(input: AdvisorInput): AdvisorNudge | null {
  const balance = input.amrBalanceUsd;
  if (balance == null || !Number.isFinite(balance)) return null;
  if (balance >= ADVISOR_LOW_BALANCE_USD) return null;
  return { id: 'amr-low-balance', balanceUsd: balance };
}

/**
 * True when the trailing turns are ≥3 consecutive COMPLETED short answers
 * (each with a reported output under 1k tokens). Any incomplete turn or a
 * turn without usage data breaks the streak — we only nudge on evidence.
 */
export function hasShortTurnStreak(turns: AdvisorTurn[]): boolean {
  let streak = 0;
  for (let i = turns.length - 1; i >= 0; i -= 1) {
    const turn = turns[i]!;
    if (
      !turn.completed ||
      turn.outputTokens == null ||
      turn.outputTokens >= ADVISOR_SHORT_TURN_OUTPUT_TOKENS
    ) {
      break;
    }
    streak += 1;
    if (streak >= ADVISOR_SHORT_TURN_STREAK) return true;
  }
  return streak >= ADVISOR_SHORT_TURN_STREAK;
}

function firstModelWithTier(
  models: AgentModelOption[],
  tier: NonNullable<AgentModelOption['speedTier']>,
  excludeId: string,
): AgentModelOption | null {
  for (const model of models) {
    if (model.deprecated) continue;
    if (model.id === excludeId) continue;
    if (model.speedTier === tier) return model;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Pane-state → AdvisorInput helpers
// ---------------------------------------------------------------------------

/** Reduce the chat transcript to the assistant turns the triggers inspect. */
export function advisorTurnsFromMessages(messages: ChatMessage[]): AdvisorTurn[] {
  const turns: AdvisorTurn[] = [];
  for (const message of messages) {
    if (message.role !== 'assistant') continue;
    turns.push({
      completed: message.runStatus === 'succeeded',
      outputTokens: latestOutputTokens(message),
    });
  }
  return turns;
}

function latestOutputTokens(message: ChatMessage): number | null {
  const events = message.events ?? [];
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event?.kind !== 'usage') continue;
    return typeof event.outputTokens === 'number' && Number.isFinite(event.outputTokens)
      ? event.outputTokens
      : null;
  }
  return null;
}

/**
 * Resolve the active agent's current model against its enriched catalog
 * options. Mirrors how the config prefs pick a model (explicit
 * `agentModels[agentId].model`, else the agent's first option) without
 * importing the context-usage module. BYOK ('api') mode returns nulls —
 * the model-mismatch triggers only understand daemon-agent catalogs.
 */
export function resolveAdvisorModel(
  config: AppConfig | undefined,
  agentsById: Map<string, AgentInfo> | undefined,
): { agentId: string | null; currentModel: AgentModelOption | null; agentModels: AgentModelOption[] } {
  if (!config || config.mode !== 'daemon' || !config.agentId) {
    return { agentId: null, currentModel: null, agentModels: [] };
  }
  const agentId = config.agentId;
  const models = agentsById?.get(agentId)?.models ?? [];
  const configured = config.agentModels?.[agentId]?.model?.trim();
  const modelId = configured && configured !== 'default' ? configured : models[0]?.id ?? null;
  const currentModel = modelId
    ? models.find((model) => model.id === modelId) ?? null
    : null;
  return { agentId, currentModel, agentModels: models };
}

/** Parse the wallet snapshot's `balanceUsd` string ("12.40") defensively. */
export function parseAmrBalanceUsd(balance: string | null | undefined): number | null {
  if (typeof balance !== 'string') return null;
  const parsed = Number.parseFloat(balance.replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

// ---------------------------------------------------------------------------
// Per-conversation dedup
// ---------------------------------------------------------------------------

// Module-level so it survives ChatPane remounts (the pane is keyed by
// conversation id, so switching away and back would otherwise re-fire a
// nudge). Session-scoped on purpose: a reload starts a fresh advisor slate.
const firedByConversation = new Map<string, Set<AdvisorTriggerId>>();

const NO_CONVERSATION_KEY = '__no-conversation__';

export function advisorNudgeAlreadyFired(
  conversationId: string | null,
  id: AdvisorTriggerId,
): boolean {
  return firedByConversation.get(conversationId ?? NO_CONVERSATION_KEY)?.has(id) ?? false;
}

export function markAdvisorNudgeFired(
  conversationId: string | null,
  id: AdvisorTriggerId,
): void {
  const key = conversationId ?? NO_CONVERSATION_KEY;
  const fired = firedByConversation.get(key);
  if (fired) fired.add(id);
  else firedByConversation.set(key, new Set([id]));
}

/** Test-only: clear the module-level dedup state between specs. */
export function resetAdvisorDedupForTests(): void {
  firedByConversation.clear();
}
