// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PersistedAgentEvent } from '@open-design/contracts';
import { OdComputerPanel } from '../../src/components/OdComputerPanel';

afterEach(cleanup);

const threeSteps: PersistedAgentEvent[] = [
  { kind: 'tool_use', id: 't1', name: 'WebSearch', input: { query: 'agent replay' } },
  { kind: 'tool_result', toolUseId: 't1', content: 'results', isError: false },
  { kind: 'tool_use', id: 't2', name: 'Read', input: { file_path: 'notes.md' } },
  { kind: 'tool_result', toolUseId: 't2', content: 'body', isError: false },
  { kind: 'tool_use', id: 't3', name: 'Write', input: { file_path: 'deck.html' } },
  { kind: 'tool_result', toolUseId: 't3', content: 'ok', isError: false },
];

describe('OdComputerPanel', () => {
  it('shows an empty state when the round has no steps', () => {
    render(<OdComputerPanel events={[]} live={false} variant="side" />);
    expect(screen.getByTestId('od-computer-body').textContent).toContain('Steps appear here');
  });

  it('follows live: the newest step is selected and the Live indicator shows', () => {
    render(<OdComputerPanel events={threeSteps} live variant="side" />);
    // Newest step (Write deck.html) drives the header status line.
    expect(screen.getByTestId('od-computer-status').textContent).toContain('deck.html');
    expect(screen.getByTestId('od-computer-live')).toBeTruthy();
  });

  it('scrubs to a past step and offers Jump to live', () => {
    render(<OdComputerPanel events={threeSteps} live variant="side" />);
    const scrubber = screen.getByTestId('od-computer-scrubber') as HTMLInputElement;

    fireEvent.change(scrubber, { target: { value: '0' } });

    // Now inspecting the first step (search) — no longer following live.
    expect(screen.getByTestId('od-computer-status').textContent).toContain('agent replay');
    expect(screen.queryByTestId('od-computer-live')).toBeNull();
    const jump = screen.getByTestId('od-computer-jump-live');

    fireEvent.click(jump);

    // Back to following the newest step.
    expect(screen.getByTestId('od-computer-status').textContent).toContain('deck.html');
    expect(screen.getByTestId('od-computer-live')).toBeTruthy();
  });

  it('steps forward and backward through the timeline', () => {
    render(<OdComputerPanel events={threeSteps} live variant="side" />);
    // Start following (newest = step 3). Prev → step 2 (Read notes.md).
    fireEvent.click(screen.getByLabelText('Previous step'));
    expect(screen.getByTestId('od-computer-status').textContent).toContain('notes.md');
    // Next → back to newest (Write deck.html), re-following live.
    fireEvent.click(screen.getByLabelText('Next step'));
    expect(screen.getByTestId('od-computer-status').textContent).toContain('deck.html');
    expect(screen.getByTestId('od-computer-live')).toBeTruthy();
  });
});
