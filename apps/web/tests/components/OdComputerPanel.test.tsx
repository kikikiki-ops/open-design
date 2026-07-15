// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { PersistedAgentEvent } from '@open-design/contracts';
import { OdComputerPanel } from '../../src/components/OdComputerPanel';
import { deriveTaskRound } from '../../src/runtime/task-steps';

afterEach(cleanup);

const threeSteps: PersistedAgentEvent[] = [
  { kind: 'tool_use', id: 't1', name: 'WebSearch', input: { query: 'agent replay' } },
  { kind: 'tool_result', toolUseId: 't1', content: 'results', isError: false },
  { kind: 'tool_use', id: 't2', name: 'Read', input: { file_path: 'notes.md' } },
  { kind: 'tool_result', toolUseId: 't2', content: 'body', isError: false },
  { kind: 'tool_use', id: 't3', name: 'Write', input: { file_path: 'deck.html' } },
  { kind: 'tool_result', toolUseId: 't3', content: 'ok', isError: false },
];

function round(events: PersistedAgentEvent[], live = false) {
  return deriveTaskRound({
    id: 'a1',
    role: 'assistant',
    runId: 'run-1',
    runStatus: live ? 'running' : 'succeeded',
    events,
  });
}

describe('OdComputerPanel', () => {
  it('shows an empty state when the round has no steps', () => {
    render(<OdComputerPanel round={round([])} variant="side" />);
    expect(screen.getByTestId('od-computer-body').textContent).toContain('Steps appear here');
  });

  it('follows live: the newest step is selected and the Live indicator shows', () => {
    render(<OdComputerPanel round={round(threeSteps, true)} variant="side" />);
    // Newest step (Write deck.html) drives the header status line.
    expect(screen.getByTestId('od-computer-status').textContent).toContain('deck.html');
    expect(screen.getByTestId('od-computer-live')).toBeTruthy();
  });

  it('scrubs to a past step and offers Jump to live', () => {
    render(<OdComputerPanel round={round(threeSteps, true)} variant="side" />);
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
    render(<OdComputerPanel round={round(threeSteps, true)} variant="side" />);
    // Start following (newest = step 3). Prev → step 2 (Read notes.md).
    fireEvent.click(screen.getByLabelText('Previous step'));
    expect(screen.getByTestId('od-computer-status').textContent).toContain('notes.md');
    // Next → back to newest (Write deck.html), re-following live.
    fireEvent.click(screen.getByLabelText('Next step'));
    expect(screen.getByTestId('od-computer-status').textContent).toContain('deck.html');
    expect(screen.getByTestId('od-computer-live')).toBeTruthy();
  });

  it('keeps a manually selected history step when new live events append', () => {
    const { rerender } = render(<OdComputerPanel round={round(threeSteps, true)} variant="side" />);
    fireEvent.change(screen.getByTestId('od-computer-scrubber'), { target: { value: '0' } });
    expect(screen.getByTestId('od-computer-status').textContent).toContain('agent replay');

    rerender(
      <OdComputerPanel
        round={round([
          ...threeSteps,
          { kind: 'tool_use', id: 't4', name: 'Bash', input: { command: 'pnpm typecheck' } },
        ], true)}
        variant="side"
      />,
    );

    expect(screen.getByTestId('od-computer-status').textContent).toContain('agent replay');
    expect(screen.getByTestId('od-computer-jump-live')).toBeTruthy();

    fireEvent.click(screen.getByTestId('od-computer-jump-live'));
    expect(screen.getByTestId('od-computer-status').textContent).toContain('pnpm typecheck');
    expect(screen.getByTestId('od-computer-live')).toBeTruthy();
  });

  it('expands and collapses the task progress list below the timeline', () => {
    render(<OdComputerPanel round={round(threeSteps, true)} variant="side" />);

    expect(screen.getByTestId('od-computer-task-steps')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.getByTestId('od-computer-task-summary').getAttribute('data-collapsed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(screen.getByTestId('od-computer-task-summary').getAttribute('data-collapsed')).toBe('false');
  });

  it('keeps TodoWrite snapshots out of the Computer timeline and progress list', () => {
    const todoContent = 'Polish the task progress alignment';
    render(
      <OdComputerPanel
        round={round([
          {
            kind: 'tool_use',
            id: 'todo-1',
            name: 'TodoWrite',
            input: { todos: [{ content: todoContent, status: 'in_progress' }] },
          },
          { kind: 'tool_result', toolUseId: 'todo-1', content: 'ok', isError: false },
          { kind: 'tool_use', id: 'read-1', name: 'Read', input: { file_path: 'DESIGN.md' } },
        ], true)}
        variant="side"
      />,
    );

    expect(screen.getByTestId('od-computer-status').textContent).toContain('DESIGN.md');
    expect(screen.getByTestId('od-computer-panel').textContent).not.toContain(todoContent);
    expect(screen.queryByTestId('od-computer-task-todos')).toBeNull();
    expect(screen.getByTestId('od-computer-task-steps').querySelectorAll('li')).toHaveLength(1);
  });
});
