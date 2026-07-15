import { describe, expect, it } from 'vitest';

import type { PersistedAgentEvent } from '../src/api/chat';
import { deriveTaskSteps, taskStepKindForTool } from '../src/api/tasks';

describe('taskStepKindForTool', () => {
  it('classifies tools by their wire name', () => {
    expect(taskStepKindForTool('WebSearch')).toBe('search');
    expect(taskStepKindForTool('WebFetch')).toBe('search-drilldown');
    expect(taskStepKindForTool('Read')).toBe('read');
    expect(taskStepKindForTool('Write')).toBe('write');
    expect(taskStepKindForTool('Edit')).toBe('edit');
    expect(taskStepKindForTool('TodoWrite')).toBe('plan');
    expect(taskStepKindForTool('Bash')).toBe('command');
    expect(taskStepKindForTool('Glob')).toBe('list');
    expect(taskStepKindForTool('SomethingElse')).toBe('tool');
  });
});

describe('deriveTaskSteps', () => {
  it('projects tool calls into ordered steps and joins their results', () => {
    const events: PersistedAgentEvent[] = [
      { kind: 'text', text: 'Working on it' },
      { kind: 'tool_use', id: 't1', name: 'WebSearch', input: { query: 'agent replay' } },
      { kind: 'tool_result', toolUseId: 't1', content: '10 results', isError: false },
      { kind: 'tool_use', id: 't2', name: 'Read', input: { file_path: 'src/app.ts' } },
      // t2 has no result yet → still running
    ];

    const steps = deriveTaskSteps(events);

    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({
      id: 't1',
      kind: 'search',
      tool: 'WebSearch',
      target: 'agent replay',
      status: 'done',
    });
    expect(steps[1]).toMatchObject({
      id: 't2',
      kind: 'read',
      target: 'src/app.ts',
      status: 'running',
    });
  });

  it('marks errored tools and dedupes repeated tool_use ids', () => {
    const events: PersistedAgentEvent[] = [
      { kind: 'tool_use', id: 't1', name: 'Bash', input: { command: 'ls' } },
      { kind: 'tool_use', id: 't1', name: 'Bash', input: { command: 'ls' } },
      { kind: 'tool_result', toolUseId: 't1', content: 'boom', isError: true },
    ];

    const steps = deriveTaskSteps(events);

    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ kind: 'command', status: 'error', isError: true });
  });

  it('collapses consecutive thinking events into one step and records artifacts', () => {
    const events: PersistedAgentEvent[] = [
      { kind: 'thinking', text: 'Consider ' },
      { kind: 'thinking', text: 'the plan.' },
      {
        kind: 'live_artifact',
        action: 'created',
        projectId: 'p1',
        artifactId: 'a1',
        title: 'deck.html',
      },
    ];

    const steps = deriveTaskSteps(events);

    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({ kind: 'thinking', target: 'Consider the plan.' });
    expect(steps[1]).toMatchObject({ kind: 'generate', target: 'deck.html' });
  });
});
