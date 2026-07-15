import { describe, expect, test, vi } from 'vitest';

import { loadOptionalDesktopPetWindow } from '../../src/main/runtime.js';

describe('desktop pet load isolation', () => {
  test('does not reject or advance the pet URL when the optional window fails to load', async () => {
    const failure = new Error('ERR_TOO_MANY_REDIRECTS');
    const loadURL = vi.fn().mockRejectedValue(failure);
    const onError = vi.fn();

    await expect(
      loadOptionalDesktopPetWindow({
        currentUrl: null,
        nextUrl: 'http://127.0.0.1:53914/desktop-pet',
        onError,
        window: {
          isDestroyed: () => false,
          loadURL,
        },
      }),
    ).resolves.toBeNull();

    expect(loadURL).toHaveBeenCalledWith('http://127.0.0.1:53914/desktop-pet');
    expect(onError).toHaveBeenCalledWith(failure);
  });

  test('advances the pet URL only after the optional window loads successfully', async () => {
    const loadURL = vi.fn().mockResolvedValue(undefined);

    await expect(
      loadOptionalDesktopPetWindow({
        currentUrl: null,
        nextUrl: 'http://127.0.0.1:53914/desktop-pet',
        window: {
          isDestroyed: () => false,
          loadURL,
        },
      }),
    ).resolves.toBe('http://127.0.0.1:53914/desktop-pet');
  });
});
