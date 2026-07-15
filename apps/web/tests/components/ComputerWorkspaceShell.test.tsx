// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ComputerWorkspaceShell } from '../../src/components/ComputerWorkspaceShell';

afterEach(cleanup);

function renderShell(overrides: Partial<React.ComponentProps<typeof ComputerWorkspaceShell>> = {}) {
  const onToggleFocus = vi.fn();
  const onClose = vi.fn();
  render(
    <ComputerWorkspaceShell
      open
      focused={false}
      title="Computer"
      detail="Live · Design files"
      expandLabel="Full screen"
      restoreLabel="Side view"
      closeLabel="Close Computer"
      onToggleFocus={onToggleFocus}
      onClose={onClose}
      {...overrides}
    >
      <div data-testid="computer-inner-view">Design files</div>
    </ComputerWorkspaceShell>,
  );
  return { onToggleFocus, onClose };
}

describe('ComputerWorkspaceShell', () => {
  it('owns the complete right-hand workspace and preserves its mounted children when closed', () => {
    renderShell({ open: false });

    const shell = screen.getByTestId('computer-workspace-shell');
    expect(shell.hidden).toBe(true);
    expect(screen.getByTestId('computer-inner-view')).toBeTruthy();
  });

  it('supports full-screen focus and closing back to the conversation', () => {
    const { onToggleFocus, onClose } = renderShell();

    fireEvent.click(screen.getByTestId('computer-workspace-focus-toggle'));
    fireEvent.click(screen.getByTestId('computer-workspace-close'));

    expect(onToggleFocus).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('announces the restore action while Computer is focused', () => {
    renderShell({ focused: true });

    const toggle = screen.getByTestId('computer-workspace-focus-toggle');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Side view');
  });
});
