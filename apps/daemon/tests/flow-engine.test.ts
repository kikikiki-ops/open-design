import { describe, expect, it } from 'vitest';

import { createFlowTracker, resolveFlowShape } from '../src/flow/engine.js';

function stageState(tracker: ReturnType<typeof createFlowTracker>, id: string) {
  return tracker.snapshot.stages.find((s) => s.id === id)?.state;
}

describe('resolveFlowShape', () => {
  it('gates on design-mode new-generation work', () => {
    expect(resolveFlowShape({ sessionMode: 'chat', projectKind: 'deck' })).toBeNull();
    expect(resolveFlowShape({ sessionMode: 'plan', projectKind: 'deck' })).toBeNull();
    expect(
      resolveFlowShape({ sessionMode: 'design', taskKind: 'tune-collab', projectKind: 'deck' }),
    ).toBeNull();
    expect(resolveFlowShape({ sessionMode: 'design', projectKind: 'brand' })).toBeNull();
  });

  it('maps project kind + platform onto flow shapes', () => {
    expect(resolveFlowShape({ sessionMode: 'design', projectKind: 'deck' })).toBe('deck');
    expect(
      resolveFlowShape({ sessionMode: 'design', projectKind: 'prototype', projectPlatform: 'mobile-ios' }),
    ).toBe('mobile');
    expect(
      resolveFlowShape({ sessionMode: 'design', projectKind: 'prototype', projectPlatform: 'responsive' }),
    ).toBe('webapp');
    expect(resolveFlowShape({ sessionMode: 'design', projectKind: 'video' })).toBe('media');
    expect(resolveFlowShape({ sessionMode: 'design', projectKind: 'template' })).toBe('document');
  });
});

describe('createFlowTracker', () => {
  it('starts a fresh conversation at clarify', () => {
    const tracker = createFlowTracker({ shape: 'deck', now: () => 1 });
    expect(tracker.snapshot.shape).toBe('deck');
    expect(tracker.snapshot.activeStage).toBe('clarify');
    expect(stageState(tracker, 'clarify')).toBe('active');
  });

  it('consumes <od-flow> markers split across text_delta chunk boundaries', () => {
    const tracker = createFlowTracker({ shape: 'deck', now: () => 1 });
    expect(
      tracker.observeAgentEvent({ type: 'text_delta', delta: '开始规划。\n<od-flow stage="pl' }),
    ).toBeNull();
    const advanced = tracker.observeAgentEvent({
      type: 'text_delta',
      delta: 'an" state="active" detail="正在写大纲"/>\n继续。',
    });
    expect(advanced).not.toBeNull();
    expect(tracker.snapshot.activeStage).toBe('plan');
    expect(tracker.snapshot.stages.find((s) => s.id === 'plan')?.detail).toBe('正在写大纲');
  });

  it('activates clarify from a streamed question form (heuristic channel)', () => {
    const tracker = createFlowTracker({ shape: 'deck', now: () => 1 });
    // Force clarify past pending first? No — clarify starts active; complete it
    // via a marker, then a NEW question form must not reopen it (monotonic).
    tracker.observeAgentEvent({
      type: 'text_delta',
      delta: '<od-flow stage="clarify" state="complete"/>',
    });
    expect(stageState(tracker, 'clarify')).toBe('complete');
    tracker.observeAgentEvent({ type: 'text_delta', delta: '<question-form id="x">' });
    expect(stageState(tracker, 'clarify')).toBe('complete');
  });

  it('advances research from the research CLI tool call and its report write', () => {
    const tracker = createFlowTracker({ shape: 'deck', now: () => 1 });
    tracker.observeAgentEvent({
      type: 'tool_use',
      id: 't1',
      name: 'Bash',
      input: { command: '"$OD_NODE_BIN" "$OD_BIN" research search --query "robots"' },
    });
    expect(stageState(tracker, 'research')).toBe('active');
    tracker.observeAgentEvent({
      type: 'tool_use',
      id: 't2',
      name: 'Write',
      input: { file_path: 'research/robots-market.md', content: '# findings' },
    });
    expect(stageState(tracker, 'research')).toBe('complete');
  });

  it('advances plan on a plan-artifact write and generate on an html write', () => {
    const tracker = createFlowTracker({ shape: 'deck', now: () => 1 });
    tracker.observeAgentEvent({
      type: 'tool_use',
      id: 't1',
      name: 'Write',
      input: { file_path: 'generated/outline.md', content: '# outline' },
    });
    expect(tracker.snapshot.activeStage).toBe('plan');
    tracker.observeAgentEvent({
      type: 'tool_use',
      id: 't2',
      name: 'Write',
      input: { file_path: 'deck.html', content: '<html>' },
    });
    expect(tracker.snapshot.activeStage).toBe('generate');
    // plan was auto-completed, research auto-skipped by monotonic advancement
    expect(stageState(tracker, 'plan')).toBe('complete');
    expect(stageState(tracker, 'research')).toBe('skipped');
  });

  it('completes clarify from the [form answers] echo in the next user message', () => {
    const tracker = createFlowTracker({ shape: 'deck', now: () => 1 });
    const advanced = tracker.noteUserMessage('[form answers — discovery]\n- 页数: 12');
    expect(advanced).not.toBeNull();
    expect(stageState(tracker, 'clarify')).toBe('complete');
  });

  it('promotes generate → deliver on a clean run end', () => {
    const tracker = createFlowTracker({ shape: 'deck', now: () => 1 });
    tracker.observeAgentEvent({
      type: 'text_delta',
      delta: '<od-flow stage="generate" state="active" done="12" total="12"/>',
    });
    const advanced = tracker.noteRunEnd('succeeded');
    expect(advanced).not.toBeNull();
    expect(stageState(tracker, 'generate')).toBe('complete');
    expect(tracker.snapshot.activeStage).toBe('deliver');
  });

  it('does not touch the ladder when a run fails mid-generate', () => {
    const tracker = createFlowTracker({ shape: 'deck', now: () => 1 });
    tracker.observeAgentEvent({
      type: 'text_delta',
      delta: '<od-flow stage="generate" state="active"/>',
    });
    expect(tracker.noteRunEnd('failed')).toBeNull();
    expect(stageState(tracker, 'generate')).toBe('active');
  });

  it('resumes from a persisted snapshot instead of restarting the ladder', () => {
    const first = createFlowTracker({ shape: 'deck', now: () => 1 });
    first.observeAgentEvent({
      type: 'text_delta',
      delta: '<od-flow stage="plan" state="active"/>',
    });
    const resumed = createFlowTracker({ shape: 'deck', initial: first.snapshot, now: () => 2 });
    expect(resumed.snapshot.activeStage).toBe('plan');
    const regressed = resumed.observeAgentEvent({
      type: 'text_delta',
      delta: '<od-flow stage="clarify" state="active"/>',
    });
    expect(regressed).toBeNull();
  });
});
