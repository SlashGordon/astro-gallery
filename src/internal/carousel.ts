/**
 * Browser behaviour for `<CarouselGallery />` — a fanned stack of prints. The
 * centre card sits full-size; its neighbours peek at the edges, scaled down,
 * dimmed and tilted in perspective by how far they sit from the centre.
 *
 * Every card is positioned independently from its signed, *wrapped* distance
 * to the centre (`d`) — not from its DOM order. A shared single transform on
 * the track (as `SlideshowGallery` uses) can't loop correctly here: when the
 * centre is the first card, the last card must appear immediately to its
 * left, nowhere near its natural place at the end of the row. Each card's
 * `--asg-car-x` / `--asg-car-scale` / `--asg-car-rotate` custom properties are
 * set from `d` every frame, so the whole fan reads from three numbers per
 * card instead of a state per card.
 */

interface Config {
  autoplay: boolean;
  interval: number;
  loop: boolean;
}

/** Gap between cards, as a fraction of one card's own width. */
const PITCH_RATIO = 1.14;
/** Fraction of a card's width a drag must cover to change the centre card. */
const DRAG_THRESHOLD = 0.32;
/** Below this a pointer gesture counts as a tap, not a drag. */
const TAP_SLOP = 8;

const reducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function mount(root: HTMLElement): void {
  const viewport = root.querySelector<HTMLElement>('.asg-carousel__viewport');
  const track = root.querySelector<HTMLElement>('.asg-carousel__track');
  if (!viewport || !track) return;

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.asg-carousel__card'));
  const total = cards.length;
  if (total === 0) return;

  const cfg: Config = {
    autoplay: root.dataset.asgAutoplay === 'true',
    interval: Math.max(1500, Number(root.dataset.asgInterval) || 5000),
    loop: root.dataset.asgLoop !== 'false',
  };

  const prevBtn = root.querySelector<HTMLButtonElement>('.asg-carousel__nav--prev');
  const nextBtn = root.querySelector<HTMLButtonElement>('.asg-carousel__nav--next');
  const status = root.querySelector<HTMLElement>('.asg-carousel__status');
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('.asg-carousel__dot'));
  const captions = Array.from(root.querySelectorAll<HTMLElement>('.asg-carousel__caption'));

  let index = 0;
  let dragOffset = 0;
  let cardWidth = 0;
  let timer: number | undefined;
  let playing = false;

  // ------------------------------------------------------------- rendering --

  const paint = (): void => {
    const centre = cards[index]!;
    cardWidth = centre.offsetWidth;
    const pitch = cardWidth * PITCH_RATIO;

    cards.forEach((card, i) => {
      let d = i - index;
      if (cfg.loop) {
        // Wrap the distance the short way round so end cards peek too.
        if (d > total / 2) d -= total;
        if (d < -total / 2) d += total;
      }
      const absD = Math.min(Math.abs(d), 3);
      const scale = 1 - 0.16 * absD;
      const opacity = absD === 0 ? 1 : Math.max(0.25, 1 - 0.42 * absD);
      const rotate = Math.max(-34, Math.min(34, d * -15));
      const x = d * pitch + dragOffset;

      card.style.setProperty('--asg-car-x', `${x.toFixed(1)}px`);
      card.style.setProperty('--asg-car-scale', scale.toFixed(3));
      card.style.setProperty('--asg-car-opacity', opacity.toFixed(3));
      card.style.setProperty('--asg-car-rotate', `${rotate.toFixed(2)}deg`);
      card.style.zIndex = String(100 - Math.round(absD * 10));

      const current = i === index;
      card.classList.toggle('is-current', current);
      // Not `inert`: unlike a full-bleed slideshow, the neighbours here stay
      // visible on purpose and clicking one is how you bring it forward.
      // `aria-hidden` still drops them from the AT tree — dots and arrow keys
      // already cover their navigation.
      card.setAttribute('aria-hidden', current ? 'false' : 'true');
    });

    // The track has no normal-flow content (every card is positioned
    // independently of DOM order), so it never acquires a height on its own.
    track.style.height = `${centre.offsetHeight}px`;

    captions.forEach((cap, i) => cap.toggleAttribute('hidden', i !== index));

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
  };

  const goTo = (next: number): void => {
    index = cfg.loop ? (next + total) % total : Math.max(0, Math.min(next, total - 1));
    paint();
  };

  const go = (delta: number) => goTo(index + delta);

  // -------------------------------------------------------------- autoplay --

  function stop(): void {
    playing = false;
    window.clearInterval(timer);
    timer = undefined;
    root.classList.remove('is-playing');
  }

  function start(): void {
    if (playing || total < 2 || reducedMotion()) return;
    playing = true;
    timer = window.setInterval(() => go(1), cfg.interval);
    root.classList.add('is-playing');
  }

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

  // Clicking a peeking card brings it to the centre — the fan is a control.
  cards.forEach((card, i) => {
    card.addEventListener('click', (e) => {
      if (i === index) return;
      e.preventDefault();
      stop();
      goTo(i);
    });
  });

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

  // Pointer drag — the whole fan follows the finger, then settles on release.
  let dragging = false;
  let startX = 0;
  let startY = 0;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || total < 2) return;
    dragging = true;
    dragOffset = 0;
    startX = e.clientX;
    startY = e.clientY;
    root.classList.add('is-dragging');
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const moveX = e.clientX - startX;
    if (Math.abs(moveX) < TAP_SLOP && Math.abs(e.clientY - startY) > TAP_SLOP) {
      dragging = false;
      root.classList.remove('is-dragging');
      dragOffset = 0;
      paint();
      return;
    }
    dragOffset = moveX;
    if (!cfg.loop && ((index === 0 && dragOffset > 0) || (index === total - 1 && dragOffset < 0))) {
      dragOffset *= 0.35;
    }
    paint();
  });

  const endDrag = (): void => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    stop();
    const travelled = Math.abs(dragOffset) / (cardWidth || 1);
    const dir = dragOffset < 0 ? 1 : -1;
    dragOffset = 0;
    if (travelled > DRAG_THRESHOLD) go(dir);
    else paint();
  };

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', endDrag);
  viewport.addEventListener('click', (e) => {
    if (Math.abs(dragOffset) > TAP_SLOP) e.preventDefault();
  });

  let resizeRaf: number | undefined;
  const onResize = () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(paint);
  };
  new ResizeObserver(onResize).observe(viewport);

  paint();
  if (cfg.autoplay) start();
}

/** Wire every carousel under `root`. Safe to call repeatedly. */
export function mountCarousels(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.asg-carousel').forEach((el) => {
    if (el.dataset.asgCarouselReady === 'true') return;
    el.dataset.asgCarouselReady = 'true';
    mount(el);
  });
}

/** Register `mountCarousels` for the initial load and Astro view transitions. */
export function initCarousels(): void {
  const run = () => mountCarousels();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);
}
