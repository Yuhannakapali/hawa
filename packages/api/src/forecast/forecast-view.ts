import {
  AFTERNOON_FROM_LOCAL_HOUR,
  DEFAULT_LIMITS,
  dailyRating,
  rateInBand,
  type CheckId,
  type PilotLevel,
  type Rating,
} from '@hawa/scoring';
import type { CapeLevel, DayView, HourView } from '@hawa/contracts';
import type { ForecastHour } from '../db/entities.js';
import { addDays, toNepalLocal } from '../time/nepal-time.js';

const FIRST_LOCAL_HOUR = 6;
const LAST_LOCAL_HOUR = 18;
const ALTITUDES_M = [1000, 2000, 3000] as const;

const CAPE_LEVEL_BY_RATING: Record<Rating, CapeLevel> = {
  green: 'low',
  yellow: 'medium',
  red: 'high',
};

export function scoreFor(
  row: ForecastHour,
  level: PilotLevel,
): { rating: Rating; reason: CheckId | null } {
  if (level === 'pilot') {
    return { rating: row.scorePilot, reason: row.reasonPilot };
  }
  return { rating: row.scoreStudent, reason: row.reasonStudent };
}

export function dailyRatingFor(
  rows: readonly ForecastHour[],
  level: PilotLevel,
  date: string,
): Rating | null {
  const hours = rows
    .map((row) => ({ local: toNepalLocal(row.timeUtc), rating: scoreFor(row, level).rating }))
    .filter((h) => h.local.date === date)
    .map((h) => ({ localHour: h.local.hour, rating: h.rating }));
  return dailyRating(hours);
}

function capeLevel(capeJkg: number, level: PilotLevel): CapeLevel {
  return CAPE_LEVEL_BY_RATING[rateInBand(capeJkg, DEFAULT_LIMITS[level].stormCapeJkg)];
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toHourView(row: ForecastHour, level: PilotLevel): HourView {
  const local = toNepalLocal(row.timeUtc);
  const limitKmh = DEFAULT_LIMITS[level].windTableLimitKmh;
  const altitudeWinds: Record<(typeof ALTITUDES_M)[number], [number, number]> = {
    1000: [row.wind1000mKmh, row.wind1000mDirDeg],
    2000: [row.wind2000mKmh, row.wind2000mDirDeg],
    3000: [row.wind3000mKmh, row.wind3000mDirDeg],
  };
  return {
    timeUtc: row.timeUtc.toISOString(),
    localTime: `${pad(local.hour)}:${pad(local.minute)}`,
    ...scoreFor(row, level),
    notes: row.notes,
    windKmh: row.windKmh,
    gustKmh: row.gustKmh,
    dirDeg: row.dirDeg,
    windOverLimit: row.windKmh > limitKmh,
    windAtHeight: ALTITUDES_M.map((altitudeM) => {
      const [speedKmh, dirDeg] = altitudeWinds[altitudeM];
      return { altitudeM, speedKmh, dirDeg, overLimit: speedKmh > limitKmh };
    }),
    capeJkg: row.capeJkg,
    capeLevel: capeLevel(row.capeJkg, level),
    cloudBaseM: row.cloudBaseM,
    rainMm: row.rainMm,
  };
}

function hasAfternoonStorm(rows: readonly ForecastHour[], level: PilotLevel): boolean {
  return rows.some(
    (row) =>
      toNepalLocal(row.timeUtc).hour >= AFTERNOON_FROM_LOCAL_HOUR &&
      capeLevel(row.capeJkg, level) === 'high',
  );
}

export function buildDays(
  rows: readonly ForecastHour[],
  level: PilotLevel,
  firstDate: string,
  days: number,
): DayView[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(firstDate, i);
    const dayRows = rows
      .filter((row) => {
        const local = toNepalLocal(row.timeUtc);
        return (
          local.date === date && local.hour >= FIRST_LOCAL_HOUR && local.hour <= LAST_LOCAL_HOUR
        );
      })
      .sort((a, b) => a.timeUtc.getTime() - b.timeUtc.getTime());

    return {
      date,
      rating: dailyRatingFor(dayRows, level, date),
      stormWarning: hasAfternoonStorm(dayRows, level),
      hours: dayRows.map((row) => toHourView(row, level)),
    };
  });
}
