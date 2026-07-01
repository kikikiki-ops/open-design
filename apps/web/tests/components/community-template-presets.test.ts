import { describe, expect, it } from 'vitest';
import { resolveCommunityTemplatePreset } from '../../src/components/community-template-presets';

describe('community template presets', () => {
  it('keeps each community template remixable as a distinct project preset', () => {
    const ids = [
      'electric-studio',
      'launch-landing',
      'founder-memo',
      'growth-dashboard',
    ];

    const presets = ids.map((id) => resolveCommunityTemplatePreset(id));

    expect(new Set(presets.map((preset) => preset.projectName)).size).toBe(ids.length);
    expect(new Set(presets.map((preset) => preset.metadata.demoPresetId)).size).toBe(ids.length);

    for (const preset of presets) {
      expect(preset.metadata.entryFile).toBe('index.html');
      expect(preset.prompt).toContain('Template remix');
      expect(preset.html).toContain(`<title>${preset.projectName}</title>`);
    }
  });

  it('opens the default Community slide cards as their own distinct projects', () => {
    // The Community view opens on the Slides filter, so these two ids are the
    // first Remix targets a user can hit. They must resolve to their own
    // projects, never silently remap onto Electric Studio.
    const pitch = resolveCommunityTemplatePreset('portfolio-case-study');
    const designSystem = resolveCommunityTemplatePreset('design-system-docs');

    expect(pitch.id).toBe('portfolio-case-study');
    expect(pitch.metadata.demoPresetId).toBe('portfolio-case-study');
    expect(pitch.projectName).toBe('Pitch Deck');
    expect(pitch.html).toContain('<title>Pitch Deck</title>');

    expect(designSystem.id).toBe('design-system-docs');
    expect(designSystem.projectName).toBe('Design System Slides');
    expect(designSystem.id).not.toBe(pitch.id);
  });

  it('generates a distinct project for any unknown template id instead of remapping', () => {
    const preset = resolveCommunityTemplatePreset('some-new-template');

    // No silent fallback to a different template — the id is preserved so the
    // remixed project matches the card the user clicked.
    expect(preset.id).toBe('some-new-template');
    expect(preset.metadata.demoPresetId).toBe('some-new-template');
    expect(preset.projectName).toBe('Some New Template');
    expect(preset.html).toContain('<title>Some New Template</title>');
  });
});
