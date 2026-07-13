import type { FlowShapeId, FlowSnapshot } from './flow.js';

/** Minimal template metadata consumed by deterministic inspiration ranking. */
export interface InspireCatalogueEntry {
  id: string;
  name: string;
  description?: string;
  mode: string;
  platform?: string | null;
  tags?: readonly string[];
  triggers?: readonly string[];
  category?: string | null;
  scenario?: string | null;
  examplePrompt?: string;
  defaultFor?: readonly string[];
}

/** `POST /api/inspire/rank` request. */
export interface InspireRankRequest {
  brief: string;
  outlineTitles: string[];
  mode: FlowShapeId;
}

/** `POST /api/inspire/rank` response. */
export interface InspireRankResponse {
  /** Every eligible template id, ordered best-first and de-duplicated. */
  ranked: string[];
  /** One-line explanations for the leading recommendations only. */
  reasons: Record<string, string>;
}

/** `POST /api/conversations/:id/flow/inspire` request. */
export type InspireChoiceRequest =
  | { action: 'apply'; templateId: string }
  | { action: 'skip' };

/** `POST /api/conversations/:id/flow/inspire` response. */
export interface InspireChoiceResponse {
  conversationId: string;
  flow: FlowSnapshot;
}
