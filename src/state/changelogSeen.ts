import { STORAGE_KEYS } from './keys';
import { read, write } from './storage';

export function currentVersion(): string {
  return chrome.runtime.getManifest().version;
}

export async function hasUnseenChangelog(): Promise<boolean> {
  return (await read(STORAGE_KEYS.lastSeenVersion)) !== currentVersion();
}

export async function markVersionSeen(): Promise<void> {
  await write(STORAGE_KEYS.lastSeenVersion, currentVersion());
}
