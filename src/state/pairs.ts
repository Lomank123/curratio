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

/** Toggle the bookmark; an untracked pair is added as bookmarked. */
export function toggleStar(pairs: Pair[], base: string, quote: string): Pair[] {
  if (!findPair(pairs, base, quote)) return addPair(pairs, base, quote, true);
  return pairs.map((p) =>
    p.base === base && p.quote === quote ? { ...p, starred: !p.starred } : p,
  );
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
