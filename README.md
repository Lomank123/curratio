# Curratio

A Manifest V3 Chrome extension for currency rates: track and bookmark pairs, convert amounts,
and convert prices on any web page into your primary currency.

## Develop

```bash
npm install
npm run build   # outputs dist/
npm run dev     # HMR dev build
npm run check   # svelte-check / TypeScript
```

Load `dist/` via `chrome://extensions` → Developer mode → Load unpacked.
Full guide and manual test checklist: [docs/RUNNING.md](docs/RUNNING.md).

## How it works

- The background service worker refreshes rates every 1–3 minutes (`chrome.alarms`) and caches
  them in `chrome.storage.local`. The popup and content script only read from storage.
- Live rates: Coinbase public exchange-rates endpoint, with fawazahmed0/currency-api as fallback.
  The daily-change pill compares against the previous day's fawazahmed0 snapshot.
  All source URLs live in `src/config/sources.ts`.
- The content script detects prices (`$123`, `123 €`, `USD 100`, …) for the selection card and
  the optional whole-page conversion.

Design spec: `docs/superpowers/specs/2026-09-27-fx-rates-extension-design.md`.
