import type { CheckId, DegreeRange, PilotLevel, Rating, ScoreNote } from '@hawa/scoring';

export type { CheckId, DegreeRange, PilotLevel, Rating, ScoreNote };

export type CapeLevel = 'low' | 'medium' | 'high';

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface Credit {
  text: string;
  url: string;
  license: string;
}

export interface SiteSummary {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  launchAltM: number;
  minLevel: PilotLevel;
  today: Rating | null;
  tomorrow: Rating | null;
}

export interface SiteDetail {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  launchAltM: number;
  landingAltM: number;
  windSectors: DegreeRange[];
  minLevel: PilotLevel;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface WindAtHeightView {
  altitudeM: number;
  speedKmh: number;
  dirDeg: number;
  overLimit: boolean;
}

export interface HourView {
  timeUtc: string;
  localTime: string;
  rating: Rating;
  reason: CheckId | null;
  notes: ScoreNote[];
  windKmh: number;
  gustKmh: number;
  dirDeg: number;
  windOverLimit: boolean;
  windAtHeight: WindAtHeightView[];
  capeJkg: number;
  capeLevel: CapeLevel;
  cloudBaseM: number;
  rainMm: number;
}

export interface DayView {
  date: string;
  rating: Rating | null;
  stormWarning: boolean;
  hours: HourView[];
}

export interface ForecastResponse {
  siteId: string;
  level: PilotLevel;
  model: string;
  fetchedAt: string | null;
  windLimitKmh: number;
  credit: Credit;
  days: DayView[];
}

export interface WindGridLayout {
  latMin: number;
  lonMin: number;
  step: number;
  nLat: number;
  nLon: number;
}

/** Wind components in km/h, u towards east and v towards north, row by row from the south-west corner. */
export interface WindGridResponse {
  heightM: number;
  time: string;
  times: string[];
  grid: WindGridLayout;
  u: number[];
  v: number[];
  fetchedAt: string;
  credit: Credit;
}

export interface StatusResponse {
  lastUpdatedAt: string | null;
  stale: boolean;
  credit: Credit;
}
