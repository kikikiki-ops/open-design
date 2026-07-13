import { describe, expect, it } from 'vitest';

import { createFlowSnapshot } from '@open-design/contracts';
import { applyInspireChoice } from '../src/inspire/choice.js';
import {
  filterInspireCatalogue,
  rankInspireCatalogue,
} from '../src/inspire/rank.js';

describe('inspiration keyword ranking', () => {
  const catalogue = [
    {
      id: 'z-neutral',
      name: 'Neutral Grid',
      mode: 'deck',
      description: 'A general presentation system',
    },
    {
      id: 'coffee-story',
      name: 'Coffee Editorial',
      mode: 'deck',
      description: 'Editorial storytelling for a coffee market',
      tags: ['coffee', 'editorial'],
    },
    {
      id: 'coffee-story',
      name: 'Duplicate Coffee Editorial',
      mode: 'deck',
      description: 'This duplicate must not appear twice',
    },
    {
      id: 'a-minimal',
      name: 'Minimal',
      mode: 'deck',
    },
    {
      id: 'b-bold',
      name: 'Bold',
      mode: 'deck',
    },
    {
      id: 'c-classic',
      name: 'Classic',
      mode: 'deck',
    },
    {
      id: 'web-prototype',
      name: 'Web Prototype',
      mode: 'prototype',
      platform: 'web',
    },
  ] as const;

  it('filters by the shape registry, de-duplicates, and ranks every eligible id', () => {
    const result = rankInspireCatalogue(
      {
        brief: 'Coffee market pitch',
        outlineTitles: ['Brand story', 'Market opportunity'],
        mode: 'deck',
      },
      catalogue,
    );

    expect(result.ranked).toEqual([
      'coffee-story',
      'a-minimal',
      'b-bold',
      'c-classic',
      'z-neutral',
    ]);
    expect(new Set(result.ranked).size).toBe(result.ranked.length);
    expect(result.reasons['coffee-story']).toContain('coffee');
    expect(Object.keys(result.reasons)).toHaveLength(4);
    expect(result.reasons['z-neutral']).toBeUndefined();
  });

  it('honors platform filters declared by other flow shapes', () => {
    expect(filterInspireCatalogue('landing', catalogue)).toEqual([
      {
        id: 'web-prototype',
        name: 'Web Prototype',
        mode: 'prototype',
        platform: 'web',
      },
    ]);
  });
});

describe('durable inspiration choice', () => {
  it('applies a template once and treats an exact retry as unchanged', () => {
    const initial = createFlowSnapshot('deck', { now: 1 });
    const first = applyInspireChoice(
      initial,
      { action: 'apply', templateId: 'coffee-story' },
      2,
    );
    expect(first.status).toBe('updated');
    expect(first.flow.inspireChoice).toEqual({
      templateId: 'coffee-story',
      skipped: false,
    });
    expect(first.flow.stages.find((stage) => stage.id === 'inspire')?.state).toBe(
      'complete',
    );

    const retry = applyInspireChoice(
      first.flow,
      { action: 'apply', templateId: 'coffee-story' },
      3,
    );
    expect(retry).toEqual({ status: 'unchanged', flow: first.flow });
    expect(
      applyInspireChoice(first.flow, { action: 'skip' }, 3).status,
    ).toBe('conflict');
  });

  it('records an explicit skip with the default-style detail', () => {
    const result = applyInspireChoice(
      createFlowSnapshot('deck', { now: 1 }),
      { action: 'skip' },
      2,
    );
    expect(result.status).toBe('updated');
    expect(result.flow.inspireChoice).toEqual({ templateId: null, skipped: true });
    expect(result.flow.stages.find((stage) => stage.id === 'inspire')).toMatchObject({
      state: 'skipped',
      detail: 'Skipped · Using the default style',
    });
  });
});
