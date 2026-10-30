import { loadConfig } from '../config.js';
import { createDataSource } from './data-source.js';
import { Site } from './entities.js';
import { SEED_SITES } from './seed-sites.js';

const db = createDataSource(loadConfig().databaseUrl);
await db.initialize();
await db.runMigrations();

const sites = db.getRepository(Site);
const before = await sites.count();
await sites.upsert(SEED_SITES, ['name']);
const after = await sites.find({ order: { name: 'ASC' } });

console.log(
  `sites before: ${before}, after: ${after.length} (expected ${SEED_SITES.length} or more)`,
);
console.table(
  after.map(({ name, lat, lon, launchAltM, active }) => ({ name, lat, lon, launchAltM, active })),
);

await db.destroy();
