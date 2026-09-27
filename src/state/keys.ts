export const STORAGE_KEYS = {
  settings: 'curratio:settings',
  pairs: 'curratio:pairs',
  ui: 'curratio:ui',
  rates: 'curratio:rates',
  prevDay: 'curratio:prevDay',
  status: 'curratio:status',
  lastSeenVersion: 'curratio:lastSeenVersion',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
