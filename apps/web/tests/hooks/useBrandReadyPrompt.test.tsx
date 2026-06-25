// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react';
import type { ProjectMetadata } from '@open-design/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useBrandReadyPrompt } from '../../src/runtime/useBrandReadyPrompt';

const BRAND_METADATA: ProjectMetadata = {
  kind: 'brand',
  importedFrom: 'brand-extraction',
  brandId: 'brand-1',
};

function mockBrandsResponse(brands: unknown[] = [
  {
    meta: {
      id: 'brand-1',
      status: 'ready',
      designSystemId: 'user:brand-1',
    },
    brand: {
      name: 'Nexu',
    },
  },
]): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({
      brands,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );
}

afterEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('useBrandReadyPrompt', () => {
  it('exposes ready state even when the one-shot prompt was already dismissed', async () => {
    window.sessionStorage.setItem('od:brand-ready-prompt:brand-1', '1');
    mockBrandsResponse();

    const { result } = renderHook(() => useBrandReadyPrompt(BRAND_METADATA));

    await waitFor(() => {
      expect(result.current.ready).toEqual({
        designSystemId: 'user:brand-1',
        brandName: 'Nexu',
      });
    });
    expect(result.current.status).toBe('ready');
    expect(result.current.prompt).toBeNull();
  });

  it('does not surface browser assist for an ordinary failed extraction', async () => {
    mockBrandsResponse([
      {
        meta: {
          id: 'brand-1',
          status: 'failed',
          sourceUrl: 'https://www.economist.com/',
          error: 'Brand extraction failed in the backing project.',
        },
        brand: null,
      },
    ]);

    const { result } = renderHook(() => useBrandReadyPrompt(BRAND_METADATA));

    await waitFor(() => {
      expect(result.current.status).toBe('failed');
    });
    expect(result.current.browserAssist).toBeNull();
  });

  it('surfaces browser assist for an anti-bot failed extraction', async () => {
    mockBrandsResponse([
      {
        meta: {
          id: 'brand-1',
          status: 'failed',
          sourceUrl: 'https://www.economist.com/',
          blocked: true,
          blockedReason: 'Cloudflare',
          error: 'Programmatic extraction blocked by Cloudflare.',
        },
        brand: null,
      },
    ]);

    const { result } = renderHook(() => useBrandReadyPrompt(BRAND_METADATA));

    await waitFor(() => {
      expect(result.current.browserAssist).toEqual({
        brandId: 'brand-1',
        sourceUrl: 'https://www.economist.com/',
        reason: 'Cloudflare',
      });
    });
    expect(result.current.status).toBe('failed');
  });
});
