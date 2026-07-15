import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createTeamResourceVersionStore } from '../src/collab/team-resource-version-store.js';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) =>
      fs.promises.rm(root, { recursive: true, force: true }),
    ),
  );
});

describe('team resource version store', () => {
  it('persists independent workspace and resource cursors', async () => {
    const root = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'od-team-resource-versions-'),
    );
    roots.push(root);
    const store = createTeamResourceVersionStore(root);

    await store.set('team-a', 'skill', 'review-kit', 'version-1');
    await store.set('team-b', 'skill', 'review-kit', 'version-2');

    const reloaded = createTeamResourceVersionStore(root);
    expect(reloaded.get('team-a', 'skill', 'review-kit')).toBe('version-1');
    expect(reloaded.get('team-b', 'skill', 'review-kit')).toBe('version-2');
    expect(reloaded.get('team-a', 'plugin', 'review-kit')).toBeNull();
  });
});
