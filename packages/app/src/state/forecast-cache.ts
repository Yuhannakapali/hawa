import { readJson, writeJson } from '../storage/kv-store';

const CACHE_PREFIX = 'cache:';

export interface Cached<T> {
  savedAt: string;
  data: T;
}

export interface Loaded<T> {
  data: T;
  offlineSince: string | null;
}

export async function loadWithCache<T>(
  key: string,
  load: () => Promise<T>,
  options: { save: boolean; now?: () => Date },
): Promise<Loaded<T>> {
  try {
    const data = await load();
    if (options.save) {
      const now = options.now ?? (() => new Date());
      await writeJson(CACHE_PREFIX + key, {
        savedAt: now().toISOString(),
        data,
      });
    }
    return { data, offlineSince: null };
  } catch (error) {
    const cached = await readJson<Cached<T>>(CACHE_PREFIX + key);
    if (cached === null) {
      throw error;
    }
    return { data: cached.data, offlineSince: cached.savedAt };
  }
}
