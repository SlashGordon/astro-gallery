/**
 * Browser behaviour for the Expedition components. Dependency-free; every
 * function only enhances static HTML that already works without it:
 *
 * - reveals hide nothing until the script has run, and only frames below the
 *   fold are ever hidden;
 * - the viewer intercepts links that otherwise open the full image;
 * - sequences are plain scroll containers, the buttons are an extra.
 *
 * All `init*` functions are idempotent and re-run after Astro view transitions.
 */

const reducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Run `fn` now (or on DOM ready) and again after every Astro page swap. */
export function onPage(fn: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
  document.addEventListener('astro:page-load', fn);
}

/** Coalesce scroll work into one task per frame. */
function onScrollFrame(fn: () => void): void {
  let queued = false;
  window.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        fn();
      });
    },
    { passive: true },
  );
}

// ------------------------------------------------------------------ reveal --

/**
 * Viewport-triggered entrances. Anything already on screen when the script
 * runs is left alone, so there is no flash on load and nothing stays hidden if
 * the script fails.
 */
export function initReveal(root: ParentNode = document): void {
  const els = Array.from(
    root.querySelectorAll<HTMLElement>('[data-asg-exp-reveal]:not([data-asg-exp-seen])'),
  );
  if (els.length === 0) return;
  els.forEach((el) => (el.dataset.asgExpSeen = ''));
  if (reducedMotion() || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.06 },
  );

  const fold = window.innerHeight * 0.92;
  // Read every rect first, then write: one layout pass for the whole page.
  const below = els.filter((el) => el.getBoundingClientRect().top > fold);
  for (const el of below) {
    el.classList.add('is-pending');
    io.observe(el);
  }
}

// -------------------------------------------------------------- navigation --

/** Hide the bar while reading downwards, bring it back on the way up. */
export function initNavigation(): void {
  document.querySelectorAll<HTMLElement>('[data-asg-exp-nav]').forEach((nav) => {
    if (nav.dataset.asgExpReady) return;
    nav.dataset.asgExpReady = 'true';

    const menu = nav.querySelector<HTMLDetailsElement>('details');
    let last = window.scrollY;

    onScrollFrame(() => {
      const y = window.scrollY;
      const delta = y - last;
      if (Math.abs(delta) < 6) return;
      const keep = y < 96 || menu?.open || nav.matches(':focus-within');
      nav.classList.toggle('is-hidden', delta > 0 && !keep);
      nav.classList.toggle('is-scrolled', y > 96);
      last = y;
    });

    if (!menu) return;
    const summary = menu.querySelector('summary');
    menu.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !menu.open) return;
      menu.open = false;
      summary?.focus();
    });
    menu.addEventListener('click', (e) => {
      if ((e.target as Element).closest('a')) menu.open = false;
    });
    menu.addEventListener('toggle', () => {
      document.documentElement.classList.toggle('asg-exp-locked', menu.open);
    });
  });
}

// ---------------------------------------------------------------- progress --

/** Track the chapter crossing the middle of the viewport. */
export function initProgress(): void {
  const el = document.querySelector<HTMLElement>('[data-asg-exp-progress]');
  if (!el || el.dataset.asgExpReady || !('IntersectionObserver' in window)) return;
  el.dataset.asgExpReady = 'true';

  const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('a[data-asg-exp-chapter]'));
  const label = el.querySelector<HTMLElement>('[data-asg-exp-progress-label]');
  const sections = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));

  const setCurrent = (index: number) => {
    links.forEach((a, i) => {
      if (i === index) a.setAttribute('aria-current', 'step');
      else a.removeAttribute('aria-current');
    });
    if (label && links[index]) label.textContent = links[index]!.dataset.asgExpChapter ?? '';
  };

  // A one-pixel line across the middle of the viewport decides what is current.
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const i = sections.indexOf(e.target as HTMLElement);
        if (i >= 0) {
          setCurrent(i);
          el.classList.add('is-active');
        } else {
          el.classList.remove('is-active');
        }
      }
    },
    { rootMargin: '-50% 0px -50% 0px' },
  );
  sections.forEach((s) => s && io.observe(s));
  document.querySelectorAll('[data-asg-exp-progress-off]').forEach((s) => io.observe(s));

  // Scroll-driven CSS animates the bar where supported; otherwise do it here.
  if (!CSS.supports?.('animation-timeline: scroll()')) {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty(
        '--asg-exp-progress',
        String(max > 0 ? window.scrollY / max : 0),
      );
    };
    update();
    onScrollFrame(update);
  }
}

// --------------------------------------------------------------- sequences --

/** Prev/next buttons and a counter for horizontally scrolling chapters. */
export function initSequences(): void {
  document.querySelectorAll<HTMLElement>('[data-asg-exp-seq]').forEach((seq) => {
    if (seq.dataset.asgExpReady) return;
    seq.dataset.asgExpReady = 'true';

    const track = seq.querySelector<HTMLElement>('[data-asg-exp-seq-track]');
    const prev = seq.querySelector<HTMLButtonElement>('[data-asg-exp-seq-prev]');
    const next = seq.querySelector<HTMLButtonElement>('[data-asg-exp-seq-next]');
    const counter = seq.querySelector<HTMLElement>('[data-asg-exp-seq-count]');
    if (!track) return;
    const items = Array.from(track.children) as HTMLElement[];
    const pad = () => parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0;

    const currentIndex = () => {
      const x = track.scrollLeft + pad();
      let best = 0;
      items.forEach((it, i) => {
        if (Math.abs(it.offsetLeft - x) < Math.abs(items[best]!.offsetLeft - x)) best = i;
      });
      return best;
    };

    const sync = () => {
      const i = currentIndex();
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = atEnd;
      if (counter) {
        const shown = atEnd ? items.length : i + 1;
        counter.textContent = `${String(shown).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
      }
    };

    const go = (dir: number) => {
      const target = items[Math.max(0, Math.min(items.length - 1, currentIndex() + dir))];
      if (!target) return;
      track.scrollTo({
        left: target.offsetLeft - pad(),
        behavior: reducedMotion() ? 'auto' : 'smooth',
      });
    };

    prev?.addEventListener('click', () => go(-1));
    next?.addEventListener('click', () => go(1));
    [prev, next].forEach((b) => b && (b.hidden = false));

    let queued = false;
    track.addEventListener(
      'scroll',
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          sync();
        });
      },
      { passive: true },
    );
    sync();
  });
}

// ------------------------------------------------------------------ viewer --

interface ViewerItem {
  el: HTMLAnchorElement;
  src: string;
  srcset: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  location: string;
  date: string;
  coordinates: string;
  caption: string;
  frame: string;
}

function readItem(el: HTMLAnchorElement): ViewerItem {
  const d = el.dataset;
  return {
    el,
    src: el.getAttribute('href') ?? '',
    srcset: d.asgExpSrcset ?? '',
    width: Number(d.asgExpWidth) || 0,
    height: Number(d.asgExpHeight) || 0,
    alt: el.querySelector('img')?.getAttribute('alt') ?? '',
    title: d.asgExpTitle ?? '',
    location: d.asgExpLocation ?? '',
    date: d.asgExpDate ?? '',
    coordinates: d.asgExpCoords ?? '',
    caption: d.asgExpCaption ?? '',
    frame: d.asgExpFrame ?? '',
  };
}

let openViewer: ((el: HTMLAnchorElement) => void) | null = null;
let listening = false;

/**
 * The immersive viewer: a modal `<dialog>` (so the page behind is inert and
 * focus stays inside), arrow keys, swipe, and focus handed back to the photo
 * that opened it.
 */
export function initViewer(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-asg-exp-viewer]');
  if (!dialog || dialog.dataset.asgExpReady || typeof dialog.showModal !== 'function') return;
  dialog.dataset.asgExpReady = 'true';

  const q = <T extends Element>(sel: string) => dialog.querySelector<T>(sel)!;
  const img = q<HTMLImageElement>('[data-asg-exp-viewer-img]');
  const stage = q<HTMLElement>('[data-asg-exp-viewer-stage]');
  const fields = {
    frame: q<HTMLElement>('[data-asg-exp-viewer-frame]'),
    location: q<HTMLElement>('[data-asg-exp-viewer-location]'),
    title: q<HTMLElement>('[data-asg-exp-viewer-title]'),
    caption: q<HTMLElement>('[data-asg-exp-viewer-caption]'),
    meta: q<HTMLElement>('[data-asg-exp-viewer-meta]'),
    status: q<HTMLElement>('[data-asg-exp-viewer-status]'),
  };
  const prevBtn = q<HTMLButtonElement>('[data-asg-exp-viewer-prev]');
  const nextBtn = q<HTMLButtonElement>('[data-asg-exp-viewer-next]');
  const closeBtn = q<HTMLButtonElement>('[data-asg-exp-viewer-close]');

  let items: ViewerItem[] = [];
  let index = 0;
  let opener: HTMLElement | null = null;
  let token = 0;

  const setText = (el: HTMLElement, text: string) => {
    el.textContent = text;
    el.hidden = !text;
  };

  /** Fetch and decode off-screen, then swap, so the old photo never blinks. */
  const preload = (item: ViewerItem): Promise<void> => {
    const pre = new Image();
    pre.sizes = '100vw';
    if (item.srcset) pre.srcset = item.srcset;
    pre.src = item.src;
    return pre.decode().catch(() => undefined);
  };

  const show = async (i: number) => {
    if (items.length === 0) return;
    index = (i + items.length) % items.length;
    const item = items[index]!;
    const mine = ++token;

    setText(fields.frame, item.frame);
    setText(fields.location, item.location);
    setText(fields.title, item.title);
    setText(fields.caption, item.caption);
    setText(fields.meta, [item.date, item.coordinates].filter(Boolean).join('  ·  '));
    fields.status.textContent = [item.frame, item.title || item.alt].filter(Boolean).join(': ');
    prevBtn.hidden = nextBtn.hidden = items.length < 2;

    stage.classList.add('is-loading');
    await preload(item);
    if (mine !== token) return;
    img.alt = item.alt;
    if (item.width && item.height) {
      img.width = item.width;
      img.height = item.height;
    }
    img.sizes = '100vw';
    img.srcset = item.srcset;
    img.src = item.src;
    stage.classList.remove('is-loading');

    // Warm the neighbours so arrowing through feels instant.
    if (items.length > 1) {
      void preload(items[(index + 1) % items.length]!);
      void preload(items[(index - 1 + items.length) % items.length]!);
    }
  };

  const open = (el: HTMLAnchorElement) => {
    items = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-asg-exp-item]')).map(
      readItem,
    );
    opener = el;
    document.documentElement.classList.add('asg-exp-locked');
    dialog.showModal();
    closeBtn.focus();
    void show(
      Math.max(
        0,
        items.findIndex((it) => it.el === el),
      ),
    );
  };

  openViewer = open;
  if (!listening) {
    listening = true;
    // One delegated listener for the page's lifetime; it always opens the
    // viewer of the current page, also after an Astro view transition.
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[data-asg-exp-item]');
      if (!link || !openViewer || !link.isConnected) return;
      e.preventDefault();
      openViewer(link);
    });
  }

  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('asg-exp-locked');
    token += 1;
    // Hand focus back to the photo that opened the viewer, scrolled into view.
    opener?.focus({ preventScroll: false });
    opener = null;
  });

  prevBtn.addEventListener('click', () => void show(index - 1));
  nextBtn.addEventListener('click', () => void show(index + 1));
  closeBtn.addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      void show(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      void show(index + 1);
    }
  });

  // A click on the empty stage around the photo closes, like a backdrop.
  stage.addEventListener('click', (e) => {
    if (e.target === stage) dialog.close();
  });

  // Swipe left/right to move, down to dismiss.
  let start: { x: number; y: number } | null = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') start = { x: e.clientX, y: e.clientY };
  });
  stage.addEventListener('pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) void show(index + (dx < 0 ? 1 : -1));
    else if (dy > 96 && dy > Math.abs(dx)) dialog.close();
  });
  stage.addEventListener('pointercancel', () => (start = null));
}
