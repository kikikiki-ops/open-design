export interface PagesFunctionContext<Env, Params = Record<string, string>> {
  request: Request;
  env: Env;
  params: Params;
}

export type PagesFunction<Env, Params = Record<string, string>> = (
  context: PagesFunctionContext<Env, Params>,
) => Response | Promise<Response>;

export interface KvBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<unknown>;
}

export interface AttributionEnv {
  ATTRIBUTION_KV?: KvBinding;
  ATTRIBUTION_CONSUME_TOKEN?: string;
}

export interface AttributionRecord {
  assetUrl: string;
  createdAt: string;
  landingUrl: string | null;
  referrer: string | null;
  token: string;
  webDistinctId: string;
  properties: Record<string, unknown>;
  consumedBy?: string;
  consumedAt?: string;
}

export const ATTRIBUTION_TTL_SECONDS = 30 * 24 * 60 * 60;

export function json(status: number, body: Record<string, unknown>, extraHeaders?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(),
      ...extraHeaders,
    },
  });
}

export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Origin': '*',
  };
}

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function requireKv(env: AttributionEnv): KvBinding | null {
  return env.ATTRIBUTION_KV ?? null;
}

export function recordKey(token: string): string {
  return `download-attribution:${token}`;
}

export function cleanString(value: unknown, max = 2048): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export function validToken(value: string | null): value is string {
  return !!value && /^[A-Za-z0-9_-]{8,160}$/.test(value);
}

export function attributionProperties(input: {
  landingUrl: string | null;
  referrer: string | null;
  platform: string | null;
  utm: Record<string, unknown>;
}): Record<string, unknown> {
  const props: Record<string, unknown> = {
    od_source_resolved: 'download_token',
  };
  const utmMap: Record<string, string> = {
    utm_source: 'od_utm_source',
    utm_medium: 'od_utm_medium',
    utm_campaign: 'od_utm_campaign',
    utm_content: 'od_utm_content',
    utm_term: 'od_utm_term',
  };
  for (const [from, to] of Object.entries(utmMap)) {
    const value = cleanString(input.utm[from], 256);
    if (value) props[to] = value;
  }
  if (input.referrer) props.od_referrer = input.referrer;
  if (input.landingUrl) props.od_landing_url = input.landingUrl;
  if (input.platform) props.od_download_platform = input.platform;
  return props;
}
