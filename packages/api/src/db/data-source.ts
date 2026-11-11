import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Device } from './entities/device.entity.js';
import { ForecastHour } from './entities/forecast-hour.entity.js';
import { Site } from './entities/site.entity.js';
import { WindTileFetch } from './entities/wind-tile-fetch.entity.js';
import { WindTileFrame } from './entities/wind-tile-frame.entity.js';
import { Init1730000000000 } from './migrations/1730000000000-init.js';
import { SiteRegion1730000000001 } from './migrations/1730000000001-site-region.js';
import { WindGrid1730000000002 } from './migrations/1730000000002-wind-grid.js';
import { Devices1730000000003 } from './migrations/1730000000003-devices.js';

export function createDataSource(databaseUrl: string): DataSource {
  return new DataSource({
    type: 'postgres',
    url: databaseUrl,
    entities: [Site, ForecastHour, WindTileFrame, WindTileFetch, Device],
    migrations: [
      Init1730000000000,
      SiteRegion1730000000001,
      WindGrid1730000000002,
      Devices1730000000003,
    ],
    synchronize: false,
  });
}
