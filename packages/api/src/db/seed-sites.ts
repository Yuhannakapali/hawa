import type { Site } from './entities.js';

export type SeedSite = Pick<
  Site,
  'name' | 'lat' | 'lon' | 'launchAltM' | 'landingAltM' | 'windSectors' | 'minLevel' | 'notes'
>;

// Example values from the MVP spec. Every site must be checked with local pilots before launch.
export const SEED_SITES: SeedSite[] = [
  {
    name: 'Sarangkot',
    lat: 28.244,
    lon: 83.949,
    launchAltM: 1590,
    landingAltM: 800,
    windSectors: [[135, 225]],
    minLevel: 'student',
    notes: 'Landing at Phewa Lake',
  },
];
