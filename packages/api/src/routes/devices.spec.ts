import type { FastifyInstance } from 'fastify';
import type { DataSource } from 'typeorm';
import { buildApp } from '../app.js';
import { Device } from '../db/entities/device.entity.js';
import { insertSite, TEST_MODEL } from '../testing/fixtures.js';
import { createTestDb } from '../testing/test-db.js';

const DEVICE_ID = '7b0a1c2e-3f4d-4a5b-8c6d-9e0f1a2b3c4d';
const OTHER_DEVICE_ID = '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const WEB_PUBLIC_KEY = 'test-vapid-public-key';

describe('device routes', () => {
  let db: DataSource;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = await createTestDb();
    app = buildApp({ db, model: TEST_MODEL, webPushPublicKey: WEB_PUBLIC_KEY });
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  async function putDevice(id: string, body: Record<string, unknown>) {
    const res = await app.inject({ method: 'PUT', url: `/v1/devices/${id}`, payload: body });
    return { status: res.statusCode, body: res.json() };
  }

  async function validBody(overrides: Record<string, unknown> = {}) {
    const site = await insertSite(db);
    return {
      platform: 'web',
      token: '{"endpoint":"https://push.example/abc"}',
      level: 'student',
      alertTime: '19:00',
      alertSiteIds: [site.id],
      ...overrides,
    };
  }

  it('returns the web push public key', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/push/config' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ webPushPublicKey: WEB_PUBLIC_KEY });
  });

  it('returns a null web push key when web push is not configured', async () => {
    const bare = buildApp({ db, model: TEST_MODEL });
    const res = await bare.inject({ method: 'GET', url: '/v1/push/config' });
    expect(res.json()).toEqual({ webPushPublicKey: null });
    await bare.close();
  });

  it('registers a device without echoing its push token', async () => {
    const body = await validBody();
    const { status, body: device } = await putDevice(DEVICE_ID, body);

    expect(status).toBe(200);
    expect(device).toMatchObject({
      id: DEVICE_ID,
      platform: 'web',
      level: 'student',
      alertTime: '19:00',
      alertSiteIds: body.alertSiteIds,
    });
    expect(device.token).toBeUndefined();
    expect(typeof device.createdAt).toBe('string');
    expect(typeof device.updatedAt).toBe('string');
  });

  it('updates an existing device in place', async () => {
    await putDevice(DEVICE_ID, await validBody());
    const { status, body } = await putDevice(DEVICE_ID, {
      platform: 'web',
      token: '{"endpoint":"https://push.example/abc"}',
      level: 'pilot',
      alertTime: '20:00',
      alertSiteIds: [],
    });

    expect(status).toBe(200);
    expect(body).toMatchObject({ level: 'pilot', alertTime: '20:00', alertSiteIds: [] });
    expect(await db.getRepository(Device).count()).toBe(1);
  });

  it('keeps one device per push token so a phone is not alerted twice', async () => {
    const body = await validBody();
    await putDevice(DEVICE_ID, body);
    await putDevice(OTHER_DEVICE_ID, body);

    const devices = await db.getRepository(Device).find();
    expect(devices.map((d) => d.id)).toEqual([OTHER_DEVICE_ID]);
  });

  it.each([
    ['an unknown platform', { platform: 'blackberry' }],
    ['an unknown alert time', { alertTime: '07:00' }],
    ['an unknown level', { level: 'expert' }],
    ['an empty token', { token: '' }],
    ['a site id that is not a uuid', { alertSiteIds: ['sarangkot'] }],
  ])('rejects %s', async (_label, overrides) => {
    const { status } = await putDevice(DEVICE_ID, await validBody(overrides));
    expect(status).toBe(400);
  });

  it('rejects a device id that is not a uuid', async () => {
    const { status } = await putDevice('not-a-uuid', await validBody());
    expect(status).toBe(400);
  });

  it('deletes a device', async () => {
    await putDevice(DEVICE_ID, await validBody());
    const res = await app.inject({ method: 'DELETE', url: `/v1/devices/${DEVICE_ID}` });

    expect(res.statusCode).toBe(204);
    expect(await db.getRepository(Device).count()).toBe(0);
  });

  it('treats deleting an unknown device as done', async () => {
    const res = await app.inject({ method: 'DELETE', url: `/v1/devices/${DEVICE_ID}` });
    expect(res.statusCode).toBe(204);
  });
});
