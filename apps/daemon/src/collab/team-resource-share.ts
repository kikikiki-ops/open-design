// Team resource sharing. A member with publish rights promotes a personal
// resource — a design system, plugin, or skill — into the team scope: the
// resource's directory is packed and pushed by the login-backed Vela CLI under
// its kind, so teammates can pull it into their own workspace. Open Design owns
// the permission gate and scheduling, not backend credentials or byte transfer.

import type { ResourceHubPrincipal } from './resource-principal.js';
import {
  createVelaCliResourceAdapter,
  shouldUseVelaCliResourceTransport,
} from './vela-cli-resource-adapter.js';
import type { ResourcePublishAdapter } from './publish-scheduler.js';

/** Thrown when a team member without share rights attempts to share a resource. */
export class TeamResourceShareForbiddenError extends Error {
  constructor() {
    super('workspace_resource_share_denied');
    this.name = 'TeamResourceShareForbiddenError';
  }
}

export interface TeamResourceShareRecord {
  id: string;
  title?: string;
  description?: string;
}

export interface TeamResourceShareService {
  /** Share a resource to the team. Returns the published version, or null off-team. */
  share(resourceId: string): Promise<{ version: number } | null>;
  /** Remove a resource from the team index. Returns false off-team/unconfigured. */
  unshare(resourceId: string): Promise<boolean>;
  /** Ids of resources shared to the team. */
  sharedIds(): Promise<string[]>;
  /** Resources shared to the team, including best-effort display metadata. */
  sharedResources(): Promise<TeamResourceShareRecord[]>;
  /** True once a resource has been shared to the team. */
  isShared(resourceId: string): boolean;
  /** Whether the login-backed Vela transport is wired. */
  readonly configured: boolean;
}

export interface CreateTeamResourceShareOptions {
  /** Resource hub kind, e.g. `design_system` | `plugin` | `skill`. */
  kind: string;
  /** Colon-free id-namespace prefix distinguishing this kind on the shared hub. */
  idPrefix: string;
  /** Resolve a resource's source directory (what gets packed and pushed). May be
   *  async: the skill resolver awaits the skill index, and the publish adapter
   *  awaits this before packing. */
  resolveDir: (resourceId: string) => string | Promise<string>;
  /** Resolve the current principal (null = no team identity → share no-ops). */
  getPrincipal: () => ResourceHubPrincipal | null | Promise<ResourceHubPrincipal | null>;
  /**
   * Whether the current member may manage shared resources (`canManageShared
   * Resources`). When it resolves false but the member IS on a team, the share is
   * refused (a non-owner/admin cannot share). Omitted → no permission gate (the
   * caller is trusted to have pre-checked).
   */
  getCanShare?: () => boolean | Promise<boolean>;
  /** Optional resource-index metadata shown in teammate team lists. */
  describeResource?: (resourceId: string) => Record<string, unknown> | null | Promise<Record<string, unknown> | null>;
  /** Injectable Vela resource runner for tests. */
  run?: (args: string[]) => Promise<string>;
  env?: NodeJS.ProcessEnv;
}

export function createTeamResourceShareService(
  options: CreateTeamResourceShareOptions,
): TeamResourceShareService {
  const env = options.env ?? process.env;
  if (!shouldUseVelaCliResourceTransport(env)) {
    return {
      share: async () => null,
      unshare: async () => false,
      sharedIds: async () => [],
      sharedResources: async () => [],
      isShared: () => false,
      configured: false,
    };
  }
  // Distinct, colon-free id namespace on the shared hub. The caller's id (e.g.
  // `user:palette-x`) is sanitized to path-safe chars — the hub routes the
  // resource id as a path param, so a colon would 404.
  const resourceIdFor = (id: string) => `${options.idPrefix}-${id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  // Ids shared this session. The published resources are the durable record on
  // the hub; this is the fast local view the team collection reads until a hub
  // listing query lands.
  const shared = new Set<string>();

  const adapter: ResourcePublishAdapter = createVelaCliResourceAdapter({
    resolveProjectDir: options.resolveDir,
    resourceIdFor,
    kind: options.kind,
    hasTeamIdentity: async () => (await options.getPrincipal()) != null,
    ...(options.describeResource ? { describeProject: options.describeResource } : {}),
    ...(options.run ? { run: options.run } : {}),
  });

  return {
    async share(resourceId) {
      // Permission gate: only a member who can manage shared resources may
      // promote one to the team. No team identity stays a silent no-op
      // (shared:false); a team member who lacks the permission is refused so the
      // gate cannot be bypassed by calling the route directly.
      if (options.getCanShare && !(await options.getCanShare())) {
        if (await options.getPrincipal()) throw new TeamResourceShareForbiddenError();
        return null;
      }
      const result = await adapter.publish({ projectId: resourceId, reason: 'share' });
      if (result) shared.add(resourceId);
      return result;
    },
    async unshare(resourceId) {
      if (!(await options.getPrincipal())) return false;
      await adapter.unpublish?.({ projectId: resourceId });
      shared.delete(resourceId);
      return true;
    },
    async sharedIds() {
      return (await this.sharedResources()).map((resource) => resource.id);
    },
    async sharedResources() {
      if (!(await options.getPrincipal())) return [];
      try {
        const out = await (options.run ?? defaultRun)(['shared', '--json']);
        const resources = parseSharedResourceRecords(out, options.kind, options.idPrefix);
        for (const resource of resources) shared.add(resource.id);
        const byId = new Map(resources.map((resource) => [resource.id, resource]));
        for (const id of shared) {
          if (!byId.has(id)) byId.set(id, { id });
        }
        return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
      } catch {
        return [...shared].sort().map((id) => ({ id }));
      }
    },
    isShared: (resourceId) => shared.has(resourceId),
    configured: true,
  };
}

async function defaultRun(args: string[]): Promise<string> {
  const { runVelaResourceCommand } = await import('./vela-cli-resource-adapter.js');
  return runVelaResourceCommand(args);
}

interface SharedResourceListPayload {
  resources?: Array<{
    id?: unknown;
    kind?: unknown;
    deletedAt?: unknown;
    metadata?: unknown;
  }>;
}

export function parseSharedResourceIds(
  stdout: string,
  kind: string,
  idPrefix: string,
): string[] {
  return parseSharedResourceRecords(stdout, kind, idPrefix).map((resource) => resource.id);
}

export function parseSharedResourceRecords(
  stdout: string,
  kind: string,
  idPrefix: string,
): TeamResourceShareRecord[] {
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  let parsed: SharedResourceListPayload;
  try {
    parsed = JSON.parse(trimmed) as SharedResourceListPayload;
  } catch {
    return [];
  }
  const prefix = `${idPrefix}-`;
  const records = new Map<string, TeamResourceShareRecord>();
  for (const resource of parsed.resources ?? []) {
    if (resource.kind !== kind || resource.deletedAt != null) continue;
    if (typeof resource.id !== 'string' || !resource.id.startsWith(prefix)) {
      continue;
    }
    const localId = resource.id.slice(prefix.length);
    if (!localId) continue;
    const metadata = isObjectRecord(resource.metadata) ? resource.metadata : {};
    const title = stringValue(metadata.title) || stringValue(metadata.name);
    const description = stringValue(metadata.description);
    records.set(localId, {
      id: localId,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    });
  }
  return [...records.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
