import { DAILY_WINDOW } from './limits.js';
import { isWorse, worstOf } from './ratings.js';
import type { HourRating, Rating } from './types.js';

export function dailyRating(hours: readonly HourRating[]): Rating | null {
  const byHour = new Map(hours.map((h) => [h.localHour, h.rating]));
  const { fromLocalHour, toLocalHour, blockHours } = DAILY_WINDOW;

  let best: Rating | null = null;
  for (let start = fromLocalHour; start + blockHours <= toLocalHour; start++) {
    const block: Rating[] = [];
    for (let hour = start; hour < start + blockHours; hour++) {
      const rating = byHour.get(hour);
      if (rating !== undefined) {
        block.push(rating);
      }
    }
    if (block.length < blockHours) {
      continue;
    }
    const blockRating = worstOf(block);
    if (best === null || isWorse(best, blockRating)) {
      best = blockRating;
    }
  }
  return best;
}
