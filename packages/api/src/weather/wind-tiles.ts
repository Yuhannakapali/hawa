import type { WindGridLayout } from '@hawa/contracts';
import type { GridPoint } from './wind-grid.js';

// The Himalaya region around Nepal; 72–100°E is exactly seven 4° tiles wide.
export const WIND_REGION = { latMin: 20, latMax: 36, lonMin: 72, lonMax: 100 };

const COARSE_STEP_DEG = 2;
const FINE_STEP_DEG = 0.5;
const FINE_TILE_SPAN_DEG = 4;
export const FINE_MIN_ZOOM = 6;
const MAX_FINE_TILES = 12;

export interface TileSpec extends WindGridLayout {
  key: string;
}

export interface Bbox {
  west: number;
  south: number;
  east: number;
  north: number;
}

const NEPAL_BBOX: Bbox = { west: 80, south: 26.3, east: 88.3, north: 30.5 };

function pointsAlong(spanDeg: number, stepDeg: number): number {
  return Math.round(spanDeg / stepDeg) + 1;
}

export function coarseTile(): TileSpec {
  return {
    key: 'coarse',
    latMin: WIND_REGION.latMin,
    lonMin: WIND_REGION.lonMin,
    step: COARSE_STEP_DEG,
    nLat: pointsAlong(WIND_REGION.latMax - WIND_REGION.latMin, COARSE_STEP_DEG),
    nLon: pointsAlong(WIND_REGION.lonMax - WIND_REGION.lonMin, COARSE_STEP_DEG),
  };
}

export function fineTile(latMin: number, lonMin: number): TileSpec {
  const points = pointsAlong(FINE_TILE_SPAN_DEG, FINE_STEP_DEG);
  return {
    key: `fine:${latMin}:${lonMin}`,
    latMin,
    lonMin,
    step: FINE_STEP_DEG,
    nLat: points,
    nLon: points,
  };
}

function clampToRegion(view: Bbox): Bbox | null {
  const clamped = {
    west: Math.max(view.west, WIND_REGION.lonMin),
    south: Math.max(view.south, WIND_REGION.latMin),
    east: Math.min(view.east, WIND_REGION.lonMax),
    north: Math.min(view.north, WIND_REGION.latMax),
  };
  if (clamped.west >= clamped.east || clamped.south >= clamped.north) {
    return null;
  }
  return clamped;
}

function tileOrigins(min: number, max: number, regionMin: number): number[] {
  const first = regionMin + Math.floor((min - regionMin) / FINE_TILE_SPAN_DEG) * FINE_TILE_SPAN_DEG;
  const origins: number[] = [];
  for (let origin = first; origin < max; origin += FINE_TILE_SPAN_DEG) {
    origins.push(origin);
  }
  return origins;
}

function fineTilesFor(view: Bbox): TileSpec[] {
  const lats = tileOrigins(view.south, view.north, WIND_REGION.latMin);
  const lons = tileOrigins(view.west, view.east, WIND_REGION.lonMin);
  return lats.flatMap((lat) => lons.map((lon) => fineTile(lat, lon)));
}

export function tilesForView(view: Bbox, zoom: number): TileSpec[] {
  const clamped = clampToRegion(view);
  if (clamped === null) {
    return [];
  }
  if (zoom < FINE_MIN_ZOOM) {
    return [coarseTile()];
  }
  const tiles = fineTilesFor(clamped);
  if (tiles.length > MAX_FINE_TILES) {
    return [coarseTile()];
  }
  return tiles;
}

export function tilePoints(tile: TileSpec): GridPoint[] {
  const points: GridPoint[] = [];
  for (let iLat = 0; iLat < tile.nLat; iLat++) {
    for (let iLon = 0; iLon < tile.nLon; iLon++) {
      points.push({ lat: tile.latMin + iLat * tile.step, lon: tile.lonMin + iLon * tile.step });
    }
  }
  return points;
}

export function mergeLayout(tiles: readonly TileSpec[]): WindGridLayout {
  const step = tiles[0]!.step;
  const latMin = Math.min(...tiles.map((t) => t.latMin));
  const lonMin = Math.min(...tiles.map((t) => t.lonMin));
  const latMax = Math.max(...tiles.map((t) => t.latMin + (t.nLat - 1) * t.step));
  const lonMax = Math.max(...tiles.map((t) => t.lonMin + (t.nLon - 1) * t.step));
  return {
    latMin,
    lonMin,
    step,
    nLat: pointsAlong(latMax - latMin, step),
    nLon: pointsAlong(lonMax - lonMin, step),
  };
}

export const PREFETCH_TILES: TileSpec[] = [coarseTile(), ...fineTilesFor(NEPAL_BBOX)];
