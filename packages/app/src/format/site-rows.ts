import type { Rating, SiteSummary } from '@hawa/contracts';
import type { Favorites } from '../state/app-state';

const RANK: Record<Rating, number> = { green: 0, yellow: 1, red: 2 };
const UNKNOWN_RANK = 3;

export interface SiteRow {
  site: SiteSummary;
  favorite: boolean;
  available: boolean;
  today: Rating | null;
  tomorrow: Rating | null;
}

export interface SiteRows {
  favorites: SiteRow[];
  others: SiteRow[];
  flyableToday: number;
  total: number;
}

function rank(rating: Rating | null): number {
  if (rating === null) {
    return UNKNOWN_RANK;
  }
  return RANK[rating];
}

function toRow(site: SiteSummary, favorites: Favorites, offline: boolean): SiteRow {
  const favorite = favorites[site.id] !== undefined;
  const available = !offline || favorite;
  if (!available) {
    return { site, favorite, available, today: null, tomorrow: null };
  }
  return {
    site,
    favorite,
    available,
    today: site.today,
    tomorrow: site.tomorrow,
  };
}

export function buildSiteRows(
  sites: readonly SiteSummary[],
  favorites: Favorites,
  offline: boolean,
): SiteRows {
  const rows = sites.map((site) => toRow(site, favorites, offline));
  const others = rows.filter((row) => !row.favorite);
  if (!offline) {
    others.sort((a, b) => rank(a.today) - rank(b.today));
  }
  return {
    favorites: rows.filter((row) => row.favorite),
    others,
    flyableToday: sites.filter((site) => site.today === 'green').length,
    total: sites.length,
  };
}
