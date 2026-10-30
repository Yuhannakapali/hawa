import type { DataSource } from 'typeorm';
import { ForecastHour, Site } from '../db/entities.js';
import type { HourlyWeather } from '../weather/types.js';

export const TEST_MODEL = 'test-model';

export async function insertSite(db: DataSource, overrides: Partial<Site> = {}): Promise<Site> {
  return db.getRepository(Site).save({
    name: 'Sarangkot',
    lat: 28.244,
    lon: 83.949,
    launchAltM: 1590,
    landingAltM: 800,
    windSectors: [[135, 225]],
    minLevel: 'student',
    ...overrides,
  });
}

export function calmWeather(timeUtc: Date, overrides: Partial<HourlyWeather> = {}): HourlyWeather {
  return {
    timeUtc,
    windKmh: 10,
    gustKmh: 14,
    dirDeg: 180,
    wind1000m: { speedKmh: 8, dirDeg: 180 },
    wind2000m: { speedKmh: 15, dirDeg: 200 },
    wind3000m: { speedKmh: 25, dirDeg: 250 },
    capeJkg: 100,
    cloudBaseM: 2500,
    rainMm: 0,
    ...overrides,
  };
}

export async function insertForecastHour(
  db: DataSource,
  siteId: string,
  timeUtc: Date,
  overrides: Partial<ForecastHour> = {},
): Promise<void> {
  await db.getRepository(ForecastHour).insert({
    siteId,
    timeUtc,
    model: TEST_MODEL,
    windKmh: 10,
    gustKmh: 14,
    dirDeg: 180,
    wind1000mKmh: 8,
    wind1000mDirDeg: 180,
    wind2000mKmh: 15,
    wind2000mDirDeg: 200,
    wind3000mKmh: 25,
    wind3000mDirDeg: 250,
    capeJkg: 100,
    cloudBaseM: 2500,
    rainMm: 0,
    scoreStudent: 'green',
    scorePilot: 'green',
    reasonStudent: null,
    reasonPilot: null,
    notes: [],
    fetchedAt: timeUtc,
    ...overrides,
  });
}
