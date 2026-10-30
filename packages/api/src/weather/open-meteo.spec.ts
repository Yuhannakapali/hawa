import { OpenMeteoSource, PRESSURE_LEVELS_HPA } from './open-meteo.js';

const NEPAL_OFFSET_SECONDS = 20700;

type Levels = Record<number, number>;

function levelFields(heights: Levels, speeds: Levels, dirs: Levels) {
  const fields: Record<string, number[]> = {};
  for (const hpa of PRESSURE_LEVELS_HPA) {
    fields[`geopotential_height_${hpa}hPa`] = [heights[hpa]!];
    fields[`wind_speed_${hpa}hPa`] = [speeds[hpa]!];
    fields[`wind_direction_${hpa}hPa`] = [dirs[hpa]!];
  }
  return fields;
}

function same(value: number): Levels {
  return Object.fromEntries(PRESSURE_LEVELS_HPA.map((hpa) => [hpa, value]));
}

const HEIGHTS: Levels = { 900: 1000, 850: 1500, 800: 1500, 700: 2500, 600: 4000 };

function response(hourly: Record<string, unknown> = {}) {
  return {
    utc_offset_seconds: NEPAL_OFFSET_SECONDS,
    elevation: 1500,
    hourly: {
      time: ['2026-10-30T06:00'],
      wind_speed_10m: [12],
      wind_gusts_10m: [20],
      wind_direction_10m: [190],
      precipitation: [0.2],
      cape: [300],
      temperature_2m: [20],
      dew_point_2m: [12],
      ...levelFields(HEIGHTS, same(10), same(270)),
      ...hourly,
    },
  };
}

function sourceReturning(body: unknown, status = 200) {
  const fetchFn = vi.fn(
    async (_url: string | URL | Request) => new Response(JSON.stringify(body), { status }),
  );
  const source = new OpenMeteoSource({
    baseUrl: 'https://api.example.test/v1/forecast',
    fetch: fetchFn,
  });
  return { source, fetchFn };
}

async function firstHour(body: unknown) {
  const { source } = sourceReturning(body);
  const [hour] = await source.fetchHourly(28.244, 83.949, 1);
  return hour!;
}

describe('OpenMeteoSource', () => {
  it('requests km/h in Nepal time for the given number of days', async () => {
    const { source, fetchFn } = sourceReturning(response());
    await source.fetchHourly(28.244, 83.949, 3);

    const url = new URL(String(fetchFn.mock.calls[0]![0]));
    expect(url.origin + url.pathname).toBe('https://api.example.test/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('28.244');
    expect(url.searchParams.get('longitude')).toBe('83.949');
    expect(url.searchParams.get('timezone')).toBe('Asia/Kathmandu');
    expect(url.searchParams.get('forecast_days')).toBe('3');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('hourly')).toContain('wind_speed_800hPa');
  });

  it('maps surface values and converts local time to UTC', async () => {
    expect(await firstHour(response())).toMatchObject({
      timeUtc: new Date('2026-10-30T00:15:00Z'),
      windKmh: 12,
      gustKmh: 20,
      dirDeg: 190,
      rainMm: 0.2,
      capeJkg: 300,
    });
  });

  it('estimates cloud base from the temperature and dew point spread', async () => {
    expect((await firstHour(response())).cloudBaseM).toBe(1500 + 8 * 125);
  });

  it('interpolates wind between the pressure levels around each height', async () => {
    const speeds: Levels = { 900: 5, 850: 10, 800: 10, 700: 30, 600: 30 };
    const hour = await firstHour(response(levelFields(HEIGHTS, speeds, same(270))));

    expect(hour.wind1000m.speedKmh).toBeCloseTo(5);
    expect(hour.wind2000m.speedKmh).toBeCloseTo(20);
    expect(hour.wind2000m.dirDeg).toBeCloseTo(270);
    expect(hour.wind3000m.speedKmh).toBeCloseTo(30);
  });

  it('interpolates direction across north without averaging to south', async () => {
    const dirs: Levels = { 900: 350, 850: 350, 800: 350, 700: 10, 600: 10 };
    const hour = await firstHour(response(levelFields(HEIGHTS, same(20), dirs)));

    const offNorth = Math.min(hour.wind2000m.dirDeg, 360 - hour.wind2000m.dirDeg);
    expect(offNorth).toBeLessThan(1);
  });

  it('uses the nearest level when a height is outside the levels', async () => {
    const high: Levels = { 900: 4100, 850: 4200, 800: 4300, 700: 4400, 600: 4500 };
    const hour = await firstHour(response(levelFields(high, same(12), same(90))));

    expect(hour.wind1000m.speedKmh).toBeCloseTo(12);
    expect(hour.wind1000m.dirDeg).toBeCloseTo(90);
  });

  it('throws when Open-Meteo fails', async () => {
    const { source } = sourceReturning({ reason: 'bad' }, 400);
    await expect(source.fetchHourly(28.244, 83.949, 1)).rejects.toThrow(/400/);
  });
});
