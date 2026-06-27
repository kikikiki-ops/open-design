import { describe, expect, it } from 'vitest';

import { EXPORT_FORMATS } from '@open-design/contracts';

import { exportRoutePath } from '../src/export-cli-routing.js';

describe('exportRoutePath', () => {
  it('routes pdf to the raster /export/pdf-image path, not the vector /export route', () => {
    // Regression: the CLI used to send --format pdf to the generic `/export`
    // route, which renders vector PDF via printToPDF() and drops CJK glyphs in
    // the packaged runtime. The UI uses the raster screenshot PDF, so the CLI
    // must match it.
    expect(exportRoutePath('pdf')).toBe('export/pdf-image');
    expect(exportRoutePath('pdf')).not.toBe('export');
  });

  it('routes pptx and image to their screenshot-renderer routes', () => {
    expect(exportRoutePath('pptx')).toBe('export/pptx');
    expect(exportRoutePath('image')).toBe('export/image');
  });

  it('every supported export format maps to a screenshot-renderer route', () => {
    // None of the formats may fall through to the generic vector `/export` route.
    for (const format of EXPORT_FORMATS) {
      const route = exportRoutePath(format);
      expect(route.startsWith('export/')).toBe(true);
      expect(route).not.toBe('export');
    }
  });
});
