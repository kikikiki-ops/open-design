import type { Express } from 'express';
import {
  TeamResourceShareForbiddenError,
  type TeamResourceShareRecord,
  type TeamResourceShareService,
} from '../collab/team-resource-share.js';

export interface RegisterTeamResourceShareRoutesDeps {
  /** URL segment for this resource kind: `design-systems` | `plugins` | `skills`. */
  basePath: string;
  share: TeamResourceShareService;
  /** Optional materialization hook for shared team resources. */
  syncSharedResource?: (resource: TeamResourceShareRecord) => Promise<void>;
}

/**
 * Team resource sharing routes for one resource kind. A member promotes a
 * personal resource into the team scope; the share service packs its directory
 * and pushes it to the resource hub so teammates can pull it. When there is no
 * team identity (or the hub is not configured), share returns `shared: false`
 * so the client keeps a local-only view instead of erroring. Mounted once per
 * kind (design systems, plugins, skills).
 */
export function registerTeamResourceShareRoutes(
  app: Express,
  deps: RegisterTeamResourceShareRoutesDeps,
): void {
  const { basePath, share } = deps;
  const root = `/api/workspace/${basePath}`;

  // Ids shared to the team — drives the "team" collection for this kind.
  app.get(`${root}/team`, async (_req, res) => {
    const resources = await share.sharedResources();
    if (deps.syncSharedResource) {
      await Promise.all(resources.map((resource) => deps.syncSharedResource?.(resource)));
    }
    res.json({ ids: resources.map((resource) => resource.id), resources });
  });

  // Share a personal resource to the team.
  app.post(`${root}/:id/share`, async (req, res) => {
    const id = typeof req.params.id === 'string' ? decodeURIComponent(req.params.id) : '';
    if (!id) return res.status(400).json({ error: 'invalid resource id' });
    try {
      const result = await share.share(id);
      if (!result) return res.json({ shared: false });
      res.json({ shared: true, version: result.version });
    } catch (error) {
      if (error instanceof TeamResourceShareForbiddenError) {
        return res.status(403).json({ error: 'WORKSPACE_RESOURCE_SHARE_DENIED' });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'share failed' });
    }
  });

  // Remove a resource from the team index. Vela remains the permission source of
  // truth: only the resource owner can edit/remove the shared resource.
  app.delete(`${root}/:id/share`, async (req, res) => {
    const id = typeof req.params.id === 'string' ? decodeURIComponent(req.params.id) : '';
    if (!id) return res.status(400).json({ error: 'invalid resource id' });
    try {
      const unshared = await share.unshare(id);
      res.json({ unshared });
    } catch (error) {
      if (error instanceof TeamResourceShareForbiddenError) {
        return res.status(403).json({ error: 'WORKSPACE_RESOURCE_UNSHARE_DENIED' });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'unshare failed' });
    }
  });
}
