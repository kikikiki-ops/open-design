import { describe, expect, it } from 'vitest';

import type {
  InspireChoiceRequest,
  InspireRankRequest,
  InspireRankResponse,
} from '../src/index';

describe('inspiration API contracts', () => {
  it('keeps the rank request and response wire shapes explicit', () => {
    const request: InspireRankRequest = {
      brief: 'Coffee market pitch',
      outlineTitles: ['Brand story'],
      mode: 'deck',
    };
    const response: InspireRankResponse = {
      ranked: ['coffee-story'],
      reasons: { 'coffee-story': 'Matches coffee.' },
    };

    expect(request.mode).toBe('deck');
    expect(response.ranked).toEqual(['coffee-story']);
  });

  it('uses a discriminated apply-or-skip choice', () => {
    const choices: InspireChoiceRequest[] = [
      { action: 'apply', templateId: 'coffee-story' },
      { action: 'skip' },
    ];
    expect(choices.map((choice) => choice.action)).toEqual(['apply', 'skip']);
  });
});
