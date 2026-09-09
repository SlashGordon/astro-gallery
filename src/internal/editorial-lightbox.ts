/**
 * Fullscreen viewer for `<EditorialGallery />` — the photo on the left, a
 * caption panel on the right. Dependency-free and browser-only; the styling
 * lives in `styles/gallery.css` (`.asg-eglb*`).
 *
 * Text is written with `textContent`, so nothing here needs HTML escaping.
 */

export interface EditorialItem {
  /** Full-size image URL. */
  src: string;
  /** Small image, used for the filmstrip and the blurred ambient backdrop. */
  thumb: string;
  alt: string;
  title: string;
  caption: string;
  /** Pre-formatted capture date — formatting happens at build time. */
  date: string;
  location: string;
  camera: string;
  /** e.g. `"4032 × 3024"`. */
  dimensions: string;
}

/** Panel copy. Every string is resolved against the component locale at build time. */
export interface EditorialLabels {
  /** Eyebrow above the title — normally the album name. */
  album: string;
  date: string;
  location: string;
  camera: string;
  dimensions: string;
  close: string;
  previous: string;
  next: string;
  showDetails: string;
  hideDetails: string;
}

export const DEFAULT_EDITORIAL_LABELS: EditorialLabels = {
  album: '',
  date: 'Date',
  location: 'Location',
  camera: 'Camera',
  dimensions: 'Dimensions',
  close: 'Close',
  previous: 'Previous photo',
  next: 'Next photo',
  showDetails: 'Show details',
  hideDetails: 'Hide details',
};

const ICON_CLOSE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ICON_PREV =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const ICON_NEXT =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
const ICON_PANEL =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/></svg>';

const SHELL = `
  <div class="asg-eglb__ambient" aria-hidden="true"></div>
  <div class="asg-eglb__stage">
    <div class="asg-eglb__frame">
      <img class="asg-eglb__img" alt="" decoding="async" />
    </div>
    <button class="asg-eglb__nav asg-eglb__nav--prev" type="button">${ICON_PREV}</button>
    <button class="asg-eglb__nav asg-eglb__nav--next" type="button">${ICON_NEXT}</button>
    <div class="asg-eglb__strip"></div>
  </div>
  <aside class="asg-eglb__panel">
    <div class="asg-eglb__panel-top">
      <p class="asg-eglb__eyebrow"></p>
      <button class="asg-eglb__toggle" type="button">${ICON_PANEL}</button>
    </div>
    <div class="asg-eglb__panel-body">
      <p class="asg-eglb__counter"></p>
      <h2 class="asg-eglb__title"></h2>
      <p class="asg-eglb__caption"></p>
      <dl class="asg-eglb__meta"></dl>
    </div>
  </aside>
  <button class="asg-eglb__close" type="button">${ICON_CLOSE}</button>
  <button class="asg-eglb__reveal" type="button">${ICON_PANEL}</button>
`;

let active: { destroy: () => void } | null = null;

const prefersReducedMotion = (): boolean =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** Open the viewer on `items`, starting at `startIndex`. */
export function openEditorialLightbox(
  items: EditorialItem[],
  startIndex = 0,
  labels: Partial<EditorialLabels> = {},
): void {
  if (!items.length) return;
  active?.destroy();

  const text: EditorialLabels = { ...DEFAULT_EDITORIAL_LABELS, ...labels };
  const restoreFocus = document.activeElement as HTMLElement | null;
  const multi = items.length > 1;
  const pad = String(items.length).length;

  let index = Math.max(0, Math.min(startIndex, items.length - 1));
  /** Guards against a slow decode from an earlier item overwriting a newer one. */
  let renderToken = 0;

  const overlay = document.createElement('div');
  overlay.className = 'asg-eglb';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', text.album || 'Photo viewer');
  overlay.innerHTML = SHELL;

  const q = <T extends HTMLElement>(sel: string) => overlay.querySelector<T>(sel)!;
  const ambient = q('.asg-eglb__ambient');
  const stage = q('.asg-eglb__stage');
  const img = q<HTMLImageElement>('.asg-eglb__img');
  const strip = q('.asg-eglb__strip');
  const panel = q('.asg-eglb__panel');
  const panelBody = q('.asg-eglb__panel-body');
  const eyebrow = q('.asg-eglb__eyebrow');
  const counter = q('.asg-eglb__counter');
  const title = q('.asg-eglb__title');
  const caption = q('.asg-eglb__caption');
  const meta = q<HTMLDListElement>('.asg-eglb__meta');
  const closeBtn = q<HTMLButtonElement>('.asg-eglb__close');
  const prevBtn = q<HTMLButtonElement>('.asg-eglb__nav--prev');
  const nextBtn = q<HTMLButtonElement>('.asg-eglb__nav--next');
  const toggleBtn = q<HTMLButtonElement>('.asg-eglb__toggle');
  const revealBtn = q<HTMLButtonElement>('.asg-eglb__reveal');

  closeBtn.setAttribute('aria-label', text.close);
  prevBtn.setAttribute('aria-label', text.previous);
  nextBtn.setAttribute('aria-label', text.next);
  toggleBtn.setAttribute('aria-label', text.hideDetails);
  revealBtn.setAttribute('aria-label', text.showDetails);
  revealBtn.hidden = true;
  prevBtn.hidden = !multi;
  nextBtn.hidden = !multi;
  counter.hidden = !multi;
  eyebrow.textContent = text.album;
  eyebrow.hidden = !text.album;

  // ------------------------------------------------------------- filmstrip --
  const thumbs: HTMLButtonElement[] = multi
    ? items.map((item, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'asg-eglb__thumb';
        btn.setAttribute('aria-label', item.title || item.alt || `Photo ${i + 1}`);
        const thumbImg = document.createElement('img');
        thumbImg.src = item.thumb || item.src;
        thumbImg.alt = '';
        thumbImg.loading = 'lazy';
        thumbImg.decoding = 'async';
        btn.appendChild(thumbImg);
        btn.addEventListener('click', () => goTo(i));
        strip.appendChild(btn);
        return btn;
      })
    : [];
  strip.hidden = !multi;
  if (multi) strip.setAttribute('aria-label', text.album || 'Photos');

  // ---------------------------------------------------------------- render --
  function metaRow(term: string, value: string, wide = false): void {
    if (!value) return;
    const row = document.createElement('div');
    row.className = wide ? 'asg-eglb__meta-row asg-eglb__meta-row--wide' : 'asg-eglb__meta-row';
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value;
    row.append(dt, dd);
    meta.appendChild(row);
  }

  async function render(): Promise<void> {
    const token = ++renderToken;
    const item = items[index]!;

    // Panel first — text should never wait on the photo.
    counter.textContent = `${String(index + 1).padStart(pad, '0')} / ${items.length}`;
    title.textContent = item.title || item.alt;
    caption.textContent = item.caption;
    caption.hidden = !item.caption;

    meta.replaceChildren();
    metaRow(text.date, item.date);
    metaRow(text.camera, item.camera);
    metaRow(text.location, item.location, true);
    metaRow(text.dimensions, item.dimensions);
    meta.hidden = meta.childElementCount === 0;

    // Re-trigger the staggered entrance.
    panelBody.classList.remove('is-entering');
    void panelBody.offsetWidth;
    panelBody.classList.add('is-entering');

    thumbs.forEach((btn, i) => {
      const current = i === index;
      btn.classList.toggle('is-current', current);
      if (current) btn.setAttribute('aria-current', 'true');
      else btn.removeAttribute('aria-current');
      // Roving tabindex: the strip is one tab stop, arrows move within it.
      btn.tabIndex = current ? 0 : -1;
    });
    // Scroll the strip itself. `scrollIntoView` walks up and scrolls every
    // scrollable ancestor — the overlay is one (`overflow: hidden`), so it would
    // drag the entire viewer sideways whenever the content overflowed.
    const current = thumbs[index];
    if (current) {
      strip.scrollTo({
        left: Math.max(0, current.offsetLeft - (strip.clientWidth - current.offsetWidth) / 2),
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }

    ambient.style.backgroundImage = `url("${item.thumb || item.src}")`;

    // Swap the photo only once the next one can paint, so we cross-fade
    // between two sharp frames instead of flashing an empty box.
    stage.classList.add('is-swapping');
    const next = new Image();
    next.src = item.src;
    try {
      await next.decode();
    } catch {
      /* decode is best-effort — fall through and let <img> load normally */
    }
    if (token !== renderToken) return;
    img.src = item.src;
    img.alt = item.alt;
    stage.classList.remove('is-swapping');
  }

  function goTo(next: number): void {
    if (next === index) return;
    index = (next + items.length) % items.length;
    void render();
  }

  const go = (delta: number) => goTo(index + delta);

  // ---------------------------------------------------------------- panel ---
  function setPanel(open: boolean): void {
    overlay.classList.toggle('is-panel-hidden', !open);
    revealBtn.hidden = open;
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    // The collapsed panel is only clipped, not display:none — keep its control
    // out of the tab order so focus can't land in the hidden strip.
    toggleBtn.tabIndex = open ? 0 : -1;
    if (!open) revealBtn.focus();
    else toggleBtn.focus();
  }
  toggleBtn.setAttribute('aria-expanded', 'true');
  toggleBtn.addEventListener('click', () => setPanel(false));
  revealBtn.addEventListener('click', () => setPanel(true));

  // ------------------------------------------------------------- keyboard ---
  function focusable(): HTMLElement[] {
    return Array.from(overlay.querySelectorAll<HTMLElement>('button')).filter(
      (el) => !el.hidden && el.tabIndex !== -1 && el.offsetParent !== null,
    );
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      destroy();
      return;
    }
    if (e.key === 'Tab') {
      const list = focusable();
      if (list.length === 0) return;
      const first = list[0]!;
      const last = list[list.length - 1]!;
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (current === first || !overlay.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    if (!multi) return;
    if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'Home') goTo(0);
    else if (e.key === 'End') goTo(items.length - 1);
  }

  // ---------------------------------------------------------------- swipe ---
  let touchX = 0;
  let touchY = 0;
  stage.addEventListener(
    'touchstart',
    (e) => {
      touchX = e.changedTouches[0]!.clientX;
      touchY = e.changedTouches[0]!.clientY;
    },
    { passive: true },
  );
  stage.addEventListener(
    'touchend',
    (e) => {
      if (!multi) return;
      const dx = e.changedTouches[0]!.clientX - touchX;
      const dy = e.changedTouches[0]!.clientY - touchY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    },
    { passive: true },
  );

  function destroy(): void {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    document.documentElement.style.removeProperty('overflow');
    restoreFocus?.focus?.();
    active = null;
  }

  closeBtn.addEventListener('click', destroy);
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  overlay.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === overlay || t === stage || t.classList.contains('asg-eglb__frame')) destroy();
  });
  document.addEventListener('keydown', onKey);

  document.documentElement.style.overflow = 'hidden';
  document.body.appendChild(overlay);
  void render();
  closeBtn.focus();
  active = { destroy };
}

/** Read the items a container declares on its `.asg-eg-item` triggers. */
function readItems(container: HTMLElement): EditorialItem[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.asg-eg-item')).map((el) => ({
    src: el.dataset.asgFull || (el as HTMLAnchorElement).href,
    thumb: el.dataset.asgThumb || '',
    alt: el.dataset.asgAlt || '',
    title: el.dataset.asgTitle || '',
    caption: el.dataset.asgCaption || '',
    date: el.dataset.asgDate || '',
    location: el.dataset.asgLocation || '',
    camera: el.dataset.asgCamera || '',
    dimensions: el.dataset.asgDimensions || '',
  }));
}

/**
 * Wire every `[data-asg-eglb]` container on the page. Safe to call repeatedly —
 * already-wired containers are skipped.
 */
export function mountEditorialLightboxes(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-asg-eglb]').forEach((container) => {
    if (container.dataset.asgEglbReady === 'true') return;
    container.dataset.asgEglbReady = 'true';

    let labels: Partial<EditorialLabels> = {};
    try {
      labels = JSON.parse(container.dataset.asgEglbLabels || '{}');
    } catch {
      /* malformed labels — fall back to the English defaults */
    }

    const triggers = Array.from(container.querySelectorAll<HTMLElement>('.asg-eg-item'));
    triggers.forEach((el, i) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openEditorialLightbox(readItems(container), i, labels);
      });
    });
  });
}

/** Register `mountEditorialLightboxes` for the initial load and view transitions. */
export function initEditorialLightboxes(): void {
  const run = () => mountEditorialLightboxes();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);
}
