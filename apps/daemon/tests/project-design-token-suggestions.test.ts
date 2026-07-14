import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { extractTokenCandidates, buildProjectDesignTokenSuggestions } from '../src/project-design-token-suggestions.js';

describe('project design token suggestions', () => {
  it('extracts CSS custom properties and declaration values', () => {
    const tokens = extractTokenCandidates(`
      :root { --color-primary: #2563eb; --space-md: 16px; }
      .card { border-radius: 8px; color: var(--color-primary); }
    `, 'styles.css');

    expect(tokens).toEqual(expect.arrayContaining([
      expect.objectContaining({ token: '--color-primary', value: '#2563eb', sourceFile: 'styles.css' }),
      expect.objectContaining({ token: '--space-md', value: '16px', sourceFile: 'styles.css' }),
      expect.objectContaining({ token: 'border-radius', value: '8px', sourceFile: 'styles.css' }),
    ]));
  });

  it('ranks exact selected values above name-only matches', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'od-token-suggestions-'));
    const projectRoot = path.join(root, 'p1');
    await mkdir(projectRoot, { recursive: true });
    await writeFile(
      path.join(projectRoot, 'tokens.css'),
      ':root { --color-brand: #2563eb; --color-warning: #f59e0b; --space-md: 16px; }',
      'utf8',
    );

    const result = await buildProjectDesignTokenSuggestions({
      projectId: 'p1',
      projectsRoot: root,
      designSystemsRoot: path.join(root, 'design-systems'),
      userDesignSystemsRoot: path.join(root, 'user-design-systems'),
      project: null,
      listFiles: async () => [{ name: 'tokens.css', mime: 'text/css', size: 200 }],
      resolveProjectDir: () => projectRoot,
      query: {
        props: ['color'],
        values: { color: '#2563eb' },
      },
    });

    expect(result.suggestions[0]).toEqual(expect.objectContaining({
      prop: 'color',
      token: '--color-brand',
      value: '#2563eb',
      sourceFile: 'tokens.css',
      matchReason: 'Exact color value match',
    }));
  });
});
