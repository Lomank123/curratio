import type { Pair } from '../lib/types';

export const SUGGESTED_BASES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD'];
const SUGGESTED_LIMIT = 4;

export function findPair(pairs: Pair[], base: string, quote: string): Pair | undefined {
  return pairs.find((p) => p.base === base && p.quote === quote);
}

export function addPair(pairs: Pair[], base: string, quote: string, starred: boolean): Pair[] {
  if (base === quote || findPair(pairs, base, quote)) return pairs;
  return [...pairs, { base, quote, starred }];
}

export function removePair(pairs: Pair[], base: string, quote: string): Pair[] {
  return pairs.filter((p) => !(p.base === base && p.quote === quote));
}

/** Toggle Featured; a newly featured pair goes to the end of the Featured list. */
export function toggleStar(pairs: Pair[], base: string, quote: string): Pair[] {
  const pair = findPair(pairs, base, quote);
  if (!pair) return addPair(pairs, base, quote, true);
  if (pair.starred) {
    return pairs.map((p) => (p === pair ? { ...p, starred: false } : p));
  }
  return [...removePair(pairs, base, quote), { ...pair, starred: true }];
}

/**
 * Move the featured pair `dragged` to just before (or after) the featured pair `target`.
 * Featured order is the order of starred pairs in the array.
 */
export function moveFeatured(pairs: Pair[], dragged: Pair, target: Pair, after: boolean): Pair[] {
  const same = (a: Pair, b: Pair) => a.base === b.base && a.quote === b.quote;
  if (same(dragged, target)) return pairs;
  const moving = pairs.find((p) => same(p, dragged));
  if (!moving) return pairs;
  const rest = pairs.filter((p) => !same(p, dragged));
  const idx = rest.findIndex((p) => same(p, target));
  if (idx < 0) return pairs;
  rest.splice(after ? idx + 1 : idx, 0, moving);
  return rest;
}

/** Popular `X/primary` pairs not already tracked in either direction. */
export function suggestedPairs(primary: string, pairs: Pair[]): Pair[] {
  return SUGGESTED_BASES.filter(
    (code) =>
      code !== primary && !findPair(pairs, code, primary) && !findPair(pairs, primary, code),
  )
    .slice(0, SUGGESTED_LIMIT)
    .map((base) => ({ base, quote: primary, starred: false }));
}
