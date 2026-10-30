import { rateDirection, type DegreeRange } from '@hawa/scoring';

const POINTS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
];
const DEG_PER_POINT = 360 / POINTS.length;

export function cardinal(dirDeg: number): string {
  return POINTS[Math.round(dirDeg / DEG_PER_POINT) % POINTS.length]!;
}

export function isInSectors(dirDeg: number, sectors: readonly DegreeRange[]): boolean {
  return rateDirection(dirDeg, sectors, 0) === 'green';
}

export function sectorLabel(sectors: readonly DegreeRange[]): string {
  return sectors.map(([from, to]) => `${from}°–${to}°`).join(', ');
}

const CENTER = 100;

function point(angleDeg: number, r: number): string {
  const rad = (angleDeg * Math.PI) / 180;
  return `${(CENTER + r * Math.sin(rad)).toFixed(1)} ${(CENTER - r * Math.cos(rad)).toFixed(1)}`;
}

export function sectorPath([from, to]: DegreeRange, r: number): string {
  const span = (((to - from) % 360) + 360) % 360;
  let largeArc = 0;
  if (span > 180) {
    largeArc = 1;
  }
  return `M${CENTER} ${CENTER} L${point(from, r)} A${r} ${r} 0 ${largeArc} 1 ${point(to, r)} Z`;
}
