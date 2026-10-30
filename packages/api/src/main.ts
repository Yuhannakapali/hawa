import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDataSource } from './db/data-source.js';
import { scheduleJobs } from './jobs/scheduler.js';
import { OpenMeteoSource } from './weather/open-meteo.js';

const config = loadConfig();
const db = createDataSource(config.databaseUrl);
await db.initialize();
await db.runMigrations();

const source = new OpenMeteoSource({ baseUrl: config.openMeteoUrl });
const app = buildApp({ db, model: source.model, logger: true });
const stopJobs = scheduleJobs(db, source, app.log);

async function shutdown() {
  stopJobs();
  await app.close();
  await db.destroy();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

await app.listen({ host: config.host, port: config.port });
