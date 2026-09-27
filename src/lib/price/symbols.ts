import { isCurrency } from '../currencies';

/** Hints used to resolve ambiguous symbols (`$`, `¥`, `kr`) to a currency code. */
export type SymbolHints = { tld: string; lang: string };

export type SymbolEntry = { text: string; resolve: (hints: SymbolHints) => string | null };

/** `$` is resolved by the site's TLD; anything not listed here defaults to USD. */
const DOLLAR_TLD: Record<string, string> = {
  ca: 'CAD',
  au: 'AUD',
  nz: 'NZD',
  mx: 'MXN',
  sg: 'SGD',
  hk: 'HKD',
  ar: 'ARS',
  cl: 'CLP',
  co: 'COP',
};

/** `kr` only resolves for these TLDs; anything else is not a match at all. */
const KRONA_TLD: Record<string, string> = {
  se: 'SEK',
  no: 'NOK',
  dk: 'DKK',
  is: 'ISK',
};

/** Symbols whose currency never depends on hints. */
const UNAMBIGUOUS: Record<string, string> = {
  '€': 'EUR',
  '£': 'GBP',
  '₹': 'INR',
  '₩': 'KRW',
  '₪': 'ILS',
  '₺': 'TRY',
  '₴': 'UAH',
  '₽': 'RUB',
  '₫': 'VND',
  '₱': 'PHP',
  '₦': 'NGN',
  '฿': 'THB',
  zł: 'PLN',
  Kč: 'CZK',
  Ft: 'HUF',
  lei: 'RON',
  R$: 'BRL',
  US$: 'USD',
  C$: 'CAD',
  CA$: 'CAD',
  A$: 'AUD',
  AU$: 'AUD',
  NZ$: 'NZD',
  HK$: 'HKD',
  S$: 'SGD',
  MX$: 'MXN',
  CHF: 'CHF',
  'Fr.': 'CHF',
  '￥': 'CNY',
  元: 'CNY',
};

const AMBIGUOUS: SymbolEntry[] = [
  { text: '$', resolve: (h) => DOLLAR_TLD[h.tld] ?? 'USD' },
  { text: '¥', resolve: (h) => (h.tld === 'cn' || h.lang.startsWith('zh') ? 'CNY' : 'JPY') },
  { text: 'kr', resolve: (h) => KRONA_TLD[h.tld] ?? null },
];

/** All known currency-marker symbols, longest text first so the longest one wins. */
export const SYMBOLS: SymbolEntry[] = [
  ...Object.entries(UNAMBIGUOUS).map(([text, code]) => ({ text, resolve: () => code })),
  ...AMBIGUOUS,
].sort((a, b) => b.text.length - a.text.length);

/** ISO codes that are also common English words; excluded from bare-code detection. */
export const ISO_CODE_BLOCKLIST = new Set([
  'ALL',
  'CUP',
  'TOP',
  'MOP',
  'BOB',
  'PEN',
  'GEL',
  'MAD',
  'NAD',
  'SOS',
  'TRY',
]);

export function isDetectableIsoCode(code: string): boolean {
  return isCurrency(code) && !ISO_CODE_BLOCKLIST.has(code);
}
