(() => {
  const deck = document.querySelector('.deck');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const dots = document.querySelector('.deck-dots');
  if (!deck || slides.length === 0) return;

  let current = 0;
  let wheelDistance = 0;
  let wheelReset;
  let touchStart = null;

  deck.tabIndex = 0;
  deck.classList.add('is-ready');

  const dotButtons = slides.map((slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'deck-dot';
    dot.setAttribute('aria-label', `跳转至第 ${index + 1} 页`);
    dot.addEventListener('click', () => go(index));
    dots?.append(dot);
    return dot;
  });

  function go(nextIndex) {
    const previous = current;
    current = Math.max(0, Math.min(nextIndex, slides.length - 1));
    slides.forEach((slide, index) => {
      const isCurrent = index === current;
      slide.classList.toggle('active', isCurrent);
      slide.classList.toggle('is-active', isCurrent);
      slide.classList.toggle('is-prev', index === previous && current > previous);
      slide.setAttribute('aria-hidden', String(!isCurrent));
    });
    dotButtons.forEach((dot, index) => dot.setAttribute('aria-current', String(index === current)));
    const counter = slides[current].querySelector('.page-number');
    if (counter) counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    window.location.hash = `slide-${current + 1}`;
  }

  function isEditableTarget(target) {
    return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(target.tagName));
  }

  deck.addEventListener('pointerdown', () => deck.focus({ preventScroll: true }));
  window.addEventListener('keydown', (event) => {
    if (isEditableTarget(event.target)) return;
    const nextKeys = ['ArrowRight', 'ArrowDown', 'PageDown', ' '];
    const previousKeys = ['ArrowLeft', 'ArrowUp', 'PageUp'];
    if (nextKeys.includes(event.key)) { event.preventDefault(); go(current + 1); }
    if (previousKeys.includes(event.key)) { event.preventDefault(); go(current - 1); }
    if (event.key === 'Home') { event.preventDefault(); go(0); }
    if (event.key === 'End') { event.preventDefault(); go(slides.length - 1); }
  });

  deck.addEventListener('wheel', (event) => {
    event.preventDefault();
    wheelDistance += event.deltaX + event.deltaY;
    window.clearTimeout(wheelReset);
    wheelReset = window.setTimeout(() => { wheelDistance = 0; }, 170);
    if (Math.abs(wheelDistance) < 48) return;
    go(current + (wheelDistance > 0 ? 1 : -1));
    wheelDistance = 0;
  }, { passive: false });

  deck.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  deck.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    go(current + (deltaX < 0 ? 1 : -1));
  }, { passive: true });

  const hashMatch = window.location.hash.match(/slide-(\d+)/);
  go(hashMatch ? Number(hashMatch[1]) - 1 : 0);
})();
