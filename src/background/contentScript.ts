import contentScriptFile from '../content/index.ts?script';
import { ALL_SITES, readSiteGrants } from '../state/siteAccess';

const SCRIPT_ID = 'curratio-content';

/** Match patterns the content script should run on, from the user's grants. */
async function grantedMatches(): Promise<string[]> {
  const { allSites, origins } = await readSiteGrants();
  return allSites ? [ALL_SITES] : origins;
}

/** Keep the content script registered on exactly the sites the user has allowed. */
export async function syncContentScript(): Promise<void> {
  const matches = await grantedMatches();
  const [registered] = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  if (matches.length === 0) {
    if (registered) await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
    return;
  }
  if (registered) {
    await chrome.scripting.updateContentScripts([{ id: SCRIPT_ID, matches }]);
    return;
  }
  await chrome.scripting.registerContentScripts([
    {
      id: SCRIPT_ID,
      js: [contentScriptFile],
      matches,
      runAt: 'document_idle',
      allFrames: false,
      persistAcrossSessions: true,
    },
  ]);
}

/** Inject into already-open tabs on newly allowed sites, so they work without a reload. */
export async function injectIntoOpenTabs(origins: string[]): Promise<void> {
  const url = origins.includes(ALL_SITES) ? ['http://*/*', 'https://*/*'] : origins;
  if (url.length === 0) return;
  const tabs = await chrome.tabs.query({ url });
  await Promise.all(
    tabs.map(
      (tab) =>
        tab.id === undefined
          ? undefined
          : chrome.scripting
              .executeScript({ target: { tabId: tab.id }, files: [contentScriptFile] })
              .catch(() => undefined), // e.g. Chrome Web Store pages can't be scripted
    ),
  );
}
