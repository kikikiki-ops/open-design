// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  InspirePanel,
  type InspirePanelProps,
  type RankedInspireTemplate,
} from '../../src/components/InspirePanel';

afterEach(cleanup);

const templates: RankedInspireTemplate[] = [
  {
    id: 'minimal/deck',
    title: 'Minimal Deck',
    reason: 'Strong hierarchy for an investor narrative.',
    category: 'Deck',
  },
  {
    id: 'editorial-report',
    title: 'Editorial Report',
    reason: 'Balances dense evidence with clear pacing.',
    category: 'Report',
  },
];

function createProps(
  overrides: Partial<InspirePanelProps> = {},
): InspirePanelProps {
  return {
    rankedTemplates: templates,
    loading: false,
    selectedId: null,
    searchQuery: '',
    categories: [
      { id: 'deck', label: 'Deck' },
      { id: 'report', label: 'Report' },
    ],
    selectedCategory: null,
    onSelect: vi.fn(),
    onApply: vi.fn(),
    onSkip: vi.fn(),
    onSearch: vi.fn(),
    onCategory: vi.fn(),
    ...overrides,
  };
}

describe('InspirePanel', () => {
  it('leaves the default selection to the parent and uses skill preview URLs', () => {
    const props = createProps();
    const view = render(<InspirePanel {...props} />);

    const firstCard = view.container.querySelector(
      '[data-template-id=\'minimal/deck\']',
    );
    expect(firstCard?.getAttribute('data-selected')).toBe('false');
    expect(
      firstCard?.querySelector('iframe')?.getAttribute('src'),
    ).toBe('/api/skills/minimal%2Fdeck/example');
    expect(screen.getByRole('button', { name: 'Use this style' })).toHaveProperty(
      'disabled',
      true,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Select' })[0]!);
    expect(props.onSelect).toHaveBeenCalledWith('minimal/deck');

    const controlledProps = createProps({
      ...props,
      selectedId: 'minimal/deck',
    });
    view.rerender(<InspirePanel {...controlledProps} />);
    const selectedCard = view.container.querySelector(
      '[data-template-id=\'minimal/deck\']',
    );
    expect(selectedCard?.getAttribute('data-selected')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Use this style' }));
    expect(props.onApply).toHaveBeenCalledWith('minimal/deck');
  });

  it('forwards search, category, skip, and card selection actions', () => {
    const props = createProps({ selectedCategory: 'deck' });
    const view = render(<InspirePanel {...props} />);

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search templates' }),
      { target: { value: 'minimal' } },
    );
    expect(props.onSearch).toHaveBeenCalledWith('minimal');

    fireEvent.click(screen.getByRole('button', { name: 'Report' }));
    expect(props.onCategory).toHaveBeenCalledWith('report');

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(props.onCategory).toHaveBeenCalledWith(null);

    const reportCard = view.container.querySelector(
      '[data-template-id=\'editorial-report\']',
    );
    fireEvent.click(
      within(reportCard as HTMLElement).getByRole('button', { name: 'Select' }),
    );
    expect(props.onSelect).toHaveBeenCalledWith('editorial-report');

    fireEvent.click(
      screen.getByRole('button', { name: 'Use the default style' }),
    );
    expect(props.onSkip).toHaveBeenCalledOnce();
  });

  it('renders a loading state without template cards', () => {
    const props = createProps({
      loading: true,
      rankedTemplates: [],
      copy: { loading: 'Finding the best matches' },
    });
    const view = render(<InspirePanel {...props} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Finding the best matches',
    );
    expect(view.container.querySelector('[data-template-id]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Use this style' })).toHaveProperty(
      'disabled',
      true,
    );
  });
});
