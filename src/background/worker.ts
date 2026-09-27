import { EMessageType } from '../lib/enums';
import { defaultPairs, defaultUi, withDefaults } from '../state/defaults';
import { STORAGE_KEYS } from '../state/keys';
import { onChange, read, write } from '../state/storage';
import { injectIntoOpenTabs, syncContentScript } from './contentScript';
import { refresh } from './refresh';

const ALARM = 'curratio-refresh';

async function seedDefaults(): Promise<void> {
  const stored = await read(STORAGE_KEYS.settings);
  const settings = withDefaults(stored, navigator.language);
  if (JSON.stringify(stored) !== JSON.stringify(settings)) {
    await write(STORAGE_KEYS.settings, settings);
  }
  if (!(await read(STORAGE_KEYS.pairs))) {
    await write(STORAGE_KEYS.pairs, defaultPairs(settings.primary));
  }
  if (!(await read(STORAGE_KEYS.ui))) {
    await write(STORAGE_KEYS.ui, defaultUi(settings.primary));
  }
}

/** Background refresh on `refreshSec`; 0 means manual refresh only, so no alarm. */
async function ensureAlarm(): Promise<void> {
  const settings = await read(STORAGE_KEYS.settings);
  const refreshSec = settings?.refreshSec ?? 60;
  const existing = await chrome.alarms.get(ALARM);
  if (refreshSec === 0) {
    if (existing) await chrome.alarms.clear(ALARM);
    return;
  }
  const periodInMinutes = refreshSec / 60;
  if (existing?.periodInMinutes === periodInMinutes) return;
  await chrome.alarms.create(ALARM, { periodInMinutes });
}

async function boot(): Promise<void> {
  await seedDefaults();
  await ensureAlarm();
  await syncContentScript();
  const settings = await read(STORAGE_KEYS.settings);
  // With refresh off, only fetch when there is nothing cached yet.
  if (settings?.refreshSec || !(await read(STORAGE_KEYS.rates))) await refresh();
}

chrome.runtime.onInstalled.addListener(() => void boot());
chrome.runtime.onStartup.addListener(() => void boot());

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) void refresh();
});

onChange(STORAGE_KEYS.settings, () => void ensureAlarm());

chrome.permissions.onAdded.addListener(({ origins = [] }) => {
  void syncContentScript().then(() => injectIntoOpenTabs(origins));
});
chrome.permissions.onRemoved.addListener(() => void syncContentScript());

chrome.runtime.onMessage.addListener((msg: { type?: EMessageType }, _sender, sendResponse) => {
  if (msg?.type !== EMessageType.Refresh) return false;
  refresh().then(sendResponse);
  return true; // async response
});
