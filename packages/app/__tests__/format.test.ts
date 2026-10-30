import type { HourView, SiteSummary } from '@hawa/contracts';
import { ApiError } from '../src/api/client';
import { cardinal, isInSectors, sectorPath } from '../src/format/compass';
import { defaultSelectedHour, hourReasonText, summarizeDay } from '../src/format/day-summary';
import { classifyLoadError } from '../src/format/load-error';
import { buildSiteRows } from '../src/format/site-rows';
import { altitude, speed } from '../src/format/units';

function hour(
  localTime: string,
  rating: HourView['rating'],
  reason: HourView['reason'] = null,
): HourView {
  return {
    timeUtc: `2026-10-30T${localTime}:00+05:45`,
    localTime,
    rating,
    reason,
    notes: [],
    windKmh: 10,
    gustKmh: 14,
    dirDeg: 180,
    windOverLimit: false,
    windAtHeight: [],
    capeJkg: 100,
    capeLevel: 'low',
    cloudBaseM: 2500,
    rainMm: 0,
  };
}

function site(id: string, today: SiteSummary['today']): SiteSummary {
  return {
    id,
    name: id,
    region: 'Pokhara',
    lat: 28,
    lon: 84,
    launchAltM: 1590,
    minLevel: 'student',
    today,
    tomorrow: 'red',
  };
}

describe('units', () => {
  it('converts wind to knots and altitude to feet', () => {
    expect(speed(20, 'kmh')).toBe(20);
    expect(speed(20, 'kt')).toBe(11);
    expect(altitude(1590, 'm')).toBe('1590 m');
    expect(altitude(1000, 'ft')).toBe('3281 ft');
  });
});

describe('compass', () => {
  it('names the 16 compass points', () => {
    expect(cardinal(0)).toBe('N');
    expect(cardinal(295)).toBe('WNW');
    expect(cardinal(359)).toBe('N');
  });

  it('checks sectors including ones that cross north', () => {
    expect(isInSectors(180, [[135, 225]])).toBe(true);
    expect(isInSectors(240, [[135, 225]])).toBe(false);
    expect(isInSectors(10, [[330, 30]])).toBe(true);
  });

  it('draws the small arc for a sector that crosses north', () => {
    expect(sectorPath([330, 30], 72)).toContain(' 0 0 1 ');
    expect(sectorPath([90, 300], 72)).toContain(' 0 1 1 ');
  });
});

describe('summarizeDay', () => {
  it('names the first green window and lists every segment', () => {
    const hours = [
      hour('06:00', 'green'),
      hour('07:00', 'green'),
      hour('08:00', 'yellow', 'gust-spread'),
    ];
    expect(summarizeDay(hours)).toEqual({
      rating: 'green',
      title: 'Best window 06:00–07:00',
      body: 'Flyable 06:00–07:00 · Marginal 08:00–08:00',
    });
  });

  it('reports the most common reason when nothing is flyable', () => {
    const hours = [
      hour('06:00', 'red', 'gust-spread'),
      hour('07:00', 'red', 'wind-direction'),
      hour('08:00', 'red', 'gust-spread'),
    ];
    expect(summarizeDay(hours)).toEqual({
      rating: 'red',
      title: 'No flyable hours',
      body: 'Main reason: Gusts too strong.',
    });
  });

  it('is marginal at best when the best hour is yellow', () => {
    const hours = [hour('06:00', 'yellow', 'rain'), hour('07:00', 'red', 'rain')];
    expect(summarizeDay(hours)?.title).toBe('Marginal at best');
  });

  it('is null for a day without hours', () => {
    expect(summarizeDay([])).toBeNull();
  });
});

describe('hour selection and reason text', () => {
  it('selects the first storm hour, otherwise the middle hour', () => {
    const calm = [hour('06:00', 'green'), hour('07:00', 'green'), hour('08:00', 'green')];
    expect(defaultSelectedHour(calm)?.localTime).toBe('07:00');
    const stormy = [...calm, hour('14:00', 'red', 'storm-risk')];
    expect(defaultSelectedHour(stormy)?.localTime).toBe('14:00');
  });

  it('explains green hours, including light wind', () => {
    expect(hourReasonText(hour('06:00', 'green'))).toBe('Within your limits');
    expect(hourReasonText({ ...hour('06:00', 'green'), notes: ['light-wind'] })).toBe(
      'Light wind — forward launch may be harder',
    );
  });
});

describe('buildSiteRows', () => {
  const sites = [site('a', 'red'), site('b', 'green'), site('c', null), site('d', 'yellow')];

  it('puts favorites first and sorts the rest best first', () => {
    const rows = buildSiteRows(sites, { d: { alertsOn: true } }, false);
    expect(rows.favorites.map((r) => r.site.id)).toEqual(['d']);
    expect(rows.others.map((r) => r.site.id)).toEqual(['b', 'a', 'c']);
    expect(rows).toMatchObject({ flyableToday: 1, total: 4 });
  });

  it('hides ratings for sites not saved offline', () => {
    const rows = buildSiteRows(sites, { d: { alertsOn: true } }, true);
    expect(rows.favorites[0]).toMatchObject({
      available: true,
      today: 'yellow',
    });
    expect(rows.others.map((r) => [r.site.id, r.available, r.today])).toEqual([
      ['a', false, null],
      ['b', false, null],
      ['c', false, null],
    ]);
  });
});

describe('classifyLoadError', () => {
  it('separates not found, server and offline failures', () => {
    expect(classifyLoadError(new ApiError(404, 'x'), false)).toBe('not-found');
    expect(classifyLoadError(new ApiError(500, 'x'), false)).toBe('server');
    expect(classifyLoadError(new TypeError('Failed to fetch'), false)).toBe('not-saved-offline');
    expect(classifyLoadError(new TypeError('Failed to fetch'), true)).toBe('server');
  });
});
