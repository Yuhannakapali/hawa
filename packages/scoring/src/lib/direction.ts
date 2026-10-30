import type { DegreeRange, Rating } from './types.js';

const FULL_CIRCLE_DEG = 360;

function normalize(deg: number): number {
  return ((deg % FULL_CIRCLE_DEG) + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
}

function clockwiseDistance(from: number, to: number): number {
  return normalize(to - from);
}

function degreesOutsideSector(dirDeg: number, [from, to]: DegreeRange): number {
  const width = clockwiseDistance(from, to);
  const intoSector = clockwiseDistance(from, dirDeg);
  if (intoSector <= width) {
    return 0;
  }
  const pastEnd = intoSector - width;
  const beforeStart = FULL_CIRCLE_DEG - intoSector;
  return Math.min(pastEnd, beforeStart);
}

export function rateDirection(
  dirDeg: number,
  sectors: readonly DegreeRange[],
  yellowMarginDeg: number,
): Rating {
  const closest = Math.min(...sectors.map((s) => degreesOutsideSector(dirDeg, s)));
  if (closest === 0) {
    return 'green';
  }
  if (closest <= yellowMarginDeg) {
    return 'yellow';
  }
  return 'red';
}
