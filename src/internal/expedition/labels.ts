/** Interface copy for the Expedition components. Each entry may be localized. */
import { pickText, type MaybeLocalized } from '../i18n.js';

export interface ExpeditionLabelOptions {
  skip?: MaybeLocalized;
  navigation?: MaybeLocalized;
  menu?: MaybeLocalized;
  chapters?: MaybeLocalized;
  chapter?: MaybeLocalized;
  frame?: MaybeLocalized;
  scroll?: MaybeLocalized;
  sequence?: MaybeLocalized;
  previous?: MaybeLocalized;
  next?: MaybeLocalized;
  close?: MaybeLocalized;
  viewer?: MaybeLocalized;
  open?: MaybeLocalized;
  backToTop?: MaybeLocalized;
  continue?: MaybeLocalized;
}

export type ExpeditionLabels = Required<{ [K in keyof ExpeditionLabelOptions]: string }>;

const DEFAULTS: ExpeditionLabels = {
  skip: 'Skip to the gallery',
  navigation: 'Site',
  menu: 'Menu',
  chapters: 'Chapters',
  chapter: 'Chapter',
  frame: 'Frame',
  scroll: 'Scroll',
  sequence: 'Scroll sideways',
  previous: 'Previous photo',
  next: 'Next photo',
  close: 'Close viewer',
  viewer: 'Photo viewer',
  open: 'Open photo',
  backToTop: 'Back to top',
  continue: 'Keep exploring',
};

export function resolveLabels(
  labels: ExpeditionLabelOptions | undefined,
  locale: string,
): ExpeditionLabels {
  const out = {} as ExpeditionLabels;
  for (const key of Object.keys(DEFAULTS) as Array<keyof ExpeditionLabels>) {
    out[key] = pickText(labels?.[key], locale, DEFAULTS[key]);
  }
  return out;
}
