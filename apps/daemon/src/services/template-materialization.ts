import {
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
} from 'node:fs/promises';
import path from 'node:path';

const MAX_TEMPLATE_FILES = 500;
const MAX_TEMPLATE_BYTES = 20 * 1024 * 1024;

export interface MaterializeTemplateInput {
  templateRoot: string;
  projectRoot: string;
  targetName?: string;
}

export interface MaterializeTemplateResult {
  targetPath: string;
  sourcePath: string;
  created: boolean;
  copiedFiles: number;
}

/**
 * Seed a project with a template shell before generation starts.
 *
 * Existing project HTML always wins. Template trees are copied without
 * following symlinks and under strict file/byte caps so a user-installed
 * template cannot escape its root or expand an unbounded tree.
 */
export async function materializeTemplateShell(
  input: MaterializeTemplateInput,
): Promise<MaterializeTemplateResult> {
  const templateRoot = path.resolve(input.templateRoot);
  const projectRoot = path.resolve(input.projectRoot);
  const targetName = input.targetName ?? 'index.html';
  const targetPath = path.join(projectRoot, targetName);
  const sourcePath = await resolveTemplateEntry(templateRoot);

  await mkdir(projectRoot, { recursive: true });
  if (await pathExists(targetPath)) {
    return {
      targetPath,
      sourcePath,
      created: false,
      copiedFiles: 0,
    };
  }

  const sourceHtml = await readFile(sourcePath);
  if (sourceHtml.byteLength > MAX_TEMPLATE_BYTES) {
    throw new Error('Template exceeds the materialization size limit');
  }
  const temporaryPath = `${targetPath}.od-template-${process.pid}-${Date.now()}`;
  await mkdir(path.dirname(targetPath), { recursive: true });
  await rm(temporaryPath, { force: true });
  try {
    await copyFile(sourcePath, temporaryPath);
    await rename(temporaryPath, targetPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }

  const state = {
    files: 1,
    bytes: sourceHtml.byteLength,
  };
  await copyTemplateCompanions({
    sourceRoot: templateRoot,
    destinationRoot: projectRoot,
    sourceEntry: sourcePath,
    state,
  });

  return {
    targetPath,
    sourcePath,
    created: true,
    copiedFiles: state.files,
  };
}

async function resolveTemplateEntry(templateRoot: string): Promise<string> {
  for (const relative of ['assets/template.html', 'example.html']) {
    const candidate = path.join(templateRoot, relative);
    if (await pathExists(candidate)) return candidate;
  }
  throw new Error('Template has no assets/template.html or example.html entry');
}

async function copyTemplateCompanions(input: {
  sourceRoot: string;
  destinationRoot: string;
  sourceEntry: string;
  state: { files: number; bytes: number };
}): Promise<void> {
  const entries = await readdir(input.sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'SKILL.md' || entry.name === 'example.html') continue;
    const source = path.join(input.sourceRoot, entry.name);
    const destination = path.join(input.destinationRoot, entry.name);
    await copyTemplateEntry(source, destination, input.sourceEntry, input.state);
  }
}

async function copyTemplateEntry(
  source: string,
  destination: string,
  sourceEntry: string,
  state: { files: number; bytes: number },
): Promise<void> {
  const info = await lstat(source);
  if (info.isSymbolicLink()) return;
  if (info.isDirectory()) {
    await mkdir(destination, { recursive: true });
    for (const entry of await readdir(source, { withFileTypes: true })) {
      await copyTemplateEntry(
        path.join(source, entry.name),
        path.join(destination, entry.name),
        sourceEntry,
        state,
      );
    }
    return;
  }
  if (!info.isFile() || path.resolve(source) === path.resolve(sourceEntry)) return;
  state.files += 1;
  state.bytes += info.size;
  if (state.files > MAX_TEMPLATE_FILES || state.bytes > MAX_TEMPLATE_BYTES) {
    throw new Error('Template exceeds the materialization size limit');
  }
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await lstat(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}
