import type { AgentInfo, AppConfig, ChatMessage } from '../types';
import {
  FALLBACK_CONTEXT_WINDOW,
  hasModelContextWindow,
  modelContextWindowDefault,
} from '../state/maxTokens';

export type ContextUsageSegmentId =
  | 'system'
  | 'tools'
  | 'rules'
  | 'skills'
  | 'mcp'
  | 'designContext'
  | 'attachments'
  | 'conversation'
  | 'output'
  | 'other';

export interface ContextUsageSegment {
  id: ContextUsageSegmentId;
  tokens: number;
}

export type ContextAutoCompactionStatus = 'idle' | 'running' | 'completed';

export interface ContextUsageSummary {
  modelId: string | null;
  modelLabel: string;
  contextWindow: number;
  contextWindowEstimated: boolean;
  usedTokens: number;
  usedRatio: number;
  source: 'provider' | 'estimated';
  latestInputTokens: number | null;
  latestOutputTokens: number | null;
  segments: ContextUsageSegment[];
  warningLevel: 'warning' | 'critical' | null;
  autoCompaction: boolean;
  autoCompactionStatus: ContextAutoCompactionStatus;
  autoCompactionBeforeTokens: number | null;
}

export interface ContextUsageInput {
  messages: ChatMessage[];
  config?: AppConfig;
  agentsById?: Map<string, AgentInfo>;
  /**
   * Catalog-reported context window (tokens) for the currently-selected
   * model, when the caller already resolved one (e.g. from a provider
   * models cache in BYOK mode). Takes precedence over both the enriched
   * `AgentModelOption.contextWindow` on the agent's model list and the
   * local static lookup in `state/maxTokens.ts`. For daemon-mode agents
   * this is usually unnecessary: the selected model's `contextWindow`
   * is read from `agentsById` automatically.
   */
  catalogContextWindow?: number | null;
  currentSkillId?: string | null;
  hasActiveDesignSystem?: boolean;
  activeWorkspaceContext?: { id: string } | null;
  activePluginId?: string | null;
}

const SYSTEM_PROMPT_TOKENS = 4100;
const TOOL_DEFINITION_TOKENS = 13700;
const RULE_TOKENS = 8600;
const BASE_SKILL_TOKENS = 2400;
const BASE_MCP_TOKENS = 900;
const BASE_DESIGN_CONTEXT_TOKENS = 1200;

const WARNING_RATIO = 0.75;
const CRITICAL_RATIO = 0.9;

export function buildContextUsageSummary(input: ContextUsageInput): ContextUsageSummary {
  const model = resolveContextUsageModel(
    input.config,
    input.agentsById,
    input.catalogContextWindow,
  );
  const latestUsage = latestUsageTokens(input.messages);
  const contextCounts = collectRunContextCounts(input);
  const attachmentTokens = estimateAttachmentTokens(input.messages);
  const conversationTokens = estimateConversationTokens(input.messages);
  const outputTokens = latestUsage.outputTokens ?? estimateLatestAssistantOutputTokens(input.messages);

  const skillsTokens = BASE_SKILL_TOKENS + Math.max(0, contextCounts.skillCount) * 1100;
  const mcpTokens = BASE_MCP_TOKENS + Math.max(0, contextCounts.mcpCount) * 800;
  const designContextTokens =
    BASE_DESIGN_CONTEXT_TOKENS +
    Math.max(0, contextCounts.designContextCount) * 700;
  const inputConversationTokens = Math.max(0, conversationTokens - outputTokens);

  const inputSegmentCandidates: ContextUsageSegment[] = [
    { id: 'system', tokens: SYSTEM_PROMPT_TOKENS },
    { id: 'tools', tokens: TOOL_DEFINITION_TOKENS },
    { id: 'rules', tokens: RULE_TOKENS },
    { id: 'skills', tokens: skillsTokens },
    { id: 'mcp', tokens: mcpTokens },
    { id: 'designContext', tokens: designContextTokens },
    { id: 'attachments', tokens: attachmentTokens },
    { id: 'conversation', tokens: inputConversationTokens },
  ];
  const knownInputSegments = inputSegmentCandidates.filter((segment) => segment.tokens > 0);

  const knownInputTokens = sumTokens(knownInputSegments);
  const providerInputTokens = latestUsage.inputTokens;
  const calibratedInputTokens =
    providerInputTokens != null ? Math.max(providerInputTokens, knownInputTokens) : knownInputTokens;
  const otherTokens = Math.max(0, calibratedInputTokens - knownInputTokens);

  const segments: ContextUsageSegment[] = [
    ...knownInputSegments,
    ...(otherTokens > 0 ? [{ id: 'other' as const, tokens: otherTokens }] : []),
    ...(outputTokens > 0 ? [{ id: 'output' as const, tokens: outputTokens }] : []),
  ];
  const usedTokens = Math.min(model.contextWindow, sumTokens(segments));
  const usedRatio = model.contextWindow > 0 ? usedTokens / model.contextWindow : 0;
  const warningLevel =
    usedRatio >= CRITICAL_RATIO ? 'critical' : usedRatio >= WARNING_RATIO ? 'warning' : null;
  const autoCompaction = summarizeAutoCompaction(input.messages, model, latestUsage, usedRatio);

  return {
    modelId: model.modelId,
    modelLabel: model.modelLabel,
    contextWindow: model.contextWindow,
    contextWindowEstimated: model.contextWindowEstimated,
    usedTokens,
    usedRatio,
    source: providerInputTokens != null ? 'provider' : 'estimated',
    latestInputTokens: providerInputTokens,
    latestOutputTokens: latestUsage.outputTokens,
    segments: mergeTinySegments(segments),
    warningLevel,
    autoCompaction: model.autoCompaction,
    autoCompactionStatus: autoCompaction.status,
    autoCompactionBeforeTokens: autoCompaction.beforeTokens,
  };
}

export function estimateTextTokens(text: string): number {
  if (!text) return 0;
  let cjk = 0;
  let ascii = 0;
  let whitespace = 0;
  let other = 0;
  for (const char of text) {
    if (/\s/u.test(char)) {
      whitespace += 1;
    } else if (/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/u.test(char)) {
      cjk += 1;
    } else if (char.charCodeAt(0) < 128) {
      ascii += 1;
    } else {
      other += 1;
    }
  }
  return Math.max(1, Math.ceil(cjk * 1.05 + ascii / 4 + whitespace / 8 + other / 2));
}

function resolveContextUsageModel(
  config: AppConfig | undefined,
  agentsById: Map<string, AgentInfo> | undefined,
  catalogContextWindow?: number | null,
): Pick<ContextUsageSummary, 'modelId' | 'modelLabel' | 'contextWindow' | 'contextWindowEstimated' | 'autoCompaction'> {
  if (!config) {
    return {
      modelId: null,
      modelLabel: 'Default',
      contextWindow: FALLBACK_CONTEXT_WINDOW,
      contextWindowEstimated: true,
      autoCompaction: false,
    };
  }

  if (config.mode === 'api') {
    const modelId = config.model.trim() || null;
    return modelFromId(modelId, modelId ?? 'Default', catalogContextWindow, false);
  }

  const agentId = config.agentId;
  const agent = agentId ? agentsById?.get(agentId) : null;
  const configuredModel = agentId ? config.agentModels?.[agentId]?.model?.trim() : undefined;
  const modelId =
    configuredModel && configuredModel !== 'default'
      ? configuredModel
      : agent?.models?.[0]?.id ?? null;
  const modelOption = agent?.models?.find((model) => model.id === modelId) ?? null;
  const modelLabel = modelOption?.label ?? modelId ?? 'Default';
  // Prefer the daemon catalog's context window (delivered on the enriched
  // AgentModelOption) over the local static lookup; an explicit
  // caller-provided window wins over both.
  return modelFromId(
    modelId,
    modelLabel,
    catalogContextWindow ?? modelOption?.contextWindow,
    agent?.contextManagement?.autoCompaction === true,
  );
}

function modelFromId(
  modelId: string | null,
  modelLabel: string,
  catalogContextWindow?: number | null,
  autoCompaction = false,
): Pick<ContextUsageSummary, 'modelId' | 'modelLabel' | 'contextWindow' | 'contextWindowEstimated' | 'autoCompaction'> {
  const catalogWindow =
    typeof catalogContextWindow === 'number' &&
    Number.isFinite(catalogContextWindow) &&
    catalogContextWindow > 0
      ? Math.round(catalogContextWindow)
      : null;
  if (catalogWindow != null) {
    return {
      modelId,
      modelLabel,
      contextWindow: catalogWindow,
      contextWindowEstimated: false,
      autoCompaction,
    };
  }
  if (!modelId) {
    return {
      modelId,
      modelLabel,
      contextWindow: FALLBACK_CONTEXT_WINDOW,
      contextWindowEstimated: true,
      autoCompaction,
    };
  }
  return {
    modelId,
    modelLabel,
    contextWindow: modelContextWindowDefault(modelId),
    contextWindowEstimated: !hasModelContextWindow(modelId),
    autoCompaction,
  };
}

function summarizeAutoCompaction(
  messages: ChatMessage[],
  model: Pick<ContextUsageSummary, 'contextWindow' | 'autoCompaction'>,
  latestUsage: { inputTokens: number | null; outputTokens: number | null },
  usedRatio: number,
): { status: ContextAutoCompactionStatus; beforeTokens: number | null } {
  if (!model.autoCompaction) return { status: 'idle', beforeTokens: null };
  if (hasActiveAssistantRun(messages) && usedRatio >= CRITICAL_RATIO) {
    return { status: 'running', beforeTokens: null };
  }

  const latestInput = latestUsage.inputTokens;
  if (latestInput == null || model.contextWindow <= 0) {
    return { status: 'idle', beforeTokens: null };
  }
  const priorPeak = priorUsagePeak(messages, latestInput);
  if (
    priorPeak != null &&
    priorPeak / model.contextWindow >= CRITICAL_RATIO &&
    latestInput <= priorPeak * 0.75
  ) {
    return { status: 'completed', beforeTokens: priorPeak };
  }
  return { status: 'idle', beforeTokens: null };
}

function hasActiveAssistantRun(messages: ChatMessage[]): boolean {
  return messages.some(
    (message) =>
      message.role === 'assistant' &&
      (message.runStatus === 'queued' || message.runStatus === 'running'),
  );
}

function priorUsagePeak(messages: ChatMessage[], latestInput: number): number | null {
  const inputs = usageInputHistory(messages);
  const latestIndex = inputs.lastIndexOf(latestInput);
  const priorInputs = latestIndex >= 0 ? inputs.slice(0, latestIndex) : inputs.slice(0, -1);
  const peak = priorInputs.reduce<number | null>(
    (max, value) => (max == null || value > max ? value : max),
    null,
  );
  return peak;
}

function usageInputHistory(messages: ChatMessage[]): number[] {
  const inputs: number[] = [];
  for (const message of messages) {
    for (const event of message.events ?? []) {
      if (event?.kind !== 'usage') continue;
      const value = finitePositive(event.inputTokens);
      if (value != null) inputs.push(value);
    }
  }
  return inputs;
}

function latestUsageTokens(messages: ChatMessage[]): {
  inputTokens: number | null;
  outputTokens: number | null;
} {
  for (let mi = messages.length - 1; mi >= 0; mi -= 1) {
    const events = messages[mi]?.events ?? [];
    for (let ei = events.length - 1; ei >= 0; ei -= 1) {
      const event = events[ei];
      if (event?.kind !== 'usage') continue;
      return {
        inputTokens: finitePositive(event.inputTokens),
        outputTokens: finitePositive(event.outputTokens),
      };
    }
  }
  return { inputTokens: null, outputTokens: null };
}

function collectRunContextCounts(input: ContextUsageInput): {
  skillCount: number;
  mcpCount: number;
  designContextCount: number;
} {
  const skillIds = new Set<string>();
  const mcpIds = new Set<string>();
  const designContextIds = new Set<string>();
  if (input.currentSkillId) skillIds.add(input.currentSkillId);
  if (input.activePluginId) designContextIds.add(`plugin:${input.activePluginId}`);
  if (input.hasActiveDesignSystem) designContextIds.add('design-system:active');
  if (input.activeWorkspaceContext?.id) {
    designContextIds.add(`workspace:${input.activeWorkspaceContext.id}`);
  }
  for (const message of input.messages) {
    const context = message.runContext;
    for (const id of context?.skillIds ?? []) skillIds.add(id);
    for (const id of context?.mcpServerIds ?? []) mcpIds.add(id);
    for (const id of context?.pluginIds ?? []) designContextIds.add(`plugin:${id}`);
    for (const id of context?.connectorIds ?? []) designContextIds.add(`connector:${id}`);
    for (const item of context?.workspaceItems ?? []) {
      designContextIds.add(`workspace:${item.id}`);
    }
  }
  return {
    skillCount: skillIds.size,
    mcpCount: mcpIds.size,
    designContextCount: designContextIds.size,
  };
}

function estimateAttachmentTokens(messages: ChatMessage[]): number {
  let tokens = 0;
  for (const message of messages) {
    for (const attachment of message.attachments ?? []) {
      tokens += 24 + estimateTextTokens(`${attachment.kind} ${attachment.name} ${attachment.path}`);
    }
    for (const attachment of message.commentAttachments ?? []) {
      tokens += 80 + estimateTextTokens([
        attachment.filePath,
        attachment.label,
        attachment.comment,
        attachment.currentText,
        attachment.htmlHint,
      ].join('\n'));
    }
  }
  return tokens;
}

function estimateConversationTokens(messages: ChatMessage[]): number {
  let tokens = 0;
  for (const message of messages) {
    tokens += 8 + estimateTextTokens(message.content ?? '');
    for (const event of message.events ?? []) {
      if (event.kind === 'text' || event.kind === 'thinking') {
        tokens += estimateTextTokens(event.text);
      } else if (event.kind === 'tool_use') {
        tokens += 36 + estimateTextTokens(safeJson(event.input));
      } else if (event.kind === 'tool_result') {
        tokens += 24 + estimateTextTokens(event.content.slice(0, 20000));
      }
    }
  }
  return tokens;
}

function estimateLatestAssistantOutputTokens(messages: ChatMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role !== 'assistant') continue;
    let text = message.content ?? '';
    for (const event of message.events ?? []) {
      if (event.kind === 'text') text += event.text;
    }
    return estimateTextTokens(text);
  }
  return 0;
}

function mergeTinySegments(segments: ContextUsageSegment[]): ContextUsageSegment[] {
  const total = sumTokens(segments);
  if (total <= 0) return segments;
  let other = 0;
  const visible: ContextUsageSegment[] = [];
  for (const segment of segments) {
    if (segment.id !== 'other' && segment.tokens / total < 0.015) {
      other += segment.tokens;
    } else {
      visible.push(segment);
    }
  }
  if (other > 0) {
    const existing = visible.find((segment) => segment.id === 'other');
    if (existing) existing.tokens += other;
    else visible.push({ id: 'other', tokens: other });
  }
  return visible.filter((segment) => segment.tokens > 0);
}

function sumTokens(segments: ContextUsageSegment[]): number {
  return segments.reduce((sum, segment) => sum + segment.tokens, 0);
}

function finitePositive(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : null;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(value ?? '');
  }
}
