// Model Catalog (L1 of the model/cost/usage transparency plan,
// specs/current/model-cost-usage-transparency.zh-CN.md).
//
// A hand-maintained, pure, synchronous lookup table that turns bare
// `{ id, label }` model options into "model cards": description, context
// window, max output tokens, list pricing, speed tier, capability tags and
// recommended session modes. The three model-serving endpoints
// (`/api/agents`, `/api/provider/models`, `/api/amr/models`) all pass their
// options through {@link enrichModelOptions} before responding, and the
// usage ledger uses {@link estimateCostUsd} when a runtime does not report
// `costUsd` itself.
//
// Rules of this file:
// - Pure TypeScript, no fs / network / process access. Keep it importable
//   from anywhere in the daemon (including tests) without side effects.
// - Catalog data NEVER overwrites metadata the source already supplied —
//   remote/provider-reported fields win (see `enrichModelOptions`). This is
//   load-bearing for AMR, whose remote catalog is the freshest source.
// - Pricing is USD list price per 1M tokens, only for models where we are
//   reasonably confident. When unsure, omit `pricing` entirely — the UI
//   renders estimated costs with a `≈` prefix and "unpriced" models simply
//   show no price badge.

import type { AgentModelOption } from '@open-design/contracts';

/** Catalog metadata for one model — everything except identity fields. */
export type ModelCatalogEntry = Omit<AgentModelOption, 'id' | 'label'>;

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a raw model id into the catalog key space so the same model is
 * recognized across surfaces:
 *
 *   'public_model_gpt_5_4'        → 'gpt-5-4'   (AMR / vela catalog)
 *   'gpt-5.4'                     → 'gpt-5-4'   (codex CLI)
 *   'anthropic/claude-sonnet-4-5' → 'claude-sonnet-4-5' (opencode vendor path)
 *   'openai-codex:gpt-5.5'        → 'gpt-5-5'   (hermes routed ids)
 *   'Claude-Opus-4.5'             → 'claude-opus-4-5'
 *
 * Steps: take the segment after the last '/', then after the first ':'
 * (vendor routing prefixes), lowercase, fold '.'/'_' separators to '-', and
 * strip the AMR 'public-model-' prefix.
 */
export function normalizeModelId(raw: string | null | undefined): string {
  if (typeof raw !== 'string') return '';
  let id = raw.trim();
  if (!id) return '';
  const slash = id.lastIndexOf('/');
  if (slash >= 0) id = id.slice(slash + 1);
  const colon = id.indexOf(':');
  if (colon >= 0) id = id.slice(colon + 1);
  id = id.toLowerCase().replace(/[._]/g, '-');
  id = id.replace(/^public-model-/, '');
  return id;
}

// Short / vendor-specific aliases that should resolve to a canonical catalog
// key. Keys and values are both in normalized form.
const MODEL_ALIASES: Record<string, string> = {
  // Claude CLI short aliases (apps/daemon/src/runtimes/defs/claude.ts).
  opus: 'claude-opus-4-5',
  sonnet: 'claude-sonnet-4-5',
  haiku: 'claude-haiku-4-5',
  fable: 'claude-fable-5',
  // Hermes/grok long-form id for the same non-reasoning snapshot.
  'grok-4-20-0309-non-reasoning': 'grok-4-20-non-reasoning',
  // DeepSeek API's serving name for the current V3.x chat snapshot.
  'deepseek-chat': 'deepseek-v3-2',
};

// ---------------------------------------------------------------------------
// Builtin catalog
// ---------------------------------------------------------------------------

// Keyed by normalized model id (see normalizeModelId). Keep entries concise:
// one description line stating what the model is and what it is good for.
const MODEL_CATALOG: Record<string, ModelCatalogEntry> = {
  // ---- Anthropic Claude -------------------------------------------------
  'claude-opus-4-5': {
    description:
      "Anthropic's most capable Claude 4.5 model — deep reasoning for complex, long-horizon tasks.",
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    pricing: { inputPer1M: 5, outputPer1M: 25, cacheReadPer1M: 0.5, currency: 'USD' },
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding'],
    recommendedFor: ['plan', 'design'],
  },
  'claude-sonnet-4-5': {
    description:
      "Anthropic's balanced flagship — strong coding and agentic work at mid-tier cost.",
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    pricing: { inputPer1M: 3, outputPer1M: 15, cacheReadPer1M: 0.3, currency: 'USD' },
    speedTier: 'balanced',
    tags: ['reasoning', 'vision', 'coding'],
    recommendedFor: ['chat', 'plan', 'design'],
  },
  'claude-haiku-4-5': {
    description:
      "Anthropic's fast, low-cost model — near-frontier quality for quick everyday turns.",
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    pricing: { inputPer1M: 1, outputPer1M: 5, cacheReadPer1M: 0.1, currency: 'USD' },
    speedTier: 'fast',
    tags: ['vision', 'coding'],
    recommendedFor: ['chat'],
  },
  'claude-fable-5': {
    description:
      "Anthropic's newest frontier generation — top-end reasoning and design work.",
    contextWindow: 200_000,
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding'],
    recommendedFor: ['plan', 'design'],
  },
  'claude-sonnet-4-6': {
    description:
      "Anthropic's updated mid-tier Claude — balanced coding and agentic performance.",
    contextWindow: 200_000,
    speedTier: 'balanced',
    tags: ['reasoning', 'vision', 'coding'],
    recommendedFor: ['chat', 'plan', 'design'],
  },
  'claude-sonnet-4-6-1m': {
    description:
      'Claude Sonnet 4.6 with a 1M-token context window for very large codebases and documents.',
    contextWindow: 1_000_000,
    speedTier: 'balanced',
    tags: ['reasoning', 'vision', 'coding', 'long-context'],
    recommendedFor: ['plan', 'design'],
  },
  'claude-opus-4-8': {
    description:
      "Anthropic's top Opus-class model — strongest reasoning for the hardest tasks.",
    contextWindow: 200_000,
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding'],
    recommendedFor: ['plan', 'design'],
  },
  'claude-opus-4-8-1m': {
    description:
      'Claude Opus 4.8 with a 1M-token context window — frontier reasoning over huge inputs.',
    contextWindow: 1_000_000,
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding', 'long-context'],
    recommendedFor: ['plan', 'design'],
  },

  // ---- OpenAI GPT / codex ----------------------------------------------
  'gpt-5': {
    description:
      "OpenAI's GPT-5 flagship — broad knowledge with strong reasoning and coding.",
    contextWindow: 400_000,
    maxOutputTokens: 128_000,
    pricing: { inputPer1M: 1.25, outputPer1M: 10, cacheReadPer1M: 0.125, currency: 'USD' },
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding'],
    recommendedFor: ['plan', 'design'],
  },
  'gpt-5-codex': {
    description:
      'GPT-5 tuned for agentic software engineering — long autonomous coding sessions.',
    contextWindow: 400_000,
    maxOutputTokens: 128_000,
    pricing: { inputPer1M: 1.25, outputPer1M: 10, cacheReadPer1M: 0.125, currency: 'USD' },
    speedTier: 'powerful',
    tags: ['coding', 'reasoning'],
    recommendedFor: ['plan'],
  },
  'gpt-5-1': {
    description:
      'GPT-5.1 — smarter and more steerable GPT-5 update with adaptive reasoning.',
    contextWindow: 400_000,
    maxOutputTokens: 128_000,
    pricing: { inputPer1M: 1.25, outputPer1M: 10, cacheReadPer1M: 0.125, currency: 'USD' },
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding'],
    recommendedFor: ['chat', 'plan', 'design'],
  },
  'gpt-5-1-codex-mini': {
    description:
      'Compact codex variant of GPT-5.1 — cheap, fast agentic coding for lighter tasks.',
    contextWindow: 400_000,
    pricing: { inputPer1M: 0.25, outputPer1M: 2, cacheReadPer1M: 0.025, currency: 'USD' },
    speedTier: 'fast',
    tags: ['coding'],
    recommendedFor: ['chat'],
  },
  'gpt-5-2': {
    description: 'GPT-5.2 — refreshed GPT-5 line with improved instruction following.',
    contextWindow: 400_000,
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding'],
    recommendedFor: ['chat', 'plan'],
  },
  'gpt-5-3-codex': {
    description:
      'Codex-tuned GPT-5.3 — deep agentic coding runs with strong tool use.',
    contextWindow: 400_000,
    speedTier: 'powerful',
    tags: ['coding', 'reasoning'],
    recommendedFor: ['plan'],
  },
  'gpt-5-4': {
    description:
      "OpenAI's GPT-5.4 flagship — frontier reasoning, coding and multimodal understanding.",
    contextWindow: 400_000,
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding'],
    recommendedFor: ['plan', 'design'],
  },
  'gpt-5-4-mini': {
    description:
      'Small, fast GPT-5.4 variant — low-cost choice for quick chat and light coding.',
    contextWindow: 400_000,
    speedTier: 'fast',
    tags: ['coding'],
    recommendedFor: ['chat'],
  },
  'gpt-5-5': {
    description:
      "OpenAI's newest GPT-5.5 flagship — strongest general reasoning in the GPT line.",
    contextWindow: 400_000,
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding'],
    recommendedFor: ['plan', 'design'],
  },
  o3: {
    description:
      "OpenAI's o3 reasoning model — methodical multi-step problem solving.",
    contextWindow: 200_000,
    maxOutputTokens: 100_000,
    pricing: { inputPer1M: 2, outputPer1M: 8, cacheReadPer1M: 0.5, currency: 'USD' },
    speedTier: 'powerful',
    tags: ['reasoning'],
    recommendedFor: ['plan'],
  },
  'o4-mini': {
    description:
      'Compact reasoning model — good math/coding accuracy at a fraction of o3 cost.',
    contextWindow: 200_000,
    maxOutputTokens: 100_000,
    pricing: { inputPer1M: 1.1, outputPer1M: 4.4, cacheReadPer1M: 0.275, currency: 'USD' },
    speedTier: 'fast',
    tags: ['reasoning', 'coding'],
    recommendedFor: ['chat'],
  },
  'gpt-4o': {
    description:
      "OpenAI's multimodal GPT-4o — solid general chat with vision support.",
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    pricing: { inputPer1M: 2.5, outputPer1M: 10, cacheReadPer1M: 1.25, currency: 'USD' },
    speedTier: 'balanced',
    tags: ['vision'],
    recommendedFor: ['chat'],
  },
  'gpt-image-2': {
    description:
      "OpenAI's image generation model — creates and edits images from text prompts.",
    speedTier: 'balanced',
    tags: ['vision'],
    recommendedFor: ['design'],
  },

  // ---- Google Gemini ------------------------------------------------------
  'gemini-3-pro-preview': {
    description:
      "Google's Gemini 3 Pro — frontier multimodal reasoning with a 1M-token context.",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    pricing: { inputPer1M: 2, outputPer1M: 12, currency: 'USD' },
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding', 'long-context'],
    recommendedFor: ['plan', 'design'],
  },
  'gemini-3-flash-preview': {
    description:
      'Fast Gemini 3 tier — low-latency multimodal turns over a 1M-token context.',
    contextWindow: 1_048_576,
    speedTier: 'fast',
    tags: ['vision', 'long-context'],
    recommendedFor: ['chat'],
  },
  'gemini-2-5-pro': {
    description:
      "Google's Gemini 2.5 Pro — strong reasoning and multimodal work over long inputs.",
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    pricing: { inputPer1M: 1.25, outputPer1M: 10, cacheReadPer1M: 0.31, currency: 'USD' },
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding', 'long-context'],
    recommendedFor: ['plan', 'design'],
  },
  'gemini-2-5-flash': {
    description:
      'Fast, cheap Gemini workhorse — good default for everyday multimodal chat.',
    contextWindow: 1_048_576,
    maxOutputTokens: 65_536,
    pricing: { inputPer1M: 0.3, outputPer1M: 2.5, cacheReadPer1M: 0.075, currency: 'USD' },
    speedTier: 'fast',
    tags: ['vision', 'long-context'],
    recommendedFor: ['chat'],
  },
  'gemini-2-5-flash-lite': {
    description:
      'Cheapest Gemini 2.5 tier — high-volume, latency-sensitive lightweight tasks.',
    contextWindow: 1_048_576,
    pricing: { inputPer1M: 0.1, outputPer1M: 0.4, cacheReadPer1M: 0.025, currency: 'USD' },
    speedTier: 'fast',
    tags: ['long-context'],
    recommendedFor: ['chat'],
  },
  'gemini-2-0-flash': {
    description:
      'Gemini 2.0 Flash — fast multimodal model with a 1M-token context window.',
    contextWindow: 1_048_576,
    pricing: { inputPer1M: 0.1, outputPer1M: 0.4, cacheReadPer1M: 0.025, currency: 'USD' },
    speedTier: 'fast',
    tags: ['vision', 'long-context'],
    recommendedFor: ['chat'],
  },
  'gemini-3-1-pro-preview': {
    description:
      "Google's Gemini 3.1 Pro preview — latest frontier multimodal reasoning tier.",
    contextWindow: 1_048_576,
    speedTier: 'powerful',
    tags: ['reasoning', 'vision', 'coding', 'long-context'],
    recommendedFor: ['plan', 'design'],
  },
  'gemini-3-1-flash-lite-preview': {
    description:
      'Lightest Gemini 3.1 preview tier — cheapest option for quick, simple turns.',
    contextWindow: 1_048_576,
    speedTier: 'fast',
    tags: ['long-context'],
    recommendedFor: ['chat'],
  },
  'gemini-3-5-flash': {
    description:
      'Fast Gemini 3.5 tier — low-latency multimodal chat and light coding.',
    contextWindow: 1_048_576,
    speedTier: 'fast',
    tags: ['vision', 'long-context'],
    recommendedFor: ['chat'],
  },

  // ---- DeepSeek ---------------------------------------------------------
  'deepseek-v3-2': {
    description:
      "DeepSeek's V3.2 chat model — very low cost with solid coding and reasoning.",
    contextWindow: 128_000,
    maxOutputTokens: 8_192,
    pricing: { inputPer1M: 0.28, outputPer1M: 0.42, cacheReadPer1M: 0.028, currency: 'USD' },
    speedTier: 'balanced',
    tags: ['coding', 'reasoning'],
    recommendedFor: ['chat'],
  },
  'deepseek-v4-pro': {
    description:
      "DeepSeek's V4 Pro — strongest DeepSeek tier for hard reasoning and coding.",
    contextWindow: 128_000,
    speedTier: 'powerful',
    tags: ['reasoning', 'coding'],
    recommendedFor: ['plan'],
  },
  'deepseek-v4-flash': {
    description:
      'Fast DeepSeek V4 tier — quick, cheap turns for everyday chat and coding.',
    contextWindow: 128_000,
    speedTier: 'fast',
    tags: ['coding'],
    recommendedFor: ['chat'],
  },

  // ---- Zhipu GLM ----------------------------------------------------------
  'glm-5': {
    description:
      "Zhipu's GLM-5 flagship — strong agentic coding and reasoning at low cost.",
    contextWindow: 200_000,
    speedTier: 'powerful',
    tags: ['reasoning', 'coding'],
    recommendedFor: ['plan'],
  },
  'glm-5-1': {
    description:
      "Zhipu's updated GLM-5.1 — improved agentic coding and tool use over GLM-5.",
    contextWindow: 200_000,
    speedTier: 'powerful',
    tags: ['reasoning', 'coding'],
    recommendedFor: ['plan'],
  },
  'glm-5v-turbo': {
    description:
      'Vision-capable GLM turbo tier — fast multimodal understanding on a budget.',
    speedTier: 'fast',
    tags: ['vision'],
    recommendedFor: ['chat'],
  },

  // ---- Qwen ---------------------------------------------------------------
  'qwen3-coder-plus': {
    description:
      "Alibaba's Qwen3 Coder Plus — repository-scale agentic coding over huge contexts.",
    contextWindow: 1_048_576,
    speedTier: 'balanced',
    tags: ['coding', 'long-context'],
    recommendedFor: ['plan'],
  },
  'qwen3-coder-flash': {
    description:
      'Fast Qwen3 Coder tier — quick code edits and completions at low cost.',
    contextWindow: 1_048_576,
    speedTier: 'fast',
    tags: ['coding', 'long-context'],
    recommendedFor: ['chat'],
  },
  'qwen3-235b-a22b': {
    description:
      "Qwen3's 235B MoE model — strong open-weight general reasoning and chat.",
    contextWindow: 131_072,
    speedTier: 'balanced',
    tags: ['reasoning'],
    recommendedFor: ['chat', 'plan'],
  },

  // ---- Moonshot / Kimi ------------------------------------------------------
  'kimi-k2-turbo-preview': {
    description:
      "Moonshot's fast K2 serving tier — high-speed agentic chat and coding.",
    contextWindow: 262_144,
    speedTier: 'fast',
    tags: ['coding', 'long-context'],
    recommendedFor: ['chat'],
  },
  'kimi-k2-6': {
    description:
      "Moonshot's Kimi K2.6 — top open-weight tier for agentic coding and reasoning.",
    contextWindow: 262_144,
    speedTier: 'powerful',
    tags: ['reasoning', 'coding', 'long-context'],
    recommendedFor: ['plan'],
  },
  'moonshot-v1-8k': {
    description: 'Legacy Moonshot v1 chat model with an 8K context window.',
    contextWindow: 8_192,
    speedTier: 'fast',
    recommendedFor: ['chat'],
  },
  'moonshot-v1-32k': {
    description: 'Legacy Moonshot v1 chat model with a 32K context window.',
    contextWindow: 32_768,
    speedTier: 'fast',
    recommendedFor: ['chat'],
  },

  // ---- MiniMax -------------------------------------------------------------
  'minimax-m2-7': {
    description:
      "MiniMax's M2.7 — cost-efficient agentic model tuned for coding workflows.",
    contextWindow: 200_000,
    speedTier: 'balanced',
    tags: ['coding', 'reasoning'],
    recommendedFor: ['chat', 'plan'],
  },
  'minimax-m3': {
    description:
      "MiniMax's M3 — strongest MiniMax tier for complex agentic tasks.",
    contextWindow: 200_000,
    speedTier: 'powerful',
    tags: ['reasoning', 'coding'],
    recommendedFor: ['plan'],
  },

  // ---- xAI Grok --------------------------------------------------------------
  'grok-build': {
    description:
      "xAI's coding-agent default — balanced Grok tier tuned for build tasks.",
    speedTier: 'balanced',
    tags: ['coding'],
    recommendedFor: ['chat', 'plan'],
  },
  'grok-4-3': {
    description:
      "xAI's Grok 4.3 flagship — frontier reasoning with real-time knowledge.",
    contextWindow: 256_000,
    speedTier: 'powerful',
    tags: ['reasoning', 'coding'],
    recommendedFor: ['plan'],
  },
  'grok-4-20-reasoning': {
    description:
      'Grok 4.20 in deep-reasoning mode — slower, most thorough Grok answers.',
    contextWindow: 256_000,
    speedTier: 'powerful',
    tags: ['reasoning'],
    recommendedFor: ['plan'],
  },
  'grok-4-20-non-reasoning': {
    description:
      'Grok 4.20 without extended reasoning — fast turns for simple queries.',
    contextWindow: 256_000,
    speedTier: 'fast',
    recommendedFor: ['chat'],
  },

  // ---- Media generation (AMR catalog) ----------------------------------------
  'seedance-2': {
    description:
      "ByteDance's Seedance 2 — text- and image-to-video generation model.",
    speedTier: 'balanced',
    recommendedFor: ['design'],
  },
};

// ---------------------------------------------------------------------------
// Lookup + enrichment
// ---------------------------------------------------------------------------

function resolveCatalogKey(raw: string | null | undefined): string | null {
  const normalized = normalizeModelId(raw);
  if (!normalized) return null;
  const aliased = MODEL_ALIASES[normalized] ?? normalized;
  if (MODEL_CATALOG[aliased]) return aliased;
  // Gateway deployment suffixes (e.g. CodeBuddy's `-ioa` rehosted ids like
  // `deepseek-v4-pro-ioa`) refer to the same underlying model.
  const withoutDeploymentSuffix = aliased.replace(/-ioa$/, '');
  if (withoutDeploymentSuffix !== aliased) {
    const realiased = MODEL_ALIASES[withoutDeploymentSuffix] ?? withoutDeploymentSuffix;
    if (MODEL_CATALOG[realiased]) return realiased;
  }
  return null;
}

/**
 * Look up builtin catalog metadata for a model id. Accepts any surface's
 * raw spelling (AMR `public_model_*`, vendor-path ids, dot/underscore
 * separators, Claude short aliases). Returns null for unknown models.
 */
export function lookupModelMeta(id: string): ModelCatalogEntry | null {
  const key = resolveCatalogKey(id);
  return key ? MODEL_CATALOG[key] ?? null : null;
}

// The metadata fields enrichment may copy from the catalog onto an option.
const ENRICHABLE_FIELDS = [
  'description',
  'contextWindow',
  'maxOutputTokens',
  'pricing',
  'speedTier',
  'tags',
  'recommendedFor',
  'deprecated',
] as const satisfies ReadonlyArray<keyof ModelCatalogEntry>;

/**
 * Merge builtin catalog metadata into bare `{ id, label }` model options.
 *
 * Source-supplied metadata always wins: a field is only filled from the
 * catalog when the option does not already carry it. This keeps
 * provider/remote catalogs (AMR live models, Google `/v1beta/models`
 * token limits, …) authoritative while still giving static fallback lists
 * full model cards. Options for unknown models pass through unchanged.
 */
function fillFieldFromCatalog<K extends (typeof ENRICHABLE_FIELDS)[number]>(
  target: AgentModelOption,
  meta: ModelCatalogEntry,
  field: K,
): void {
  if (target[field] !== undefined || meta[field] === undefined) return;
  // Copy (not share) object-valued fields so callers can't mutate the
  // catalog through an enriched option.
  const value = meta[field];
  const copied = Array.isArray(value)
    ? [...value]
    : value !== null && typeof value === 'object'
      ? { ...value }
      : value;
  target[field] = copied as AgentModelOption[K];
}

export function enrichModelOptions(options: AgentModelOption[]): AgentModelOption[] {
  return options.map((option) => {
    const meta = lookupModelMeta(option.id);
    if (!meta) return option;
    const enriched: AgentModelOption = { ...option };
    for (const field of ENRICHABLE_FIELDS) {
      fillFieldFromCatalog(enriched, meta, field);
    }
    return enriched;
  });
}

/**
 * Estimate a run's USD cost from catalog list pricing. Used by the usage
 * ledger when a runtime does not report `costUsd` itself; such estimates are
 * recorded with `cost_source='estimated'` and rendered as `≈$`.
 *
 * Returns null when the model is unknown or the catalog has no usable
 * pricing for it (both input and output rates are required). Cache reads are
 * priced at `cacheReadPer1M` when present, falling back to the input rate.
 */
export function estimateCostUsd(
  model: string | null | undefined,
  usage: { input?: number; output?: number; cacheRead?: number },
): number | null {
  if (!model) return null;
  const pricing = lookupModelMeta(model)?.pricing;
  if (!pricing) return null;
  const { inputPer1M, outputPer1M } = pricing;
  if (typeof inputPer1M !== 'number' || typeof outputPer1M !== 'number') {
    return null;
  }
  const cacheReadPer1M =
    typeof pricing.cacheReadPer1M === 'number' ? pricing.cacheReadPer1M : inputPer1M;
  const input = usage.input ?? 0;
  const output = usage.output ?? 0;
  const cacheRead = usage.cacheRead ?? 0;
  return (
    (input * inputPer1M + output * outputPer1M + cacheRead * cacheReadPer1M) /
    1_000_000
  );
}
