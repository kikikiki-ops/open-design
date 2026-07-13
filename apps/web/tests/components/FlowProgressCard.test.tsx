// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { applyFlowMarker, createFlowSnapshot } from '@open-design/contracts';
import { FlowProgressCard } from '../../src/components/FlowProgressCard';

afterEach(cleanup);

describe('FlowProgressCard', () => {
  it('renders the full ladder with the active step and pending hints', () => {
    let flow = createFlowSnapshot('deck', { now: 1 });
    flow = applyFlowMarker(flow, { stage: 'clarify', state: 'active' }, 1);

    render(<FlowProgressCard flow={flow} />);

    expect(screen.getByText('Task progress')).toBeTruthy();
    expect(screen.getByText('Step 1 of 6')).toBeTruthy();
    expect(screen.getByText('Confirm the brief')).toBeTruthy();
    // Pending steps always carry a "when does this start" preview line.
    expect(screen.getByText('Pick after the plan is confirmed')).toBeTruthy();
    expect(screen.getByText('Download or share when generation ends')).toBeTruthy();
  });

  it('shows generate progress counts and stage detail lines', () => {
    let flow = createFlowSnapshot('deck', { now: 1 });
    flow = applyFlowMarker(
      flow,
      { stage: 'research', state: 'skipped', detail: 'Skipped · default style' },
      1,
    );
    flow = applyFlowMarker(flow, { stage: 'generate', state: 'active', done: 3, total: 12 }, 2);

    render(<FlowProgressCard flow={flow} />);

    expect(screen.getByText('3 / 12 slides')).toBeTruthy();
    expect(screen.getByText('Skipped · default style')).toBeTruthy();
  });
});
