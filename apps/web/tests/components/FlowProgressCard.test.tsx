// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyFlowMarker, createFlowSnapshot } from '@open-design/contracts';
import { FlowProgressCard } from '../../src/components/FlowProgressCard';

afterEach(cleanup);

describe('FlowProgressCard', () => {
  it('shows the stable five-stage journey with research explicitly optional', () => {
    let flow = createFlowSnapshot('deck', { now: 1 });
    flow = applyFlowMarker(flow, { stage: 'clarify', state: 'active' }, 1);

    render(<FlowProgressCard flow={flow} />);

    expect(screen.getByText('Task progress')).toBeTruthy();
    expect(screen.getByText('Step 1 of 5')).toBeTruthy();
    expect(screen.getByText('Brief & questions')).toBeTruthy();
    expect(screen.getByText('Research (optional)')).toBeTruthy();
    expect(screen.getByText('Outline')).toBeTruthy();
    expect(screen.getByText('Inspiration')).toBeTruthy();
    expect(screen.getByText('Implement')).toBeTruthy();
    // Delivery remains the completion CTA outside the progress journey.
    expect(screen.queryByText('Download / share')).toBeNull();
    // Pending steps always carry a "when does this start" preview line.
    expect(screen.getByText('Pick after the outline is confirmed')).toBeTruthy();
  });

  it('keeps the same five visible stages when deep research is selected', () => {
    const flow = {
      ...createFlowSnapshot('deck', { now: 1 }),
      researchMode: 'deep' as const,
    };

    render(<FlowProgressCard flow={flow} />);

    expect(screen.getByText('Step 1 of 5')).toBeTruthy();
    expect(screen.getByText('Research (optional)')).toBeTruthy();
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

  it('localizes canonical engine details while preserving template names', () => {
    let flow = createFlowSnapshot('mobile', { now: 1 });
    flow = applyFlowMarker(
      flow,
      { stage: 'plan', state: 'complete', detail: 'Outline confirmed' },
      2,
    );
    flow = applyFlowMarker(
      flow,
      {
        stage: 'inspire',
        state: 'complete',
        detail: 'Using template wireframe-mobile-flow',
      },
      3,
    );

    render(<FlowProgressCard flow={flow} />);

    expect(screen.queryByText('Outline confirmed')).toBeNull();
    expect(screen.queryByText('Using template wireframe-mobile-flow')).toBeNull();
    expect(screen.getAllByText('Done').length).toBeGreaterThan(0);
    expect(screen.getByText('selected · wireframe-mobile-flow')).toBeTruthy();
  });

  it('opens a durable stage artifact from the progress card', () => {
    const onOpenArtifact = vi.fn();
    const flow = applyFlowMarker(
      createFlowSnapshot('deck', { now: 1 }),
      { stage: 'clarify', state: 'active' },
      2,
    );
    render(
      <FlowProgressCard
        flow={flow}
        stageArtifactPaths={{ clarify: ['generated/brief.md'] }}
        onOpenArtifact={onOpenArtifact}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Brief & questions: generated/brief.md',
      }),
    );

    expect(onOpenArtifact).toHaveBeenCalledWith('generated/brief.md');
  });

  it('keeps completed research and plan outputs visible instead of collapsing them to Done', () => {
    let flow = createFlowSnapshot('deck', { now: 1, researchMode: 'deep' });
    flow = applyFlowMarker(flow, { stage: 'research', state: 'complete' }, 2);
    flow = applyFlowMarker(flow, { stage: 'plan', state: 'active' }, 3);

    render(
      <FlowProgressCard
        flow={flow}
        stageArtifactPaths={{
          research: ['research/market-scan.md'],
          plan: ['generated/outline.md'],
        }}
      />,
    );

    expect(screen.getByText('research/market-scan.md')).toBeTruthy();
    expect(screen.getByText('generated/outline.md')).toBeTruthy();
  });

  it('opens the stage form instead of its generated brief artifact', () => {
    const onOpenForm = vi.fn();
    const onOpenArtifact = vi.fn();
    render(
      <FlowProgressCard
        flow={createFlowSnapshot('deck', { now: 1 })}
        stageArtifactPaths={{ clarify: ['generated/brief.md'] }}
        stageActions={{ clarify: onOpenForm }}
        onOpenArtifact={onOpenArtifact}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Brief & questions' }));

    expect(onOpenForm).toHaveBeenCalledOnce();
    expect(onOpenArtifact).not.toHaveBeenCalled();
  });

  it('does not attach a previous artifact to a stage that is still pending', () => {
    render(
      <FlowProgressCard
        flow={createFlowSnapshot('prototype', { now: 1 })}
        stageArtifactPaths={{ generate: ['generated/previous-round.html'] }}
      />,
    );

    expect(screen.queryByText('generated/previous-round.html')).toBeNull();
  });
});
