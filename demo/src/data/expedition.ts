/**
 * Content for the Expedition demo, kept apart from the page that renders it.
 * Dates and coordinates come from the photos' EXIF; titles and captions are the
 * same copy the main demo page uses.
 */
import type { ClosingData, HeroData, InterludeData, NavLink, TravelChapter } from 'astro-gallery';
import field from '../assets/images/holidays/1.jpg';
import engineHouse from '../assets/images/holidays/2.jpg';
import cliffs from '../assets/images/holidays/3.jpg';
import slateRoofs from '../assets/images/holidays/4.jpg';
import southBank from '../assets/images/holidays/5.jpg';
import mortonsTower from '../assets/images/holidays/6.jpg';
import tuscany from '../assets/images/holidays/7.jpg';
import baltic from '../assets/images/holidays/8.jpg';
import beechWood from '../assets/images/holidays/9.jpg';
import pineHeath from '../assets/images/holidays/10.jpg';
import poppies from '../assets/images/holidays/11.jpg';
import lake from '../assets/images/holidays/12.jpg';
import heath from '../assets/images/holidays/13.jpg';

export const hero: HeroData = {
  kicker: 'Holiday snapshots · 2018–2024 · 13 frames',
  headline: ['The world', "doesn't", 'fit in a grid.'],
  introduction: 'Notes from the places that changed the way we see things.',
  image: {
    src: baltic,
    alt: 'Flat Baltic water under a wide sky, wooden groynes running out from an empty beach',
    location: 'Ostsee, Germany',
    focus: '50% 60%',
  },
};

export const chapters: TravelChapter[] = [
  {
    id: 'cornwall',
    title: 'Cornwall',
    location: 'Cornwall, United Kingdom',
    dates: '5–7 August 2018',
    coordinates: '50.198° N 5.485° W',
    route: ['The beach field', 'The engine house', 'The headland'],
    introduction:
      'The coast path bends inland here and then throws you straight up the hill. Two weeks without rain had taken the grass down to straw.',
    images: [
      {
        id: 'field',
        src: field,
        alt: 'A field of dry summer grass above the sea, a picnic bench in the foreground',
        title: 'The field above the beach',
        date: '5 Aug 2018',
        coordinates: '50.198° N 5.485° W',
        caption:
          'We came up here most evenings because it was the only flat ground for a mile in any direction.',
        layout: 'landscape',
      },
      {
        id: 'engine-house',
        src: engineHouse,
        alt: 'The ruined engine house and chimney of a tin mine above the coast path',
        title: 'The climb to the engine house',
        date: '7 Aug 2018',
        coordinates: '50.213° N 5.483° W',
        caption: 'The chimney has been standing since long after the tin ran out.',
        layout: 'portrait',
        focus: '47% 50%',
      },
      {
        id: 'cliffs',
        src: cliffs,
        alt: 'Cliffs covered in heather dropping to the sea, a brown labrador at the edge of the frame',
        title: 'Cliffs, heather and one impatient dog',
        date: '7 Aug 2018',
        coordinates: '50.324° N 5.189° W',
        caption:
          'Caves cut into the headland below, the heather just going over and a labrador who had decided some time ago that we were walking too slowly.',
        layout: 'panorama',
        focus: '50% 58%',
        heading: 'No handrail\npast this point',
      },
    ],
  },
  {
    id: 'london',
    title: 'London',
    location: 'London, United Kingdom',
    dates: '11 October 2018',
    coordinates: '51.502° N 0.124° W',
    route: ['Embankment', 'Lambeth'],
    introduction:
      'October and London had decided to put on the good weather: high cirrus and the kind of blue you get about three times a year.',
    mirror: true,
    images: [
      {
        id: 'south-bank',
        src: southBank,
        alt: 'The London Eye and County Hall across the Thames under a blue sky with high cloud',
        title: 'South bank, shot from the north',
        date: '11 Oct 2018',
        coordinates: '51.502° N 0.124° W',
        caption:
          'The wheel does not photograph well from underneath, so you cross the river and take it from the Embankment with County Hall alongside for scale.',
        layout: 'feature',
      },
      {
        id: 'mortons-tower',
        src: mortonsTower,
        alt: 'The red-brick gatehouse of Lambeth Palace beside the tower of St Mary-at-Lambeth',
        title: "Morton's Tower",
        date: '11 Oct 2018',
        coordinates: '51.495° N 0.121° W',
        layout: 'portrait',
        focus: '40% 50%',
      },
    ],
  },
  {
    id: 'germany',
    title: 'Germany, through the year',
    location: 'Germany',
    dates: '2018–2024',
    introduction:
      'Slate roofs in the Thuringian Forest, beech in November, pine in January and the heath when it flowers all at once.',
    composition: 'sequence',
    images: [
      {
        src: slateRoofs,
        alt: 'A valley town of slate roofs seen from a tower, forested hills behind',
        title: 'Slate roofs, Thuringia',
        location: 'Thuringian Forest',
        date: '1 Sep 2018',
        coordinates: '50.524° N 11.305° E',
      },
      {
        src: beechWood,
        alt: 'A beech wood in autumn, copper leaves around a thin dark stream',
        title: 'Beech wood in November',
      },
      {
        src: pineHeath,
        alt: 'A sandy track through birch and Scots pine in winter light',
        title: 'Pine and heath in January',
      },
      {
        src: poppies,
        alt: 'Red poppies in long grass at the edge of a field',
        title: 'Poppies at the field edge',
      },
      {
        src: heath,
        alt: 'Flowering purple heather under a blue sky with one oak on the horizon',
        title: 'The heath comes over all at once',
      },
    ],
  },
];

export const interludes: InterludeData[] = [
  {
    after: 'cornwall',
    statement: ['Somewhere between', 'lost and found.'],
    label: 'Crete Senesi, Tuscany · 23 Aug 2019',
    image: {
      src: tuscany,
      alt: 'A dirt track climbing through gold stubble fields to a farmhouse on a Tuscan ridge',
      focus: '50% 45%',
    },
  },
];

/** One subpage per destination, under `/expedition/<slug>/`. */
export interface Destination {
  slug: string;
  chapter: TravelChapter;
  hero: HeroData;
  /** Short label for link lists, e.g. `"3 frames · August 2018"`. */
  meta: string;
}

const heroImages: Record<string, HeroData['image']> = {
  cornwall: {
    src: cliffs,
    alt: 'Cliffs covered in heather dropping to the sea, a brown labrador at the edge of the frame',
    location: 'Cornwall, United Kingdom',
    focus: '50% 58%',
  },
  london: {
    src: southBank,
    alt: 'The London Eye and County Hall across the Thames under a blue sky with high cloud',
    location: 'London, United Kingdom',
    focus: '30% 50%',
  },
  germany: {
    src: heath,
    alt: 'Flowering purple heather under a blue sky with one oak on the horizon',
    location: 'Germany',
    focus: '50% 60%',
  },
};

export const destinations: Destination[] = chapters.map((chapter, i) => ({
  slug: chapter.id,
  // Keep the chapter's place in the series on its own page.
  chapter: { ...chapter, number: i + 1 },
  hero: {
    kicker: [`Chapter ${String(i + 1).padStart(2, '0')}`, chapter.dates]
      .filter(Boolean)
      .join(' · '),
    headline: chapter.title.split(', '),
    image: heroImages[chapter.id]!,
  },
  meta: [`${chapter.images?.length ?? 0} frames`, chapter.dates].filter(Boolean).join(' · '),
}));

export const destinationHref = (slug: string) => `/expedition/${slug}/`;

/** The closing sequence, linking every destination except the current one. */
export function closingFor(current?: string): ClosingData {
  return {
    statement: ['The next story', 'is out there.'],
    image: {
      src: lake,
      alt: 'A bench facing a swimming lake between birch trees at the end of June',
      focus: '50% 55%',
    },
    links: [
      ...destinations
        .filter((d) => d.slug !== current)
        .map((d) => ({ label: d.chapter.title, href: destinationHref(d.slug), meta: d.meta })),
      ...(current
        ? [{ label: 'The whole expedition', href: '/expedition/', meta: '13 frames' }]
        : []),
      { label: 'All components', href: '/', meta: 'The astro-gallery demo' },
    ],
    colophon: 'astro-gallery · Expedition demo',
  };
}

export const closing: ClosingData = closingFor();

export function navigationFor(onDestination: boolean): NavLink[] {
  return [
    { label: 'Gallery', href: onDestination ? '/expedition/' : '#cornwall' },
    { label: 'Destinations', href: '#destinations' },
    { label: 'Components', href: '/' },
    { label: 'About', href: 'https://github.com/SlashGordon/astro-gallery#readme' },
  ];
}

export const navigation: NavLink[] = navigationFor(false);
