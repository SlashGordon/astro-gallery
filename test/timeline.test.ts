import { describe, expect, it } from 'vitest';
import { groupByDate, type TimelinePhoto } from '../src/internal/timeline.js';

function photo(partial: Partial<TimelinePhoto>): TimelinePhoto {
  return {
    thumbSrc: 't',
    fullSrc: 'f',
    alt: 'a',
    width: 100,
    height: 100,
    date: null,
    latitude: null,
    longitude: null,
    camera: null,
    ...partial,
  };
}

describe('groupByDate', () => {
  it('buckets photos by calendar day in ascending order', () => {
    const groups = groupByDate(
      [
        photo({ date: new Date('2024-05-02T10:00:00Z') }),
        photo({ date: new Date('2024-05-01T09:00:00Z') }),
        photo({ date: new Date('2024-05-01T18:00:00Z') }),
      ],
      'en-US',
      'Undated',
    );

    expect(groups.map((g) => g.isoDate)).toEqual(['2024-05-01', '2024-05-02']);
    expect(groups[0]!.photos).toHaveLength(2);
  });

  it('collects undated photos into a trailing group', () => {
    const groups = groupByDate(
      [photo({ date: new Date('2024-05-01T09:00:00Z') }), photo({}), photo({})],
      'en-US',
      'No date',
    );

    expect(groups).toHaveLength(2);
    expect(groups[1]!.isoDate).toBe('');
    expect(groups[1]!.dateLabel).toBe('No date');
    expect(groups[1]!.photos).toHaveLength(2);
  });

  it('surfaces the first camera found in a group', () => {
    const groups = groupByDate(
      [
        photo({ date: new Date('2024-05-01T09:00:00Z'), camera: null }),
        photo({ date: new Date('2024-05-01T10:00:00Z'), camera: 'Apple iPhone 14' }),
      ],
      'en-US',
      'Undated',
    );
    expect(groups[0]!.camera).toBe('Apple iPhone 14');
  });
});
