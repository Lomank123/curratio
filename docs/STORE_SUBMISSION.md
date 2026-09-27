# Chrome Web Store submission notes

This is the copy-paste source for the Developer Dashboard tabs. Keep it in sync with the manifest
(`manifest.config.ts`).

## Title and summary (from the manifest)

The store takes these from the uploaded package, so they can't be edited in the dashboard.
Change them in `manifest.config.ts`.

| Field   | Manifest key  | Value                                                                                                                             | Limit     |
| ------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Title   | `name`        | Curratio – Currency Converter & Live Exchange Rates                                                                               | 51 / 75   |
| Summary | `description` | Live exchange rates for 160+ currencies, a two-way converter, and instant conversion of prices you select or see on any web page. | 129 / 132 |

`short_name` is `Curratio`, which Chrome uses where space is tight.

## Description (Store listing → Description)

```
Curratio is a small, fast currency companion for your browser: live exchange rates, a two-way
converter, and prices on any website converted into your own currency — instantly.

It's free and open source. No ads, no accounts, no tracking, no analytics. Your data never
leaves your device.


WHAT IT DOES

• Live exchange rates — 160+ world currencies, refreshed in the background every 30 seconds,
  1, 5 or 15 minutes, or hourly. You can also turn refreshing off and update by hand.
• Converter — type into either side, swap with one click, and copy the result.
• Featured pairs — star the pairs you care about to pin them on top, and drag to reorder them.
• Daily change — see how much each pair moved since yesterday, as a percentage or as the
  actual value.
• Suggested pairs — popular pairs for your primary currency, one click to start tracking.
• Currency search — find any currency by code, name, or symbol.

ON ANY WEB PAGE

• Select a price — highlight "$19.99", "1.234,56 €", "12,50 zł" or "USD 100" and a small card
  shows the amount in your primary currency.
• Convert whole pages (optional) — turn it on and every foreign price on the page is shown in
  your currency, or in any other currency you pick. Hover a converted price to see the
  original. Turn it off and the original prices come back.

Curratio understands currency symbols and codes before or after the amount, European and US
number formats, and ambiguous symbols like $, ¥ and kr based on the site you're on.

Light and dark themes included.


PRIVACY

Everything Curratio stores — your pairs, settings and the latest rates — stays in your browser.
Price detection happens locally on the page. Nothing you browse, select or read is ever
collected or sent anywhere. The only network requests are downloads of public exchange-rate
tables.


SOURCE CODE & FEEDBACK

Curratio is open source: https://github.com/Lomank123/curratio
Bug reports and ideas are welcome on GitHub.
```

## Category and language

Category: **Tools** (Productivity). Alternative: **Shopping**. Language: English (United States).

## Single purpose

> Curratio shows live currency exchange rates and converts amounts between currencies, both in
> its popup converter and for prices displayed on the web pages the user visits.

## Permission justifications

### `storage`

Saves the user's settings, tracked and featured currency pairs, converter state, and the most
recently downloaded exchange rates locally with `chrome.storage.local`, so the popup opens
instantly and works offline with the last known rates. Nothing is transmitted.

### `alarms`

Schedules the background refresh of exchange rates at the interval the user chooses (30 s to
1 h, or off). This keeps rates current for the popup and for price conversion on web pages, even
while the popup is closed.

### Host permissions: `api.coinbase.com`, `cdn.jsdelivr.net`, `currency-api.pages.dev`, `*.currency-api.pages.dev`

The background worker downloads public exchange-rate tables (JSON) from these hosts.

- Coinbase is the live source.
- fawazahmed0/currency-api, served by jsDelivr and mirrored on Cloudflare Pages, is the fallback
  and the previous-day reference for the daily change.

The requests carry no user data. No other hosts are contacted.

### Content script on all sites (`<all_urls>`)

The extension's core feature is converting prices on the pages the user visits, and those can be
on any website. The content script:

- reads the user's text selection (up to 64 characters) to detect a price and show a small
  conversion card, and
- only when the user turns on "Convert all prices on pages", replaces detected prices on screen
  with converted amounts.

All processing is local. Page content, selections and URLs are never stored or transmitted. The
script makes no network requests; it only reads rates the extension has already stored.
Restricting it to specific sites would break the feature, because users expect it to work
wherever prices appear.

### Remote code

Select **"No, I am not using remote code."**

All logic ships inside the package. The extension downloads only exchange-rate data (JSON). It
never downloads or evaluates scripts, and it uses no `eval` or remote imports.

## Data use disclosures

Leave every data-type box **unchecked**. Curratio collects none of these types. Selected text
and page text are read only in the browser to find prices; they are never stored or transmitted,
so they aren't "collected".

Certify:

- Does **not** sell or transfer user data to third parties.
- Does **not** use or transfer user data for purposes unrelated to the single purpose.
- Does **not** use or transfer user data to determine creditworthiness or for lending.

## Privacy policy URL

https://github.com/Lomank123/curratio/blob/main/docs/PRIVACY.md

This only works once the repo is public and `docs/PRIVACY.md` is on `main`. The listing depends
on the link staying reachable, so don't move or rename the file.

## Store listing assets

These are uploaded to the dashboard only and aren't part of the extension package. See
`store-assets/README.md`.

| Asset                         | File                                       | Notes                          |
| ----------------------------- | ------------------------------------------ | ------------------------------ |
| Store icon (128×128)          | `public/icon-128.png`                      | Required                       |
| Screenshots (1280×800)        | `store-assets/screenshot-1-1280x800.png` … | Required (at least 1, up to 5) |
| Small promo tile (440×280)    | `store-assets/promo-440x280.jpg`           | Optional; RGB, no alpha        |
| Marquee promo tile (1400×560) | `store-assets/promo-marquee-1400x560.jpg`  | Optional; RGB, no alpha        |

## Additional fields (Store listing)

| Field        | Value                                        |
| ------------ | -------------------------------------------- |
| Homepage URL | https://github.com/Lomank123/curratio        |
| Support URL  | https://github.com/Lomank123/curratio/issues |

## Test instructions (Privacy → Test instructions)

```
No login or setup is needed. Rates load automatically a few seconds after install.

1. Open the popup: rates, the converter and featured pairs are shown.
2. On any page with a price (e.g. a shop listing "$19.99"), select the price: a small card shows
   it converted into the primary currency (set in ⋮ → Settings; default follows browser locale).
   Prices already in the primary currency show no card, by design.
3. In ⋮ → Settings, turn on "Convert all prices on pages", then open or reload a shop page:
   foreign prices are shown converted, hover shows the original. Turning it off restores them.
```

## Publisher settings (Settings page, not the item)

The contact email must be set **and verified** before any item can be published.

## This file is not uploaded

It's a copy-paste source only. Keep it current, so future updates (new permissions, new rate
hosts) don't require rewriting the justifications from scratch.
