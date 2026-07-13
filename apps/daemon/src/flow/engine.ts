/**
 * Staged-flow engine (specs/current/staged-flow-north-star.zh-CN.md §5.2).
 *
 * One tracker per run advances the conversation's `FlowSnapshot` through two
 * channels:
 *
 *   1. Marker channel (primary) — the agent narrates transitions with inline
 *      `<od-flow stage="…" state="…"/>` markers in its streamed text.
 *   2. Heuristic channel (fallback) — deterministic signals the daemon can
 *      observe regardless of whether the model emitted markers: a streamed
 *      `<question-form` (clarify), a research CLI invocation (research), a
 *      plan-artifact write (plan), an HTML artifact write (generate), the
 *      `[form answers …]` echo in the next user message (clarify complete),
 *      and a clean run end while generating (generate complete → deliver).
 *
 * Both channels funnel through `applyFlowMarker`, whose invariant is monotonic
 * forward progress, so a late or duplicated signal can never move the ladder
 * backwards.
 */

import {
  applyFlowMarker,
  createFlowSnapshot,
  FLOW_SHAPES,
  parseOdFlowMarkers,
  type FlowShapeId,
  type FlowSnapshot,
  type OdFlowMarker,
} from '@open-design/contracts';

/** Longest prefix of a marker/tag we may need to hold across chunk splits. */
const TAG_CARRY = 96;
const QUESTION_FORM_TAG = '<question-form';

export interface ResolveFlowShapeInput {
  sessionMode?: string | null;
  taskKind?: string | null;
  projectKind?: string | null;
  projectPlatform?: string | null;
}

/**
 * Gate + shape resolution for a run. Only design-mode, new-generation work
 * enters the staged flow; everything else (chat, plan, tune-collab, brand,
 * migrations) keeps its current UX and returns null.
 */
export function resolveFlowShape(input: ResolveFlowShapeInput): FlowShapeId | null {
  if ((input.sessionMode ?? 'design') !== 'design') return null;
  if ((input.taskKind ?? 'new-generation') !== 'new-generation') return null;
  const platform = input.projectPlatform ?? '';
  switch (input.projectKind) {
    case 'deck':
      return 'deck';
    case 'prototype':
      return platform.startsWith('mobile') ? 'mobile' : 'webapp';
    case 'image':
    case 'video':
    case 'audio':
      return 'media';
    case 'template':
      return 'document';
    default:
      return null;
  }
}

export interface FlowTracker {
  readonly snapshot: FlowSnapshot;
  /** Feed one streamed agent payload. Returns the snapshot when it advanced. */
  observeAgentEvent(ev: unknown): FlowSnapshot | null;
  /** Feed the user message that started this run (form-answer echoes). */
  noteUserMessage(text: string): FlowSnapshot | null;
  /** Feed the run's terminal status. */
  noteRunEnd(status: string | null | undefined): FlowSnapshot | null;
}

export interface CreateFlowTrackerOptions {
  shape: FlowShapeId;
  initial?: FlowSnapshot | null;
  now?: () => number;
}

export function createFlowTracker(options: CreateFlowTrackerOptions): FlowTracker {
  const now = options.now ?? Date.now;
  let snapshot: FlowSnapshot;
  if (options.initial && options.initial.version === 1) {
    snapshot = options.initial;
  } else {
    // A brand-new flow conversation starts at clarify — the ladder should be
    // visible (step 1 active) from the very first streamed byte.
    snapshot = applyFlowMarker(
      createFlowSnapshot(options.shape, { now: now() }),
      { stage: 'clarify', state: 'active' },
      now(),
    );
  }

  /** Unconsumed streamed-text tail, held only while a tag may be incomplete. */
  let markerTail = '';
  /** Rolling window for `<question-form` detection across chunk boundaries. */
  let questionFormWindow = '';
  let questionFormSeen = false;

  const planArtifactNames = FLOW_SHAPES[snapshot.shape].planArtifacts.map((p) => {
    const parts = p.split('/');
    return parts[parts.length - 1] ?? p;
  });

  function apply(marker: OdFlowMarker): boolean {
    const next = applyFlowMarker(snapshot, marker, now());
    if (next === snapshot) return false;
    snapshot = next;
    return true;
  }

  function consumeTextDelta(delta: string): boolean {
    let advanced = false;

    // Marker channel: consume complete `<od-flow …>` tags, carry a partial tail.
    markerTail += delta;
    for (;;) {
      const start = markerTail.indexOf('<od-flow');
      if (start === -1) {
        markerTail = markerTail.slice(-TAG_CARRY);
        break;
      }
      const end = markerTail.indexOf('>', start);
      if (end === -1) {
        markerTail = markerTail.slice(start);
        break;
      }
      for (const marker of parseOdFlowMarkers(markerTail.slice(start, end + 1))) {
        if (apply(marker)) advanced = true;
      }
      markerTail = markerTail.slice(end + 1);
    }

    // Heuristic: a streamed question form means we are clarifying.
    if (!questionFormSeen) {
      questionFormWindow = (questionFormWindow + delta).slice(
        -(QUESTION_FORM_TAG.length + delta.length),
      );
      if (questionFormWindow.includes(QUESTION_FORM_TAG)) {
        questionFormSeen = true;
        if (apply({ stage: 'clarify', state: 'active' })) advanced = true;
      }
      questionFormWindow = questionFormWindow.slice(-QUESTION_FORM_TAG.length);
    }
    return advanced;
  }

  function toolWritePath(input: unknown): string | null {
    if (!input || typeof input !== 'object') return null;
    const record = input as Record<string, unknown>;
    for (const key of ['file_path', 'path', 'filename', 'file']) {
      const value = record[key];
      if (typeof value === 'string' && value) return value;
    }
    return null;
  }

  function consumeToolUse(name: string, input: unknown): boolean {
    let advanced = false;
    const command =
      input && typeof input === 'object' && typeof (input as Record<string, unknown>).command === 'string'
        ? String((input as Record<string, unknown>).command)
        : '';
    if (command.includes('research search')) {
      if (apply({ stage: 'research', state: 'active' })) advanced = true;
      return advanced;
    }
    const path = toolWritePath(input);
    if (!path) return advanced;
    const lower = path.toLowerCase();
    if (lower.includes('research/') && lower.endsWith('.md')) {
      if (apply({ stage: 'research', state: 'complete' })) advanced = true;
      return advanced;
    }
    if (planArtifactNames.some((artifact) => lower.endsWith(artifact.toLowerCase()))) {
      if (apply({ stage: 'plan', state: 'active' })) advanced = true;
      return advanced;
    }
    if (lower.endsWith('.html') || lower.endsWith('.htm')) {
      if (apply({ stage: 'generate', state: 'active' })) advanced = true;
    }
    return advanced;
  }

  return {
    get snapshot() {
      return snapshot;
    },

    observeAgentEvent(ev: unknown): FlowSnapshot | null {
      if (!ev || typeof ev !== 'object') return null;
      const payload = ev as Record<string, unknown>;
      const type = payload.type;
      let advanced = false;
      if (type === 'text_delta' && typeof payload.delta === 'string') {
        advanced = consumeTextDelta(payload.delta);
      } else if (type === 'tool_use') {
        advanced = consumeToolUse(
          typeof payload.name === 'string' ? payload.name : '',
          payload.input,
        );
      } else if (type === 'live_artifact' || type === 'artifact') {
        const label =
          typeof payload.title === 'string'
            ? payload.title
            : typeof payload.name === 'string'
              ? payload.name
              : '';
        if (!label.toLowerCase().endsWith('.md')) {
          advanced = apply({ stage: 'generate', state: 'active' });
        }
      }
      return advanced ? snapshot : null;
    },

    noteUserMessage(text: string): FlowSnapshot | null {
      if (typeof text !== 'string' || !text) return null;
      let advanced = false;
      if (text.includes('[form answers')) {
        if (apply({ stage: 'clarify', state: 'complete' })) advanced = true;
      }
      if (text.includes('[inspiration —') || text.includes('[inspiration -')) {
        if (apply({ stage: 'inspire', state: 'complete' })) advanced = true;
      }
      return advanced ? snapshot : null;
    },

    noteRunEnd(status: string | null | undefined): FlowSnapshot | null {
      if (status !== 'succeeded') return null;
      const generate = snapshot.stages.find((s) => s.id === 'generate');
      if (!generate || generate.state !== 'active') return null;
      let advanced = apply({ stage: 'generate', state: 'complete' });
      if (apply({ stage: 'deliver', state: 'active' })) advanced = true;
      return advanced ? snapshot : null;
    },
  };
}
