import { describe, expect, it } from 'vitest';

import {
  buildContextUsageSummary,
  estimateTextTokens,
} from '../../src/runtime/context-usage';
import type { AgentInfo, AppConfig, ChatMessage } from '../../src/types';

const apiConfig: AppConfig = {
  mode: 'api',
  apiKey: 'sk-test',
  apiProtocol: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  model: 'openai/gpt-5.5-medium',
  agentId: null,
  skillId: null,
  designSystemId: null,
};

describe('estimateTextTokens', () => {
  it('counts CJK text more densely than short ASCII text', () => {
    expect(estimateTextTokens('这是一个中文测试')).toBeGreaterThan(estimateTextTokens('hello'));
  });
});

describe('buildContextUsageSummary', () => {
  it('uses latest provider usage to calibrate the current context budget', () => {
    const messages: ChatMessage[] = [
      {
        id: 'user-1',
        role: 'user',
        content: 'Build a deck with uploaded screenshots',
        attachments: [{ kind: 'file', name: 'brief.md', path: '/tmp/brief.md' }],
        runContext: {
          skillIds: ['deck-builder'],
          mcpServerIds: ['figma'],
          pluginIds: ['product-design'],
          workspaceItems: [{ id: 'design-files', kind: 'design-files', label: 'Design Files' }],
        },
      },
      {
        id: 'assistant-1',
        role: 'assistant',
        content: 'Done.',
        events: [
          { kind: 'text', text: 'Finished the first pass.' },
          { kind: 'usage', inputTokens: 100000, outputTokens: 2000 },
        ],
      },
    ];

    const summary = buildContextUsageSummary({
      messages,
      config: apiConfig,
      currentSkillId: 'deck-builder',
      hasActiveDesignSystem: true,
    });

    expect(summary).toMatchObject({
      modelId: 'openai/gpt-5.5-medium',
      contextWindow: 128000,
      contextWindowEstimated: false,
      source: 'provider',
      latestInputTokens: 100000,
      latestOutputTokens: 2000,
      warningLevel: 'warning',
    });
    expect(summary.usedTokens).toBe(102000);
    expect(summary.usedRatio).toBeCloseTo(102000 / 128000, 5);
    expect(summary.segments.some((segment) => segment.id === 'other')).toBe(true);
  });

  it('resolves daemon agent model labels and estimates unknown windows conservatively', () => {
    const config: AppConfig = {
      ...apiConfig,
      mode: 'daemon',
      model: '',
      agentId: 'codex',
      agentModels: {
        codex: { model: 'future-model-max' },
      },
    };
    const agentsById = new Map<string, AgentInfo>([
      [
        'codex',
        {
          id: 'codex',
          name: 'Codex',
          bin: 'codex',
          available: true,
          models: [{ id: 'future-model-max', label: 'Future Model Max' }],
        },
      ],
    ]);

    const summary = buildContextUsageSummary({
      messages: [
        {
          id: 'user-1',
          role: 'user',
          content: '请继续修改这一版',
        },
      ],
      config,
      agentsById,
    });

    expect(summary).toMatchObject({
      modelId: 'future-model-max',
      modelLabel: 'Future Model Max',
      contextWindow: 128000,
      contextWindowEstimated: true,
      source: 'estimated',
      warningLevel: null,
    });
  });
});
