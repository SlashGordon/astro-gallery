/**
 * Browser behaviour for `<SlideshowGallery />`. Dependency-free.
 *
 * The track is moved with a single `transform: translate3d()` — never widths or
 * margins — so every slide change stays on the compositor. Styling lives in
 * `styles/gallery.css` (`.asg-slides*`).
 */

interface Config {
  autoplay: boolean;
  interval: number;
  loop: boolean;
}

/** Distance, as a fraction of the viewport, a drag must cover to change slide. */
const DRAG_THRESHOLD = 0.15;
/** Below this a pointer gesture counts as a tap, not a drag. */
const TAP_SLOP = 8;

const reducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function mount(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>('.asg-slides__track');
  if (!track) return;

  const slides = Array.from(root.querySelectorAll<HTMLElement>('.asg-slides__slide'));
  if (slides.length === 0) return;

  const cfg: Config = {
    autoplay: root.dataset.asgAutoplay === 'true',
    interval: Math.max(1500, Number(root.dataset.asgInterval) || 6000),
    loop: root.dataset.asgLoop !== 'false',
  };

  const viewport = root.querySelector<HTMLElement>('.asg-slides__viewport')!;
  const prevBtn = root.querySelector<HTMLButtonElement>('.asg-slides__nav--prev');
  const nextBtn = root.querySelector<HTMLButtonElement>('.asg-slides__nav--next');
  const playBtn = root.querySelector<HTMLButtonElement>('.asg-slides__play');
  const status = root.querySelector<HTMLElement>('.asg-slides__status');
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('.asg-slides__dot'));
  const total = slides.length;

  let index = 0;
  let timer: number | undefined;
  let playing = false;

  // ------------------------------------------------------------- rendering --

  const setTransform = (offsetPx = 0) => {
    track.style.transform = offsetPx
      ? `translate3d(calc(${-index * 100}% + ${offsetPx}px), 0, 0)`
      : `translate3d(${-index * 100}%, 0, 0)`;
  };

  function sync(): void {
    slides.forEach((slide, i) => {
      const current = i === index;
      slide.classList.toggle('is-current', current);
      // Keep off-screen slides out of the a11y tree and the tab order.
      slide.inert = !current;
      slide.setAttribute('aria-hidden', current ? 'false' : 'true');
    });

    dots.forEach((dot, i) => {
      const current = i === index;
      dot.setAttribute('aria-current', current ? 'true' : 'false');
      dot.tabIndex = current ? 0 : -1;
    });

    if (!cfg.loop) {
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === total - 1;
    }

    if (status) status.textContent = `${index + 1} of ${total}`;
  }

  /**
   * Wrapping from the last slide to the first would otherwise slide the whole
   * track back past every image. Cut instantly and cross-fade instead.
   */
  function goTo(next: number, animate = true): void {
    const target = cfg.loop ? (next + total) % total : Math.max(0, Math.min(next, total - 1));
    if (target === index) {
      setTransform();
      return;
    }

    const wraps =
      animate &&
      cfg.loop &&
      ((index === total - 1 && target === 0) || (index === 0 && target === total - 1));

    index = target;

    if (!animate || wraps) {
      root.classList.add('is-cutting');
      setTransform();
      // Two frames: one to paint the jump, one to drop back to the eased track.
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('is-cutting')));
    } else {
      setTransform();
    }

    sync();
  }

  const go = (delta: number) => goTo(index + delta);

  // -------------------------------------------------------------- autoplay --

  function stop(): void {
    playing = false;
    window.clearInterval(timer);
    timer = undefined;
    playBtn?.setAttribute('aria-pressed', 'false');
    root.classList.remove('is-playing');
  }

  function start(): void {
    if (playing || total < 2 || reducedMotion()) return;
    playing = true;
    timer = window.setInterval(() => go(1), cfg.interval);
    playBtn?.setAttribute('aria-pressed', 'true');
    root.classList.add('is-playing');
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => (playing ? stop() : start()));
  }

  // Pause while the visitor is reading, and while the tab is in the background.
  if (cfg.autoplay) {
    root.addEventListener('pointerenter', () => playing && stop());
    root.addEventListener('focusin', () => playing && stop());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
    });
  }

  // ---------------------------------------------------------------- input ---

  prevBtn?.addEventListener('click', () => {
    stop();
    go(-1);
  });
  nextBtn?.addEventListener('click', () => {
    stop();
    go(1);
  });
  dots.forEach((dot, i) =>
    dot.addEventListener('click', () => {
      stop();
      goTo(i);
    }),
  );

  root.addEventListener('keydown', (e) => {
    const key = e.key;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
    e.preventDefault();
    stop();
    if (key === 'ArrowLeft') go(-1);
    else if (key === 'ArrowRight') go(1);
    else if (key === 'Home') goTo(0);
    else goTo(total - 1);
  });

  // Pointer drag — the track follows the finger, then settles on the easing.
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let dx = 0;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || total < 2) return;
    dragging = true;
    dx = 0;
    startX = e.clientX;
    startY = e.clientY;
    root.classList.add('is-dragging');
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const moveX = e.clientX - startX;
    // Let vertical scrolling win until the gesture is clearly horizontal.
    if (Math.abs(moveX) < TAP_SLOP && Math.abs(e.clientY - startY) > TAP_SLOP) {
      dragging = false;
      root.classList.remove('is-dragging');
      setTransform();
      return;
    }
    dx = moveX;
    // Resist dragging past the ends when not looping.
    if (!cfg.loop && ((index === 0 && dx > 0) || (index === total - 1 && dx < 0))) dx *= 0.35;
    setTransform(dx);
  });

  function endDrag(): void {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    stop();
    const travelled = Math.abs(dx) / (viewport.clientWidth || 1);
    if (travelled > DRAG_THRESHOLD) go(dx < 0 ? 1 : -1);
    else setTransform();
    dx = 0;
  }

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', endDrag);
  // A drag that ends on the image must not also follow the link.
  viewport.addEventListener('click', (e) => {
    if (Math.abs(dx) > TAP_SLOP) e.preventDefault();
  });

  sync();
  setTransform();
  if (cfg.autoplay) start();
}

/** Wire every slideshow under `root`. Safe to call repeatedly. */
export function mountSlideshows(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.asg-slides').forEach((el) => {
    if (el.dataset.asgSlidesReady === 'true') return;
    el.dataset.asgSlidesReady = 'true';
    mount(el);
  });
}

/** Register `mountSlideshows` for the initial load and Astro view transitions. */
export function initSlideshows(): void {
  const run = () => mountSlideshows();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);
}
