import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

const icons = {
  16: 'icon-16.png',
  32: 'icon-32.png',
  48: 'icon-48.png',
  128: 'icon-128.png',
};

export default defineManifest({
  manifest_version: 3,
  // Store listing title (≤75 chars) and summary (≤132 chars) come from these two fields.
  name: 'Curratio – Currency Converter & Live Exchange Rates',
  short_name: 'Curratio',
  version: pkg.version,
  description:
    'Live exchange rates for 160+ currencies, a two-way converter, and instant conversion of prices you select or see on any web page.',
  icons,
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Curratio',
    default_icon: icons,
  },
  background: { service_worker: 'src/background/worker.ts', type: 'module' },
  permissions: ['storage', 'alarms'],
  host_permissions: [
    'https://api.coinbase.com/*',
    'https://cdn.jsdelivr.net/*',
    'https://currency-api.pages.dev/*',
    'https://*.currency-api.pages.dev/*',
  ],
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
      all_frames: false,
    },
  ],
});
