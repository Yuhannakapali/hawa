import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadWithCache } from '../src/state/forecast-cache';

const NOW = new Date('2026-10-30T03:46:00Z');
const now = () => NOW;

describe('loadWithCache', () => {
  beforeEach(() => AsyncStorage.clear());

  it('returns fresh data and saves it when asked', async () => {
    const result = await loadWithCache('k', async () => ({ v: 1 }), {
      save: true,
      now,
    });

    expect(result).toEqual({ data: { v: 1 }, offlineSince: null });
    const failing = await loadWithCache('k', () => Promise.reject(new TypeError('offline')), {
      save: true,
      now,
    });
    expect(failing).toEqual({
      data: { v: 1 },
      offlineSince: NOW.toISOString(),
    });
  });

  it('does not save when not asked, so a failure is rethrown', async () => {
    await loadWithCache('k', async () => ({ v: 1 }), { save: false, now });

    await expect(
      loadWithCache('k', () => Promise.reject(new TypeError('offline')), {
        save: false,
        now,
      }),
    ).rejects.toThrow('offline');
  });
});
