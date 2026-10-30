import { NEPAL_TIME_ZONE } from '../time/nepal-time.js';
import type { HourlyWeather, WeatherSource, WindAtHeight } from './types.js';
import {
  SURFACE_HEIGHT_M,
  WIND_GRID_HEIGHTS_M,
  type GridPoint,
  type WindFrame,
  type WindGridSource,
} from './wind-grid.js';

export const PRESSURE_LEVELS_HPA = [900, 850, 800, 700, 600] as const;

const GRID_SURFACE_VARIABLES = ['wind_speed_10m', 'wind_direction_10m'];

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

function readLevels(read: HourReader): LevelWind[] {
  return PRESSURE_LEVELS_HPA.map((hpa) => ({
    heightM: read.get(`geopotential_height_${hpa}hPa`),
    ...toComponents(read.get(`wind_speed_${hpa}hPa`), read.get(`wind_direction_${hpa}hPa`)),
  })).sort((a, b) => a.heightM - b.heightM);
}

function utcTime(body: OpenMeteoResponse, index: number): Date {
  const localMs = Date.parse(`${body.hourly.time[index]}Z`);
  return new Date(localMs - body.utc_offset_seconds * MS_PER_SECOND);
}

function toHour(body: OpenMeteoResponse, index: number): HourlyWeather | null {
  const read = new HourReader(body.hourly, index);
  const levels = readLevels(read);

  const spreadDeg = read.get('temperature_2m') - read.get('dew_point_2m');
  const hour: HourlyWeather = {
    timeUtc: utcTime(body, index),
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

const OPEN_METEO_MODEL = 'best_match';

class OpenMeteoClient {
  private readonly fetchFn: FetchFn;

  constructor(private readonly options: OpenMeteoOptions) {
    this.fetchFn = options.fetch ?? ((url) => fetch(url));
  }

  async get<T>(points: GridPoint[], variables: string[], days: number): Promise<T> {
    const url = new URL(this.options.baseUrl);
    url.searchParams.set('latitude', points.map((p) => p.lat).join(','));
    url.searchParams.set('longitude', points.map((p) => p.lon).join(','));
    url.searchParams.set('hourly', variables.join(','));
    url.searchParams.set('wind_speed_unit', 'kmh');
    url.searchParams.set('timezone', NEPAL_TIME_ZONE);
    url.searchParams.set('forecast_days', String(days));

    const res = await this.fetchFn(url.toString());
    if (!res.ok) {
      throw new Error(`Open-Meteo request failed with ${res.status}`);
    }
    return (await res.json()) as T;
  }
}

export class OpenMeteoSource implements WeatherSource {
  readonly model = OPEN_METEO_MODEL;
  private readonly client: OpenMeteoClient;

  constructor(options: OpenMeteoOptions) {
    this.client = new OpenMeteoClient(options);
  }

  async fetchHourly(lat: number, lon: number, days: number): Promise<HourlyWeather[]> {
    const body = await this.client.get<OpenMeteoResponse>(
      [{ lat, lon }],
      [...SURFACE_VARIABLES, ...levelVariables()],
      days,
    );
    return body.hourly.time
      .map((_, index) => toHour(body, index))
      .filter((hour): hour is HourlyWeather => hour !== null);
  }
}

function windAtGridHeight(read: HourReader, heightM: number): { u: number; v: number } {
  if (heightM === SURFACE_HEIGHT_M) {
    return toComponents(read.get('wind_speed_10m'), read.get('wind_direction_10m'));
  }
  const wind = windAtAltitude(readLevels(read), heightM);
  return toComponents(wind.speedKmh, wind.dirDeg);
}

export class OpenMeteoWindGridSource implements WindGridSource {
  readonly model = OPEN_METEO_MODEL;
  private readonly client: OpenMeteoClient;

  constructor(options: OpenMeteoOptions) {
    this.client = new OpenMeteoClient(options);
  }

  async fetchGrid(points: GridPoint[], days: number): Promise<WindFrame[]> {
    const response = await this.client.get<OpenMeteoResponse | OpenMeteoResponse[]>(
      points,
      [...GRID_SURFACE_VARIABLES, ...levelVariables()],
      days,
    );
    let locations: OpenMeteoResponse[] = [];
    if (Array.isArray(response)) {
      locations = response;
    } else {
      locations = [response];
    }
    const first = locations[0];
    if (first === undefined) {
      return [];
    }

    const frames: WindFrame[] = [];
    first.hourly.time.forEach((_, index) => {
      for (const heightM of WIND_GRID_HEIGHTS_M) {
        const frame: WindFrame = { timeUtc: utcTime(first, index), heightM, u: [], v: [] };
        let missing = false;
        for (const location of locations) {
          const read = new HourReader(location.hourly, index);
          const wind = windAtGridHeight(read, heightM);
          missing = missing || read.missing;
          frame.u.push(wind.u);
          frame.v.push(wind.v);
        }
        if (!missing) {
          frames.push(frame);
        }
      }
    });
    return frames;
  }
}
