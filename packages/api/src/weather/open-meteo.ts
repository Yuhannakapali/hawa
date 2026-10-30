import { NEPAL_TIME_ZONE } from '../time/nepal-time.js';
import type { HourlyWeather, WeatherSource, WindAtHeight } from './types.js';

export const PRESSURE_LEVELS_HPA = [900, 850, 800, 700, 600] as const;

const SURFACE_VARIABLES = [
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'precipitation',
  'cape',
  'temperature_2m',
  'dew_point_2m',
];

// Rule of thumb: the cumulus base rises about 125 m per °C of temperature/dew point spread.
const CLOUD_BASE_M_PER_DEG_SPREAD = 125;

const FULL_CIRCLE_DEG = 360;
const DEG_TO_RAD = Math.PI / 180;
const MS_PER_SECOND = 1000;

type FetchFn = (url: string) => Promise<Response>;

interface OpenMeteoResponse {
  utc_offset_seconds: number;
  elevation: number;
  hourly: Record<string, (number | null)[]> & { time: string[] };
}

interface LevelWind {
  heightM: number;
  u: number;
  v: number;
}

function levelVariables(): string[] {
  return PRESSURE_LEVELS_HPA.flatMap((hpa) => [
    `wind_speed_${hpa}hPa`,
    `wind_direction_${hpa}hPa`,
    `geopotential_height_${hpa}hPa`,
  ]);
}

function toComponents(speedKmh: number, dirDeg: number): { u: number; v: number } {
  const rad = dirDeg * DEG_TO_RAD;
  return { u: -speedKmh * Math.sin(rad), v: -speedKmh * Math.cos(rad) };
}

function fromComponents(u: number, v: number): WindAtHeight {
  const dirDeg = (Math.atan2(-u, -v) / DEG_TO_RAD + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
  return { speedKmh: Math.hypot(u, v), dirDeg };
}

function windAtAltitude(levels: LevelWind[], altitudeM: number): WindAtHeight {
  const lowest = levels[0]!;
  const highest = levels[levels.length - 1]!;
  if (altitudeM <= lowest.heightM) {
    return fromComponents(lowest.u, lowest.v);
  }
  if (altitudeM >= highest.heightM) {
    return fromComponents(highest.u, highest.v);
  }
  const upperIndex = levels.findIndex((l) => l.heightM >= altitudeM);
  const below = levels[upperIndex - 1]!;
  const above = levels[upperIndex]!;
  const fraction = (altitudeM - below.heightM) / (above.heightM - below.heightM);
  return fromComponents(
    below.u + (above.u - below.u) * fraction,
    below.v + (above.v - below.v) * fraction,
  );
}

class HourReader {
  missing = false;

  constructor(
    private readonly hourly: OpenMeteoResponse['hourly'],
    private readonly index: number,
  ) {}

  get(variable: string): number {
    const value = this.hourly[variable]?.[this.index];
    if (value === null || value === undefined) {
      this.missing = true;
      return Number.NaN;
    }
    return value;
  }
}

function toHour(body: OpenMeteoResponse, index: number): HourlyWeather | null {
  const read = new HourReader(body.hourly, index);
  const localMs = Date.parse(`${body.hourly.time[index]}Z`);

  const levels = PRESSURE_LEVELS_HPA.map((hpa) => ({
    heightM: read.get(`geopotential_height_${hpa}hPa`),
    ...toComponents(read.get(`wind_speed_${hpa}hPa`), read.get(`wind_direction_${hpa}hPa`)),
  })).sort((a, b) => a.heightM - b.heightM);

  const spreadDeg = read.get('temperature_2m') - read.get('dew_point_2m');
  const hour: HourlyWeather = {
    timeUtc: new Date(localMs - body.utc_offset_seconds * MS_PER_SECOND),
    windKmh: read.get('wind_speed_10m'),
    gustKmh: read.get('wind_gusts_10m'),
    dirDeg: read.get('wind_direction_10m'),
    wind1000m: windAtAltitude(levels, 1000),
    wind2000m: windAtAltitude(levels, 2000),
    wind3000m: windAtAltitude(levels, 3000),
    capeJkg: read.get('cape'),
    cloudBaseM: body.elevation + spreadDeg * CLOUD_BASE_M_PER_DEG_SPREAD,
    rainMm: read.get('precipitation'),
  };
  if (read.missing) {
    return null;
  }
  return hour;
}

export interface OpenMeteoOptions {
  baseUrl: string;
  fetch?: FetchFn;
}

export class OpenMeteoSource implements WeatherSource {
  readonly model = 'best_match';
  private readonly fetchFn: FetchFn;

  constructor(private readonly options: OpenMeteoOptions) {
    this.fetchFn = options.fetch ?? ((url) => fetch(url));
  }

  async fetchHourly(lat: number, lon: number, days: number): Promise<HourlyWeather[]> {
    const url = new URL(this.options.baseUrl);
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('hourly', [...SURFACE_VARIABLES, ...levelVariables()].join(','));
    url.searchParams.set('wind_speed_unit', 'kmh');
    url.searchParams.set('timezone', NEPAL_TIME_ZONE);
    url.searchParams.set('forecast_days', String(days));

    const res = await this.fetchFn(url.toString());
    if (!res.ok) {
      throw new Error(`Open-Meteo request failed with ${res.status}`);
    }
    const body = (await res.json()) as OpenMeteoResponse;
    return body.hourly.time
      .map((_, index) => toHour(body, index))
      .filter((hour): hour is HourlyWeather => hour !== null);
  }
}
