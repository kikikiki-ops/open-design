// @vitest-environment jsdom

/**
 * End-to-end coverage for chat file-link routing (issue #1239).
 *
 * Before this fix, every `<a>` rendered from chat markdown carried
 * `target="_blank"` with no `onClick`. In Electron that hits the desktop
 * `setWindowOpenHandler` and creates a new `od://` BrowserWindow; relative
 * hrefs like `template.html` have no base so the new window can't resolve
 * them and the user lands on the home screen. The fix detects in-project
 * file paths in chat markdown and routes them through the existing
 * `requestOpenFile` workspace tab opener.
 */

import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssistantMessage } from '../../src/components/AssistantMessage';
import type { ChatMessage } from '../../src/types';

afterEach(() => {
  cleanup();
  // Cross-project link clicks navigate via history.pushState; reset the
  // jsdom URL so expectations don't leak between tests.
  window.history.replaceState(null, '', '/');
});

function messageWithText(text: string): ChatMessage {
  return {
    id: 'assistant-1',
    role: 'assistant',
    content: text,
    events: [{ kind: 'text', text }],
    startedAt: 1_000,
    endedAt: 3_000,
    runStatus: 'succeeded',
  };
}

describe('AssistantMessage — chat file-link routing (#1239)', () => {
  it('routes a relative file-link click through onRequestOpenFile and suppresses the default new-window behavior', () => {
    const onRequestOpenFile = vi.fn();
    const { container } = render(
      <AssistantMessage
        message={messageWithText('Open [template.html](template.html) to preview.')}
        streaming={false}
        projectId="project-1"
        onRequestOpenFile={onRequestOpenFile}
      />,
    );

    const anchor = container.querySelector('a.md-link');
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('href')).toBe('template.html');

    // Dispatch a real DOM MouseEvent so defaultPrevented reflects what
    // Electron's setWindowOpenHandler actually reads.
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor!.dispatchEvent(clickEvent);

    expect(onRequestOpenFile).toHaveBeenCalledTimes(1);
    expect(onRequestOpenFile).toHaveBeenCalledWith('template.html');
    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it('normalizes ./ and nested subdirectory paths before opening', () => {
    const onRequestOpenFile = vi.fn();
    const { container } = render(
      <AssistantMessage
        message={messageWithText('Inspect [hero](./subdir/hero.html) section.')}
        streaming={false}
        projectId="project-1"
        onRequestOpenFile={onRequestOpenFile}
      />,
    );

    const anchor = container.querySelector('a.md-link');
    expect(anchor).not.toBeNull();
    fireEvent.click(anchor!);
    expect(onRequestOpenFile).toHaveBeenCalledTimes(1);
    expect(onRequestOpenFile).toHaveBeenCalledWith('subdir/hero.html');
  });

  it('routes project raw file URLs through onRequestOpenFile instead of opening a new window', () => {
    const onRequestOpenFile = vi.fn();
    const { container } = render(
      <AssistantMessage
        message={messageWithText('Open [mutuals-v2.html](/api/projects/project-1/raw/mutuals-v2.html).')}
        streaming={false}
        projectId="project-1"
        onRequestOpenFile={onRequestOpenFile}
      />,
    );

    const anchor = container.querySelector('a.md-link');
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('href')).toBe('/api/projects/project-1/raw/mutuals-v2.html');

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor!.dispatchEvent(clickEvent);

    expect(onRequestOpenFile).toHaveBeenCalledTimes(1);
    expect(onRequestOpenFile).toHaveBeenCalledWith('mutuals-v2.html');
    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it('navigates in-place to app file URLs for a different project instead of opening a new window', () => {
    const onRequestOpenFile = vi.fn();
    const { container } = render(
      <AssistantMessage
        message={messageWithText('Open [index.html](/projects/other-project/files/index.html).')}
        streaming={false}
        projectId="project-1"
        projectFileNames={new Set(['index.html'])}
        onRequestOpenFile={onRequestOpenFile}
      />,
    );

    const anchor = container.querySelector('a.md-link');
    expect(anchor).not.toBeNull();

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor!.dispatchEvent(clickEvent);

    // Not the current workspace's file — but it IS an Open Design file, so
    // the click must route to the owning project in the SAME window rather
    // than falling through to Electron's window-open handler (which lands a
    // chrome-less child window on the home screen).
    expect(onRequestOpenFile).not.toHaveBeenCalled();
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(window.location.pathname).toBe('/projects/other-project/files/index.html');
  });

  it('navigates to the owning project for absolute managed-projects disk paths (0.14.1 acceptance scenario)', () => {
    // @-mentioned reference projects are handed to the agent as absolute
    // disk paths, so the assistant links their files as
    // `<data-root>/projects/<projectId>/<file>`. Clicking one must open
    // that project's file, not a new window on home.
    const onRequestOpenFile = vi.fn();
    const { container } = render(
      <AssistantMessage
        message={messageWithText(
          '只有一个文件：[deck-outline.md](/Users/mac/.open-design/data/projects/other-project/deck-outline.md)。',
        )}
        streaming={false}
        projectId="project-1"
        projectFileNames={new Set(['unrelated.html'])}
        onRequestOpenFile={onRequestOpenFile}
      />,
    );

    const anchor = container.querySelector('a.md-link');
    expect(anchor).not.toBeNull();

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor!.dispatchEvent(clickEvent);

    expect(onRequestOpenFile).not.toHaveBeenCalled();
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(window.location.pathname).toBe('/projects/other-project/files/deck-outline.md');
  });

  it('suppresses unresolvable path-like links instead of opening a detached home window', () => {
    const onRequestOpenFile = vi.fn();
    const { container } = render(
      <AssistantMessage
        message={messageWithText('参考实现：[bar.ts](/Users/mac/code/foo/bar.ts)。')}
        streaming={false}
        projectId="project-1"
        onRequestOpenFile={onRequestOpenFile}
      />,
    );

    const anchor = container.querySelector('a.md-link');
    expect(anchor).not.toBeNull();

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor!.dispatchEvent(clickEvent);

    // Nothing in the app can preview a path outside the managed projects
    // root; the ONLY wrong outcome is the default target="_blank" fallback,
    // which opens a new app window that renders home.
    expect(onRequestOpenFile).not.toHaveBeenCalled();
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(window.location.pathname).toBe('/');
  });

  it('routes same-origin absolute project raw URLs through onRequestOpenFile', () => {
    const onRequestOpenFile = vi.fn();
    const href = `${window.location.origin}/api/projects/project-1/raw/Web%20Prototype%20mutuals-v2.html`;
    const { container } = render(
      <AssistantMessage
        message={messageWithText(`Open [Web Prototype mutuals-v2.html](${href}).`)}
        streaming={false}
        projectId="project-1"
        onRequestOpenFile={onRequestOpenFile}
      />,
    );

    const anchor = container.querySelector('a.md-link');
    expect(anchor).not.toBeNull();

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor!.dispatchEvent(clickEvent);

    expect(onRequestOpenFile).toHaveBeenCalledTimes(1);
    expect(onRequestOpenFile).toHaveBeenCalledWith('Web Prototype mutuals-v2.html');
    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it('routes local absolute paths that match project files through onRequestOpenFile', () => {
    const onRequestOpenFile = vi.fn();
    const { container } = render(
      <AssistantMessage
        message={messageWithText(
          '已完成单文件原型：[index.html](/Users/mac/open-design/open-design-preview-0.10.0/projects/Web%20Prototype/index.html)。',
        )}
        streaming={false}
        projectId="project-1"
        projectFileNames={new Set(['index.html'])}
        onRequestOpenFile={onRequestOpenFile}
      />,
    );

    const anchor = container.querySelector('a.md-link');
    expect(anchor).not.toBeNull();

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor!.dispatchEvent(clickEvent);

    expect(onRequestOpenFile).toHaveBeenCalledTimes(1);
    expect(onRequestOpenFile).toHaveBeenCalledWith('index.html');
    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it('does not intercept external https:// URLs — preserves default target="_blank" behavior', () => {
    const onRequestOpenFile = vi.fn();
    const { container } = render(
      <AssistantMessage
        message={messageWithText('See [docs](https://example.com/docs) for context.')}
        streaming={false}
        projectId="project-1"
        onRequestOpenFile={onRequestOpenFile}
      />,
    );

    const anchor = container.querySelector('a.md-link');
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('href')).toBe('https://example.com/docs');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor!.dispatchEvent(clickEvent);
    expect(onRequestOpenFile).not.toHaveBeenCalled();
    expect(clickEvent.defaultPrevented).toBe(false);
  });

  it('does not intercept #anchor fragments', () => {
    const onRequestOpenFile = vi.fn();
    const { container } = render(
      <AssistantMessage
        message={messageWithText('Jump to [intro](#intro) of this page.')}
        streaming={false}
        projectId="project-1"
        onRequestOpenFile={onRequestOpenFile}
      />,
    );

    const anchor = container.querySelector('a.md-link');
    expect(anchor).not.toBeNull();
    fireEvent.click(anchor!);
    expect(onRequestOpenFile).not.toHaveBeenCalled();
  });

  it('keeps default link behavior when the host did not pass onRequestOpenFile', () => {
    // Some surfaces (e.g. read-only history view) intentionally do not
    // pass `onRequestOpenFile`. The fix must not throw and the link must
    // still render with its default target="_blank" behavior.
    const { container } = render(
      <AssistantMessage
        message={messageWithText('Open [template.html](template.html) to preview.')}
        streaming={false}
        projectId="project-1"
      />,
    );

    const anchor = container.querySelector('a.md-link');
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('target')).toBe('_blank');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor!.dispatchEvent(clickEvent);
    expect(clickEvent.defaultPrevented).toBe(false);
  });
});
