import { isDetectableIsoCode, SYMBOLS } from './symbols';

export type PriceHints = { tld: string; lang: string };

export type PriceMatch = {
  start: number;
  end: number;
  amount: number;
  currency: string;
  raw: string;
};

// Optional single separator between a marker and the amount: space, nbsp or narrow nbsp.
const SPACE = '[ \\u00A0\\u202F]?';
// Digits with `.`, `,`, `'`, space and nbsp separators, from the spec's amount grammar.
const AMOUNT = "\\d[\\d.,'\\u00A0\\u202F ]*\\d|\\d";
const ISO = '[A-Z]{3}';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Symbols are already sorted longest-first (see symbols.ts), so alternation naturally
// prefers e.g. `US$` over `$` when both could start at the same position.
const SYMBOL_ALT = SYMBOLS.map((s) => escapeRegExp(s.text)).join('|');

// Boundaries: a marker can't be glued to a word (`12 leisure` ≠ 12 lei) and an amount can't
// start or end inside another token (`SKU12 EUR`, `$1234abc`).
const NOT_AFTER_WORD = '(?<![\\p{L}])';
const NOT_BEFORE_WORD = '(?![\\p{L}])';
const AMOUNT_START = "(?<![\\p{L}\\d.,'])";
const AMOUNT_END = '(?![\\p{L}\\d])';

const SYMBOL_BEFORE_RE = new RegExp(
  `${NOT_AFTER_WORD}(${SYMBOL_ALT})${SPACE}(${AMOUNT})${AMOUNT_END}`,
  'gu',
);
const SYMBOL_AFTER_RE = new RegExp(
  `${AMOUNT_START}(${AMOUNT})${SPACE}(${SYMBOL_ALT})${NOT_BEFORE_WORD}`,
  'gu',
);
const CODE_BEFORE_RE = new RegExp(`\\b(${ISO})\\b${SPACE}(${AMOUNT})${AMOUNT_END}`, 'gu');
const CODE_AFTER_RE = new RegExp(`${AMOUNT_START}(${AMOUNT})${SPACE}\\b(${ISO})\\b`, 'gu');

/** Interpret the separator grammar from spec §8 and return the amount, or null if invalid. */
function parseAmountRaw(raw: string): number | null {
  // Space-like separators and `'` are always thousands separators.
  let s = raw.replace(/[ \u00A0\u202F']/g, '');
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) {
    const decimalChar = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
    const thousandChar = decimalChar === ',' ? '.' : ',';
    s = s.split(thousandChar).join('');
    if (decimalChar === ',') s = s.replace(',', '.');
  } else if (hasComma || hasDot) {
    const ch = hasComma ? ',' : '.';
    const parts = s.split(ch);
    const isThousands = parts.length - 1 > 1 || parts[parts.length - 1].length === 3;
    s = isThousands ? parts.join('') : parts.join('.');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function collectSymbolMatches(
  text: string,
  hints: PriceHints,
  re: RegExp,
  symbolFirst: boolean,
): PriceMatch[] {
  const out: PriceMatch[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const symbolText = symbolFirst ? m[1] : m[2];
    const amountText = symbolFirst ? m[2] : m[1];
    const entry = SYMBOLS.find((s) => s.text === symbolText);
    const currency = entry?.resolve(hints) ?? null;
    const amount = parseAmountRaw(amountText);
    if (currency && amount !== null) {
      out.push({ start: m.index, end: m.index + m[0].length, amount, currency, raw: m[0] });
    }
    if (re.lastIndex === m.index) re.lastIndex += 1;
  }
  return out;
}

function collectCodeMatches(text: string, re: RegExp, codeFirst: boolean): PriceMatch[] {
  const out: PriceMatch[] = [];
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const code = codeFirst ? m[1] : m[2];
    const amountText = codeFirst ? m[2] : m[1];
    const amount = parseAmountRaw(amountText);
    if (isDetectableIsoCode(code) && amount !== null) {
      out.push({ start: m.index, end: m.index + m[0].length, amount, currency: code, raw: m[0] });
    }
    if (re.lastIndex === m.index) re.lastIndex += 1;
  }
  return out;
}

/** Find every price in `text`, left to right, with no overlapping matches. Pure, no DOM. */
export function findPrices(text: string, hints: PriceHints): PriceMatch[] {
  const all = [
    ...collectSymbolMatches(text, hints, SYMBOL_BEFORE_RE, true),
    ...collectSymbolMatches(text, hints, SYMBOL_AFTER_RE, false),
    ...collectCodeMatches(text, CODE_BEFORE_RE, true),
    ...collectCodeMatches(text, CODE_AFTER_RE, false),
  ];
  all.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));

  const result: PriceMatch[] = [];
  let lastEnd = -1;
  for (const m of all) {
    if (m.start >= lastEnd) {
      result.push(m);
      lastEnd = m.end;
    }
  }
  return result;
}

/** Page hints for symbol resolution: TLD from the hostname, language from `<html lang>`. */
export function hintsFromPage(): PriceHints {
  const labels = location.hostname.split('.');
  const tld = labels[labels.length - 1] ?? '';
  const lang = (document.documentElement.lang || '').toLowerCase();
  return { tld, lang };
}
