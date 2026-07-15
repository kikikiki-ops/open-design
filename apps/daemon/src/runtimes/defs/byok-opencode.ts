import { opencodeByokModelId } from '../byok-opencode.js';
import { agentCapabilities } from '../capabilities.js';
import { DEFAULT_MODEL_OPTION } from './shared.js';
import type { RuntimeAgentDef } from '../types.js';

// opencode ≥1.17 replaced --dangerously-skip-permissions with --auto.
const SKIP_PERMISSIONS_FLAG_OLD = '--dangerously-skip-permissions';
const SKIP_PERMISSIONS_FLAG_NEW = '--auto';

export const byokOpenCodeAgentDef = {
  id: 'byok-opencode',
  name: 'BYOK OpenCode',
  bin: 'opencode-cli',
  fallbackBins: ['opencode'],
  versionArgs: ['--version'],
  helpArgs: ['run', '--help'],
  capabilityFlags: {
    [SKIP_PERMISSIONS_FLAG_NEW]: 'autoPermissions',
    [SKIP_PERMISSIONS_FLAG_OLD]: 'skipPermissions',
  },
  fallbackModels: [DEFAULT_MODEL_OPTION],
  buildArgs: (_prompt, _imagePaths, _extra, options = {}) => {
    const args = ['run', '--format', 'json'];
    const model = opencodeByokModelId(options.model);
    if (model) args.push('-m', model);
    // Always pass a permissions-skip flag. BYOK runs execute in a daemon
    // subprocess with no interactive terminal — opencode's permission prompts
    // are auto-rejected, which silently kills every tool call. We prefer the
    // newer --auto flag (opencode ≥1.17); fall back to the legacy flag only
    // when the capability probe has explicitly confirmed the old flag is
    // present and the new one is absent.
    const caps = agentCapabilities.get('byok-opencode');
    const useLegacy = caps !== undefined && caps.skipPermissions && !caps.autoPermissions;
    args.push(useLegacy ? SKIP_PERMISSIONS_FLAG_OLD : SKIP_PERMISSIONS_FLAG_NEW);
    return args;
  },
  promptViaStdin: true,
  streamFormat: 'json-event-stream',
  eventParser: 'opencode',
  externalMcpInjection: 'opencode-env-content',
  supportsCustomModel: true,
} satisfies RuntimeAgentDef;
