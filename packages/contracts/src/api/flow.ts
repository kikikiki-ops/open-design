/**
 * North-star staged flow (specs/current/staged-flow-north-star.zh-CN.md).
 *
 * Every generation conversation walks the same fixed stage ladder —
 * clarify → research → plan → inspire → generate → deliver — regardless of
 * output shape (deck, landing page, mobile prototype, document, …). Shape
 * differences (which stages exist, what the plan artifact is called, how
 * progress is counted, which delivery CTAs appear) are declared once in the
 * `FLOW_SHAPES` registry so web, daemon, and CLI cannot drift.
 *
 * The daemon owns the `FlowSnapshot` for a conversation. It advances stages
 * through two channels: `<od-flow …/>` markers the agent emits inline in its
 * streamed text (primary), and deterministic heuristics on observable run
 * events (fallback). Both channels funnel through `applyFlowMarker`, whose
 * invariant is monotonic forward progress — a stage never moves backwards.
 */

export type FlowStageId =
  | 'clarify'
  | 'research'
  | 'plan'
  | 'inspire'
  | 'generate'
  | 'deliver';

export const FLOW_STAGE_ORDER: readonly FlowStageId[] = [
  'clarify',
  'research',
  'plan',
  'inspire',
  'generate',
  'deliver',
];

export type FlowStageState = 'pending' | 'active' | 'complete' | 'skipped' | 'error';

/** States an `<od-flow>` marker may request. `pending` is never requested —
 * it is only the initial state a snapshot is created with. */
export type FlowMarkerState = Exclude<FlowStageState, 'pending'>;

export interface FlowStageSnapshot {
  id: FlowStageId;
  state: FlowStageState;
  /** One human line, e.g. "7 个问题已确认" / "Round 1/2 · 9 searches". */
  detail?: string;
  /** Generation-style progress for the stage (rendered as N/M). */
  progress?: { done: number; total: number };
}

export type FlowResearchMode = 'deep' | 'basic' | 'off';

export interface FlowInspireChoice {
  templateId: string | null;
  skipped: boolean;
}

export type FlowShapeId =
  | 'deck'
  | 'landing'
  | 'mobile'
  | 'webapp'
  | 'document'
  | 'report'
  | 'media';

export type FlowDeliverAction =
  | 'pptx'
  | 'pdf'
  | 'html'
  | 'zip'
  | 'deploy'
  | 'social'
  | 'preview'
  | 'md';

export interface FlowShapeSpec {
  id: FlowShapeId;
  /** Stages that exist for this shape, in ladder order. */
  stages: readonly FlowStageId[];
  /** Plan-stage artifacts the agent must write before asking to confirm. */
  planArtifacts: readonly string[];
  /** i18n key for the generate-stage progress unit (页/区块/屏幕/章节/素材). */
  progressUnitKey: string;
  /** Inspiration catalogue subset for this shape (design-template od.mode / platform). */
  inspireFilter: { modes: readonly string[]; platform?: string };
  /** Delivery CTA actions rendered when the deliver stage activates. */
  deliverActions: readonly FlowDeliverAction[];
}

const ALL_STAGES = FLOW_STAGE_ORDER;

export const FLOW_SHAPES: Record<FlowShapeId, FlowShapeSpec> = {
  deck: {
    id: 'deck',
    stages: ALL_STAGES,
    planArtifacts: ['generated/brief.md', 'generated/outline.md'],
    progressUnitKey: 'flow.unit.slides',
    inspireFilter: { modes: ['deck'] },
    deliverActions: ['pptx', 'pdf', 'social'],
  },
  landing: {
    id: 'landing',
    stages: ALL_STAGES,
    planArtifacts: ['generated/structure.md'],
    progressUnitKey: 'flow.unit.sections',
    inspireFilter: { modes: ['prototype', 'template'], platform: 'web' },
    deliverActions: ['deploy', 'html', 'zip'],
  },
  mobile: {
    id: 'mobile',
    stages: ALL_STAGES,
    planArtifacts: ['generated/flows.md'],
    progressUnitKey: 'flow.unit.screens',
    inspireFilter: { modes: ['prototype'], platform: 'mobile' },
    deliverActions: ['preview', 'zip'],
  },
  webapp: {
    id: 'webapp',
    stages: ALL_STAGES,
    planArtifacts: ['generated/plan.md'],
    progressUnitKey: 'flow.unit.pages',
    inspireFilter: { modes: ['prototype'], platform: 'web' },
    deliverActions: ['deploy', 'zip'],
  },
  document: {
    id: 'document',
    stages: ALL_STAGES,
    planArtifacts: ['generated/toc.md'],
    progressUnitKey: 'flow.unit.chapters',
    inspireFilter: { modes: ['template'] },
    deliverActions: ['md', 'pdf', 'social'],
  },
  report: {
    id: 'report',
    stages: ALL_STAGES,
    planArtifacts: ['generated/outline.md'],
    progressUnitKey: 'flow.unit.chapters',
    inspireFilter: { modes: ['template'] },
    deliverActions: ['pdf', 'social'],
  },
  media: {
    id: 'media',
    stages: ALL_STAGES,
    planArtifacts: ['generated/shots.md'],
    progressUnitKey: 'flow.unit.assets',
    inspireFilter: { modes: ['image', 'video', 'audio'] },
    deliverActions: ['zip', 'social'],
  },
};

export interface FlowSnapshot {
  version: 1;
  shape: FlowShapeId;
  stages: FlowStageSnapshot[];
  activeStage: FlowStageId | null;
  researchMode: FlowResearchMode;
  inspireChoice?: FlowInspireChoice;
  updatedAt: number;
}

/** `GET /api/conversations/:id/flow` response. `flow` is null for
 * conversations that never entered the staged flow (plain chat, tune). */
export interface FlowStatusResponse {
  conversationId: string;
  flow: FlowSnapshot | null;
}

/** `PATCH /api/conversations/:id/flow` request. */
export interface UpdateFlowResearchModeRequest {
  researchMode: FlowResearchMode;
}

/** Map a design-template / plugin `od.mode` (+ platform) to a flow shape.
 * Returns null when the mode has no staged-flow shape (e.g. unknown modes). */
export function flowShapeFromModePlatform(
  mode: string | null | undefined,
  platform?: string | null,
): FlowShapeId | null {
  switch (mode) {
    case 'deck':
      return 'deck';
    case 'prototype':
      return platform === 'mobile' ? 'mobile' : 'webapp';
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

export function createFlowSnapshot(
  shape: FlowShapeId,
  options?: { researchMode?: FlowResearchMode | undefined; now?: number },
): FlowSnapshot {
  const spec = FLOW_SHAPES[shape];
  return {
    version: 1,
    shape,
    stages: spec.stages.map((id) => ({ id, state: 'pending' as FlowStageState })),
    activeStage: null,
    researchMode: options?.researchMode ?? 'basic',
    updatedAt: options?.now ?? 0,
  };
}

// ---------------------------------------------------------------------------
// `<od-flow …/>` inline markers
//
// The agent narrates stage transitions with a single self-closing tag on its
// own line, e.g.:
//
//   <od-flow stage="plan" state="active" detail="正在写大纲"/>
//   <od-flow stage="generate" state="active" done="3" total="12"/>
//
// Markers are protocol, not content: renderers strip them (see
// `stripOdFlowMarkers`) the same way `<question-form>` blocks are lifted out
// of assistant text.
// ---------------------------------------------------------------------------

export interface OdFlowMarker {
  stage: FlowStageId;
  state: FlowMarkerState;
  detail?: string;
  done?: number;
  total?: number;
}

const OD_FLOW_TAG_RE = /<od-flow\b([^<>]*?)\/?>(?:\s*<\/od-flow>)?/gi;
const OD_FLOW_ATTR_RE = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

const FLOW_STAGE_ID_SET = new Set<string>(FLOW_STAGE_ORDER);
const FLOW_MARKER_STATES = new Set<string>(['active', 'complete', 'skipped', 'error']);

function decodeMarkerEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseMarkerAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  OD_FLOW_ATTR_RE.lastIndex = 0;
  for (let m = OD_FLOW_ATTR_RE.exec(raw); m; m = OD_FLOW_ATTR_RE.exec(raw)) {
    const key = m[1];
    if (!key) continue;
    attrs[key.toLowerCase()] = decodeMarkerEntities(m[2] ?? m[3] ?? '');
  }
  return attrs;
}

/** Parse every complete `<od-flow …/>` marker in `text`, in order. Invalid
 * markers (unknown stage/state) are dropped — the fallback heuristics keep
 * the snapshot honest when the model misfires. */
export function parseOdFlowMarkers(text: string): OdFlowMarker[] {
  const markers: OdFlowMarker[] = [];
  OD_FLOW_TAG_RE.lastIndex = 0;
  for (let m = OD_FLOW_TAG_RE.exec(text); m; m = OD_FLOW_TAG_RE.exec(text)) {
    const attrs = parseMarkerAttributes(m[1] ?? '');
    const stage = attrs.stage;
    const state = attrs.state;
    if (!stage || !FLOW_STAGE_ID_SET.has(stage)) continue;
    if (!state || !FLOW_MARKER_STATES.has(state)) continue;
    const marker: OdFlowMarker = {
      stage: stage as FlowStageId,
      state: state as FlowMarkerState,
    };
    if (attrs.detail) marker.detail = attrs.detail;
    const done = attrs.done !== undefined ? Number(attrs.done) : NaN;
    const total = attrs.total !== undefined ? Number(attrs.total) : NaN;
    if (Number.isFinite(done)) marker.done = done;
    if (Number.isFinite(total)) marker.total = total;
    markers.push(marker);
  }
  return markers;
}

/** Remove complete markers plus any trailing unterminated `<od-flow`
 * fragment (mid-stream chunk boundary), for display surfaces. */
export function stripOdFlowMarkers(text: string): string {
  let out = text.replace(OD_FLOW_TAG_RE, '');
  const tail = out.lastIndexOf('<od-flow');
  if (tail !== -1 && !out.slice(tail).includes('>')) {
    out = out.slice(0, tail);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Monotonic snapshot advancement
// ---------------------------------------------------------------------------

const TERMINAL_STAGE_STATES: ReadonlySet<FlowStageState> = new Set([
  'complete',
  'skipped',
  'error',
]);

function stageIndex(snapshot: FlowSnapshot, id: FlowStageId): number {
  return snapshot.stages.findIndex((s) => s.id === id);
}

/**
 * Apply one marker (from either channel) to a snapshot, returning a new
 * snapshot. Invariant: monotonic forward progress —
 * - a terminal stage never changes state again;
 * - activating a stage completes every earlier still-active stage and marks
 *   earlier never-started stages `skipped`;
 * - a marker for a stage earlier than the current active stage is ignored.
 * Returns the input snapshot unchanged when the marker is a no-op.
 */
export function applyFlowMarker(
  snapshot: FlowSnapshot,
  marker: OdFlowMarker,
  now: number,
): FlowSnapshot {
  const idx = stageIndex(snapshot, marker.stage);
  if (idx === -1) return snapshot;
  const activeIdx = snapshot.activeStage ? stageIndex(snapshot, snapshot.activeStage) : -1;
  const current = snapshot.stages[idx];
  if (!current) return snapshot;

  if (marker.state === 'active') {
    if (TERMINAL_STAGE_STATES.has(current.state)) return snapshot;
    if (activeIdx > idx) return snapshot;
    if (
      current.state === 'active' &&
      marker.detail === undefined &&
      marker.done === undefined &&
      marker.total === undefined
    ) {
      return snapshot;
    }
    const stages = snapshot.stages.map((stage, i) => {
      if (i < idx && !TERMINAL_STAGE_STATES.has(stage.state)) {
        return {
          ...stage,
          state: (stage.state === 'active' ? 'complete' : 'skipped') as FlowStageState,
        };
      }
      if (i === idx) return updatedStage(stage, 'active', marker);
      return stage;
    });
    return { ...snapshot, stages, activeStage: marker.stage, updatedAt: now };
  }

  // Terminal marker (complete / skipped / error).
  if (TERMINAL_STAGE_STATES.has(current.state)) return snapshot;
  if (activeIdx > idx && current.state === 'pending') return snapshot;
  const stages = snapshot.stages.map((stage, i) =>
    i === idx ? updatedStage(stage, marker.state, marker) : stage,
  );
  return { ...snapshot, stages, updatedAt: now };
}

function updatedStage(
  stage: FlowStageSnapshot,
  state: FlowStageState,
  marker: OdFlowMarker,
): FlowStageSnapshot {
  const next: FlowStageSnapshot = { id: stage.id, state };
  const detail = marker.detail ?? stage.detail;
  if (detail !== undefined) next.detail = detail;
  const progress = progressFromMarker(marker, stage.progress);
  if (progress !== undefined) next.progress = progress;
  return next;
}

function progressFromMarker(
  marker: OdFlowMarker,
  previous: { done: number; total: number } | undefined,
): { done: number; total: number } | undefined {
  if (marker.done === undefined && marker.total === undefined) return previous;
  return {
    done: marker.done ?? previous?.done ?? 0,
    total: marker.total ?? previous?.total ?? 0,
  };
}
