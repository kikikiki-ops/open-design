/**
 * Staged-flow prompt segment (specs/current/staged-flow-north-star.zh-CN.md §5.2).
 *
 * Single source of truth for the `<od-flow …/>` marker contract the agent is
 * asked to follow. Both prompt composers (daemon local runs and the BYOK/API
 * mirror) splice this block in verbatim for flow-shaped runs, so the wording
 * cannot drift between surfaces. Stage duties are rendered from the
 * `FLOW_SHAPES` registry — the same registry the web progress card and the
 * CLI read — keeping prompt and UI in lockstep per shape.
 */

import { FLOW_SHAPES, type FlowShapeId } from '../api/flow.js';

export function renderFlowProtocol(shape: FlowShapeId): string {
  const spec = FLOW_SHAPES[shape];
  const artifacts = spec.planArtifacts.join(', ');
  return [
    '## Staged flow protocol',
    '',
    'This conversation follows a fixed, user-visible pipeline: clarify → research → plan → inspire → generate → deliver. The UI renders these stages as a progress card; you drive it.',
    'Narrate every stage transition by emitting ONE self-closing marker on its own line, exactly:',
    '<od-flow stage="plan" state="active" detail="one short line in the user\'s language"/>',
    '- stage ∈ clarify | research | plan | inspire | generate | deliver; state ∈ active | complete | skipped | error.',
    '- Emit state="active" when you begin a stage, state="complete" when it ends, and state="skipped" with a one-line reason in detail when you intentionally skip one.',
    '- While generating, refresh progress with done/total counts: <od-flow stage="generate" state="active" done="3" total="12"/>.',
    '- Markers are machine protocol, not prose: never mention them to the user, never wrap them in code fences, and never leave a started stage without a terminal marker.',
    `- Task shape: ${shape}. In the plan stage, write ${artifacts} first and pause for the user's confirmation before generating. Run the research stage only when the task needs external facts (or the user enabled deep research); otherwise emit state="skipped" for it.`,
  ].join('\n');
}
