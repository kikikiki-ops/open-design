/**
 * Per-round task steps (specs/current/task-progress-and-computer-replay.zh-CN.md).
 *
 * A "task" is one user-prompt round (one run). Its steps are a curated,
 * ORDERED projection of the round's persisted agent events — every important
 * action (search, read, write, plan, generate, think) becomes one replayable
 * step. Derivation is pure and shared: the web Computer panel and the `od task`
 * CLI both call `deriveTaskSteps` so they can never disagree.
 *
 * The step carries STRUCTURED fields only (kind / tool / target / status). The
 * human one-liners are formatted at the edge (web with i18n, CLI plain) so this
 * layer stays free of localization — see `apps/web/src/runtime/task-steps.ts`.
 */

import type { PersistedAgentEvent } from './chat.js';

export type TaskStepKind =
  | 'plan'
  | 'search'
  | 'search-drilldown'
  | 'read'
  | 'write'
  | 'edit'
  | 'list'
  | 'command'
  | 'inspiration'
  | 'generate'
  | 'thinking'
  | 'tool';

export type TaskStepStatus = 'running' | 'done' | 'error';

/** One round (assistant turn) with its derived steps. */
export interface TaskRoundSummary {
  index: number;
  assistantMessageId: string;
  runId: string | null;
  status: string | null;
  steps: TaskStep[];
}

/** `GET /api/conversations/:id/tasks` response — the per-round step timeline
 * that both the Computer panel and `od task steps` render. */
export interface TaskRoundsResponse {
  conversationId: string;
  rounds: TaskRoundSummary[];
}

export interface TaskStep {
  /** tool_use id, or a synthetic `synthetic:<n>` id for artifact/thinking steps. */
  id: string;
  kind: TaskStepKind;
  status: TaskStepStatus;
  /** Wire tool name (e.g. `WebSearch`, `Read`), when the step came from a tool. */
  tool?: string;
  /** The step's headline token: query / file path / url / command / artifact
   * title / thinking snippet. Rendered into the localized brief + Computer header. */
  target?: string;
  /** True when the tool reported an error. */
  isError?: boolean;
}

const PLAN_TOOL_NAMES = new Set(['TodoWrite', 'todowrite', 'todo_write', 'update_plan']);
const SEARCH_TOOL_NAMES = new Set(['WebSearch', 'web_search']);
const FETCH_TOOL_NAMES = new Set(['WebFetch', 'web_fetch']);
const READ_TOOL_NAMES = new Set(['Read', 'read_file']);
const WRITE_TOOL_NAMES = new Set(['Write', 'write', 'create_file']);
const EDIT_TOOL_NAMES = new Set(['Edit', 'str_replace_edit', 'MultiEdit', 'multi_edit']);
const LIST_TOOL_NAMES = new Set(['Glob', 'list_files', 'Grep']);
const COMMAND_TOOL_NAMES = new Set(['Bash']);

/** Classify a wire tool name into a task-step kind. Matches the web `toolFamily`
 * / `file-ops` conventions so the Computer, the transcript, and the CLI agree. */
export function taskStepKindForTool(name: string): TaskStepKind {
  if (PLAN_TOOL_NAMES.has(name)) return 'plan';
  if (SEARCH_TOOL_NAMES.has(name)) return 'search';
  if (FETCH_TOOL_NAMES.has(name)) return 'search-drilldown';
  if (READ_TOOL_NAMES.has(name)) return 'read';
  if (WRITE_TOOL_NAMES.has(name)) return 'write';
  if (EDIT_TOOL_NAMES.has(name)) return 'edit';
  if (LIST_TOOL_NAMES.has(name)) return 'list';
  if (COMMAND_TOOL_NAMES.has(name)) return 'command';
  return 'tool';
}

function firstString(input: unknown, keys: readonly string[]): string | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const record = input as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

const PATH_KEYS = ['file_path', 'filePath', 'path', 'filename', 'target_path', 'targetPath', 'file'];
const QUERY_KEYS = ['query', 'q', 'search', 'prompt'];
const URL_KEYS = ['url', 'uri', 'href'];
const COMMAND_KEYS = ['command', 'cmd', 'script'];

/** The headline token for a tool step (query / path / url / command). */
export function taskStepTargetForTool(kind: TaskStepKind, input: unknown): string | undefined {
  switch (kind) {
    case 'search':
      return firstString(input, QUERY_KEYS);
    case 'search-drilldown':
      return firstString(input, URL_KEYS) ?? firstString(input, QUERY_KEYS);
    case 'read':
    case 'write':
    case 'edit':
      return firstString(input, PATH_KEYS);
    case 'command':
      return firstString(input, COMMAND_KEYS);
    case 'list':
      return firstString(input, ['pattern', ...PATH_KEYS]);
    default:
      return firstString(input, [...PATH_KEYS, ...QUERY_KEYS, ...URL_KEYS]);
  }
}

/**
 * Derive the ordered replayable steps for one round from its persisted events.
 *
 * - `tool_use` → one step, deduped by id (first occurrence wins), classified by
 *   tool name and joined with its `tool_result` (by id) for status.
 * - `live_artifact` (created/updated) → a `generate` step.
 * - consecutive `thinking` events collapse into a single `thinking` step.
 *
 * Ordering follows the event array (which the daemon appends in arrival order).
 */
export function deriveTaskSteps(events: readonly PersistedAgentEvent[]): TaskStep[] {
  const resultByToolId = new Map<string, { isError: boolean }>();
  for (const event of events) {
    if (event.kind === 'tool_result') {
      resultByToolId.set(event.toolUseId, { isError: Boolean(event.isError) });
    }
  }

  const steps: TaskStep[] = [];
  const seenToolIds = new Set<string>();
  let synthetic = 0;
  let pendingThinking: string[] = [];

  const flushThinking = () => {
    if (pendingThinking.length === 0) return;
    const text = pendingThinking.join('').trim();
    pendingThinking = [];
    if (!text) return;
    steps.push({
      id: `synthetic:thinking:${synthetic++}`,
      kind: 'thinking',
      status: 'done',
      target: text.slice(0, 240),
    });
  };

  for (const event of events) {
    if (event.kind === 'thinking') {
      pendingThinking.push(event.text);
      continue;
    }
    flushThinking();

    if (event.kind === 'tool_use') {
      if (seenToolIds.has(event.id)) continue;
      seenToolIds.add(event.id);
      const kind = taskStepKindForTool(event.name);
      const result = resultByToolId.get(event.id);
      const target = taskStepTargetForTool(kind, event.input);
      const step: TaskStep = {
        id: event.id,
        kind,
        tool: event.name,
        status: result ? (result.isError ? 'error' : 'done') : 'running',
      };
      if (target !== undefined) step.target = target;
      if (result?.isError) step.isError = true;
      steps.push(step);
      continue;
    }

    if (event.kind === 'live_artifact' && event.action !== 'deleted') {
      const step: TaskStep = {
        id: `synthetic:artifact:${synthetic++}`,
        kind: 'generate',
        status: 'done',
      };
      if (event.title) step.target = event.title;
      steps.push(step);
    }
  }
  flushThinking();

  return steps;
}
