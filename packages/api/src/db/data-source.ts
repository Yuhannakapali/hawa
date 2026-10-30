import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ForecastHour, Site } from './entities.js';
import { Init1730000000000 } from './migrations/1730000000000-init.js';

export function createDataSource(databaseUrl: string): DataSource {
  return new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [Site, ForecastHour],
    migrations: [Init1730000000000],
    synchronize: false,
  });
}
