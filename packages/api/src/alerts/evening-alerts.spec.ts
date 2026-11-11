import type { DevicePlatform } from '@hawa/contracts';
import type { DataSource } from 'typeorm';
import { Device } from '../db/entities/device.entity.js';
import type { Site } from '../db/entities/site.entity.js';
import type { PushMessage, PushResult, PushSender } from '../push/push-sender.js';
import { insertForecastHour, insertSite, TEST_MODEL } from '../testing/fixtures.js';
import { createTestDb } from '../testing/test-db.js';
import { sendEveningAlerts } from './evening-alerts.js';

// 19:05 Nepal time on 2026-11-08.
const NOW = new Date('2026-11-08T13:20:00Z');
const TOMORROW_HOURS_UTC = [9, 10, 11, 12, 13, 14, 15, 16].map(
  (localHour) => new Date(Date.parse('2026-11-09T00:00:00Z') + (localHour * 60 - 345) * 60_000),
);

interface Sent {
  platform: DevicePlatform;
  token: string;
  message: PushMessage;
}

class FakeSender implements PushSender {
  sent: Sent[] = [];
  results = new Map<string, PushResult | Error>();

  async send(platform: DevicePlatform, token: string, message: PushMessage): Promise<PushResult> {
    const result = this.results.get(token) ?? 'sent';
    if (result instanceof Error) {
      throw result;
    }
    this.sent.push({ platform, token, message });
    return result;
  }
}

describe('sendEveningAlerts', () => {
  let db: DataSource;
  let sender: FakeSender;
  let green: Site;
  let red: Site;

  beforeEach(async () => {
    db = await createTestDb();
    sender = new FakeSender();
    green = await insertSite(db, { name: 'Sarangkot' });
    red = await insertSite(db, { name: 'Bandipur' });
    for (const time of TOMORROW_HOURS_UTC) {
      await insertForecastHour(db, green.id, time);
      await insertForecastHour(db, red.id, time, { scoreStudent: 'red', scorePilot: 'red' });
    }
  });

  afterEach(async () => {
    await db.destroy();
  });

  async function addDevice(overrides: Partial<Device> = {}): Promise<Device> {
    return db.getRepository(Device).save({
      id: crypto.randomUUID(),
      platform: 'web',
      token: `token-${crypto.randomUUID()}`,
      level: 'student',
      alertTime: '19:00',
      alertSiteIds: [green.id],
      lastAlertDate: null,
      ...overrides,
    });
  }

  function run(now = NOW) {
    return sendEveningAlerts(db, sender, TEST_MODEL, now);
  }

  it('alerts a device whose favorite site is green tomorrow, naming the site', async () => {
    const device = await addDevice();

    const result = await run();

    expect(result.sent).toBe(1);
    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0]).toMatchObject({ platform: 'web', token: device.token });
    expect(sender.sent[0]!.message.body).toContain('Sarangkot');
    expect(sender.sent[0]!.message.url).toBe(`/app/sites/${green.id}`);
  });

  it('does not alert when no favorite is green tomorrow', async () => {
    await addDevice({ alertSiteIds: [red.id] });

    await run();

    expect(sender.sent).toHaveLength(0);
  });

  it('alerts at most once a day', async () => {
    await addDevice();

    await run();
    await run(new Date(NOW.getTime() + 15 * 60_000));

    expect(sender.sent).toHaveLength(1);
  });

  it('waits until the device alert time', async () => {
    await addDevice({ alertTime: '20:00' });

    await run();

    expect(sender.sent).toHaveLength(0);
  });

  it('skips an alert time that passed more than an hour ago', async () => {
    await addDevice({ alertTime: '18:00' });

    await run();

    expect(sender.sent).toHaveLength(0);
  });

  it('ignores devices with alerts turned off for every site', async () => {
    await addDevice({ alertSiteIds: [] });

    await run();

    expect(sender.sent).toHaveLength(0);
  });

  it('ignores sites that are no longer active', async () => {
    await db.getRepository('Site').update(green.id, { active: false });
    await addDevice();

    await run();

    expect(sender.sent).toHaveLength(0);
  });

  it('removes a device whose push subscription is gone', async () => {
    const device = await addDevice();
    sender.results.set(device.token, 'gone');

    const result = await run();

    expect(result.removed).toBe(1);
    expect(await db.getRepository(Device).count()).toBe(0);
  });

  it('keeps going and retries later when one send fails', async () => {
    const failing = await addDevice();
    await addDevice();
    sender.results.set(failing.token, new Error('network down'));

    const result = await run();

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    const stored = await db.getRepository(Device).findOneByOrFail({ id: failing.id });
    expect(stored.lastAlertDate).toBeNull();
  });
});
