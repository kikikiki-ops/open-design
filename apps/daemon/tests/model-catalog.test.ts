import assert from 'node:assert/strict';
import { test } from 'vitest';
import type { AgentModelOption } from '@open-design/contracts';
import {
  enrichModelOptions,
  estimateCostUsd,
  lookupModelMeta,
  normalizeModelId,
} from '../src/model-catalog.js';

test('normalizeModelId folds AMR / vendor-path / separator spellings together', () => {
  assert.equal(normalizeModelId('public_model_gpt_5_4'), 'gpt-5-4');
  assert.equal(normalizeModelId('gpt-5.4'), 'gpt-5-4');
  assert.equal(normalizeModelId('anthropic/claude-sonnet-4-5'), 'claude-sonnet-4-5');
  assert.equal(normalizeModelId('openai-codex:gpt-5.5'), 'gpt-5-5');
  assert.equal(normalizeModelId('  Claude-Opus-4.5 '), 'claude-opus-4-5');
  assert.equal(normalizeModelId(null), '');
});

test('lookupModelMeta resolves claude short aliases and AMR public_model ids', () => {
  const viaAlias = lookupModelMeta('sonnet');
  const canonical = lookupModelMeta('claude-sonnet-4-5');
  assert.ok(canonical);
  assert.deepEqual(viaAlias, canonical);

  const amr = lookupModelMeta('public_model_kimi_k2_6');
  assert.ok(amr);
  assert.equal(amr.speedTier, 'powerful');

  // CodeBuddy '-ioa' rehosted ids hit the same underlying entry.
  assert.deepEqual(
    lookupModelMeta('deepseek-v4-pro-ioa'),
    lookupModelMeta('deepseek-v4-pro'),
  );

  assert.equal(lookupModelMeta('totally-unknown-model'), null);
  assert.equal(lookupModelMeta('default'), null);
});

test('enrichModelOptions fills missing metadata without overwriting source fields', () => {
  const options: AgentModelOption[] = [
    { id: 'claude-opus-4-5', label: 'claude-opus-4-5' },
    {
      id: 'public_model_gemini_2_5_flash',
      label: 'gemini 2.5 flash',
      // Remote-supplied metadata must win over the catalog.
      description: 'remote says hi',
      contextWindow: 42,
    },
    { id: 'default', label: 'Default (CLI config)' },
  ];
  const [opus, gemini, dflt] = enrichModelOptions(options);

  assert.ok(opus);
  assert.equal(opus.contextWindow, 200_000);
  assert.equal(opus.speedTier, 'powerful');
  assert.equal(opus.pricing?.inputPer1M, 5);
  assert.equal(typeof opus.description, 'string');

  assert.ok(gemini);
  assert.equal(gemini.description, 'remote says hi');
  assert.equal(gemini.contextWindow, 42);
  // Fields the source did not set still get filled.
  assert.equal(gemini.speedTier, 'fast');

  // Unknown/pseudo ids pass through untouched.
  assert.deepEqual(dflt, { id: 'default', label: 'Default (CLI config)' });

  // Enriched object-valued fields are copies, not shared catalog references.
  assert.ok(opus.pricing);
  opus.pricing.inputPer1M = 999;
  assert.equal(lookupModelMeta('claude-opus-4-5')?.pricing?.inputPer1M, 5);
});

test('estimateCostUsd prices tokens from catalog list pricing', () => {
  // claude-sonnet-4-5: $3 in / $15 out / $0.30 cache-read per 1M.
  const cost = estimateCostUsd('sonnet', {
    input: 1_000_000,
    output: 100_000,
    cacheRead: 1_000_000,
  });
  assert.ok(cost !== null);
  assert.ok(Math.abs(cost - (3 + 1.5 + 0.3)) < 1e-9);

  // Unknown or unpriced models estimate to null.
  assert.equal(estimateCostUsd('totally-unknown-model', { input: 10 }), null);
  assert.equal(estimateCostUsd(null, { input: 10 }), null);
  assert.equal(estimateCostUsd('claude-fable-5', { input: 10 }), null);

  // Zero usage on a priced model is a real $0, not null.
  assert.equal(estimateCostUsd('gpt-5', {}), 0);
});
