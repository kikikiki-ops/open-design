import { describe, expect, it } from 'vitest';
import {
  TeamResourceShareForbiddenError,
  createTeamResourceShareService,
  parseSharedResourceIds,
  parseSharedResourceRecords,
} from '../src/collab/team-resource-share.js';
import type { ResourceHubPrincipal } from '../src/collab/resource-principal.js';

const unreachableRun = async (): Promise<string> => {
  throw new Error('Vela should not run when the permission gate stops sharing');
};
const principal: ResourceHubPrincipal = {
  memberId: 'wm-1',
  teamId: 't-1',
  role: 'member',
  lifecycleState: 'active',
};

describe('team resource share permission gate', () => {
  it('refuses a team member who cannot manage shared resources (403 marker)', async () => {
    const service = createTeamResourceShareService({
      kind: 'design_system',
      idPrefix: 'ds',
      resolveDir: () => '/tmp/ds',
      getPrincipal: () => principal,
      getCanShare: () => false,
      run: unreachableRun,
      env: { OD_WORKSPACE_CONTEXT_SOURCE: 'vela' },
    });
    await expect(service.share('ds-1')).rejects.toBeInstanceOf(TeamResourceShareForbiddenError);
    expect(service.isShared('ds-1')).toBe(false);
  });

  it('stays a silent no-op when there is no team identity, without a permission error', async () => {
    const service = createTeamResourceShareService({
      kind: 'design_system',
      idPrefix: 'ds',
      resolveDir: () => '/tmp/ds',
      getPrincipal: () => null,
      getCanShare: () => false,
      run: unreachableRun,
      env: { OD_WORKSPACE_CONTEXT_SOURCE: 'vela' },
    });
    expect(await service.share('ds-1')).toBeNull();
  });

  it('keeps a non-Vela dev workspace on the unconfigured no-op path', async () => {
    const service = createTeamResourceShareService({
      kind: 'design_system',
      idPrefix: 'ds',
      resolveDir: () => '/tmp/ds',
      getPrincipal: () => principal,
      getCanShare: () => true,
      run: unreachableRun,
      env: {},
    });

    expect(service.configured).toBe(false);
    expect(await service.share('ds-1')).toBeNull();
    expect(await service.unshare('ds-1')).toBe(false);
    expect(await service.sharedIds()).toEqual([]);
  });

  it('removes a team resource through the Vela CLI', async () => {
    const calls: string[][] = [];
    const run = async (args: string[]): Promise<string> => {
      calls.push(args);
      if (args[0] === 'push') return JSON.stringify({ version: 1 });
      if (args[0] === 'remove') return JSON.stringify({ ok: true });
      throw new Error(`unexpected args: ${args.join(' ')}`);
    };
    const service = createTeamResourceShareService({
      kind: 'skill',
      idPrefix: 'skill',
      resolveDir: () => '/tmp/skill',
      getPrincipal: () => principal,
      getCanShare: () => true,
      run,
      env: { OD_WORKSPACE_CONTEXT_SOURCE: 'vela' },
    });

    expect(await service.share('mock-team-expert-kit')).toEqual({ version: 1 });
    expect(service.isShared('mock-team-expert-kit')).toBe(true);
    await expect(service.unshare('mock-team-expert-kit')).resolves.toBe(true);
    expect(service.isShared('mock-team-expert-kit')).toBe(false);
    expect(calls.at(-1)).toEqual(['remove', 'skill-mock-team-expert-kit', '--json']);
  });

  it('lists resources already shared through another daemon via Vela CLI', async () => {
    const run = async (args: string[]): Promise<string> => {
      expect(args).toEqual(['shared', '--json']);
      return JSON.stringify({
        resources: [
          {
            id: 'skill-mock-team-expert-kit',
            kind: 'skill',
            deletedAt: null,
            ownerMemberId: 'wm-1',
            metadata: { title: 'Mock kit', description: 'Shared kit' },
          },
          { id: 'skill-deleted-kit', kind: 'skill', deletedAt: '2026-07-13T00:00:00Z' },
          { id: 'project-p1', kind: 'project', deletedAt: null },
        ],
      });
    };
    const service = createTeamResourceShareService({
      kind: 'skill',
      idPrefix: 'skill',
      resolveDir: () => '/tmp/skill',
      getPrincipal: () => principal,
      getCanShare: () => false,
      run,
      env: { OD_WORKSPACE_CONTEXT_SOURCE: 'vela' },
    });

    expect(await service.sharedIds()).toEqual(['mock-team-expert-kit']);
    await expect(service.sharedResources()).resolves.toEqual([
      {
        id: 'mock-team-expert-kit',
        title: 'Mock kit',
        description: 'Shared kit',
        ownerMemberId: 'wm-1',
        canUnshare: true,
      },
    ]);
    expect(service.isShared('mock-team-expert-kit')).toBe(true);
  });

  it('reconciles stale local shared ids when Vela reports the resource removed', async () => {
    let remoteHasSkill = true;
    const run = async (args: string[]): Promise<string> => {
      if (args[0] === 'push') return JSON.stringify({ version: 1 });
      expect(args).toEqual(['shared', '--json']);
      return JSON.stringify({
        resources: remoteHasSkill
          ? [
            {
              id: 'skill-mock-team-expert-kit',
              kind: 'skill',
              deletedAt: null,
              ownerMemberId: 'wm-1',
            },
          ]
          : [],
      });
    };
    const service = createTeamResourceShareService({
      kind: 'skill',
      idPrefix: 'skill',
      resolveDir: () => '/tmp/skill',
      getPrincipal: () => principal,
      getCanShare: () => true,
      run,
      env: { OD_WORKSPACE_CONTEXT_SOURCE: 'vela' },
    });

    expect(await service.share('mock-team-expert-kit')).toEqual({ version: 1 });
    expect(await service.sharedIds()).toEqual(['mock-team-expert-kit']);
    expect(service.isShared('mock-team-expert-kit')).toBe(true);

    remoteHasSkill = false;

    expect(await service.sharedIds()).toEqual([]);
    expect(service.isShared('mock-team-expert-kit')).toBe(false);
  });

  it('marks resources unshareable for non-owner non-uploader members', async () => {
    const run = async (): Promise<string> => JSON.stringify({
      resources: [
        {
          id: 'plugin-shared-kit',
          kind: 'plugin',
          deletedAt: null,
          ownerMemberId: 'wm-owner',
        },
      ],
    });
    const service = createTeamResourceShareService({
      kind: 'plugin',
      idPrefix: 'plugin',
      resolveDir: () => '/tmp/plugin',
      getPrincipal: () => principal,
      getCanShare: () => true,
      run,
      env: { OD_WORKSPACE_CONTEXT_SOURCE: 'vela' },
    });

    await expect(service.sharedResources()).resolves.toEqual([
      { id: 'shared-kit', ownerMemberId: 'wm-owner', canUnshare: false },
    ]);
    await expect(service.unshare('shared-kit')).rejects.toBeInstanceOf(TeamResourceShareForbiddenError);
  });

  it('parses shared resource ids by kind and prefix', () => {
    expect(
      parseSharedResourceIds(
        JSON.stringify({
          resources: [
            { id: 'plugin-alpha', kind: 'plugin' },
            { id: 'skill-alpha', kind: 'skill' },
            { id: 'skill-beta', kind: 'skill', deletedAt: null },
            { id: 'skill-gamma', kind: 'skill', deletedAt: '2026-07-13T00:00:00Z' },
          ],
        }),
        'skill',
        'skill',
      ),
    ).toEqual(['alpha', 'beta']);
  });

  it('parses shared resource metadata for team cards', () => {
    expect(
      parseSharedResourceRecords(
        JSON.stringify({
          resources: [
            {
              id: 'skill-alpha',
              kind: 'skill',
              ownerMemberId: 'wm-1',
              metadata: { title: 'Alpha skill', description: 'Useful in teams' },
            },
          ],
        }),
        'skill',
        'skill',
      ),
    ).toEqual([{
      id: 'alpha',
      title: 'Alpha skill',
      description: 'Useful in teams',
      ownerMemberId: 'wm-1',
    }]);
  });

  it('decodes legacy design-system resource ids back to user ids', () => {
    expect(
      parseSharedResourceRecords(
        JSON.stringify({
          resources: [
            {
              id: 'ds-user-design-system-inspired-by-agentic',
              kind: 'design_system',
              ownerMemberId: 'wm-1',
              metadata: { title: 'Agentic' },
            },
          ],
        }),
        'design_system',
        'ds',
      ),
    ).toEqual([{
      id: 'user:design-system-inspired-by-agentic',
      title: 'Agentic',
      ownerMemberId: 'wm-1',
    }]);
  });
});
