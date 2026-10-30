import type { CheckId, HourView, Rating } from '@hawa/contracts';
import { ratingMeta, reasonText } from '../theme/tokens';

export interface DaySummary {
  rating: Rating;
  title: string;
  body: string;
}

interface Segment {
  rating: Rating;
  from: string;
  to: string;
}

function segments(hours: readonly HourView[]): Segment[] {
  const result: Segment[] = [];
  for (const hour of hours) {
    const last = result[result.length - 1];
    if (last !== undefined && last.rating === hour.rating) {
      last.to = hour.localTime;
    } else {
      result.push({
        rating: hour.rating,
        from: hour.localTime,
        to: hour.localTime,
      });
    }
  }
  return result;
}

function mainReason(hours: readonly HourView[]): CheckId | null {
  const counts = new Map<CheckId, number>();
  for (const hour of hours) {
    if (hour.rating !== 'green' && hour.reason !== null) {
      counts.set(hour.reason, (counts.get(hour.reason) ?? 0) + 1);
    }
  }
  let best: CheckId | null = null;
  let bestCount = 0;
  for (const [reason, count] of counts) {
    if (count > bestCount) {
      best = reason;
      bestCount = count;
    }
  }
  return best;
}

export function summarizeDay(hours: readonly HourView[]): DaySummary | null {
  if (hours.length === 0) {
    return null;
  }
  const segs = segments(hours);
  const firstGreen = segs.find((s) => s.rating === 'green');
  if (firstGreen !== undefined) {
    return {
      rating: 'green',
      title: `Best window ${firstGreen.from}–${firstGreen.to}`,
      body: segs.map((s) => `${ratingMeta[s.rating].label} ${s.from}–${s.to}`).join(' · '),
    };
  }

  const reason = mainReason(hours);
  let body = '';
  if (reason !== null) {
    body = `Main reason: ${reasonText[reason]}.`;
  }
  if (segs.some((s) => s.rating === 'yellow')) {
    return { rating: 'yellow', title: 'Marginal at best', body };
  }
  return { rating: 'red', title: 'No flyable hours', body };
}

export function firstStormHour(hours: readonly HourView[]): HourView | undefined {
  return hours.find((h) => h.reason === 'storm-risk');
}

export function defaultSelectedHour(hours: readonly HourView[]): HourView | undefined {
  const storm = firstStormHour(hours);
  if (storm !== undefined) {
    return storm;
  }
  return hours[Math.floor(hours.length / 2)];
}

export function hourReasonText(hour: HourView): string {
  if (hour.reason !== null) {
    return reasonText[hour.reason];
  }
  if (hour.notes.includes('light-wind')) {
    return reasonText['light-wind'];
  }
  return 'Within your limits';
}
