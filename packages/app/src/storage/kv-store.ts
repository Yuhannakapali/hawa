import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'hawa:';

export async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + key);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private browsing); the app keeps working in memory.
  }
}
