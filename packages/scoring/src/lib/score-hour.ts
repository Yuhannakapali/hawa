import { rateDirection } from './direction.js';
import {
  AFTERNOON_FROM_LOCAL_HOUR,
  DEFAULT_LIMITS,
  LIGHT_WIND_BELOW_KMH,
  type LimitsByLevel,
  type ScoreLimits,
} from './limits.js';
import { isWorse, rateInBand } from './ratings.js';
import type {
  CheckId,
  HourConditions,
  HourScore,
  PilotLevel,
  Rating,
  ScoreNote,
  SiteWindow,
} from './types.js';

function rateStormRisk(hour: HourConditions, limits: ScoreLimits): Rating {
  if (hour.localHour < AFTERNOON_FROM_LOCAL_HOUR) {
    return 'green';
  }
  return rateInBand(hour.capeJkg, limits.stormCapeJkg);
}

function runChecks(
  hour: HourConditions,
  site: SiteWindow,
  limits: ScoreLimits,
): [CheckId, Rating][] {
  return [
    ['launch-wind', rateInBand(hour.windKmh, limits.launchWindKmh)],
    ['gust-spread', rateInBand(hour.gustKmh - hour.windKmh, limits.gustSpreadKmh)],
    [
      'wind-direction',
      rateDirection(hour.dirDeg, site.windSectors, limits.directionYellowMarginDeg),
    ],
    ['wind-2000m', rateInBand(hour.wind2000mKmh, limits.wind2000mKmh)],
    ['rain', rateInBand(hour.rainMm, limits.rainMm)],
    ['storm-risk', rateStormRisk(hour, limits)],
  ];
}

export function scoreHour(
  hour: HourConditions,
  site: SiteWindow,
  level: PilotLevel,
  limitsByLevel: LimitsByLevel = DEFAULT_LIMITS,
): HourScore {
  let rating: Rating = 'green';
  let reason: CheckId | null = null;
  for (const [check, result] of runChecks(hour, site, limitsByLevel[level])) {
    if (isWorse(result, rating)) {
      rating = result;
      reason = check;
    }
  }

  const notes: ScoreNote[] = [];
  if (hour.windKmh < LIGHT_WIND_BELOW_KMH) {
    notes.push('light-wind');
  }

  return { rating, reason, notes };
}
