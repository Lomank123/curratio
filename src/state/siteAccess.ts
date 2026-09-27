/** Website access for price conversion on pages: per site or all sites, granted on demand. */
export const ALL_SITES = '<all_urls>';

/** Origin pattern (`https://host/*`) for an http(s) URL, or undefined for other pages. */
export function originPattern(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined;
    return `${u.protocol}//${u.hostname}/*`;
  } catch {
    return undefined;
  }
}

/** `https://example.com/*` → `example.com`. */
export function hostOf(pattern: string): string {
  return pattern.replace(/^https?:\/\//, '').replace(/\/\*$/, '');
}

/** Rate-source hosts are required permissions, not website access; leave them out. */
function isRateHost(origin: string): boolean {
  return (chrome.runtime.getManifest().host_permissions ?? []).includes(origin);
}

export type SiteGrants = { allSites: boolean; origins: string[] };

/** What the user has granted: all sites, and/or individual site origins. */
export async function readSiteGrants(): Promise<SiteGrants> {
  const { origins = [] } = await chrome.permissions.getAll();
  return {
    allSites: origins.includes(ALL_SITES),
    origins: origins.filter((o) => o !== ALL_SITES && !isRateHost(o)),
  };
}

/** Must be called from a user gesture (a click in the popup). */
export function requestSiteAccess(pattern: string): Promise<boolean> {
  return chrome.permissions.request({ origins: [pattern] });
}

export function revokeSiteAccess(pattern: string): Promise<boolean> {
  return chrome.permissions.remove({ origins: [pattern] });
}
