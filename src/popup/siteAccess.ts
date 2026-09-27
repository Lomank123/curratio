import { writable } from 'svelte/store';
import { originPattern, readSiteGrants } from '../state/siteAccess';

export type SiteAccessState = {
  loaded: boolean;
  allSites: boolean;
  /** Individually allowed site origins, e.g. `https://example.com/*`. */
  origins: string[];
  /** Origin of the active tab, or undefined when it isn't an http(s) page. */
  currentOrigin?: string;
  currentGranted: boolean;
};

/** Website-access grants plus the active tab; follows grants and revocations live. */
export const siteAccess = writable<SiteAccessState>({
  loaded: false,
  allSites: false,
  origins: [],
  currentGranted: false,
});

async function refresh(): Promise<void> {
  const { allSites, origins } = await readSiteGrants();
  let currentOrigin: string | undefined;
  try {
    // activeTab exposes the tab URL while the popup is open.
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentOrigin = originPattern(tab?.url);
  } catch {
    // tab URL unavailable
  }
  const currentGranted = allSites || (!!currentOrigin && origins.includes(currentOrigin));
  siteAccess.set({ loaded: true, allSites, origins, currentOrigin, currentGranted });
}

chrome.permissions.onAdded.addListener(() => void refresh());
chrome.permissions.onRemoved.addListener(() => void refresh());
void refresh();
