import type { WindGridLayout } from '@hawa/contracts';

export interface WindField {
  grid: WindGridLayout;
  u: number[];
  v: number[];
}

export interface Wind {
  u: number;
  v: number;
}

export type Rgb = [number, number, number];

// Our own scale: calm blues through greens to warm reds for strong wind.
export const WIND_SPEED_STOPS: { kmh: number; rgb: Rgb }[] = [
  { kmh: 0, rgb: [74, 118, 186] },
  { kmh: 10, rgb: [64, 160, 170] },
  { kmh: 20, rgb: [88, 178, 96] },
  { kmh: 30, rgb: [226, 192, 74] },
  { kmh: 40, rgb: [224, 122, 58] },
  { kmh: 55, rgb: [196, 54, 46] },
  { kmh: 70, rgb: [142, 42, 138] },
];

function valueAt(
  values: number[],
  grid: WindGridLayout,
  iLat: number,
  iLon: number,
): number {
  return values[iLat * grid.nLon + iLon]!;
}

export function sampleWind(
  field: WindField,
  lat: number,
  lon: number,
): Wind | null {
  const { grid } = field;
  const y = (lat - grid.latMin) / grid.step;
  const x = (lon - grid.lonMin) / grid.step;
  if (x < 0 || y < 0 || x > grid.nLon - 1 || y > grid.nLat - 1) {
    return null;
  }
  const x0 = Math.min(Math.floor(x), grid.nLon - 2);
  const y0 = Math.min(Math.floor(y), grid.nLat - 2);
  const fx = x - x0;
  const fy = y - y0;

  function blend(values: number[]): number {
    const south =
      valueAt(values, grid, y0, x0) * (1 - fx) +
      valueAt(values, grid, y0, x0 + 1) * fx;
    const north =
      valueAt(values, grid, y0 + 1, x0) * (1 - fx) +
      valueAt(values, grid, y0 + 1, x0 + 1) * fx;
    return south * (1 - fy) + north * fy;
  }

  return { u: blend(field.u), v: blend(field.v) };
}

export function speedColor(kmh: number): Rgb {
  const first = WIND_SPEED_STOPS[0]!;
  if (kmh <= first.kmh) {
    return first.rgb;
  }
  for (let i = 1; i < WIND_SPEED_STOPS.length; i++) {
    const upper = WIND_SPEED_STOPS[i]!;
    if (kmh <= upper.kmh) {
      const lower = WIND_SPEED_STOPS[i - 1]!;
      const t = (kmh - lower.kmh) / (upper.kmh - lower.kmh);
      return lower.rgb.map((c, k) =>
        Math.round(c + (upper.rgb[k]! - c) * t),
      ) as Rgb;
    }
  }
  return WIND_SPEED_STOPS[WIND_SPEED_STOPS.length - 1]!.rgb;
}
