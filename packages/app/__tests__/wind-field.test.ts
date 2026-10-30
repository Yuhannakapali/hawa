import type { WindGridLayout } from '@hawa/contracts';
import {
  sampleWind,
  speedColor,
  WIND_SPEED_STOPS,
} from '../src/format/wind-field';

const grid: WindGridLayout = {
  latMin: 27,
  lonMin: 84,
  step: 1,
  nLat: 2,
  nLon: 2,
};
// Row by row from the south-west corner: (27,84) (27,85) (28,84) (28,85).
const field = { grid, u: [0, 10, 20, 30], v: [0, 0, -10, -10] };

describe('sampleWind', () => {
  it('returns the grid value at a grid point', () => {
    expect(sampleWind(field, 28, 85)).toEqual({ u: 30, v: -10 });
  });

  it('interpolates between grid points', () => {
    const wind = sampleWind(field, 27.5, 84.5);
    expect(wind?.u).toBeCloseTo(15);
    expect(wind?.v).toBeCloseTo(-5);
  });

  it('is null outside the grid', () => {
    expect(sampleWind(field, 26.9, 84.5)).toBeNull();
    expect(sampleWind(field, 27.5, 85.1)).toBeNull();
  });
});

describe('speedColor', () => {
  it('uses the stop colour at a stop and clamps beyond the last stop', () => {
    const first = WIND_SPEED_STOPS[0]!;
    const last = WIND_SPEED_STOPS[WIND_SPEED_STOPS.length - 1]!;
    expect(speedColor(first.kmh)).toEqual(first.rgb);
    expect(speedColor(last.kmh + 100)).toEqual(last.rgb);
  });

  it('blends between two stops', () => {
    const a = WIND_SPEED_STOPS[0]!;
    const b = WIND_SPEED_STOPS[1]!;
    const mid = speedColor((a.kmh + b.kmh) / 2);
    expect(mid[0]).toBe(Math.round((a.rgb[0] + b.rgb[0]) / 2));
  });
});
