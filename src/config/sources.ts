/**
 * Every rate-source URL lives here. Swap a provider by changing these constants and, if its
 * response shape differs, its parser below. The rest of the extension only uses
 * `fetchLatest` / `fetchDaily`.
 */
import { isCurrency } from '../lib/currencies';
import { ERateSource } from '../lib/enums';
import type { UsdRates } from '../lib/types';

export const RATE_SOURCES = {
  /** Live, keyless, ~60 s CDN cache. Undocumented public endpoint. */
  coinbaseLatest: 'https://api.coinbase.com/v2/exchange-rates?currency=USD',
  /** fawazahmed0/currency-api — daily, keyless, no rate limits. Tried in order. */
  fawazLatest: [
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    'https://currency-api.pages.dev/v1/currencies/usd.json',
  ],
  fawazByDate: [
    (date: string) =>
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.json`,
    (date: string) => `https://${date}.currency-api.pages.dev/v1/currencies/usd.json`,
  ],
} as const;

export const FETCH_TIMEOUT_MS = 10_000;

export type UsdTable = { rates: UsdRates; source: ERateSource; date?: string };

export class SourceError extends Error {
  constructor(
    message: string,
    readonly badResponse: boolean,
  ) {
    super(message);
  }
}

async function getJson(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new SourceError(`HTTP ${res.status} from ${url}`, true);
    return await res.json();
  } catch (e) {
    if (e instanceof SourceError) throw e;
    throw new SourceError(`Network error for ${url}: ${String(e)}`, false);
  } finally {
    clearTimeout(timer);
  }
}

/** Keep supported codes with sane positive values; keys are upper-cased. */
function normalise(raw: Record<string, unknown>): UsdRates {
  const out: UsdRates = { USD: 1 };
  for (const [key, value] of Object.entries(raw)) {
    const code = key.toUpperCase();
    const n = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isCurrency(code) && Number.isFinite(n) && n > 0) out[code] = n;
  }
  return out;
}

function ensureUsable(rates: UsdRates, url: string): UsdRates {
  // A table with only USD means the response shape changed.
  if (Object.keys(rates).length < 10) throw new SourceError(`Too few rates from ${url}`, true);
  return rates;
}

async function fetchCoinbase(): Promise<UsdTable> {
  const url = RATE_SOURCES.coinbaseLatest;
  const body = (await getJson(url)) as { data?: { rates?: Record<string, unknown> } };
  const rates = ensureUsable(normalise(body.data?.rates ?? {}), url);
  return { rates, source: ERateSource.Coinbase };
}

async function fetchFawaz(url: string): Promise<UsdTable> {
  const body = (await getJson(url)) as { date?: string; usd?: Record<string, unknown> };
  const rates = ensureUsable(normalise(body.usd ?? {}), url);
  return { rates, source: ERateSource.Fawaz, date: body.date };
}

/** Try each loader in order; throw the last error if all fail. */
async function firstOk(loaders: (() => Promise<UsdTable>)[]): Promise<UsdTable> {
  let last: unknown;
  for (const load of loaders) {
    try {
      return await load();
    } catch (e) {
      last = e;
      console.warn('[curratio] rate source failed', e);
    }
  }
  throw last;
}

/** Latest rates: Coinbase (live), then fawaz mirrors (daily). */
export function fetchLatest(): Promise<UsdTable> {
  return firstOk([fetchCoinbase, ...RATE_SOURCES.fawazLatest.map((u) => () => fetchFawaz(u))]);
}

/** Daily snapshot for a `YYYY-MM-DD` date. */
export function fetchDaily(date: string): Promise<UsdTable> {
  return firstOk(RATE_SOURCES.fawazByDate.map((u) => () => fetchFawaz(u(date))));
}
