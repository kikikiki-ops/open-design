// Web-side task-step helpers (specs/current/task-progress-and-computer-replay.zh-CN.md).
//
// Step DERIVATION is pure and shared from @open-design/contracts (so the
// Computer panel and the `od task` CLI agree). This module adds the web-only
// bits: turning a conversation into the CURRENT round, and formatting each
// structured step into a localized one-line brief + a Computer header line.

import {
  deriveTaskSteps,
  type PersistedAgentEvent,
  type TaskStep,
  type TaskStepKind,
} from '@open-design/contracts';
import type { Dict } from '../i18n/types';

export type { TaskStep, TaskStepKind };
export { deriveTaskSteps };

type TranslateFn = (key: keyof Dict, vars?: Record<string, string | number>) => string;

export type TaskRunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | null;

export interface TaskRound {
  /** The assistant message that owns this round's run. */
  assistantMessageId: string;
  runId: string | undefined;
  steps: TaskStep[];
  status: TaskRunStatus;
  /** True while the round's run is still producing steps. */
  live: boolean;
}

interface RoundSourceMessage {
  id: string;
  role: string;
  events?: PersistedAgentEvent[] | undefined;
  runId?: string | undefined;
  runStatus?: TaskRunStatus | undefined;
  endedAt?: number | undefined;
}

/**
 * The latest round in a conversation: the most recent assistant message, its
 * derived steps, and whether its run is live. `streaming` lets a caller mark a
 * run live before the daemon has stamped a running status.
 */
export function deriveCurrentRound(
  messages: ReadonlyArray<RoundSourceMessage> | undefined,
  options?: { streaming?: boolean },
): TaskRound | null {
  if (!messages || messages.length === 0) return null;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!message || message.role !== 'assistant') continue;
    const steps = deriveTaskSteps(message.events ?? []);
    const status: TaskRunStatus =
      message.runStatus ?? (message.endedAt != null ? 'succeeded' : null);
    const live =
      status === 'running' ||
      status === 'queued' ||
      Boolean(options?.streaming && status == null);
    return {
      assistantMessageId: message.id,
      runId: message.runId,
      steps,
      status,
      live,
    };
  }
  return null;
}

function basename(path: string): string {
  const clean = (path.split(/[?#]/u, 1)[0] ?? path).replace(/[/\\]+$/u, '');
  const parts = clean.split(/[/\\]/u);
  return parts[parts.length - 1] || clean;
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/** Human-friendly headline token for a step (file basename / short query / …). */
export function taskStepTargetLabel(step: TaskStep, t: TranslateFn): string {
  if (!step.target) return t('task.step.untitled');
  switch (step.kind) {
    case 'read':
    case 'write':
    case 'edit':
    case 'generate':
      return basename(step.target);
    case 'command':
      return clip(step.target.split('\n', 1)[0] ?? step.target, 48);
    default:
      return clip(step.target, 64);
  }
}

/** One-line brief for the chat transcript and the Computer step list. */
export function taskStepBrief(step: TaskStep, t: TranslateFn): string {
  const target = taskStepTargetLabel(step, t);
  switch (step.kind) {
    case 'search':
      return t('task.step.search', { target });
    case 'search-drilldown':
      return t('task.step.searchDrilldown', { target });
    case 'read':
      return t('task.step.read', { target });
    case 'write':
      return t('task.step.write', { target });
    case 'edit':
      return t('task.step.edit', { target });
    case 'list':
      return t('task.step.list', { target });
    case 'command':
      return t('task.step.command', { target });
    case 'plan':
      return t('task.step.plan');
    case 'generate':
      return t('task.step.generate', { target });
    case 'thinking':
      return t('task.step.thinking');
    case 'inspiration':
      return t('task.step.generate', { target });
    case 'tool':
    default:
      return t('task.step.tool', { tool: step.tool ?? target });
  }
}

const STEP_GLYPH: Record<TaskStepKind, string> = {
  plan: '◇',
  search: '⌕',
  'search-drilldown': '↳',
  read: '▤',
  write: '✎',
  edit: '✎',
  list: '≣',
  command: '›_',
  inspiration: '✦',
  generate: '◆',
  thinking: '✽',
  tool: '•',
};

export function taskStepGlyph(kind: TaskStepKind): string {
  return STEP_GLYPH[kind] ?? '•';
}

type ToolUseEvent = Extract<PersistedAgentEvent, { kind: 'tool_use' }>;
type ToolResultEvent = Extract<PersistedAgentEvent, { kind: 'tool_result' }>;

/** A derived step paired with the raw tool_use / tool_result so the Computer
 * body can delegate to the existing ToolCard family cards for rich content. */
export interface ComputerStep {
  step: TaskStep;
  use?: ToolUseEvent;
  result?: ToolResultEvent;
}

/** Derive the ordered steps for the Computer panel and join each back to its
 * raw tool_use + tool_result (synthetic thinking/artifact steps carry neither). */
export function computerStepsFromEvents(
  events: readonly PersistedAgentEvent[] | undefined,
): ComputerStep[] {
  if (!events || events.length === 0) return [];
  const useById = new Map<string, ToolUseEvent>();
  const resultByUseId = new Map<string, ToolResultEvent>();
  for (const event of events) {
    if (event.kind === 'tool_use' && !useById.has(event.id)) useById.set(event.id, event);
    else if (event.kind === 'tool_result') resultByUseId.set(event.toolUseId, event);
  }
  return deriveTaskSteps(events).map((step) => {
    const use = useById.get(step.id);
    const result = use ? resultByUseId.get(step.id) : undefined;
    const computer: ComputerStep = { step };
    if (use) computer.use = use;
    if (result) computer.result = result;
    return computer;
  });
}
