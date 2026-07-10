import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequest } from '../functions/api/attribution/mint.ts';

test('download attribution mint only accepts Open Design GitHub release assets', async () => {
  const records = new Map<string, string>();
  const request = new Request('https://download.open-design.ai/api/attribution/mint', {
    method: 'POST',
    body: JSON.stringify({
      webDistinctId: 'web-anon-1',
      assetUrl: 'https://github.com/nexu-io/open-design/releases/download/v1/Open-Design.dmg',
      platform: 'macos',
    }),
  });

  const response = await onRequest({
    request,
    env: { ATTRIBUTION_KV: { get: async () => null, put: async (key, value) => { records.set(key, value); } } },
    params: {},
  });

  assert.equal(response.status, 200);
  const payload = await response.json() as { downloadUrl?: string };
  assert.match(payload.downloadUrl ?? '', /^https:\/\/download\.open-design\.ai\/macos\/auto\/oddl_/);
  assert.equal(records.size, 1);
});

test('download attribution mint rejects arbitrary proxy targets', async () => {
  const response = await onRequest({
    request: new Request('https://download.open-design.ai/api/attribution/mint', {
      method: 'POST',
      body: JSON.stringify({ webDistinctId: 'web-anon-1', assetUrl: 'https://example.com/private.zip' }),
    }),
    env: { ATTRIBUTION_KV: { get: async () => null, put: async () => undefined } },
    params: {},
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'unsupported_release_asset' });
});
