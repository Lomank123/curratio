import type {
  ECalcSide,
  EChangeFormat,
  ERateSource,
  ERefreshError,
  ESection,
  ETheme,
} from './enums';

/** Units of each currency per 1 USD (`USD = 1`). */
export type UsdRates = Record<string, number>;

export type Settings = {
  primary: string;
  /** null until the popup resolves `prefers-color-scheme` on first open. */
  theme: ETheme | null;
  intervalMin: RefreshInterval;
  changeFormat: EChangeFormat;
  selectionConvert: boolean;
  pageConvert: boolean;
  /** null = follow the primary currency. */
  pageConvertTarget: string | null;
};

export type RefreshInterval = 1 | 2 | 3;

export type Pair = { base: string; quote: string; starred: boolean };

export type UiState = {
  calcOpen: boolean;
  calc: { from: string; to: string; amount: string; side: ECalcSide };
  collapsed: Record<ESection, boolean>;
};

export type RatesState = { rates: UsdRates; fetchedAt: number; source: ERateSource };

export type PrevDayState = { date: string; rates: UsdRates };

export type StatusState = { lastAttemptAt: number; error: ERefreshError | null };
