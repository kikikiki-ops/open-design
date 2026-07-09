import { randomUUID } from 'node:crypto';
import fsp from 'node:fs/promises';
import path from 'node:path';

// Local content-addressed blob cache for the resource drive. A blob's bytes are
// immutable and named by their digest, so once a blob is on disk here we never
// pull it from the store again — pull/materialize become read-through. Modelled
// on git's object store / restic's local cache: shard by a digest prefix to keep
// directories small, land entries atomically (temp + rename) so a crashed write
// never leaves a truncated file a reader could trust.
//
// File-oriented (not bytes): callers stream a source file into the cache and
// copy the cache entry out, so nothing has to hold a whole blob in memory.
// v1 keeps everything (no GC): blobs are content-addressed and shared across
// resources/teams, so the cache is pure upside; eviction is a later concern.

export interface BlobCache {
  // Absolute path where this digest is (or would be) stored, or null if the
  // cache can't address it (malformed digest) or is disabled.
  pathFor(digest: string): string | null;
  has(digest: string): Promise<boolean>;
  // Atomically copy a source file's bytes into the cache under `digest`.
  putFile(digest: string, sourcePath: string): Promise<void>;
}

// digest is "<algo>:<hex>". Lay it out as <root>/<algo>/<aa>/<rest> so a single
// directory never holds more than 256 shards.
function pathForDigest(root: string, digest: string): string | null {
  const sep = digest.indexOf(':');
  if (sep <= 0) return null;
  const algo = digest.slice(0, sep);
  const hex = digest.slice(sep + 1);
  if (!/^[0-9a-f]{4,}$/u.test(hex)) return null;
  return path.join(root, algo, hex.slice(0, 2), hex.slice(2));
}

export function createBlobCache(rootDir: string): BlobCache {
  return {
    pathFor(digest) {
      return pathForDigest(rootDir, digest);
    },
    async has(digest) {
      const file = pathForDigest(rootDir, digest);
      if (!file) return false;
      try {
        await fsp.access(file);
        return true;
      } catch {
        return false;
      }
    },
    async putFile(digest, sourcePath) {
      const file = pathForDigest(rootDir, digest);
      if (!file) return;
      await fsp.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp-${randomUUID()}`;
      try {
        await fsp.copyFile(sourcePath, tmp);
        await fsp.rename(tmp, file);
      } catch (error) {
        await fsp.rm(tmp, { force: true }).catch(() => {});
        // A cache write is best-effort — a full disk must not fail the transfer;
        // a concurrent writer landing the same content first is fine.
        if ((error as NodeJS.ErrnoException)?.code === 'EEXIST') return;
      }
    },
  };
}

// Disabled cache: addresses nothing, stores nothing. Lets the drive treat
// "no cache" and "cache" through one code path.
export const noopBlobCache: BlobCache = {
  pathFor() {
    return null;
  },
  async has() {
    return false;
  },
  async putFile() {},
};
