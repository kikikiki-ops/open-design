import { describe, expect, it } from 'vitest';
import type { PersistedAgentEvent } from '@open-design/contracts';
import {
  computerStepsFromEvents,
  deriveCurrentRound,
  taskStepBrief,
  type TaskStep,
} from '../../src/runtime/task-steps';

const t = (key: string, vars?: Record<string, string | number>) =>
  vars ? `${key} ${Object.values(vars).join(' ')}` : key;

describe('deriveCurrentRound', () => {
  it('returns the latest assistant round with derived steps and live status', () => {
    const events: PersistedAgentEvent[] = [
      { kind: 'tool_use', id: 't1', name: 'WebSearch', input: { query: 'x' } },
    ];
    const round = deriveCurrentRound([
      { id: 'u1', role: 'user' },
      { id: 'a1', role: 'assistant', runStatus: 'running', events },
    ]);
    expect(round?.assistantMessageId).toBe('a1');
    expect(round?.live).toBe(true);
    expect(round?.steps).toHaveLength(1);
    expect(round?.steps[0]?.kind).toBe('search');
  });

  it('treats a finished message without an explicit runStatus as ended', () => {
    const round = deriveCurrentRound([{ id: 'a1', role: 'assistant', endedAt: 5, events: [] }]);
    expect(round?.status).toBe('succeeded');
    expect(round?.live).toBe(false);
  });

  it('returns null when there is no assistant message', () => {
    expect(deriveCurrentRound([{ id: 'u1', role: 'user' }])).toBeNull();
    expect(deriveCurrentRound([])).toBeNull();
  });
});

describe('taskStepBrief', () => {
  const brief = (step: TaskStep) => taskStepBrief(step, t);

  it('uses the file basename for file steps and the raw query for search', () => {
    expect(brief({ id: '1', kind: 'read', status: 'done', target: 'src/deep/app.ts' })).toContain('app.ts');
    expect(brief({ id: '2', kind: 'search', status: 'done', target: 'hello world' })).toContain('hello world');
    expect(brief({ id: '3', kind: 'plan', status: 'done' })).toBe('task.step.plan');
  });
});

describe('computerStepsFromEvents', () => {
  it('joins each derived step with its raw tool_use and tool_result', () => {
    const steps = computerStepsFromEvents([
      { kind: 'tool_use', id: 't1', name: 'Read', input: { file_path: 'x.ts' } },
      { kind: 'tool_result', toolUseId: 't1', content: 'hi', isError: false },
    ]);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.use?.name).toBe('Read');
    expect(steps[0]?.result?.content).toBe('hi');
  });
});
