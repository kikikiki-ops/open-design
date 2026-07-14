// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { buildSrcdoc } from '../../src/runtime/srcdoc';

// Regression coverage for "keyboard paging moves the slide but the page
// counter never changes" (plane issue 3c507f18, 0.14.1 acceptance).
//
// Decks generated outside the fixed framework skeleton track their slide
// index inside their own keyboard handler and render their own page counter
// from it. The bridge's slide navigation used to mutate classes/transforms
// directly, which moved the visible slide while the artifact's handler (and
// therefore its counter) never ran — the counter stayed on "1" forever. The
// mirror gap: when the iframe itself has focus, the artifact handler moves a
// transform track without touching slide attributes, so the bridge's
// MutationObserver never fired a report and the HOST page counter went stale
// instead.

function extractDeckBridgeScript(srcdoc: string): string {
  const match = srcdoc.match(/<script data-od-deck-bridge>([\s\S]*?)<\/script>/);
  if (!match || !match[1]) {
    throw new Error('deck bridge script not found in srcdoc');
  }
  return match[1];
}

function setupCustomCounterDeck() {
  const bodyHtml = `
    <style>
      html, body { margin: 0; }
      body { overflow-x: hidden; }
      .deck-shell { width: 100vw; overflow: hidden; }
      .deck-track { display: flex; width: 300vw; }
      .slide { flex: 0 0 100vw; }
      .deck-pager { position: fixed; bottom: 20px; left: 50%; }
    </style>
    <div class="deck-shell">
      <div class="deck-track" id="deck-track">
        <section class="slide active">One</section>
        <section class="slide">Two</section>
        <section class="slide">Three</section>
      </div>
    </div>
    <div class="deck-pager"><span id="pager-cur">1</span> / <span id="pager-total">3</span></div>
  `;
  const srcdoc = buildSrcdoc(`<!doctype html><html><body>${bodyHtml}</body></html>`, {
    deck: true,
  });
  const script = extractDeckBridgeScript(srcdoc);
  const dom = new JSDOM(`<!doctype html><html><body>${bodyHtml}</body></html>`, {
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const win = dom.window;
  const parentPostMessage = vi.fn();
  Object.defineProperty(win, 'parent', {
    configurable: true,
    value: { postMessage: parentPostMessage },
  });
  Object.defineProperty(win, 'innerWidth', {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(win.document, 'scrollingElement', {
    configurable: true,
    value: win.document.documentElement,
  });

  // The artifact's own navigation runtime: internal index + self-rendered
  // page counter, driven by its own keydown handler — the shape agent
  // decks author when they do not copy the framework skeleton.
  const slides = Array.from(win.document.querySelectorAll<HTMLElement>('.slide'));
  const track = win.document.getElementById('deck-track') as HTMLElement;
  const pagerCur = win.document.getElementById('pager-cur') as HTMLElement;
  let active = 0;
  function apply(index: number) {
    active = Math.max(0, Math.min(slides.length - 1, index));
    track.style.transform = `translateX(-${active * 100}vw)`;
    pagerCur.textContent = String(active + 1);
  }
  win.document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') apply(active + 1);
    else if (event.key === 'ArrowLeft') apply(active - 1);
    else if (event.key === 'Home') apply(0);
    else if (event.key === 'End') apply(slides.length - 1);
  });
  apply(0);

  const evaluate = new win.Function(script);
  evaluate.call(win);
  return { win, parentPostMessage, track, pagerCur };
}

function slideStatesOf(parentPostMessage: ReturnType<typeof vi.fn>) {
  return parentPostMessage.mock.calls
    .map((call) => call[0])
    .filter((message) => message?.type === 'od:slide-state');
}

describe('deck bridge - keyboard paging keeps page counters in sync', () => {
  it('host-driven navigation runs the artifact keyboard handler so the artifact page counter advances', async () => {
    const { win, parentPostMessage, track, pagerCur } = setupCustomCounterDeck();

    win.dispatchEvent(new win.MessageEvent('message', {
      data: { type: 'od:slide', action: 'next' },
    }));
    await new Promise<void>((resolve) => win.setTimeout(resolve, 360));

    // The artifact's own handler must have moved the deck (it writes the
    // transform) and updated its own counter — direct class/transform
    // mutation from the bridge leaves the counter stale on "1".
    expect(track.style.transform).toBe('translateX(-100vw)');
    expect(pagerCur.textContent).toBe('2');
    expect(slideStatesOf(parentPostMessage).at(-1)).toMatchObject({ active: 1, count: 3 });
  });

  it('iframe-focused keyboard navigation on a transform-track deck still reports slide state to the host', async () => {
    const { win, parentPostMessage } = setupCustomCounterDeck();
    // Let the bridge's delayed initial-load report fire first, so the
    // assertion below can only be satisfied by a report triggered by the
    // keyboard navigation itself.
    await new Promise<void>((resolve) => win.setTimeout(resolve, 360));
    parentPostMessage.mockClear();

    // Focus lives inside the iframe: the artifact handler consumes the key
    // and moves the track. No slide attribute changes, no scroll event —
    // the bridge must still notice and report, or the host counter goes
    // stale.
    win.document.dispatchEvent(new win.KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    }));
    await new Promise<void>((resolve) => win.setTimeout(resolve, 240));

    expect(slideStatesOf(parentPostMessage).at(-1)).toMatchObject({ active: 1, count: 3 });
  });
});
