import type { Pair, PrevDayState, RatesState, Settings, StatusState, UiState } from '../lib/types';
import { STORAGE_KEYS } from './keys';

/** Value type stored under each key. */
export type StorageShape = {
  [STORAGE_KEYS.settings]: Settings;
  [STORAGE_KEYS.pairs]: Pair[];
  [STORAGE_KEYS.ui]: UiState;
  [STORAGE_KEYS.rates]: RatesState;
  [STORAGE_KEYS.prevDay]: PrevDayState;
  [STORAGE_KEYS.status]: StatusState;
  [STORAGE_KEYS.lastSeenVersion]: string;
};

export async function read<K extends keyof StorageShape>(
  key: K,
): Promise<StorageShape[K] | undefined> {
  const raw = await chrome.storage.local.get(key);
  return raw[key] as StorageShape[K] | undefined;
}

export async function write<K extends keyof StorageShape>(
  key: K,
  value: StorageShape[K],
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

/** Call `fn` whenever `key` changes in local storage (from any extension context). */
export function onChange<K extends keyof StorageShape>(
  key: K,
  fn: (value: StorageShape[K] | undefined) => void,
): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && key in changes) fn(changes[key].newValue as StorageShape[K]);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
