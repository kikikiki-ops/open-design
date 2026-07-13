import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { materializeTemplateShell } from '../../src/services/template-materialization.js';

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'od-template-materialize-'));
  roots.push(root);
  return root;
}

describe('materializeTemplateShell', () => {
  it('copies the template entry and companion assets into an empty project', async () => {
    const root = await temporaryRoot();
    const templateRoot = path.join(root, 'template');
    const projectRoot = path.join(root, 'project');
    await mkdir(path.join(templateRoot, 'assets'), { recursive: true });
    await writeFile(
      path.join(templateRoot, 'assets', 'template.html'),
      '<!doctype html><link rel="stylesheet" href="./assets/theme.css">',
    );
    await writeFile(path.join(templateRoot, 'assets', 'theme.css'), ':root { color: red; }');
    await writeFile(path.join(root, 'secret.txt'), 'secret');
    await symlink(path.join(root, 'secret.txt'), path.join(templateRoot, 'assets', 'secret.txt'));

    const result = await materializeTemplateShell({ templateRoot, projectRoot });

    expect(result.created).toBe(true);
    expect(await readFile(path.join(projectRoot, 'index.html'), 'utf8')).toContain(
      './assets/theme.css',
    );
    expect(await readFile(path.join(projectRoot, 'assets', 'theme.css'), 'utf8')).toContain(
      'color: red',
    );
    await expect(readFile(path.join(projectRoot, 'assets', 'secret.txt'), 'utf8')).rejects.toThrow();
  });

  it('does not overwrite existing project HTML', async () => {
    const root = await temporaryRoot();
    const templateRoot = path.join(root, 'template');
    const projectRoot = path.join(root, 'project');
    await mkdir(templateRoot, { recursive: true });
    await mkdir(projectRoot, { recursive: true });
    await writeFile(path.join(templateRoot, 'example.html'), '<html>template</html>');
    await writeFile(path.join(projectRoot, 'index.html'), '<html>existing</html>');

    const result = await materializeTemplateShell({ templateRoot, projectRoot });

    expect(result.created).toBe(false);
    expect(await readFile(path.join(projectRoot, 'index.html'), 'utf8')).toBe(
      '<html>existing</html>',
    );
  });
});
