import fs from 'node:fs';
import path from 'node:path';

interface ActiveWorkspaceSelectionFile {
  workspaceId?: unknown;
}

export interface ActiveWorkspaceSelectionStore {
  get(): string | null;
  set(workspaceId: string): Promise<void>;
  clear(): Promise<void>;
}

export function createActiveWorkspaceSelectionStore(
  dataDir: string,
): ActiveWorkspaceSelectionStore {
  const filePath = path.join(dataDir, 'workspace-selection.json');
  let cached: string | null | undefined;

  const read = (): string | null => {
    if (cached !== undefined) return cached;
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as ActiveWorkspaceSelectionFile;
      cached = typeof parsed.workspaceId === 'string' && parsed.workspaceId.trim()
        ? parsed.workspaceId.trim()
        : null;
    } catch {
      cached = null;
    }
    return cached;
  };

  return {
    get: read,
    async set(workspaceId: string) {
      const next = workspaceId.trim();
      if (!next) throw new Error('workspaceId is required');
      cached = next;
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(
        filePath,
        JSON.stringify({ workspaceId: next }, null, 2),
        'utf8',
      );
    },
    async clear() {
      cached = null;
      await fs.promises.rm(filePath, { force: true });
    },
  };
}
