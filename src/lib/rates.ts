import { EChangeFormat } from './enums';
import type { UsdRates } from './types';

/** How many `quote` units one `base` buys, or null when either rate is unknown. */
export function crossRate(rates: UsdRates | undefined, base: string, quote: string): number | null {
  const b = rates?.[base];
  const q = rates?.[quote];
  if (!b || !q) return null;
  return q / b;
}

export function convert(
  rates: UsdRates | undefined,
  amount: number,
  from: string,
  to: string,
): number | null {
  const r = crossRate(rates, from, to);
  return r === null ? null : amount * r;
}

export type Change = { up: boolean; text: string };

const MINUS = '−';

/** Change of `now` against the previous-day reference, as `+0.21%` or `+12.3 pip`. */
export function dailyChange(
  now: number | null,
  prev: number | null,
  format: EChangeFormat,
): Change | null {
  if (now === null || prev === null) return null;
  const delta = now - prev;
  const up = delta >= 0;
  const sign = up ? '+' : MINUS;
  if (format === EChangeFormat.Pips) {
    const pip = now >= 10 ? 0.01 : 0.0001;
    return { up, text: `${sign}${Math.abs(delta / pip).toFixed(1)} pip` };
  }
  return { up, text: `${sign}${Math.abs((delta / prev) * 100).toFixed(2)}%` };
}
