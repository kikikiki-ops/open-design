import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import type {
  BlobDescriptor,
  Manifest,
  ManifestEntryInput,
  PreparedUpload,
  PrepareUploadResult,
  ResourceHubPrincipal,
} from '../src/integrations/resource-hub.js';
import { materializeTree, packTree, pushTree } from '../src/resource-drive.js';
import { createBlobCache, noopBlobCache } from '../src/resource-cache.js';

const principal: ResourceHubPrincipal = {
  memberId: 'm',
  teamId: 't',
  role: 'owner',
  lifecycleState: 'active',
};

// In-memory fake hub + object store, recording how the drive calls it. Bytes
// flow file<->store: uploadFile reads the source file, downloadToFile writes the
// dest file, so the fake exercises the same streaming surface the real one does.
function fakeClient() {
  const store = new Map<string, Uint8Array>(); // committed blobs
  const staged = new Map<string, Uint8Array>(); // uploaded, awaiting commit
  const manifests = new Map<string, Manifest>();
  const calls = { prepare: 0, commit: 0, upload: 0, download: 0, publish: 0 };
  let inFlight = 0;
  let maxInFlight = 0;
  const gate = async () => {
    inFlight++;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await Promise.resolve();
    await Promise.resolve();
    inFlight--;
  };

  const client = {
    async findMissingBlobs(_p: ResourceHubPrincipal, digests: string[]) {
      return digests.filter((d) => !store.has(d));
    },
    async prepareUpload(
      _p: ResourceHubPrincipal,
      blobs: BlobDescriptor[],
    ): Promise<PrepareUploadResult> {
      calls.prepare++;
      const missing = blobs.filter((b) => !store.has(b.digest));
      return {
        uploads: missing.map((b) => ({
          digest: b.digest,
          url: `mem://${b.digest}`,
          method: 'PUT',
          expiresInSeconds: 60,
        })),
        present: blobs.filter((b) => store.has(b.digest)).map((b) => b.digest),
        storeLive: true,
      };
    },
    async uploadFile(upload: Pick<PreparedUpload, 'url'>, filePath: string) {
      calls.upload++;
      await gate();
      staged.set(upload.url.replace('mem://', ''), new Uint8Array(await readFile(filePath)));
    },
    async commitUpload(_p: ResourceHubPrincipal, blobs: BlobDescriptor[]) {
      calls.commit++;
      for (const b of blobs) {
        const bytes = staged.get(b.digest);
        if (bytes) store.set(b.digest, bytes);
      }
    },
    async publishVersion(
      _p: ResourceHubPrincipal,
      resourceId: string,
      input: { manifestDigest: string; entries: ManifestEntryInput[] },
    ) {
      calls.publish++;
      manifests.set(input.manifestDigest, {
        digest: input.manifestDigest,
        entries: input.entries.map((e) => ({
          path: e.path,
          type: e.type,
          executable: e.executable ?? false,
          blobDigest: e.blobDigest ?? null,
          symlinkTarget: e.symlinkTarget ?? null,
        })),
      });
      return {
        id: 'v1',
        resourceId,
        version: 1,
        manifestDigest: input.manifestDigest,
        createdByMemberId: 'm',
        createdAt: '2026-07-09T00:00:00.000Z',
      };
    },
    async getManifest(_p: ResourceHubPrincipal, digest: string) {
      const m = manifests.get(digest);
      if (!m) throw new Error(`no manifest ${digest}`);
      return m;
    },
    async downloadToFile(_p: ResourceHubPrincipal, digest: string, destPath: string) {
      calls.download++;
      await gate();
      const bytes = store.get(digest);
      if (!bytes) throw new Error(`no blob ${digest}`);
      await mkdir(path.dirname(destPath), { recursive: true });
      await writeFile(destPath, bytes);
    },
  };
  return { client, store, calls, maxInFlight: () => maxInFlight };
}

// Build a tree of `n` files on disk; every 5th duplicates content (dedup).
async function buildTree(root: string, n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    const dir = path.join(root, `d${i % 4}`);
    await mkdir(dir, { recursive: true });
    const content = i % 5 === 0 ? 'SHARED-DUP' : `content-${i}`;
    await writeFile(path.join(dir, `f${i}.txt`), content);
  }
}

let tmp: string | null = null;
afterEach(async () => {
  if (tmp) await rm(tmp, { recursive: true, force: true });
  tmp = null;
});

describe('resource-cache', () => {
  it('addresses, stores and reports blobs by digest; ignores malformed', async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'cache-'));
    const cache = createBlobCache(path.join(tmp, 'cas'));
    const src = path.join(tmp, 'src.bin');
    await writeFile(src, 'hello-cache');
    const digest = 'sha256:deadbeefcafe';
    expect(await cache.has(digest)).toBe(false);
    await cache.putFile(digest, src);
    expect(await cache.has(digest)).toBe(true);
    expect(await readFile(cache.pathFor(digest)!, 'utf8')).toBe('hello-cache');
    expect(cache.pathFor('not-a-digest')).toBeNull();
  });
});

describe('packTree', () => {
  it('records file sources (paths + sizes), deduped by digest', async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'pack-'));
    await buildTree(tmp, 20);
    const packed = await packTree(tmp);
    expect(packed.blobs.size).toBeLessThan(20); // duplicates collapsed
    for (const source of packed.blobs.values()) {
      expect(typeof source.path).toBe('string');
      expect(source.size).toBeGreaterThan(0);
    }
  });
});

describe('pushTree', () => {
  it('streams missing blobs as ONE prepare + ONE commit, bounded-parallel', async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'push-'));
    await buildTree(tmp, 24);
    const { client, store, calls, maxInFlight } = fakeClient();
    const packed = await packTree(tmp);

    await pushTree(client as never, principal, 'r1', packed, { concurrency: 4 });

    expect(calls.prepare).toBe(1);
    expect(calls.commit).toBe(1);
    expect(calls.publish).toBe(1);
    expect(calls.upload).toBe(packed.blobs.size); // one PUT per unique blob
    expect(store.size).toBe(packed.blobs.size);
    expect(maxInFlight()).toBeLessThanOrEqual(4);
  });

  it('re-push of an already-present tree uploads nothing', async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'push-'));
    await buildTree(tmp, 12);
    const { client, calls } = fakeClient();
    const packed = await packTree(tmp);
    await pushTree(client as never, principal, 'r1', packed, {});
    const uploads = calls.upload;
    await pushTree(client as never, principal, 'r1', packed, {});
    expect(calls.upload).toBe(uploads); // 2nd push transferred nothing
    expect(calls.prepare).toBe(1); // 2nd push: nothing missing -> no prepare
    expect(calls.publish).toBe(2);
  });
});

describe('materializeTree', () => {
  it('writes byte-identical files, fetching each unique blob once', async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'mat-'));
    const srcDir = path.join(tmp, 'src');
    await buildTree(srcDir, 16);
    const { client, calls } = fakeClient();
    const packed = await packTree(srcDir);
    await pushTree(client as never, principal, 'r1', packed, {});

    const out = path.join(tmp, 'out');
    await materializeTree(client as never, principal, packed.manifestDigest, out);

    for (let i = 0; i < 16; i++) {
      const rel = path.join(`d${i % 4}`, `f${i}.txt`);
      expect(await readFile(path.join(out, rel), 'utf8')).toBe(
        await readFile(path.join(srcDir, rel), 'utf8'),
      );
    }
    expect(calls.download).toBe(packed.blobs.size); // deduped: once per digest
  });

  it('serves a warm cache without touching the network', async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'mat-'));
    const srcDir = path.join(tmp, 'src');
    await buildTree(srcDir, 10);
    const { client, calls } = fakeClient();
    const cache = createBlobCache(path.join(tmp, 'cas'));
    const packed = await packTree(srcDir);
    await pushTree(client as never, principal, 'r1', packed, { cache }); // seeds cache

    const before = calls.download;
    await materializeTree(client as never, principal, packed.manifestDigest, path.join(tmp, 'out'), {
      cache,
    });
    expect(calls.download).toBe(before); // zero downloads: served from CAS
  });

  it('falls back to downloads with the noop cache', async () => {
    tmp = await mkdtemp(path.join(os.tmpdir(), 'mat-'));
    const srcDir = path.join(tmp, 'src');
    await buildTree(srcDir, 8);
    const { client, calls } = fakeClient();
    const packed = await packTree(srcDir);
    await pushTree(client as never, principal, 'r1', packed, {});
    await materializeTree(client as never, principal, packed.manifestDigest, path.join(tmp, 'out'), {
      cache: noopBlobCache,
    });
    expect(calls.download).toBe(packed.blobs.size);
  });
});
