import { STORAGE_KEYS } from '../state/keys';
import { onChange, read } from '../state/storage';
import type { RatesState, Settings } from '../lib/types';
import { setHostTheme } from './host';
import { syncPageConvert } from './pageConvert';
import { syncSelection } from './selection';

let settings: Settings | null = null;
let rates: RatesState | null = null;

function sync(): void {
  if (!settings) return;
  setHostTheme(settings.theme);
  syncSelection({
    enabled: settings.selectionConvert,
    primary: settings.primary,
    rates,
  });
  syncPageConvert({
    enabled: settings.pageConvert,
    target: settings.pageConvertTarget ?? settings.primary,
    rates: rates?.rates ?? null,
  });
}

async function boot(): Promise<void> {
  const [loadedSettings, loadedRates] = await Promise.all([
    read(STORAGE_KEYS.settings),
    read(STORAGE_KEYS.rates),
  ]);
  settings = loadedSettings ?? null;
  rates = loadedRates ?? null;

  sync();

  onChange(STORAGE_KEYS.settings, (value) => {
    settings = value ?? null;
    sync();
  });
  onChange(STORAGE_KEYS.rates, (value) => {
    rates = value ?? null;
    sync();
  });
}

void boot();
