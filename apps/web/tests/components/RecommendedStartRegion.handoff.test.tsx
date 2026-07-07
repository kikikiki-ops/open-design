// @vitest-environment jsdom
//
// Regression test for "recommendation handoff must not leave a stale slot on a
// failed create" (PR #5111 review). The Home→Studio onboarding entry is stashed
// in sessionStorage before the project is created; if the create fails or is
// aborted, `handleEnter` must clear it so a later unrelated project mount can't
// consume the stale slot and mis-attribute itself as recommendation-started.

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { I18nProvider } from '../../src/i18n';
import { RecommendedStartRegion } from '../../src/components/RecommendedStartRegion';
import { buildRecommendation } from '../../src/onboarding/recommendation';
import { consumePendingOnboardingEntry } from '../../src/onboarding/onboarding-entry';

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

type OnStart = (input: { name: string; prompt: string; metadata: unknown }) => unknown;

function renderRegion(onStart: OnStart) {
  const recommendation = buildRecommendation({ role: 'designer', useCases: ['prototype'] });
  return render(
    <I18nProvider initial="en">
      <RecommendedStartRegion
        recommendation={recommendation}
        onStart={onStart as never}
        onDismiss={() => undefined}
      />
    </I18nProvider>,
  );
}

describe('RecommendedStartRegion — Start in Studio handoff', () => {
  it('clears the pending entry when the create reports failure', async () => {
    const onStart = vi.fn(() => false);
    renderRegion(onStart);
    fireEvent.click(screen.getByTestId('home-recommendation-start'));
    await waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
    expect(consumePendingOnboardingEntry()).toBeNull();
  });

  it('clears the pending entry when the create throws', async () => {
    const onStart = vi.fn(() => {
      throw new Error('create failed');
    });
    renderRegion(onStart);
    fireEvent.click(screen.getByTestId('home-recommendation-start'));
    await waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
    expect(consumePendingOnboardingEntry()).toBeNull();
  });

  it('leaves the pending entry for Studio to consume on success', async () => {
    const onStart = vi.fn(async () => true);
    renderRegion(onStart);
    fireEvent.click(screen.getByTestId('home-recommendation-start'));
    await waitFor(() => expect(onStart).toHaveBeenCalledTimes(1));
    // Settle the awaited success path — no clear should have run.
    await Promise.resolve();
    expect(consumePendingOnboardingEntry()).toMatchObject({
      source: 'home_recommendation',
      recommendationId: 'product_ui_prototype',
    });
  });
});
