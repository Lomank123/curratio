import { get, writable, type Readable } from 'svelte/store';
import { ETheme } from '../lib/enums';
import type { Pair, PrevDayState, RatesState, Settings, StatusState, UiState } from '../lib/types';
import { defaultPairs, defaultSettings, defaultUi } from '../state/defaults';
import { STORAGE_KEYS } from '../state/keys';
import { onChange, read, write, type StorageShape } from '../state/storage';

export type Persisted<T> = Readable<T> & {
  set(value: T): void;
  update(fn: (value: T) => T): void;
};

/**
 * A store mirrored to chrome.storage.local. Our own writes echo back through onChanged;
 * those echoes are skipped so fast typing can't be overwritten by an older echo.
 */
function persisted<K extends keyof StorageShape>(
  key: K,
  initial: StorageShape[K],
): Persisted<StorageShape[K]> {
  const store = writable(initial);
  const pending: string[] = [];
  onChange(key, (value) => {
    if (value === undefined) return;
    const json = JSON.stringify(value);
    if (pending[0] === json) {
      pending.shift();
      return;
    }
    pending.length = 0;
    store.set(value);
  });
  const set = (value: StorageShape[K]) => {
    store.set(value);
    pending.push(JSON.stringify(value));
    void write(key, value);
  };
  return {
    subscribe: store.subscribe,
    set,
    update: (fn) => set(fn(get(store))),
  };
}

/** Read-only store fed by the background worker. */
function mirrored<K extends keyof StorageShape>(
  key: K,
  initial: StorageShape[K] | undefined,
): Readable<StorageShape[K] | undefined> {
  const store = writable<StorageShape[K] | undefined>(initial);
  onChange(key, (value) => store.set(value));
  return { subscribe: store.subscribe };
}

export type Stores = {
  settings: Persisted<Settings>;
  pairs: Persisted<Pair[]>;
  ui: Persisted<UiState>;
  rates: Readable<RatesState | undefined>;
  prevDay: Readable<PrevDayState | undefined>;
  status: Readable<StatusState | undefined>;
};

export let stores: Stores;

function systemTheme(): ETheme {
  return matchMedia('(prefers-color-scheme: light)').matches ? ETheme.Light : ETheme.Dark;
}

/** Load everything once before mounting, seeding defaults if the worker hasn't yet. */
export async function initStores(): Promise<Stores> {
  const [settings, pairs, ui, rates, prevDay, status] = await Promise.all([
    read(STORAGE_KEYS.settings),
    read(STORAGE_KEYS.pairs),
    read(STORAGE_KEYS.ui),
    read(STORAGE_KEYS.rates),
    read(STORAGE_KEYS.prevDay),
    read(STORAGE_KEYS.status),
  ]);
  const s = settings ?? defaultSettings(navigator.language);
  stores = {
    settings: persisted(STORAGE_KEYS.settings, s),
    pairs: persisted(STORAGE_KEYS.pairs, pairs ?? defaultPairs(s.primary)),
    ui: persisted(STORAGE_KEYS.ui, ui ?? defaultUi(s.primary)),
    rates: mirrored(STORAGE_KEYS.rates, rates),
    prevDay: mirrored(STORAGE_KEYS.prevDay, prevDay),
    status: mirrored(STORAGE_KEYS.status, status),
  };
  if (!settings || s.theme === null) stores.settings.set({ ...s, theme: s.theme ?? systemTheme() });
  if (!pairs) stores.pairs.set(get(stores.pairs));
  if (!ui) stores.ui.set(get(stores.ui));
  return stores;
}
