export enum ETheme {
  Dark = 'dark',
  Light = 'light',
}

export enum EChangeFormat {
  Percent = 'percent',
  /** Absolute change of the rate, e.g. `+0.0025`. */
  Value = 'value',
}

export enum ERateSource {
  Coinbase = 'coinbase',
  Fawaz = 'fawaz',
}

export enum ERefreshError {
  Network = 'network',
  BadResponse = 'bad-response',
}

export enum EMessageType {
  Refresh = 'refresh',
}

export enum EModal {
  Add = 'add',
  Settings = 'settings',
  About = 'about',
  Changelog = 'changelog',
}

export enum EPickerTarget {
  CalcFrom = 'calc-from',
  CalcTo = 'calc-to',
  AddFrom = 'add-from',
  AddTo = 'add-to',
  Primary = 'primary',
  PageTarget = 'page-target',
}

export enum ESection {
  Featured = 'featured',
  Tracking = 'tracking',
  Suggested = 'suggested',
}

export enum ECalcSide {
  From = 'from',
  To = 'to',
}
