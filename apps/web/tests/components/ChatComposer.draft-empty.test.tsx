// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChatComposer } from '../../src/components/ChatComposer';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderComposer(props: Partial<Parameters<typeof ChatComposer>[0]> = {}) {
  const onDraftEmptyChange = vi.fn<(isEmpty: boolean) => void>();
  render(
    <ChatComposer
      projectId="project-1"
      projectFiles={[]}
      streaming={false}
      onEnsureProject={async () => 'project-1'}
      onSend={vi.fn()}
      onStop={vi.fn()}
      onDraftEmptyChange={onDraftEmptyChange}
      {...props}
    />,
  );
  return { onDraftEmptyChange };
}

// Regression guard for the Studio quick-start cards: the parent (ChatPane)
// hides them whenever the composer actually has content, driven by
// `onDraftEmptyChange`. The composer's draft can come from an initial seed OR a
// restored/persisted draft, so this contract — reporting the real emptiness on
// mount — is what keeps the cards from lingering next to a seeded recommendation
// prompt (the bug this pins).
describe('ChatComposer onDraftEmptyChange', () => {
  it('reports empty on mount for a blank composer', () => {
    const { onDraftEmptyChange } = renderComposer();
    expect(onDraftEmptyChange.mock.calls.at(-1)?.[0]).toBe(true);
  });

  it('reports non-empty on mount when seeded with an initial draft', () => {
    const { onDraftEmptyChange } = renderComposer({ initialDraft: 'Design a landing page' });
    expect(onDraftEmptyChange.mock.calls.at(-1)?.[0]).toBe(false);
  });

  it('treats a whitespace-only seed as empty', () => {
    const { onDraftEmptyChange } = renderComposer({ initialDraft: '   ' });
    expect(onDraftEmptyChange.mock.calls.at(-1)?.[0]).toBe(true);
  });
});
