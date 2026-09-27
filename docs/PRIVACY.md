# Curratio — Privacy Policy

_Last updated: 27 September 2026_

## Summary

Curratio does not collect, transmit, sell, or share any user data. Everything the extension
stores stays on your own device. The only network requests it makes are to download public
exchange rates.

## What Curratio stores

Curratio saves the following using the browser's `chrome.storage.local` API, on your device only:

- Your settings: primary currency, refresh interval, theme, display options, and the web-page
  conversion options.
- The currency pairs you track and feature, and their order.
- The converter's last currencies and amount, and which list sections are collapsed.
- The most recently downloaded exchange rates, plus the previous day's rates used for the daily
  change.
- The last extension version whose changelog you opened.

None of this leaves your browser.

## Web pages you visit

Curratio installs with **no access** to the websites you visit. You choose where price conversion
works: on a single site (from the popup, while you're on that site) or on all websites (in
Settings). Before each request, Curratio explains what the access is for, and Chrome asks you to
confirm. Settings lists every site you've allowed, so you can remove any of them, or remove access
in Chrome's extension settings. Curratio never runs a script on sites you haven't allowed.

On the sites you allow, Curratio runs a script on the pages you open.

- **Selected prices:** when you select text, the script reads only the selected text (up to 64
  characters) to check whether it contains a price.
- **Convert all prices on pages** (off by default): when you turn this on, the script reads the
  page's visible text to find prices. It replaces them on screen with converted amounts and puts
  the originals back when you turn it off.

All of this happens locally, in your browser. Page content, selections, URLs and browsing history
are never stored, logged, or sent anywhere.

## Network requests

Curratio downloads exchange rates from these public services:

| Service                                     | Address                  | What is requested                                    |
| ------------------------------------------- | ------------------------ | ---------------------------------------------------- |
| Coinbase                                    | `api.coinbase.com`       | The current rate table for US dollars                |
| jsDelivr CDN (fawazahmed0/currency-api)     | `cdn.jsdelivr.net`       | Current and previous-day rate tables (backup source) |
| Cloudflare Pages (fawazahmed0/currency-api) | `currency-api.pages.dev` | The same tables, used if jsDelivr is unavailable     |

These requests contain no personal data, identifiers, or information about the pages you visit.
They are the same for every user. Like any web request, they reveal your IP address to the
service that answers them, which is handled under that service's own privacy policy.

## What Curratio does not do

- It does not collect personal or sensitive information.
- It does not track, record, or transmit your browsing activity or page content.
- It does not send any data to the developer or to any third party.
- It contains no analytics, telemetry, tracking, or advertising.
- It does not use accounts or cookies.
- It loads no remote code. It only downloads rate data (JSON), never scripts.

## Data retention and deletion

Your data stays on your device until you delete it. Removing the extension from Chrome deletes
everything it stored.

## Changes to this policy

Any changes to this policy will be published on this page with an updated date.

## Contact

For questions about this policy, contact: lomank200222@gmail.com
