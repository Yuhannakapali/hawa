import type { Band } from './ratings.js';
import type { PilotLevel } from './types.js';

export interface ScoreLimits {
  launchWindKmh: Band;
  gustSpreadKmh: Band;
  directionYellowMarginDeg: number;
  wind2000mKmh: Band;
  rainMm: Band;
  stormCapeJkg: Band;
  windTableLimitKmh: number;
}

export type LimitsByLevel = Record<PilotLevel, ScoreLimits>;

// Starting values from the MVP spec. A local instructor must review them before launch.
const SHARED_DEFAULTS: Omit<ScoreLimits, 'launchWindKmh' | 'windTableLimitKmh'> = {
  gustSpreadKmh: { greenMax: 8, yellowMax: 12, greenMaxInclusive: false },
  directionYellowMarginDeg: 20,
  wind2000mKmh: { greenMax: 25, yellowMax: 35, greenMaxInclusive: false },
  rainMm: { greenMax: 0, yellowMax: 0.5, greenMaxInclusive: true },
  stormCapeJkg: { greenMax: 800, yellowMax: 1500, greenMaxInclusive: false },
};

export const DEFAULT_LIMITS: LimitsByLevel = {
  student: {
    ...SHARED_DEFAULTS,
    launchWindKmh: { greenMax: 15, yellowMax: 18, greenMaxInclusive: true },
    windTableLimitKmh: 20,
  },
  pilot: {
    ...SHARED_DEFAULTS,
    launchWindKmh: { greenMax: 20, yellowMax: 25, greenMaxInclusive: true },
    windTableLimitKmh: 30,
  },
};

export const LIGHT_WIND_BELOW_KMH = 5;

export const AFTERNOON_FROM_LOCAL_HOUR = 12;

export const DAILY_WINDOW = { fromLocalHour: 9, toLocalHour: 16, blockHours: 3 };
