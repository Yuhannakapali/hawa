export type Rating = 'green' | 'yellow' | 'red';

export type PilotLevel = 'student' | 'pilot';

export type CheckId =
  | 'launch-wind'
  | 'gust-spread'
  | 'wind-direction'
  | 'wind-2000m'
  | 'rain'
  | 'storm-risk';

export type ScoreNote = 'light-wind';

export type DegreeRange = readonly [from: number, to: number];

export interface SiteWindow {
  windSectors: readonly DegreeRange[];
}

export interface HourConditions {
  localHour: number;
  windKmh: number;
  gustKmh: number;
  dirDeg: number;
  wind2000mKmh: number;
  rainMm: number;
  capeJkg: number;
}

export interface HourScore {
  rating: Rating;
  reason: CheckId | null;
  notes: ScoreNote[];
}

export interface HourRating {
  localHour: number;
  rating: Rating;
}
