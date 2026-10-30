import { scoreHour } from './score-hour.js';
import { DEFAULT_LIMITS, type LimitsByLevel } from './limits.js';
import type { HourConditions, SiteWindow } from './types.js';

const site: SiteWindow = { windSectors: [[135, 225]] };

const calm: HourConditions = {
  localHour: 10,
  windKmh: 10,
  gustKmh: 14,
  dirDeg: 180,
  wind2000mKmh: 15,
  rainMm: 0,
  capeJkg: 100,
};

function score(overrides: Partial<HourConditions>, level: 'student' | 'pilot' = 'student') {
  return scoreHour({ ...calm, ...overrides }, site, level);
}

describe('scoreHour', () => {
  it('is green with no reason when every check passes', () => {
    expect(score({})).toEqual({ rating: 'green', reason: null, notes: [] });
  });

  describe('launch wind', () => {
    it.each([
      [15, 'student', 'green'],
      [16, 'student', 'yellow'],
      [18, 'student', 'yellow'],
      [19, 'student', 'red'],
      [20, 'pilot', 'green'],
      [25, 'pilot', 'yellow'],
      [26, 'pilot', 'red'],
    ] as const)('%d km/h for a %s is %s', (windKmh, level, rating) => {
      const result = score({ windKmh, gustKmh: windKmh }, level);
      expect(result.rating).toBe(rating);
    });

    it('notes light wind below 5 km/h but stays green', () => {
      expect(score({ windKmh: 3, gustKmh: 4 })).toEqual({
        rating: 'green',
        reason: null,
        notes: ['light-wind'],
      });
    });
  });

  it.each([
    [7.9, 'green'],
    [8, 'yellow'],
    [12, 'yellow'],
    [12.1, 'red'],
  ] as const)('gust spread %d km/h is %s', (spread, rating) => {
    expect(score({ gustKmh: calm.windKmh + spread }).rating).toBe(rating);
  });

  describe('wind direction', () => {
    it.each([
      [135, 'green'],
      [225, 'green'],
      [115, 'yellow'],
      [245, 'yellow'],
      [114, 'red'],
      [0, 'red'],
    ] as const)('%d° is %s', (dirDeg, rating) => {
      expect(score({ dirDeg }).rating).toBe(rating);
    });

    it('handles a sector that wraps through north', () => {
      const north: SiteWindow = { windSectors: [[330, 30]] };
      expect(scoreHour({ ...calm, dirDeg: 0 }, north, 'student').rating).toBe('green');
      expect(scoreHour({ ...calm, dirDeg: 45 }, north, 'student').rating).toBe('yellow');
      expect(scoreHour({ ...calm, dirDeg: 180 }, north, 'student').rating).toBe('red');
    });

    it('uses the best of several sectors', () => {
      const twoSectors: SiteWindow = {
        windSectors: [
          [0, 20],
          [170, 190],
        ],
      };
      expect(scoreHour({ ...calm, dirDeg: 180 }, twoSectors, 'student').rating).toBe('green');
    });
  });

  it.each([
    [24.9, 'green'],
    [25, 'yellow'],
    [35, 'yellow'],
    [35.1, 'red'],
  ] as const)('wind at 2000 m of %d km/h is %s', (wind2000mKmh, rating) => {
    expect(score({ wind2000mKmh }).rating).toBe(rating);
  });

  it.each([
    [0, 'green'],
    [0.1, 'yellow'],
    [0.5, 'yellow'],
    [0.6, 'red'],
  ] as const)('rain of %d mm/h is %s', (rainMm, rating) => {
    expect(score({ rainMm }).rating).toBe(rating);
  });

  describe('storm risk', () => {
    it.each([
      [799, 'green'],
      [800, 'yellow'],
      [1500, 'yellow'],
      [1501, 'red'],
    ] as const)('afternoon CAPE of %d J/kg is %s', (capeJkg, rating) => {
      expect(score({ capeJkg, localHour: 14 }).rating).toBe(rating);
    });

    it('ignores CAPE in the morning', () => {
      expect(score({ capeJkg: 3000, localHour: 11 }).rating).toBe('green');
    });
  });

  it('takes the worst check and reports it as the reason', () => {
    const result = score({ rainMm: 0.3, wind2000mKmh: 40 });
    expect(result).toEqual({ rating: 'red', reason: 'wind-2000m', notes: [] });
  });

  it('reports the first worst check in table order on a tie', () => {
    expect(score({ windKmh: 30, gustKmh: 30, rainMm: 2 }).reason).toBe('launch-wind');
  });
});

describe('custom limits', () => {
  const strictStudent: LimitsByLevel = {
    ...DEFAULT_LIMITS,
    student: {
      ...DEFAULT_LIMITS.student,
      gustSpreadKmh: { greenMax: 5, yellowMax: 8, greenMaxInclusive: false },
      directionYellowMarginDeg: 10,
    },
  };

  it('applies the limits for the given level', () => {
    const gusty = { ...calm, gustKmh: calm.windKmh + 10 };
    expect(scoreHour(gusty, site, 'student', strictStudent)).toMatchObject({
      rating: 'red',
      reason: 'gust-spread',
    });
    expect(scoreHour(gusty, site, 'pilot', strictStudent).rating).toBe('yellow');
  });

  it('uses the level direction margin', () => {
    const offSector = { ...calm, dirDeg: 120 };
    expect(scoreHour(offSector, site, 'student', strictStudent).rating).toBe('red');
    expect(scoreHour(offSector, site, 'pilot', strictStudent).rating).toBe('yellow');
  });
});
