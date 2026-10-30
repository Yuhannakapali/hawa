import type { DataSource } from 'typeorm';
import { createDataSource } from '../db/data-source.js';

const TEST_DATABASE_URL = process.env['TEST_DATABASE_URL'] ?? 'postgres://localhost/hawa_test';

export async function createTestDb(): Promise<DataSource> {
  const dataSource = createDataSource(TEST_DATABASE_URL);
  await dataSource.initialize();
  await dataSource.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await dataSource.runMigrations();
  return dataSource;
}
