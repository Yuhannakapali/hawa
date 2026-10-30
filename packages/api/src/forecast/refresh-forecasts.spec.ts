import type { DataSource } from 'typeorm';
import { ForecastHour } from '../db/entities.js';
import { calmWeather, insertForecastHour, insertSite, TEST_MODEL } from '../testing/fixtures.js';
import { createTestDb } from '../testing/test-db.js';
import type { HourlyWeather, WeatherSource } from '../weather/types.js';
import { pruneForecasts, refreshForecasts } from './refresh-forecasts.js';

const NOW = new Date('2026-10-30T02:00:00Z');
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const LOCAL_09 = new Date('2026-10-30T09:00:00+05:45');
const LOCAL_11 = new Date('2026-10-30T11:00:00+05:45');
const LOCAL_13 = new Date('2026-10-30T13:00:00+05:45');
const LOCAL_15 = new Date('2026-10-30T15:00:00+05:45');

class FakeSource implements WeatherSource {
  readonly model = TEST_MODEL;
  readonly calls: { lat: number; days: number }[] = [];

  constructor(private readonly hoursFor: (lat: number) => HourlyWeather[]) {}

  async fetchHourly(lat: number, _lon: number, days: number): Promise<HourlyWeather[]> {
    this.calls.push({ lat, days });
    return this.hoursFor(lat);
  }
}

describe('refreshForecasts', () => {
  let db: DataSource;

  beforeEach(async () => {
    db = await createTestDb();
  });

  afterEach(() => db.destroy());

  function rowsFor(siteId: string) {
    return db.getRepository(ForecastHour).find({ where: { siteId }, order: { timeUtc: 'ASC' } });
  }

  it('scores each hour for both pilot levels', async () => {
    const site = await insertSite(db);
    const source = new FakeSource(() => [
      calmWeather(LOCAL_09),
      calmWeather(LOCAL_15, { windKmh: 17, gustKmh: 20 }),
    ]);

    const result = await refreshForecasts(db, source, NOW);

    expect(result).toEqual({ updatedSites: 1, failures: [] });
    expect(source.calls).toEqual([{ lat: site.lat, days: 3 }]);
    const [morning, afternoon] = await rowsFor(site.id);
    expect(morning).toMatchObject({
      timeUtc: LOCAL_09,
      model: TEST_MODEL,
      scoreStudent: 'green',
      scorePilot: 'green',
      reasonStudent: null,
      fetchedAt: NOW,
    });
    expect(afternoon).toMatchObject({
      windKmh: 17,
      scoreStudent: 'yellow',
      reasonStudent: 'launch-wind',
      scorePilot: 'green',
      reasonPilot: null,
    });
  });

  it('applies storm risk by Nepal local hour', async () => {
    const site = await insertSite(db);
    const stormy = { capeJkg: 2000 };
    const source = new FakeSource(() => [
      calmWeather(LOCAL_11, stormy),
      calmWeather(LOCAL_13, stormy),
    ]);

    await refreshForecasts(db, source, NOW);

    const [morning, afternoon] = await rowsFor(site.id);
    expect(morning!.scoreStudent).toBe('green');
    expect(afternoon).toMatchObject({ scoreStudent: 'red', reasonStudent: 'storm-risk' });
  });

  it('skips inactive sites', async () => {
    await insertSite(db, { name: 'Closed', active: false });
    const source = new FakeSource(() => [calmWeather(LOCAL_09)]);

    expect(await refreshForecasts(db, source, NOW)).toEqual({ updatedSites: 0, failures: [] });
    expect(source.calls).toEqual([]);
  });

  it('replaces the stored hour on the next run', async () => {
    const site = await insertSite(db);
    await refreshForecasts(db, new FakeSource(() => [calmWeather(LOCAL_09)]), NOW);

    const later = new Date(NOW.getTime() + HOUR_MS);
    const windier = new FakeSource(() => [calmWeather(LOCAL_09, { windKmh: 30, gustKmh: 30 })]);
    await refreshForecasts(db, windier, later);

    const rows = await rowsFor(site.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ windKmh: 30, scorePilot: 'red', fetchedAt: later });
  });

  it('keeps going when one site fails and reports it', async () => {
    const good = await insertSite(db, { name: 'Good', lat: 1 });
    const bad = await insertSite(db, { name: 'Bad', lat: 2 });
    const source = new FakeSource((lat) => {
      if (lat === bad.lat) {
        throw new Error('Open-Meteo request failed with 503');
      }
      return [calmWeather(LOCAL_09)];
    });

    const result = await refreshForecasts(db, source, NOW);

    expect(result).toEqual({
      updatedSites: 1,
      failures: [
        { siteId: bad.id, siteName: 'Bad', message: 'Open-Meteo request failed with 503' },
      ],
    });
    expect(await rowsFor(good.id)).toHaveLength(1);
  });
});

describe('pruneForecasts', () => {
  it('deletes forecast hours older than 7 days', async () => {
    const db = await createTestDb();
    const site = await insertSite(db);
    const kept = new Date(NOW.getTime() - 6 * DAY_MS);
    await insertForecastHour(db, site.id, new Date(NOW.getTime() - 8 * DAY_MS));
    await insertForecastHour(db, site.id, kept);

    expect(await pruneForecasts(db, NOW)).toBe(1);

    const remaining = await db.getRepository(ForecastHour).find();
    expect(remaining.map((r) => r.timeUtc)).toEqual([kept]);
    await db.destroy();
  });
});
