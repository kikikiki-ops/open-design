// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DesignKitView } from '../../src/components/DesignKitView';
import { I18nProvider } from '../../src/i18n';
import type { DesignKit } from '../../src/runtime/design-kit';

function previewKit(): DesignKit {
  return {
    designSystemId: 'user:preview-kit',
    name: 'Preview Kit',
    editable: true,
    canUpload: false,
    logoSrc: null,
    logoAlternates: [],
    colors: [{ role: 'Primary', name: 'Primary', hex: '#123456', usage: 'Primary actions' }],
    typography: {
      display: { family: 'Inter', fallbacks: [], weights: [700] },
      body: { family: 'Inter', fallbacks: [], weights: [400] },
    },
    fonts: [],
    system: {
      kitUrl: '/raw/projects/preview/system/kit.html',
    },
    assets: [{
      kind: 'landing',
      label: 'Landing page',
      url: '/raw/projects/preview/system/artifacts/landing.html',
    }],
    showcaseHtml: '<main><a target="_blank" href="/">Open</a></main>',
  };
}

describe('DesignKitView iframe sandboxing', () => {
  it('does not let generated kit previews escape the iframe sandbox', () => {
    const { container } = render(
      <I18nProvider initial="en">
        <DesignKitView kit={previewKit()} />
      </I18nProvider>,
    );

    const iframes = Array.from(container.querySelectorAll('iframe'));
    expect(iframes.length).toBeGreaterThan(0);
    for (const iframe of iframes) {
      expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-popups');
    }
    expect(container.innerHTML).not.toContain('allow-popups-to-escape-sandbox');
    expect(container.innerHTML).not.toContain('allow-same-origin');
  });
});
