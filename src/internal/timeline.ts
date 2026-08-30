/** Grouping logic for the `<ImageTimeline />` component. Pure + build-time only. */

export interface TimelinePhoto {
  thumbSrc: string;
  fullSrc: string;
  alt: string;
  /** Intrinsic thumbnail dimensions, for a zero-CLS `<img>`. */
  width: number;
  height: number;
  date: Date | null;
  latitude: number | null;
  longitude: number | null;
  camera: string | null;
}

export interface TimelineGroup {
  /** `YYYY-MM-DD`, or `""` for the trailing "undated" bucket. */
  isoDate: string;
  dateLabel: string;
  camera: string;
  location: string;
  photos: TimelinePhoto[];
}

export type PendingGroup = Omit<TimelineGroup, 'location'>;

function formatDateLabel(isoDate: string, locale: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Bucket photos by capture day (ascending). Photos without a date collapse into a
 * single trailing group labelled `undatedLabel`.
 */
export function groupByDate(
  photos: TimelinePhoto[],
  locale: string,
  undatedLabel: string,
): PendingGroup[] {
  const dated = photos
    .filter((p): p is TimelinePhoto & { date: Date } => p.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const undated = photos.filter((p) => p.date === null);

  const buckets = new Map<string, TimelinePhoto[]>();
  for (const photo of dated) {
    const key = photo.date.toISOString().slice(0, 10);
    const bucket = buckets.get(key) ?? [];
    bucket.push(photo);
    buckets.set(key, bucket);
  }

  const groups: PendingGroup[] = Array.from(buckets.entries()).map(([isoDate, groupPhotos]) => ({
    isoDate,
    dateLabel: formatDateLabel(isoDate, locale),
    camera: groupPhotos.find((p) => p.camera)?.camera ?? '',
    photos: groupPhotos,
  }));

  if (undated.length > 0) {
    groups.push({
      isoDate: '',
      dateLabel: undatedLabel,
      camera: undated.find((p) => p.camera)?.camera ?? '',
      photos: undated,
    });
  }

  return groups;
}
