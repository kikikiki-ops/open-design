import { describe, expect, it } from 'vitest';

import {
  parseDeckOutlineMarkdown,
  serializeDeckOutlineMarkdown,
} from '../../src/runtime/deck-outline';

describe('deck outline markdown', () => {
  it('parses numbered slide headings and bullet points', () => {
    const pages = parseDeckOutlineMarkdown([
      '# Product launch',
      '',
      '## 1. Opening',
      '- The customer problem',
      '- The promise',
      '',
      '## Slide 2: Evidence',
      '1. Market signal',
    ].join('\n'));

    expect(pages).toEqual([
      {
        id: 'page-1',
        title: 'Opening',
        points: ['The customer problem', 'The promise'],
      },
      {
        id: 'page-2',
        title: 'Evidence',
        points: ['Market signal'],
      },
    ]);
  });

  it('round-trips editable pages into the canonical artifact shape', () => {
    const markdown = serializeDeckOutlineMarkdown([
      { id: 'intro', title: 'Opening', points: ['Lead with the outcome'] },
      { id: 'close', title: 'Next step', points: ['Ask for approval'] },
    ]);

    expect(markdown).toContain('# Deck outline');
    expect(parseDeckOutlineMarkdown(markdown).map(({ title, points }) => ({ title, points }))).toEqual([
      { title: 'Opening', points: ['Lead with the outcome'] },
      { title: 'Next step', points: ['Ask for approval'] },
    ]);
  });
});
