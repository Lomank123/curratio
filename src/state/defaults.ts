import { currencyForLocale } from '../lib/currencies';
import { ECalcSide, EChangeFormat, ESection } from '../lib/enums';
import type { Pair, Settings, UiState } from '../lib/types';

export function defaultSettings(locale: string): Settings {
  return {
    primary: currencyForLocale(locale),
    theme: null,
    refreshSec: 60,
    showSuggested: true,
    changeFormat: EChangeFormat.Percent,
    selectionConvert: true,
    pageConvert: false,
    pageConvertTarget: null,
  };
}

/**
 * Stored settings merged over defaults: fields added later get their default and fields that no
 * longer exist are dropped.
 */
export function withDefaults(stored: Partial<Settings> | undefined, locale: string): Settings {
  const defaults = defaultSettings(locale);
  if (!stored) return defaults;
  const merged = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof Settings)[]) {
    if (key in stored) Object.assign(merged, { [key]: stored[key] });
  }
  return merged;
}

/** Default "other side" for a pair against the primary currency. */
export function counterpart(primary: string): string {
  return primary === 'USD' ? 'EUR' : 'USD';
}

export function defaultPairs(primary: string): Pair[] {
  if (primary === 'USD') {
    return [
      { base: 'EUR', quote: 'USD', starred: true },
      { base: 'GBP', quote: 'USD', starred: true },
    ];
  }
  if (primary === 'EUR') {
    return [
      { base: 'EUR', quote: 'USD', starred: true },
      { base: 'GBP', quote: 'EUR', starred: true },
    ];
  }
  return [
    { base: 'USD', quote: primary, starred: true },
    { base: 'EUR', quote: primary, starred: true },
  ];
}

export function defaultUi(primary: string): UiState {
  return {
    calcOpen: true,
    calc: { from: counterpart(primary), to: primary, amount: '100', side: ECalcSide.From },
    collapsed: {
      [ESection.Featured]: false,
      [ESection.Tracking]: false,
      [ESection.Suggested]: false,
    },
  };
}
