import type { WorkspaceCollabContext } from '@open-design/contracts';

/**
 * Workspace identity used to scope collaboration state. Authentication is
 * owned by the Vela login session; these fields are routing context only.
 */
export interface ResourceHubPrincipal {
  memberId: string;
  teamId: string;
  role: WorkspaceCollabContext['role'];
  lifecycleState: WorkspaceCollabContext['lifecycleState'];
}

/** Derive resource scope from the one login-backed workspace context. */
export function contextToResourceHubPrincipal(
  context: WorkspaceCollabContext | null,
): ResourceHubPrincipal | null {
  if (!context || context.workspaceType !== 'team' || !context.teamId) return null;
  return {
    memberId: context.workspaceMemberId,
    teamId: context.teamId,
    role: context.role,
    lifecycleState: context.lifecycleState,
  };
}
