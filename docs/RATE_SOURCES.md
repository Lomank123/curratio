# Rate sources

All URLs and response parsers live in `src/config/sources.ts`. The rest of the extension only calls
`fetchLatest()` and `fetchDaily(date)`. To swap a provider, change the constants there and, if
the response shape differs, its parser.

Every table is normalised to **units of each currency per 1 USD** (`USD = 1`). It is filtered to
the codes in `src/lib/currencies.ts`, and non-finite or non-positive values are dropped. A table
with fewer than 10 usable rates is treated as a bad response. Each request times out after
`FETCH_TIMEOUT_MS` (10 s).

## Latest rates — `fetchLatest()`

The sources are tried in order, and the first success wins.

| #   | Source                                        | URL                                                                                    | Freshness                  |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------- |
| 1   | Coinbase                                      | `https://api.coinbase.com/v2/exchange-rates?currency=USD`                              | Live, about 60 s CDN cache |
| 2   | fawazahmed0/currency-api via jsDelivr         | `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json` | Daily                      |
| 3   | fawazahmed0/currency-api via Cloudflare Pages | `https://currency-api.pages.dev/v1/currencies/usd.json`                                | Daily                      |

Coinbase response (rates are strings):

```json
{ "data": { "currency": "USD", "rates": { "EUR": "0.877882", "PLN": "3.6754" } } }
```

fawazahmed0 response (lowercase keys, numeric values):

```json
{ "date": "2026-09-26", "usd": { "eur": 0.8779, "pln": 3.6754 } }
```

The popup's status tooltip reports `Offline` when every source fails. In that case the last
cached table keeps being used.

## Previous-day rates — `fetchDaily(date)`

These are used for the daily-change pill. The worker fetches them at most once per UTC day. It
asks for yesterday's date (UTC) and falls back to the day before if that snapshot isn't published
yet.

| #   | URL                                                                                          |
| --- | -------------------------------------------------------------------------------------------- |
| 1   | `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@{YYYY-MM-DD}/v1/currencies/usd.json` |
| 2   | `https://{YYYY-MM-DD}.currency-api.pages.dev/v1/currencies/usd.json`                         |

The response shape is the same as fawazahmed0's latest table.

## Refresh schedule

The background service worker refreshes with `chrome.alarms` on the user's interval: 30 s, 1 m,
5 m, 15 m, 1 h, or Off. With Off, rates only refresh when the user clicks the timer in the popup.
They are also fetched once on startup if nothing is cached yet.

## Terms and caveats

- **Coinbase:** `/v2/exchange-rates` is a public, keyless endpoint, but it isn't formally
  documented for third-party use. It has no published rate limit or SLA. If it changes or starts
  rejecting requests, the fawazahmed0 fallback keeps the extension working with daily rates.
- **fawazahmed0/currency-api:** free, no API key, no rate limits (per its README), with daily
  updates. The source is at https://github.com/fawazahmed0/exchange-api.
- The live value (Coinbase) and the daily-change reference (fawazahmed0) come from different
  providers. A pair can therefore show a small non-zero change on a flat day.

## Host permissions

The manifest's `host_permissions` must list every host above: `api.coinbase.com`,
`cdn.jsdelivr.net`, `currency-api.pages.dev` and `*.currency-api.pages.dev`. When you add or
replace a source, update the manifest, `docs/PRIVACY.md` and `docs/STORE_SUBMISSION.md` together.
