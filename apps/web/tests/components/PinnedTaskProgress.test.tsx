// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyFlowMarker, createFlowSnapshot } from '@open-design/contracts';
import { PinnedTaskProgress } from '../../src/components/PinnedTaskProgress';

afterEach(cleanup);

function clarifyActiveDeck() {
  let flow = createFlowSnapshot('deck', { now: 1 });
  flow = applyFlowMarker(flow, { stage: 'clarify', state: 'active' }, 1);
  return flow;
}

describe('PinnedTaskProgress', () => {
  it('renders the current-round flow ladder with a Live pill while running', () => {
    render(<PinnedTaskProgress flow={clarifyActiveDeck()} live />);

    const pinned = screen.getByTestId('pinned-task-progress');
    // The flow ladder lives inside the pinned card (headless FlowProgressCard).
    expect(pinned.contains(screen.getByTestId('flow-progress-card'))).toBe(true);
    // Expanded header shows the section title + a Live pill.
    expect(screen.getByText('Task progress')).toBeTruthy();
    expect(screen.getByTestId('pinned-task-live').textContent).toContain('Live');
    expect(screen.queryByTestId('pinned-task-status')).toBeNull();
  });

  it('shows a terminal status badge once the round has ended', () => {
    let flow = createFlowSnapshot('deck', { now: 1 });
    flow = applyFlowMarker(flow, { stage: 'deliver', state: 'active' }, 1);

    render(<PinnedTaskProgress flow={flow} live={false} status="succeeded" />);

    expect(screen.getByTestId('pinned-task-status').textContent).toContain('Completed');
    expect(screen.queryByTestId('pinned-task-live')).toBeNull();
  });

  it('toggles between the expanded ladder and the collapsed single row', () => {
    render(<PinnedTaskProgress flow={clarifyActiveDeck()} live />);
    const pinned = screen.getByTestId('pinned-task-progress');

    // Expanded: the accordion body is open.
    expect(pinned.querySelector('.accordion-collapsible.open')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));

    // Collapsed: body closed, toggle now offers to expand.
    expect(pinned.querySelector('.accordion-collapsible.open')).toBeNull();
    expect(screen.getByRole('button', { name: 'Expand' })).toBeTruthy();
  });

  it('exposes a Computer entry only when a handler is provided', () => {
    const onOpenComputer = vi.fn();
    const { rerender } = render(<PinnedTaskProgress flow={clarifyActiveDeck()} live />);
    expect(screen.queryByTestId('pinned-task-computer-entry')).toBeNull();

    rerender(
      <PinnedTaskProgress flow={clarifyActiveDeck()} live onOpenComputer={onOpenComputer} />,
    );
    fireEvent.click(screen.getByTestId('pinned-task-computer-entry'));
    expect(onOpenComputer).toHaveBeenCalledTimes(1);
  });
});
