import { dailyRating } from './daily-rating.js';
import type { HourRating, Rating } from './types.js';

function hours(ratings: Record<number, Rating>): HourRating[] {
  return Object.entries(ratings).map(([hour, rating]) => ({
    localHour: Number(hour),
    rating,
  }));
}

describe('dailyRating', () => {
  it('is the best 3-hour block between 09:00 and 16:00', () => {
    const day = hours({
      9: 'red',
      10: 'green',
      11: 'green',
      12: 'yellow',
      13: 'red',
      14: 'red',
      15: 'red',
    });
    expect(dailyRating(day)).toBe('yellow');
  });

  it('is green when three consecutive hours are green', () => {
    const day = hours({
      9: 'red',
      10: 'yellow',
      11: 'red',
      13: 'green',
      14: 'green',
      15: 'green',
    });
    expect(dailyRating(day)).toBe('green');
  });

  it('ignores hours outside the window', () => {
    const day = hours({
      6: 'green',
      7: 'green',
      8: 'green',
      9: 'red',
      10: 'red',
      11: 'red',
      12: 'red',
      13: 'red',
      14: 'red',
      15: 'red',
      16: 'green',
      17: 'green',
      18: 'green',
    });
    expect(dailyRating(day)).toBe('red');
  });

  it('only counts blocks of consecutive hours', () => {
    const day = hours({ 9: 'green', 10: 'green', 12: 'green', 13: 'red', 14: 'red', 15: 'red' });
    expect(dailyRating(day)).toBe('red');
  });

  it('is null when no full block is available', () => {
    expect(dailyRating(hours({ 9: 'green', 11: 'green' }))).toBeNull();
    expect(dailyRating([])).toBeNull();
  });
});
