/**
 * Tiny dependency-free lightbox used by `<ImageGallery />` and `<ImageTimeline />`.
 * Runs in the browser only. Styling lives in `styles/gallery.css` (`.asg-lb*`).
 */

export interface LightboxItem {
  src: string;
  alt?: string;
  caption?: string;
}

let active: { destroy: () => void } | null = null;

/** Open the overlay showing `items`, starting at `startIndex`. */
export function openLightbox(items: LightboxItem[], startIndex = 0): void {
  if (!items.length) return;
  active?.destroy();

  let index = Math.max(0, Math.min(startIndex, items.length - 1));

  const overlay = document.createElement('div');
  overlay.className = 'asg-lb';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <button class="asg-lb__close" type="button" aria-label="Close">&times;</button>
    <button class="asg-lb__nav asg-lb__nav--prev" type="button" aria-label="Previous">&#8249;</button>
    <figure class="asg-lb__stage">
      <img class="asg-lb__img" alt="" />
      <figcaption class="asg-lb__caption"></figcaption>
    </figure>
    <button class="asg-lb__nav asg-lb__nav--next" type="button" aria-label="Next">&#8250;</button>
    <div class="asg-lb__counter" aria-hidden="true"></div>
  `;

  const img = overlay.querySelector<HTMLImageElement>('.asg-lb__img')!;
  const caption = overlay.querySelector<HTMLElement>('.asg-lb__caption')!;
  const counter = overlay.querySelector<HTMLElement>('.asg-lb__counter')!;
  const prevBtn = overlay.querySelector<HTMLButtonElement>('.asg-lb__nav--prev')!;
  const nextBtn = overlay.querySelector<HTMLButtonElement>('.asg-lb__nav--next')!;
  const multi = items.length > 1;
  prevBtn.hidden = !multi;
  nextBtn.hidden = !multi;
  counter.hidden = !multi;

  function render(): void {
    const item = items[index]!;
    img.src = item.src;
    img.alt = item.alt ?? '';
    caption.textContent = item.caption ?? '';
    caption.hidden = !item.caption;
    counter.textContent = `${index + 1} / ${items.length}`;
  }

  function go(delta: number): void {
    index = (index + delta + items.length) % items.length;
    render();
  }

  function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') destroy();
    else if (e.key === 'ArrowLeft' && multi) go(-1);
    else if (e.key === 'ArrowRight' && multi) go(1);
  }

  function destroy(): void {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
    document.documentElement.style.removeProperty('overflow');
    active = null;
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target as HTMLElement).closest('.asg-lb__close')) destroy();
  });
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  document.addEventListener('keydown', onKey);

  document.documentElement.style.overflow = 'hidden';
  document.body.appendChild(overlay);
  render();
  active = { destroy };
}

/**
 * Wire every `[data-asg-lightbox="true"]` container on the page. Items are read
 * from descendant `.asg-lb-item` elements (`data-asg-full` / `-alt` / `-caption`).
 * Safe to call repeatedly — already-wired containers are skipped.
 */
export function mountLightboxes(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-asg-lightbox="true"]').forEach((container) => {
    if (container.dataset.asgLightboxReady === 'true') return;
    container.dataset.asgLightboxReady = 'true';

    const triggers = Array.from(container.querySelectorAll<HTMLElement>('.asg-lb-item'));
    const items: LightboxItem[] = triggers.map((el) => ({
      src: el.dataset.asgFull || (el as HTMLAnchorElement).href,
      alt: el.dataset.asgAlt || '',
      caption: el.dataset.asgCaption || '',
    }));

    triggers.forEach((el, i) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openLightbox(items, i);
      });
    });
  });
}

/** Register `mountLightboxes` for the initial load and Astro view transitions. */
export function initLightboxes(): void {
  const run = () => mountLightboxes();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);
}
