import fs from 'node:fs';
import path from 'node:path';

type StoredVersions = Record<string, string>;

export interface TeamResourceVersionStore {
  get(workspaceId: string, kind: string, resourceId: string): string | null;
  set(
    workspaceId: string,
    kind: string,
    resourceId: string,
    versionId: string,
  ): Promise<void>;
}

function versionKey(workspaceId: string, kind: string, resourceId: string) {
  return JSON.stringify([workspaceId, kind, resourceId]);
}

export function createTeamResourceVersionStore(
  runtimeDataDir: string,
): TeamResourceVersionStore {
  const filePath = path.join(runtimeDataDir, 'team-resource-versions.json');
  let versions: StoredVersions = {};
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      versions = Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, string] =>
            typeof entry[1] === 'string' && entry[1].length > 0,
        ),
      );
    }
  } catch {
    versions = {};
  }

  let writeQueue = Promise.resolve();
  return {
    get(workspaceId, kind, resourceId) {
      return versions[versionKey(workspaceId, kind, resourceId)] ?? null;
    },
    async set(workspaceId, kind, resourceId, versionId) {
      versions[versionKey(workspaceId, kind, resourceId)] = versionId;
      writeQueue = writeQueue.catch(() => undefined).then(async () => {
        await fs.promises.mkdir(runtimeDataDir, { recursive: true });
        const tempPath = `${filePath}.${process.pid}.tmp`;
        await fs.promises.writeFile(
          tempPath,
          `${JSON.stringify(versions, null, 2)}\n`,
          { encoding: 'utf8', mode: 0o600 },
        );
        await fs.promises.rename(tempPath, filePath);
      });
      await writeQueue;
    },
  };
}
