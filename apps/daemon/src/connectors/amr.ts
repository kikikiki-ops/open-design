import type { BoundedJsonObject } from '../live-artifacts/schema.js';
import {
  defineConnectorTool,
  type ConnectorCatalogDefinition,
  type ConnectorCatalogToolDefinition,
} from './catalog.js';
import { getDefaultAmrCredentials, type AmrCredentials } from '../integrations/amr/credentials.js';

type JsonRecord = Record<string, unknown>;

const AMR_CONNECTOR_FETCH_TIMEOUT_MS = 5_000;
const AMR_CONNECTOR_CACHE_TTL_MS = 60_000;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function cleanId(value: unknown): string | undefined {
  const raw = cleanString(value);
  if (!raw) return undefined;
  const normalized = raw.toLowerCase().replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return normalized.length > 0 ? normalized : undefined;
}

function titleFromId(id: string): string {
  return id
    .split(/[-_:\s]+/g)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function cloneBoundedObject(value: unknown): BoundedJsonObject | undefined {
  if (!isRecord(value)) return undefined;
  return JSON.parse(JSON.stringify(value)) as BoundedJsonObject;
}

function parseTool(connectorId: string, value: unknown): ConnectorCatalogToolDefinition | null {
  const raw = isRecord(value) ? value : { name: value };
  const rawName =
    cleanString(raw.name) ??
    cleanString(raw.id) ??
    cleanString(raw.slug);
  const normalizedName = cleanId(rawName);
  if (!rawName || !normalizedName) return null;
  const name = rawName.includes('.') ? rawName : `${connectorId}.${normalizedName}`;
  const title =
    cleanString(raw.title) ??
    cleanString(raw.label) ??
    cleanString(raw.description) ??
    titleFromId(normalizedName);
  const description = cleanString(raw.description);
  const inputSchemaJson =
    cloneBoundedObject(raw.inputSchemaJson) ??
    cloneBoundedObject(raw.input_schema_json) ??
    cloneBoundedObject(raw.inputSchema) ??
    cloneBoundedObject(raw.input_schema) ??
    cloneBoundedObject(raw.parameters);
  const outputSchemaJson =
    cloneBoundedObject(raw.outputSchemaJson) ??
    cloneBoundedObject(raw.output_schema_json) ??
    cloneBoundedObject(raw.outputSchema) ??
    cloneBoundedObject(raw.output_schema);
  return defineConnectorTool({
    name,
    title,
    ...(description === undefined ? {} : { description }),
    ...(inputSchemaJson === undefined ? {} : { inputSchemaJson }),
    ...(outputSchemaJson === undefined ? {} : { outputSchemaJson }),
    requiredScopes: [],
    providerToolId: rawName,
  });
}

function parseConnector(value: unknown): ConnectorCatalogDefinition | null {
  if (!isRecord(value)) return null;
  const id =
    cleanId(value.id) ??
    cleanId(value.slug) ??
    cleanId(value.name);
  if (!id) return null;
  const tools = Array.isArray(value.tools)
    ? value.tools.map((tool) => parseTool(id, tool)).filter((tool): tool is ConnectorCatalogToolDefinition => Boolean(tool))
    : [];
  const name =
    cleanString(value.name) ??
    cleanString(value.label) ??
    titleFromId(id);
  const category =
    cleanString(value.category) ??
    cleanString(value.group) ??
    'AMR';
  const description = cleanString(value.description);
  return {
    id,
    name,
    provider: 'amr',
    category,
    ...(description === undefined ? {} : { description }),
    tools,
    allowedToolNames: tools.map((tool) => tool.name),
    curatedToolNames: tools.map((tool) => tool.name),
    toolCount: typeof value.toolCount === 'number'
      ? value.toolCount
      : typeof value.tool_count === 'number'
        ? value.tool_count
        : tools.length,
    authentication: 'none',
    minimumApproval: 'auto',
  };
}

function parseConnectorList(value: unknown): ConnectorCatalogDefinition[] {
  const list =
    Array.isArray(value)
      ? value
      : isRecord(value) && Array.isArray(value.data)
        ? value.data
        : isRecord(value) && Array.isArray(value.connectors)
          ? value.connectors
          : [];
  return list.map(parseConnector).filter((connector): connector is ConnectorCatalogDefinition => Boolean(connector));
}

async function amrFetch(
  credentials: AmrCredentials,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${credentials.token}`);
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  const signal = init.signal ?? AbortSignal.timeout(AMR_CONNECTOR_FETCH_TIMEOUT_MS);
  return await fetch(new URL(path, `${credentials.gateway.replace(/\/+$/, '')}/`), {
    ...init,
    headers,
    signal,
  });
}

export class AmrConnectorProvider {
  private cached: { expiresAt: number; definitions: ConnectorCatalogDefinition[] } | null = null;

  clearDiscoveryCache(): void {
    this.cached = null;
  }

  isConfigured(): boolean {
    return getDefaultAmrCredentials() !== null;
  }

  getFastDefinitions(): ConnectorCatalogDefinition[] {
    if (!this.cached || this.cached.expiresAt <= Date.now()) return [];
    return this.cached.definitions.map((definition) => ({ ...definition, tools: [...definition.tools] }));
  }

  async listDefinitions(options: { refresh?: boolean; signal?: AbortSignal } = {}): Promise<ConnectorCatalogDefinition[]> {
    const credentials = getDefaultAmrCredentials();
    if (!credentials) return [];
    if (!options.refresh && this.cached && this.cached.expiresAt > Date.now()) {
      return this.getFastDefinitions();
    }
    const response = await amrFetch(credentials, '/v1/connectors', {
      ...(options.signal === undefined ? {} : { signal: options.signal }),
    });
    if (!response.ok) return this.getFastDefinitions();
    const definitions = parseConnectorList(await response.json());
    this.cached = {
      definitions,
      expiresAt: Date.now() + AMR_CONNECTOR_CACHE_TTL_MS,
    };
    return this.getFastDefinitions();
  }

  async getDefinition(connectorId: string, signal?: AbortSignal): Promise<ConnectorCatalogDefinition | undefined> {
    const cached = this.getFastDefinitions().find((definition) => definition.id === connectorId);
    if (cached) return cached;
    const definitions = await this.listDefinitions(signal === undefined ? {} : { signal });
    return definitions.find((definition) => definition.id === connectorId);
  }

  async execute(
    definition: ConnectorCatalogDefinition,
    tool: ConnectorCatalogToolDefinition,
    input: BoundedJsonObject,
    signal?: AbortSignal,
  ): Promise<BoundedJsonObject> {
    const credentials = getDefaultAmrCredentials();
    if (!credentials) {
      throw new Error('AMR OAuth is not connected.');
    }
    const response = await amrFetch(credentials, `/v1/connectors/${encodeURIComponent(definition.id)}/call`, {
      method: 'POST',
      body: JSON.stringify({
        tool: tool.providerToolId ?? tool.name,
        input,
      }),
      ...(signal === undefined ? {} : { signal }),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`AMR connector ${definition.id} failed with HTTP ${response.status}: ${text.slice(0, 240)}`);
    }
    const parsed = text ? JSON.parse(text) as unknown : {};
    if (!isRecord(parsed)) return { value: parsed as never };
    return parsed as BoundedJsonObject;
  }
}

export const amrConnectorProvider = new AmrConnectorProvider();
