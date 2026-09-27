import { currencyForLocale } from '../lib/currencies';
import { ECalcSide, EChangeFormat, ESection } from '../lib/enums';
import type { Pair, Settings, UiState } from '../lib/types';

export function defaultSettings(locale: string): Settings {
  return {
    primary: currencyForLocale(locale),
    theme: null,
    intervalMin: 1,
    changeFormat: EChangeFormat.Percent,
    selectionConvert: true,
    pageConvert: false,
    pageConvertTarget: null,
  };
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
      [ESection.Bookmarked]: false,
      [ESection.Tracking]: false,
      [ESection.Suggested]: false,
    },
  };
}
