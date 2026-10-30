import { scoreHour, type HourConditions } from '@hawa/scoring';
import { LessThan, type DataSource } from 'typeorm';
import { ForecastHour, Site } from '../db/entities.js';
import { toNepalLocal } from '../time/nepal-time.js';
import type { HourlyWeather, WeatherSource } from '../weather/types.js';

export const FORECAST_DAYS = 3;
export const FORECAST_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export interface RefreshFailure {
  siteId: string;
  siteName: string;
  message: string;
}

export interface RefreshResult {
  updatedSites: number;
  failures: RefreshFailure[];
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function toRow(site: Site, hour: HourlyWeather, model: string, fetchedAt: Date): ForecastHour {
  const conditions: HourConditions = {
    localHour: toNepalLocal(hour.timeUtc).hour,
    windKmh: hour.windKmh,
    gustKmh: hour.gustKmh,
    dirDeg: hour.dirDeg,
    wind2000mKmh: hour.wind2000m.speedKmh,
    rainMm: hour.rainMm,
    capeJkg: hour.capeJkg,
  };
  const student = scoreHour(conditions, site, 'student');
  const pilot = scoreHour(conditions, site, 'pilot');

  return {
    siteId: site.id,
    timeUtc: hour.timeUtc,
    model,
    windKmh: hour.windKmh,
    gustKmh: hour.gustKmh,
    dirDeg: hour.dirDeg,
    wind1000mKmh: hour.wind1000m.speedKmh,
    wind1000mDirDeg: hour.wind1000m.dirDeg,
    wind2000mKmh: hour.wind2000m.speedKmh,
    wind2000mDirDeg: hour.wind2000m.dirDeg,
    wind3000mKmh: hour.wind3000m.speedKmh,
    wind3000mDirDeg: hour.wind3000m.dirDeg,
    capeJkg: hour.capeJkg,
    cloudBaseM: hour.cloudBaseM,
    rainMm: hour.rainMm,
    scoreStudent: student.rating,
    scorePilot: pilot.rating,
    reasonStudent: student.reason,
    reasonPilot: pilot.reason,
    notes: student.notes,
    fetchedAt,
  };
}

export async function refreshForecasts(
  db: DataSource,
  source: WeatherSource,
  now: Date,
): Promise<RefreshResult> {
  const sites = await db
    .getRepository(Site)
    .find({ where: { active: true }, order: { name: 'ASC' } });
  const forecasts = db.getRepository(ForecastHour);
  const result: RefreshResult = { updatedSites: 0, failures: [] };

  for (const site of sites) {
    try {
      const hours = await source.fetchHourly(site.lat, site.lon, FORECAST_DAYS);
      const rows = hours.map((hour) => toRow(site, hour, source.model, now));
      if (rows.length > 0) {
        await forecasts.upsert(rows, ['siteId', 'timeUtc', 'model']);
      }
      result.updatedSites++;
    } catch (error) {
      result.failures.push({ siteId: site.id, siteName: site.name, message: errorMessage(error) });
    }
  }
  return result;
}

export async function pruneForecasts(db: DataSource, now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - FORECAST_RETENTION_MS);
  const result = await db.getRepository(ForecastHour).delete({ timeUtc: LessThan(cutoff) });
  return result.affected ?? 0;
}
