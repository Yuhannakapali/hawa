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
  /** Third-party calls one grid point costs, used for the daily budget. */
  readonly callsPerPoint: number;
  fetchGrid(points: GridPoint[], days: number): Promise<WindFrame[]>;
}
