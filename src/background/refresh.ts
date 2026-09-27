import { fetchDaily, fetchLatest, SourceError } from '../config/sources';
import { ERefreshError } from '../lib/enums';
import type { StatusState } from '../lib/types';
import { STORAGE_KEYS } from '../state/keys';
import { read, write } from '../state/storage';

const DAY_MS = 86_400_000;

function utcDate(offsetDays: number): string {
  return new Date(Date.now() - offsetDays * DAY_MS).toISOString().slice(0, 10);
}

/** Previous-day reference for the daily-change pill; fetched at most once per UTC day. */
async function refreshPrevDay(): Promise<void> {
  const wanted = utcDate(1);
  const current = await read(STORAGE_KEYS.prevDay);
  if (current?.date === wanted) return;
  for (const date of [wanted, utcDate(2)]) {
    try {
      const table = await fetchDaily(date);
      // Keyed by the wanted date so we don't refetch all day when only day-2 exists yet.
      await write(STORAGE_KEYS.prevDay, { date: wanted, rates: table.rates });
      return;
    } catch {
      // try the day before
    }
  }
  console.warn('[curratio] previous-day rates unavailable');
}

async function doRefresh(): Promise<StatusState> {
  const lastAttemptAt = Date.now();
  let status: StatusState;
  try {
    const table = await fetchLatest();
    await write(STORAGE_KEYS.rates, {
      rates: table.rates,
      fetchedAt: Date.now(),
      source: table.source,
    });
    status = { lastAttemptAt, error: null };
  } catch (e) {
    const error =
      e instanceof SourceError && e.badResponse ? ERefreshError.BadResponse : ERefreshError.Network;
    console.warn('[curratio] refresh failed', error, e);
    status = { lastAttemptAt, error };
  }
  await write(STORAGE_KEYS.status, status);
  await refreshPrevDay();
  return status;
}

let inFlight: Promise<StatusState> | null = null;

/** Single-flight refresh: concurrent callers share one request. */
export function refresh(): Promise<StatusState> {
  inFlight ??= doRefresh().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
