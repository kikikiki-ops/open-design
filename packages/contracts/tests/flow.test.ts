import { describe, expect, it } from 'vitest';

import {
  FLOW_SHAPES,
  FLOW_STAGE_ORDER,
  applyFlowMarker,
  createFlowSnapshot,
  flowShapeFromModePlatform,
  parseOdFlowMarkers,
  stripOdFlowMarkers,
} from '../src/api/flow';

describe('flow shape registry', () => {
  it('declares every stage in ladder order for every shape', () => {
    for (const spec of Object.values(FLOW_SHAPES)) {
      const order = spec.stages.map((s) => FLOW_STAGE_ORDER.indexOf(s));
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      expect(spec.planArtifacts.length).toBeGreaterThan(0);
      expect(spec.deliverActions.length).toBeGreaterThan(0);
    }
  });

  it('maps od.mode + platform to shapes', () => {
    expect(flowShapeFromModePlatform('deck')).toBe('deck');
    expect(flowShapeFromModePlatform('prototype', 'mobile')).toBe('mobile');
    expect(flowShapeFromModePlatform('prototype', 'web')).toBe('webapp');
    expect(flowShapeFromModePlatform('image')).toBe('media');
    expect(flowShapeFromModePlatform('nonsense')).toBeNull();
  });
});

describe('parseOdFlowMarkers', () => {
  it('parses stage, state, detail, and progress', () => {
    const markers = parseOdFlowMarkers(
      '前言\n<od-flow stage="plan" state="active" detail="正在写大纲"/>\n' +
        "<od-flow stage='generate' state='active' done='3' total='12'/>\n后记",
    );
    expect(markers).toEqual([
      { stage: 'plan', state: 'active', detail: '正在写大纲' },
      { stage: 'generate', state: 'active', done: 3, total: 12 },
    ]);
  });

  it('drops unknown stages and states instead of throwing', () => {
    expect(parseOdFlowMarkers('<od-flow stage="magic" state="active"/>')).toEqual([]);
    expect(parseOdFlowMarkers('<od-flow stage="plan" state="pending"/>')).toEqual([]);
    expect(parseOdFlowMarkers('<od-flow stage="plan"/>')).toEqual([]);
  });

  it('decodes entities in detail', () => {
    const [m] = parseOdFlowMarkers('<od-flow stage="plan" state="complete" detail="A &amp; B &quot;ok&quot;"/>');
    expect(m?.detail).toBe('A & B "ok"');
  });
});

describe('stripOdFlowMarkers', () => {
  it('removes complete markers and keeps surrounding text', () => {
    expect(stripOdFlowMarkers('a\n<od-flow stage="plan" state="active"/>\nb')).toBe('a\n\nb');
  });

  it('trims a trailing unterminated marker fragment (chunk boundary)', () => {
    expect(stripOdFlowMarkers('done.\n<od-flow stage="gen')).toBe('done.\n');
  });

  it('leaves text without markers untouched', () => {
    const text = 'no markers here <b>html</b>';
    expect(stripOdFlowMarkers(text)).toBe(text);
  });
});

describe('applyFlowMarker (monotonic advancement)', () => {
  const t = 1000;

  it('activating a stage completes earlier active stages and skips never-started ones', () => {
    let snap = createFlowSnapshot('deck', { now: 0 });
    snap = applyFlowMarker(snap, { stage: 'clarify', state: 'active' }, t);
    snap = applyFlowMarker(snap, { stage: 'plan', state: 'active', detail: '写大纲' }, t + 1);
    const byId = Object.fromEntries(snap.stages.map((s) => [s.id, s]));
    expect(byId.clarify!.state).toBe('complete');
    expect(byId.research!.state).toBe('skipped');
    expect(byId.plan!.state).toBe('active');
    expect(byId.plan!.detail).toBe('写大纲');
    expect(snap.activeStage).toBe('plan');
  });

  it('ignores markers for stages earlier than the active stage', () => {
    let snap = createFlowSnapshot('deck', { now: 0 });
    snap = applyFlowMarker(snap, { stage: 'generate', state: 'active' }, t);
    const regressed = applyFlowMarker(snap, { stage: 'clarify', state: 'active' }, t + 1);
    expect(regressed).toBe(snap);
  });

  it('never reopens a terminal stage', () => {
    let snap = createFlowSnapshot('deck', { now: 0 });
    snap = applyFlowMarker(snap, { stage: 'research', state: 'skipped' }, t);
    const reopened = applyFlowMarker(snap, { stage: 'research', state: 'active' }, t + 1);
    expect(reopened).toBe(snap);
  });

  it('updates generate progress incrementally', () => {
    let snap = createFlowSnapshot('deck', { now: 0 });
    snap = applyFlowMarker(snap, { stage: 'generate', state: 'active', done: 0, total: 12 }, t);
    snap = applyFlowMarker(snap, { stage: 'generate', state: 'active', done: 5 }, t + 1);
    const generate = snap.stages.find((s) => s.id === 'generate')!;
    expect(generate.progress).toEqual({ done: 5, total: 12 });
  });

  it('completing the active stage keeps later stages pending', () => {
    let snap = createFlowSnapshot('deck', { now: 0 });
    snap = applyFlowMarker(snap, { stage: 'clarify', state: 'active' }, t);
    snap = applyFlowMarker(snap, { stage: 'clarify', state: 'complete', detail: '5 题已确认' }, t + 1);
    const byId = Object.fromEntries(snap.stages.map((s) => [s.id, s]));
    expect(byId.clarify!.state).toBe('complete');
    expect(byId.research!.state).toBe('pending');
    expect(snap.activeStage).toBe('clarify');
  });
});
