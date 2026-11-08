import {
  coarseTile,
  fineTile,
  mergeLayout,
  PREFETCH_TILES,
  tilePoints,
  tilesForView,
  WIND_REGION,
} from './wind-tiles.js';

const NEPAL_VIEW = { west: 83, south: 27, east: 86, north: 29 };

describe('wind tiles', () => {
  it('covers the region with one coarse 2° tile', () => {
    expect(coarseTile()).toEqual({
      key: 'coarse',
      latMin: WIND_REGION.latMin,
      lonMin: WIND_REGION.lonMin,
      step: 2,
      nLat: 9,
      nLon: 15,
    });
  });

  it('makes 4° fine tiles at 0.5°', () => {
    expect(fineTile(28, 84)).toEqual({
      key: 'fine:28:84',
      latMin: 28,
      lonMin: 84,
      step: 0.5,
      nLat: 9,
      nLon: 9,
    });
  });

  it('lists tile points row by row from the south-west corner', () => {
    const points = tilePoints(fineTile(28, 84));
    expect(points).toHaveLength(81);
    expect(points[0]).toEqual({ lat: 28, lon: 84 });
    expect(points[1]).toEqual({ lat: 28, lon: 84.5 });
    expect(points[9]).toEqual({ lat: 28.5, lon: 84 });
  });

  describe('tilesForView', () => {
    it('uses the coarse tile when zoomed out', () => {
      expect(tilesForView(NEPAL_VIEW, 5).map((t) => t.key)).toEqual(['coarse']);
    });

    it('uses the fine tiles under the view when zoomed in', () => {
      expect(tilesForView(NEPAL_VIEW, 7).map((t) => t.key)).toEqual([
        'fine:24:80',
        'fine:24:84',
        'fine:28:80',
        'fine:28:84',
      ]);
    });

    it('clamps the view to the region', () => {
      const view = { west: 95, south: 34, east: 120, north: 50 };
      expect(tilesForView(view, 7).map((t) => t.key)).toEqual(['fine:32:92', 'fine:32:96']);
    });

    it('falls back to the coarse tile when too many fine tiles are in view', () => {
      const view = { west: 72, south: 20, east: 100, north: 36 };
      expect(tilesForView(view, 6).map((t) => t.key)).toEqual(['coarse']);
    });

    it('returns nothing for a view outside the region', () => {
      const view = { west: 0, south: 0, east: 10, north: 10 };
      expect(tilesForView(view, 7)).toEqual([]);
      expect(tilesForView(view, 3)).toEqual([]);
    });
  });

  it('merges neighbouring tiles into one layout', () => {
    expect(mergeLayout([fineTile(28, 80), fineTile(28, 84)])).toEqual({
      latMin: 28,
      lonMin: 80,
      step: 0.5,
      nLat: 9,
      nLon: 17,
    });
  });

  it('prefetches the coarse tile and the tiles over Nepal', () => {
    expect(PREFETCH_TILES.map((t) => t.key)).toEqual([
      'coarse',
      'fine:24:80',
      'fine:24:84',
      'fine:24:88',
      'fine:28:80',
      'fine:28:84',
      'fine:28:88',
    ]);
  });
});
