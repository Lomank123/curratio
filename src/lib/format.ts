const EN = 'en-US';

/** Rate display from the design: ≥100 → 2 dp, ≥10 → 3 dp, else 4 dp; tiny rates keep 4 significant digits. */
export function formatRate(v: number | null): string {
  if (v === null) return '—';
  if (v < 0.01) return v.toLocaleString(EN, { maximumSignificantDigits: 4 });
  const d = v >= 100 ? 2 : v >= 10 ? 3 : 4;
  return v.toLocaleString(EN, { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Minor units of a currency (JPY → 0, USD → 2, KWD → 3). */
export function currencyDigits(code: string): number {
  try {
    return (
      new Intl.NumberFormat(EN, { style: 'currency', currency: code }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

/** Plain amount with the currency's minor units and thousands grouping, e.g. `1,234.50`. */
export function formatAmount(v: number, code: string): string {
  const d = currencyDigits(code);
  return v.toLocaleString(EN, { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Localised money, e.g. `452,10 zł`. */
export function formatMoney(v: number, code: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale || undefined, { style: 'currency', currency: code }).format(
      v,
    );
  } catch {
    return `${formatAmount(v, code)} ${code}`;
  }
}

/** Parse a typed amount: `1,234.5`, `12,5` (lone comma = decimal), `1 000`. */
export function parseTypedAmount(raw: string): number {
  let s = raw.replace(/[\s\u00A0\u202F']/g, '');
  const hasDot = s.includes('.');
  const commas = (s.match(/,/g) ?? []).length;
  if (!hasDot && commas === 1) s = s.replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function formatAge(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return '<1 min ago';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)} h ago`;
}
