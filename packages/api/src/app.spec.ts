import type { FastifyInstance } from 'fastify';
import type { DataSource } from 'typeorm';
import { buildApp } from './app.js';
import { insertForecastHour, insertSite, TEST_MODEL } from './testing/fixtures.js';
import { createTestDb } from './testing/test-db.js';

const NOW = new Date('2026-10-30T02:00:00Z');
const HOUR_MS = 60 * 60 * 1000;
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';
const CREDIT = {
  text: 'Weather data by Open-Meteo.com',
  url: 'https://open-meteo.com/',
  license: 'CC BY 4.0',
};

function nepalTime(date: string, hour: number): Date {
  return new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+05:45`);
}

describe('API', () => {
  let db: DataSource;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = await createTestDb();
    app = buildApp({ db, model: TEST_MODEL, now: () => NOW });
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  async function get(url: string) {
    const res = await app.inject({ method: 'GET', url });
    return { status: res.statusCode, body: res.json() };
  }

  describe('GET /v1/sites', () => {
    async function seedSites() {
      const alpha = await insertSite(db, { name: 'Alpha' });
      const bravo = await insertSite(db, { name: 'Bravo' });
      await insertSite(db, { name: 'Zulu', active: false });
      for (const hour of [9, 10, 11]) {
        await insertForecastHour(db, alpha.id, nepalTime('2026-10-30', hour));
        await insertForecastHour(db, alpha.id, nepalTime('2026-10-31', hour), {
          scoreStudent: 'red',
          scorePilot: 'green',
        });
      }
      return { alpha, bravo };
    }

    it('lists active sites by name with today and tomorrow colors', async () => {
      const { alpha, bravo } = await seedSites();

      const { status, body } = await get('/v1/sites');

      expect(status).toBe(200);
      expect(body).toEqual({
        items: [
          {
            id: alpha.id,
            name: 'Alpha',
            lat: 28.244,
            lon: 83.949,
            region: 'Pokhara',
            launchAltM: 1590,
            minLevel: 'student',
            today: 'green',
            tomorrow: 'red',
          },
          expect.objectContaining({ id: bravo.id, today: null, tomorrow: null }),
        ],
        total: 2,
        limit: 50,
        offset: 0,
      });
    });

    it('uses the requested pilot level', async () => {
      await seedSites();
      const { body } = await get('/v1/sites?level=pilot');
      expect(body.items[0].tomorrow).toBe('green');
    });

    it('paginates', async () => {
      await seedSites();
      const { body } = await get('/v1/sites?limit=1&offset=1');
      expect(body.items.map((s: { name: string }) => s.name)).toEqual(['Bravo']);
      expect(body).toMatchObject({ total: 2, limit: 1, offset: 1 });
    });

    it.each(['level=expert', 'limit=0', 'limit=101', 'offset=-1'])('rejects %s', async (query) => {
      expect((await get(`/v1/sites?${query}`)).status).toBe(400);
    });
  });

  describe('GET /v1/sites/:id', () => {
    it('returns the site details', async () => {
      const site = await insertSite(db, { notes: 'Landing at Phewa Lake' });

      const { status, body } = await get(`/v1/sites/${site.id}`);

      expect(status).toBe(200);
      expect(body).toEqual({
        id: site.id,
        name: 'Sarangkot',
        region: 'Pokhara',
        lat: 28.244,
        lon: 83.949,
        launchAltM: 1590,
        landingAltM: 800,
        windSectors: [[135, 225]],
        minLevel: 'student',
        notes: 'Landing at Phewa Lake',
        createdAt: site.createdAt.toISOString(),
        updatedAt: site.updatedAt.toISOString(),
      });
    });

    it('returns 404 for an unknown or inactive site', async () => {
      const closed = await insertSite(db, { active: false });
      expect((await get(`/v1/sites/${UNKNOWN_ID}`)).status).toBe(404);
      expect((await get(`/v1/sites/${closed.id}`)).status).toBe(404);
    });

    it('returns 400 for an invalid id', async () => {
      expect((await get('/v1/sites/not-a-uuid')).status).toBe(400);
    });
  });

  describe('GET /v1/sites/:id/forecast', () => {
    it('groups 06:00 to 18:00 Nepal time into days', async () => {
      const site = await insertSite(db);
      for (let hour = 5; hour <= 19; hour++) {
        await insertForecastHour(db, site.id, nepalTime('2026-10-30', hour));
      }

      const { status, body } = await get(`/v1/sites/${site.id}/forecast`);

      expect(status).toBe(200);
      expect(body).toMatchObject({
        siteId: site.id,
        level: 'student',
        model: TEST_MODEL,
        fetchedAt: nepalTime('2026-10-30', 19).toISOString(),
        windLimitKmh: 20,
        credit: CREDIT,
      });
      expect(body.days.map((d: { date: string }) => d.date)).toEqual([
        '2026-10-30',
        '2026-10-31',
        '2026-11-01',
      ]);
      const [today, tomorrow] = body.days;
      expect(today.rating).toBe('green');
      expect(today.hours.map((h: { localTime: string }) => h.localTime)).toEqual([
        '06:00',
        '07:00',
        '08:00',
        '09:00',
        '10:00',
        '11:00',
        '12:00',
        '13:00',
        '14:00',
        '15:00',
        '16:00',
        '17:00',
        '18:00',
      ]);
      expect(tomorrow).toEqual({
        date: '2026-10-31',
        rating: null,
        stormWarning: false,
        hours: [],
      });
    });

    it('returns hour details for the requested level', async () => {
      const site = await insertSite(db);
      await insertForecastHour(db, site.id, nepalTime('2026-10-30', 14), {
        scoreStudent: 'red',
        reasonStudent: 'launch-wind',
        scorePilot: 'yellow',
        reasonPilot: 'storm-risk',
        capeJkg: 1000,
        notes: ['light-wind'],
      });

      const { body } = await get(`/v1/sites/${site.id}/forecast?level=pilot&days=1`);

      expect(body.days).toHaveLength(1);
      expect(body.days[0].hours[0]).toEqual({
        timeUtc: nepalTime('2026-10-30', 14).toISOString(),
        localTime: '14:00',
        rating: 'yellow',
        reason: 'storm-risk',
        notes: ['light-wind'],
        windKmh: 10,
        gustKmh: 14,
        dirDeg: 180,
        windOverLimit: false,
        windAtHeight: [
          { altitudeM: 1000, speedKmh: 8, dirDeg: 180, overLimit: false },
          { altitudeM: 2000, speedKmh: 15, dirDeg: 200, overLimit: false },
          { altitudeM: 3000, speedKmh: 25, dirDeg: 250, overLimit: false },
        ],
        capeJkg: 1000,
        capeLevel: 'medium',
        cloudBaseM: 2500,
        rainMm: 0,
      });
    });

    it('flags wind above the level limit at each height', async () => {
      const site = await insertSite(db);
      await insertForecastHour(db, site.id, nepalTime('2026-10-30', 12), {
        windKmh: 25,
        wind1000mKmh: 20,
        wind2000mKmh: 21,
        wind3000mKmh: 31,
      });

      const student = (await get(`/v1/sites/${site.id}/forecast?days=1`)).body;
      const pilot = (await get(`/v1/sites/${site.id}/forecast?days=1&level=pilot`)).body;

      const flags = (body: {
        days: { hours: { windOverLimit: boolean; windAtHeight: { overLimit: boolean }[] }[] }[];
      }) => {
        const hour = body.days[0]!.hours[0]!;
        return [hour.windOverLimit, ...hour.windAtHeight.map((w) => w.overLimit)];
      };
      expect(flags(student)).toEqual([true, false, true, true]);
      expect(flags(pilot)).toEqual([false, false, false, true]);
      expect(pilot.windLimitKmh).toBe(30);
    });

    it('warns of storms when afternoon CAPE is high', async () => {
      const site = await insertSite(db);
      await insertForecastHour(db, site.id, nepalTime('2026-10-30', 10), { capeJkg: 3000 });
      await insertForecastHour(db, site.id, nepalTime('2026-10-31', 15), { capeJkg: 3000 });

      const { body } = await get(`/v1/sites/${site.id}/forecast?days=2`);

      expect(body.days[0].stormWarning).toBe(false);
      expect(body.days[0].hours[0].capeLevel).toBe('high');
      expect(body.days[1].stormWarning).toBe(true);
    });

    it('returns 404 for an unknown site and 400 for bad params', async () => {
      const site = await insertSite(db);
      expect((await get(`/v1/sites/${UNKNOWN_ID}/forecast`)).status).toBe(404);
      expect((await get(`/v1/sites/${site.id}/forecast?days=4`)).status).toBe(400);
      expect((await get(`/v1/sites/${site.id}/forecast?level=expert`)).status).toBe(400);
    });
  });

  describe('GET /v1/status', () => {
    it('reports the last update and whether it is stale', async () => {
      const site = await insertSite(db);
      const fetchedAt = new Date(NOW.getTime() - 2 * HOUR_MS);
      await insertForecastHour(db, site.id, NOW, { fetchedAt });

      expect((await get('/v1/status')).body).toEqual({
        lastUpdatedAt: fetchedAt.toISOString(),
        stale: false,
        credit: CREDIT,
      });
    });

    it('is stale after 6 hours or with no data', async () => {
      expect((await get('/v1/status')).body).toEqual({
        lastUpdatedAt: null,
        stale: true,
        credit: CREDIT,
      });

      const site = await insertSite(db);
      await insertForecastHour(db, site.id, NOW, {
        fetchedAt: new Date(NOW.getTime() - 7 * HOUR_MS),
      });
      expect((await get('/v1/status')).body.stale).toBe(true);
    });
  });
});
