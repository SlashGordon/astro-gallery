/**
 * Browser behaviour for `<AccordionGallery />` — a straight row of
 * full-height panels, one of them open. The server marks the first panel
 * `is-active`, so the layout is right before any script runs; this file only
 * moves that class around and opens the lightbox.
 *
 * Mouse and keyboard open a panel by hovering or focusing it, so a click on
 * the open panel goes straight to the lightbox. Touch has no hover, so the
 * first tap on a closed panel opens it and the second tap shows the photo.
 */
import { openLightbox, type LightboxItem } from './lightbox.js';

function mount(root: HTMLElement): void {
  const panels = Array.from(root.querySelectorAll<HTMLElement>('.asg-accordion__panel'));
  if (panels.length === 0) return;

  const useLightbox = root.dataset.asgLightbox === 'true';
  const items = panels.map((panel) =>
    panel.querySelector<HTMLAnchorElement>('.asg-accordion__item'),
  );
  const lightboxItems: LightboxItem[] = items.map((el) => ({
    src: el?.dataset.asgFull || el?.href || '',
    alt: el?.dataset.asgAlt || '',
    caption: el?.dataset.asgCaption || '',
  }));

  let active = Math.max(
    0,
    panels.findIndex((p) => p.classList.contains('is-active')),
  );

  const activate = (next: number): void => {
    if (next === active) return;
    panels.forEach((panel, i) => panel.classList.toggle('is-active', i === next));
    active = next;
  };

  panels.forEach((panel, i) => {
    // A tap focuses the link before `click` fires, and `focusin` opens the
    // panel, so by the time the click arrives the panel already looks open.
    // Remember at `pointerdown` whether this touch started on a closed panel.
    let tapOpens = false;

    panel.addEventListener('pointerenter', (e) => {
      // A finger has no hover: let the tap decide instead.
      if (e.pointerType === 'touch') return;
      activate(i);
    });
    panel.addEventListener('pointerdown', (e) => {
      tapOpens = e.pointerType === 'touch' && i !== active;
    });
    panel.addEventListener('focusin', () => activate(i));

    items[i]?.addEventListener('click', (e) => {
      if (tapOpens || i !== active) {
        e.preventDefault();
        tapOpens = false;
        activate(i);
        return;
      }
      if (!useLightbox) return;
      e.preventDefault();
      openLightbox(lightboxItems, i);
    });
  });
}

/** Wire every accordion under `root`. Safe to call repeatedly. */
export function mountAccordions(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.asg-accordion').forEach((el) => {
    if (el.dataset.asgAccordionReady === 'true') return;
    el.dataset.asgAccordionReady = 'true';
    mount(el);
  });
}

/** Register `mountAccordions` for the initial load and Astro view transitions. */
export function initAccordions(): void {
  const run = () => mountAccordions();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
  document.addEventListener('astro:page-load', run);
  document.addEventListener('astro:after-swap', run);
}
