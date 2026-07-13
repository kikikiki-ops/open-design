import { describe, expect, it } from 'vitest';
import { createFlowSnapshot } from '@open-design/contracts';

import {
  flowStageArtifactPaths,
  isFlowStageArtifactPath,
} from '../../src/runtime/flow-artifacts';
import type { ProjectFile } from '../../src/types';

function file(
  name: string,
  kind: ProjectFile['kind'],
  mtime: number,
): ProjectFile {
  return {
    name,
    size: 1,
    mtime,
    kind,
    mime: 'text/plain',
  };
}

describe('flowStageArtifactPaths', () => {
  it('recognizes durable stage markdown that should open in preview mode', () => {
    expect(isFlowStageArtifactPath('generated/brief.md')).toBe(true);
    expect(isFlowStageArtifactPath('generated/outline.md')).toBe(true);
    expect(isFlowStageArtifactPath('research/market.md')).toBe(true);
    expect(isFlowStageArtifactPath('notes.md')).toBe(false);
  });

  it('maps durable workflow files and final output back to their stages', () => {
    const result = flowStageArtifactPaths(createFlowSnapshot('deck'), [
      file('generated/brief.md', 'text', 1),
      file('research/market.md', 'text', 2),
      file('generated/outline.md', 'text', 3),
      file('generated/inspiration.json', 'text', 4),
      file('alternate.html', 'html', 6),
      file('index.html', 'html', 5),
      file('deck.pdf', 'pdf', 7),
    ]);

    expect(result).toEqual({
      clarify: ['generated/brief.md'],
      research: ['research/market.md'],
      plan: ['generated/outline.md'],
      inspire: ['generated/inspiration.json'],
      generate: ['index.html', 'alternate.html'],
      deliver: ['deck.pdf'],
    });
  });
});
