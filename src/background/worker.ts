import { EMessageType } from '../lib/enums';
import { defaultPairs, defaultSettings, defaultUi } from '../state/defaults';
import { STORAGE_KEYS } from '../state/keys';
import { onChange, read, write } from '../state/storage';
import { refresh } from './refresh';

const ALARM = 'curratio-refresh';

async function seedDefaults(): Promise<void> {
  let settings = await read(STORAGE_KEYS.settings);
  if (!settings) {
    settings = defaultSettings(navigator.language);
    await write(STORAGE_KEYS.settings, settings);
  }
  if (!(await read(STORAGE_KEYS.pairs))) {
    await write(STORAGE_KEYS.pairs, defaultPairs(settings.primary));
  }
  if (!(await read(STORAGE_KEYS.ui))) {
    await write(STORAGE_KEYS.ui, defaultUi(settings.primary));
  }
}

async function ensureAlarm(): Promise<void> {
  const settings = await read(STORAGE_KEYS.settings);
  const periodInMinutes = settings?.intervalMin ?? 1;
  const existing = await chrome.alarms.get(ALARM);
  if (existing?.periodInMinutes === periodInMinutes) return;
  await chrome.alarms.create(ALARM, { periodInMinutes });
}

async function boot(): Promise<void> {
  await seedDefaults();
  await ensureAlarm();
  await refresh();
}

chrome.runtime.onInstalled.addListener(() => void boot());
chrome.runtime.onStartup.addListener(() => void boot());

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) void refresh();
});

onChange(STORAGE_KEYS.settings, () => void ensureAlarm());

chrome.runtime.onMessage.addListener((msg: { type?: EMessageType }, _sender, sendResponse) => {
  if (msg?.type !== EMessageType.Refresh) return false;
  refresh().then(sendResponse);
  return true; // async response
});
