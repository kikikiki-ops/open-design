// Session-only carrier for the onboarding entry that started a project.
//
// The Home recommendation knows the entry context (which product path, which
// starter) but the funnel events that measure whether the user followed through
// — first prompt sent, first generation completed — fire later, in Studio,
// where that context isn't otherwise available. Rather than persist role /
// use-case / product_type to the project (the onboarding spec §9.2 forbids
// 落库), we hand the context across the Home→Studio navigation through a single
// sessionStorage slot: Home stashes it right before creating the project, and
// the next Studio to mount consumes it (read-once). It is intentionally lost on
// refresh — the first-prompt / first-generation moment happens in the same
// session immediately after the click.

import type { ProductType } from './recommendation';

export interface OnboardingEntry {
  source: 'home_recommendation';
  productType: ProductType;
  recommendationId: string;
}

const STORAGE_KEY = 'open-design:pending-onboarding-entry';

export function stashPendingOnboardingEntry(entry: OnboardingEntry): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Storage-denied contexts just lose the funnel attribution — never throw.
  }
}

// Read and remove the pending entry. Returns null when none is set (the common
// case: any project not started from a recommendation).
export function consumePendingOnboardingEntry(): OnboardingEntry | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as Partial<OnboardingEntry>;
    if (
      parsed &&
      parsed.source === 'home_recommendation' &&
      typeof parsed.productType === 'string' &&
      typeof parsed.recommendationId === 'string'
    ) {
      return {
        source: 'home_recommendation',
        productType: parsed.productType,
        recommendationId: parsed.recommendationId,
      };
    }
    return null;
  } catch {
    return null;
  }
}
