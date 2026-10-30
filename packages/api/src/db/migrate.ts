import { loadConfig } from '../config.js';
import { createDataSource } from './data-source.js';

const db = createDataSource(loadConfig().databaseUrl);
await db.initialize();
const applied = await db.runMigrations({ transaction: 'each' });
console.log(
  `migrations applied: ${applied.length}`,
  applied.map((m) => m.name),
);
await db.destroy();
