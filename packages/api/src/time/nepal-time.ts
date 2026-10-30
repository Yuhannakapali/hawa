export const NEPAL_TIME_ZONE = 'Asia/Kathmandu';

const NEPAL_UTC_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
const ISO_DATE_LENGTH = 10;

export interface NepalLocal {
  date: string;
  hour: number;
  minute: number;
}

export function toNepalLocal(utc: Date): NepalLocal {
  const shifted = new Date(utc.getTime() + NEPAL_UTC_OFFSET_MS);
  return {
    date: shifted.toISOString().slice(0, ISO_DATE_LENGTH),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

export function nepalMidnightUtc(date: string): Date {
  return new Date(Date.parse(`${date}T00:00:00Z`) - NEPAL_UTC_OFFSET_MS);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, ISO_DATE_LENGTH);
}
