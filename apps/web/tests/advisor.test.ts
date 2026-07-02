import { beforeEach, describe, expect, it } from 'vitest';

import {
  advisorNudgeAlreadyFired,
  advisorTurnsFromMessages,
  evaluateAdvisorNudges,
  hasShortTurnStreak,
  markAdvisorNudgeFired,
  parseAmrBalanceUsd,
  resetAdvisorDedupForTests,
  resolveAdvisorModel,
  type AdvisorInput,
} from '../src/runtime/advisor';
import type { AgentInfo, AppConfig, ChatMessage } from '../src/types';

function baseInput(overrides: Partial<AdvisorInput> = {}): AdvisorInput {
  return {
    sessionMode: 'design',
    contextRatio: 0,
    criticalContextCoveredElsewhere: true,
    agentId: null,
    currentModel: null,
    agentModels: [],
    recentTurns: [],
    amrBalanceUsd: null,
    ...overrides,
  };
}

const POWERFUL = { id: 'big', label: 'Big', speedTier: 'powerful' as const };
const FAST = { id: 'small', label: 'Small', speedTier: 'fast' as const };
const FAST_DEPRECATED = {
  id: 'old-small',
  label: 'Old Small',
  speedTier: 'fast' as const,
  deprecated: true,
};

describe('evaluateAdvisorNudges', () => {
  it('fires the T1 context nudge at 75% and not below', () => {
    expect(evaluateAdvisorNudges(baseInput({ contextRatio: 0.74 }))).toEqual([]);
    expect(evaluateAdvisorNudges(baseInput({ contextRatio: 0.76 }))).toEqual([
      { id: 'context-new-session', escalated: false, percent: 76 },
    ]);
  });

  it('suppresses the critical tier when another surface covers 90%', () => {
    expect(
      evaluateAdvisorNudges(
        baseInput({ contextRatio: 0.93, criticalContextCoveredElsewhere: true }),
      ),
    ).toEqual([]);
    expect(
      evaluateAdvisorNudges(
        baseInput({ contextRatio: 0.93, criticalContextCoveredElsewhere: false }),
      ),
    ).toEqual([{ id: 'context-new-session', escalated: true, percent: 93 }]);
  });

  it('fires T2 overkill only in chat mode on a powerful model after 3 short completed turns', () => {
    const shortTurn = { completed: true, outputTokens: 400 };
    const input = baseInput({
      sessionMode: 'chat',
      agentId: 'claude',
      currentModel: POWERFUL,
      agentModels: [POWERFUL, FAST_DEPRECATED, FAST],
      recentTurns: [shortTurn, shortTurn, shortTurn],
    });
    expect(evaluateAdvisorNudges(input)).toEqual([
      { id: 'model-overkill', agentId: 'claude', from: POWERFUL, to: FAST },
    ]);
    // Two short turns → no nudge.
    expect(
      evaluateAdvisorNudges({ ...input, recentTurns: [shortTurn, shortTurn] }),
    ).toEqual([]);
    // A long turn in the trailing window breaks the streak.
    expect(
      evaluateAdvisorNudges({
        ...input,
        recentTurns: [shortTurn, { completed: true, outputTokens: 4000 }, shortTurn, shortTurn],
      }),
    ).toEqual([]);
    // Design mode never fires overkill.
    expect(evaluateAdvisorNudges({ ...input, sessionMode: 'design' })).toEqual([]);
  });

  it('fires T3 underpowered in design mode on a fast model, skipping deprecated targets', () => {
    const deprecatedPowerful = { ...POWERFUL, id: 'old-big', deprecated: true };
    const nudges = evaluateAdvisorNudges(
      baseInput({
        sessionMode: 'design',
        agentId: 'claude',
        currentModel: FAST,
        agentModels: [FAST, deprecatedPowerful, POWERFUL],
      }),
    );
    expect(nudges).toEqual([
      { id: 'model-underpowered', agentId: 'claude', from: FAST, to: POWERFUL },
    ]);
  });

  it('fires T4 low balance under $2 and orders it first', () => {
    const nudges = evaluateAdvisorNudges(
      baseInput({ contextRatio: 0.8, amrBalanceUsd: 1.25 }),
    );
    expect(nudges[0]).toEqual({ id: 'amr-low-balance', balanceUsd: 1.25 });
    expect(nudges[1]?.id).toBe('context-new-session');
    expect(
      evaluateAdvisorNudges(baseInput({ amrBalanceUsd: 2 })),
    ).toEqual([]);
  });
});

describe('hasShortTurnStreak', () => {
  it('requires usage data on every turn in the streak', () => {
    const short = { completed: true, outputTokens: 100 };
    expect(hasShortTurnStreak([short, { completed: true, outputTokens: null }, short])).toBe(false);
    expect(hasShortTurnStreak([short, short, short])).toBe(true);
    expect(hasShortTurnStreak([{ completed: false, outputTokens: 100 }, short, short])).toBe(false);
  });
});

describe('advisorTurnsFromMessages', () => {
  it('extracts completed flags and the latest usage output tokens', () => {
    const messages = [
      { id: 'u1', role: 'user', content: 'hi' },
      {
        id: 'a1',
        role: 'assistant',
        content: 'hello',
        runStatus: 'succeeded',
        events: [
          { kind: 'text', text: 'hello' },
          { kind: 'usage', inputTokens: 100, outputTokens: 42 },
        ],
      },
      { id: 'a2', role: 'assistant', content: '', runStatus: 'failed', events: [] },
    ] as unknown as ChatMessage[];
    expect(advisorTurnsFromMessages(messages)).toEqual([
      { completed: true, outputTokens: 42 },
      { completed: false, outputTokens: null },
    ]);
  });
});

describe('resolveAdvisorModel', () => {
  const agents = new Map<string, AgentInfo>([
    [
      'claude',
      { id: 'claude', name: 'Claude', bin: 'claude', available: true, models: [POWERFUL, FAST] },
    ],
  ]);

  it('resolves the configured model against the enriched catalog', () => {
    const config = {
      mode: 'daemon',
      agentId: 'claude',
      agentModels: { claude: { model: 'small' } },
    } as unknown as AppConfig;
    expect(resolveAdvisorModel(config, agents)).toEqual({
      agentId: 'claude',
      currentModel: FAST,
      agentModels: [POWERFUL, FAST],
    });
  });

  it('falls back to the first option and returns nulls in api mode', () => {
    const config = { mode: 'daemon', agentId: 'claude' } as unknown as AppConfig;
    expect(resolveAdvisorModel(config, agents).currentModel).toEqual(POWERFUL);
    const api = { mode: 'api', agentId: 'claude' } as unknown as AppConfig;
    expect(resolveAdvisorModel(api, agents)).toEqual({
      agentId: null,
      currentModel: null,
      agentModels: [],
    });
  });
});

describe('parseAmrBalanceUsd', () => {
  it('parses currency-ish strings and rejects garbage', () => {
    expect(parseAmrBalanceUsd('12.40')).toBe(12.4);
    expect(parseAmrBalanceUsd('$1.25')).toBe(1.25);
    expect(parseAmrBalanceUsd('n/a')).toBeNull();
    expect(parseAmrBalanceUsd(null)).toBeNull();
  });
});

describe('per-conversation dedup', () => {
  beforeEach(() => {
    resetAdvisorDedupForTests();
  });

  it('fires each trigger at most once per conversation', () => {
    expect(advisorNudgeAlreadyFired('c1', 'context-new-session')).toBe(false);
    markAdvisorNudgeFired('c1', 'context-new-session');
    expect(advisorNudgeAlreadyFired('c1', 'context-new-session')).toBe(true);
    expect(advisorNudgeAlreadyFired('c1', 'model-overkill')).toBe(false);
    expect(advisorNudgeAlreadyFired('c2', 'context-new-session')).toBe(false);
  });
});
