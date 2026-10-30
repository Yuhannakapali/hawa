// About 50 km between points over Nepal; ~160 points keeps each refresh small on the Open-Meteo free tier.
const LAT_MIN = 26.5;
const LAT_MAX = 30.5;
const LON_MIN = 80;
const LON_MAX = 88.5;
const STEP_DEG = 0.5;

export const WIND_GRID = {
  latMin: LAT_MIN,
  lonMin: LON_MIN,
  step: STEP_DEG,
  nLat: Math.round((LAT_MAX - LAT_MIN) / STEP_DEG) + 1,
  nLon: Math.round((LON_MAX - LON_MIN) / STEP_DEG) + 1,
};

export const SURFACE_HEIGHT_M = 10;
export const WIND_GRID_HEIGHTS_M = [SURFACE_HEIGHT_M, 2000, 3000] as const;

export interface GridPoint {
  lat: number;
  lon: number;
}

export interface WindFrame {
  timeUtc: Date;
  heightM: number;
  u: number[];
  v: number[];
}

export interface WindGridSource {
  readonly model: string;
  fetchGrid(points: GridPoint[], days: number): Promise<WindFrame[]>;
}

export function gridPoints(): GridPoint[] {
  const points: GridPoint[] = [];
  for (let iLat = 0; iLat < WIND_GRID.nLat; iLat++) {
    for (let iLon = 0; iLon < WIND_GRID.nLon; iLon++) {
      points.push({
        lat: WIND_GRID.latMin + iLat * WIND_GRID.step,
        lon: WIND_GRID.lonMin + iLon * WIND_GRID.step,
      });
    }
  }
  return points;
}
