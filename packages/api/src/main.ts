import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDataSource } from './db/data-source.js';
import { WindTileCache } from './forecast/wind-tile-cache.js';
import type { DevicePlatform } from '@hawa/contracts';
import { scheduleJobs } from './jobs/scheduler.js';
import { FcmChannel } from './push/fcm-channel.js';
import { createPushSender, type PushChannel } from './push/push-sender.js';
import { WebPushChannel } from './push/web-push-channel.js';
import { OpenMeteoSource, OpenMeteoWindGridSource } from './weather/open-meteo.js';

const config = loadConfig();
const db = createDataSource(config.databaseUrl);
await db.initialize();
await db.runMigrations();

const source = new OpenMeteoSource({ baseUrl: config.openMeteoUrl });
const WIND_TILE_TTL_MS = 3 * 60 * 60 * 1000;
const gridSource = new OpenMeteoWindGridSource({ baseUrl: config.openMeteoUrl });
const windTiles = new WindTileCache(db, gridSource, {
  ttlMs: WIND_TILE_TTL_MS,
  dailyCallBudget: config.windDailyCallBudget,
  now: () => new Date(),
  onError: (tileKey, error) => app.log.warn({ tileKey, err: error }, 'wind tile fetch failed'),
});
const pushChannels: Partial<Record<DevicePlatform, PushChannel>> = {};
if (config.webPush !== null) {
  pushChannels.web = new WebPushChannel(config.webPush);
}
if (config.firebaseServiceAccountFile !== null) {
  const fcm = new FcmChannel(config.firebaseServiceAccountFile);
  pushChannels.android = fcm;
  pushChannels.ios = fcm;
}
const pushSender = createPushSender(pushChannels);

const app = buildApp({
  db,
  model: source.model,
  logger: true,
  windTiles,
  webPushPublicKey: config.webPush?.publicKey ?? null,
});
app.log.info({ pushPlatforms: Object.keys(pushChannels) }, 'push channels configured');
const stopJobs = scheduleJobs(db, source, windTiles, pushSender, app.log);

async function shutdown() {
  stopJobs();
  await app.close();
  await db.destroy();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

await app.listen({ host: config.host, port: config.port });
