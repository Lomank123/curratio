# Curratio — Chrome extension (v1) design

Date: 2026-09-27 · Repo: `~/Workspace/curratio` · Status: draft for review

## 1. Goal

A Manifest V3 Chrome extension that tracks currency pairs, converts amounts, and converts
prices found on web pages into the user's primary currency.

**UI/UX source of truth:** `design/FX Rates Chrome Extension/FX Rates Popup v2.dc.html`
(tokens, layout, copy, spacing, component states). **Engineering reference:**
`~/Workspace/head-modifier` (stack, folder layout, ⋮ menu, changelog "seen" logic, theme via
`data-theme`, tokens.css pattern, arrow-key navigation action).

### In scope (v1)

1. Track pairs; bookmark (★) pairs so they're pinned in a "Bookmarked" section.
2. Two-way conversion calculator (from the design).
3. Primary currency setting + "Suggested" pairs section built from it.
4. Selection converter: selecting text on a page that contains a price in a non-primary
   currency shows a small floating card with the amount in the primary currency.
5. Page converter setting: rewrites every non-target price on the page into a target currency
   (default = primary; a selector lets the user choose another currency).
6. Background refresh every 1, 2 or 3 minutes (user choice).
7. Currency picker modal with search.
8. ~160 active ISO 4217 fiat currencies.
9. App icon from the design ("1d · Refresh dollar").
10. ⋮ menu: Settings, Changelog, About, and a Light/Dark mode toggle.

### Out of scope (v1)

- Historical charts, the chart modal, open/low/high. Clicking a pair loads it into the
  converter instead (see §6.4).
- Crypto currencies and metals.
- Per-site enable/disable, keyboard-shortcut panel, undo/redo, store listing assets, i18n of
  the UI itself.
- Prices inside iframes (top frame only), inside `<input>`/`<textarea>`, or in images.

## 2. Stack & project layout

Same as head-modifier: **Svelte 4 + TypeScript + Vite 5 + `@crxjs/vite-plugin`**, `svelte-check`.
Added for this repo: Prettier (+ `prettier-plugin-svelte`) and ESLint (flat config,
`typescript-eslint`, `eslint-plugin-svelte`), because the user's rules require running both.

```
manifest.config.ts            MV3 manifest (defineManifest)
vite.config.ts  svelte.config.js  tsconfig.json  package.json
eslint.config.js  .prettierrc
public/icon-{16,32,48,128}.png
scripts/render-icons.mjs      one-off: src/assets/icon.svg → public/*.png (dev dep: sharp)
src/
  assets/icon.svg             the design's icon, verbatim
  config/sources.ts           ALL rate-source URLs + adapters (see §4)
  lib/
    enums.ts                  ETheme, EChangeFormat, ERateSource, ERefreshError, EMessageType, EModal, EPickerTarget, ESection
    currencies.ts             static currency table + region→currency map
    rates.ts                  cross rate, daily change, pip math (pure)
    format.ts                 rate/amount/age formatting (pure)
    price/symbols.ts          symbol → currency table, TLD/lang hints
    price/parse.ts            findPrices(text, hints) (pure)
  state/
    keys.ts                   storage key constants
    defaults.ts               default settings / first-run pairs
    storage.ts                typed get/set/subscribe over chrome.storage.local
    pairs.ts                  pure ops: add, remove, toggleStar, suggested(...)
    changelogSeen.ts          copy of head-modifier's
  background/
    worker.ts                 onInstalled/onStartup/alarms/messages
    refresh.ts                fetch latest (+fallbacks), fetch previous-day, write storage
  content/
    index.ts                  boot: read settings/rates, wire features, react to storage changes
    host.ts                   single Shadow-DOM host element for our UI
    selection.ts              selection card
    pageConvert.ts            whole-page conversion + MutationObserver + revert
    content.css               card styles (imported ?inline into the shadow root)
    page.css                  tiny stylesheet for converted spans (injected once into <head>)
  popup/
    index.html  main.ts  App.svelte
    styles/tokens.css         design tokens (dark + light), shared with content via ?inline
    actions/arrowNav.ts       list keyboard nav (adapted from head-modifier)
    components/
      TopBar.svelte  MoreMenu.svelte  Converter.svelte
      PairList.svelte  PairSection.svelte  PairRow.svelte
      Modal.svelte  CurrencyPicker.svelte  AddPairModal.svelte
      SettingsPanel.svelte  AboutPanel.svelte  ChangelogPanel.svelte
      Toggle.svelte  Segmented.svelte
  changelog.ts
docs/RUNNING.md               how to build & load unpacked (mirrors head-modifier's)
```

Styling rules (user's global rules): all styles in `.css` files or `<style>` blocks; no inline
styles; every color/spacing/radius/font comes from tokens in `tokens.css`; flexbox by default.
Status/error codes are TS enums; enum → user-facing text goes through `Record` maps.

## 3. Manifest

- `name`: "Curratio" · `version`: `1.0.0` · `description`: "Live exchange rates, a converter,
  and instant price conversion on any page. Free, local, no tracking."
- `action.default_popup`: `src/popup/index.html`; icons 16/32/48/128.
- `background.service_worker`: `src/background/worker.ts` (`type: module`).
- `permissions`: `storage`, `alarms`.
- `host_permissions`: `https://api.coinbase.com/*`, `https://cdn.jsdelivr.net/*`,
  `https://*.currency-api.pages.dev/*`, `https://currency-api.pages.dev/*`.
- `content_scripts`: `matches: ["<all_urls>"]`, `js: ["src/content/index.ts"]`,
  `run_at: "document_idle"`, `all_frames: false`.

`<all_urls>` is required for features 4 and 5. It triggers the Web Store "read and change all
your data on websites" warning; accepted for v1.

## 4. Rate sources

All in `src/config/sources.ts`. Everything else talks to the adapter interface only, so a source
is swapped by editing this one file.

```ts
export const RATE_SOURCES = {
  coinbaseLatest: 'https://api.coinbase.com/v2/exchange-rates?currency=USD',
  fawazLatest: [
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
    'https://currency-api.pages.dev/v1/currencies/usd.json',
  ],
  fawazByDate: [
    (date: string) => `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.json`,
    (date: string) => `https://${date}.currency-api.pages.dev/v1/currencies/usd.json`,
  ],
} as const;
export const FETCH_TIMEOUT_MS = 10_000;

export type UsdTable = { rates: Record<string, number>; source: ERateSource; date?: string };
export async function fetchLatest(): Promise<UsdTable>;          // Coinbase → fawaz jsDelivr → fawaz pages.dev
export async function fetchDaily(date: string): Promise<UsdTable>; // fawaz jsDelivr → pages.dev
```

- **Live (every 1–3 min):** Coinbase public endpoint. Keyless, ~60 s CDN cache, so rates really
  move intraday. Response: `{ data: { currency: 'USD', rates: { EUR: '0.877882', … } } }`
  (strings → `parseFloat`). The endpoint is undocumented, so a failure falls back to fawaz latest,
  which updates daily.
- **fawazahmed0/currency-api:** `{ date: 'YYYY-MM-DD', usd: { eur: 0.87, … } }` with lowercase
  keys (uppercased on read). Keyless, "no rate limits", with jsDelivr and Cloudflare Pages mirrors.
  The dated pages.dev host format (`{date}.currency-api.pages.dev`) is taken from the project
  README. **Verify it during implementation**; if it's wrong, drop that fallback.
- **Normalisation:** every table is stored as "units of X per 1 USD" (`USD = 1`), filtered to the
  codes in `currencies.ts`. Non-finite or ≤ 0 values are dropped.
- Each attempt uses its own `AbortController` timeout (`FETCH_TIMEOUT_MS`). An adapter throws
  only when every URL in its chain fails.

### Daily change (replaces the design's "24h change")

There is no history in v1, so change is measured **against the previous UTC day's fawaz
snapshot**: `prevDay = fetchDaily(todayUtc − 1 day)`, retrying `−2 days` if that returns 404.
It's fetched at most once per UTC day and stored as `curratio:prevDay`. Section hint text: **"Daily
change"**. If `prevDay` is missing, the change pill shows `—`.

> Known limitation: the live value (Coinbase) and the reference (fawaz close) come from different
> providers, so a pair can show a small non-zero change even on a flat day.

## 5. Data model (`chrome.storage.local`)

| Key | Type | Written by |
|---|---|---|
| `curratio:settings` | `Settings` | popup |
| `curratio:pairs` | `Pair[]` | popup (seeded by worker on install) |
| `curratio:ui` | `UiState` | popup |
| `curratio:rates` | `{ rates: Record<string, number>; fetchedAt: number; source: ERateSource }` | worker |
| `curratio:prevDay` | `{ date: string; rates: Record<string, number> }` | worker |
| `curratio:status` | `{ lastAttemptAt: number; error: ERefreshError \| null }` | worker |
| `curratio:lastSeenVersion` | `string` | popup (changelog) |

```ts
type Settings = {
  primary: string;               // ISO code
  theme: ETheme | null;          // null until the popup resolves prefers-color-scheme on first open
  intervalMin: 1 | 2 | 3;
  changeFormat: EChangeFormat;   // 'percent' | 'pips'
  selectionConvert: boolean;     // default true
  pageConvert: boolean;          // default false
  pageConvertTarget: string | null; // null = follow primary
};
type Pair = { base: string; quote: string; starred: boolean };
type UiState = {
  calcOpen: boolean;
  calc: { from: string; to: string; amount: string; side: 'from' | 'to' };
  collapsed: Record<ESection, boolean>; // bookmarked | tracking | suggested
};
```

A pair is identified by `base+quote`, and `A/B` and `B/A` are separate pairs. Cross rate:
`rate(b, q) = rates[q] / rates[b]`.

**First run** (`runtime.onInstalled`, reason `install`):
- `primary` is taken from `navigator.language`'s region, mapped through `REGION_CURRENCY` in
  `currencies.ts` (e.g. `pl-PL → PLN`, `en-GB → GBP`, `de-DE → EUR`), falling back to `USD`.
- `theme` starts as `null`. The popup sets it from `prefers-color-scheme` on its first open,
  because the service worker has no `matchMedia`.
- Seeded pairs, all bookmarked: `USD/P` and `EUR/P`. If P is USD: `EUR/USD` and `GBP/USD`. If P
  is EUR: `EUR/USD` and `GBP/EUR`.
- `intervalMin = 1`, `changeFormat = percent`, `calc = { from: P≠USD ? 'USD' : 'EUR', to: P, amount: '100', side: 'from' }`.

## 6. Background worker

- On `onInstalled` and `onStartup`: seed defaults if missing, `ensureAlarm()`, then `refresh()`.
- `ensureAlarm()`: `chrome.alarms.create('curratio-refresh', { periodInMinutes: settings.intervalMin })`.
  It's recreated whenever `curratio:settings.intervalMin` changes (`storage.onChanged`).
- `alarms.onAlarm('curratio-refresh')` → `refresh()`.
- `runtime.onMessage({ type: EMessageType.Refresh })` → `refresh()`, then reply with the new
  `curratio:status`. The popup sends this from the refresh button, and on open when
  `now − fetchedAt > intervalMin`.
- `refresh()`:
  - Uses a single-flight guard, so concurrent calls share one promise.
  - Calls `fetchLatest()` → writes `curratio:rates`, and `curratio:status` with `error: null`.
  - On failure: keeps the old `curratio:rates` and writes `curratio:status.error = ERefreshError.Network`
    (or `.BadResponse`).
  - Then, if `curratio:prevDay.date` isn't yesterday (UTC), calls `fetchDaily` and writes
    `curratio:prevDay`. Failure here is silent: change just shows `—`.

## 7. Popup (380 px wide, per design)

Tokens: the design's `THEMES.dark` / `THEMES.light` values go verbatim into `tokens.css` under
`:root[data-theme='dark'], :host([data-theme='dark'])` (and likewise for light), plus radius,
spacing, font and control-height tokens. `App.svelte` sets `data-theme` on `<html>`, as in
head-modifier.

### 7.1 Top bar
The layout matches the design: brand (16 px icon + "Curratio"), spacer, refresh/status button,
calculator toggle, add-pair button, divider, ⋮ button.
- Status text: `Updating…` while a refresh is in flight. Otherwise the age of `fetchedAt`:
  `<1 min ago` / `N min ago` / `N h ago`, ticking every 15 s while the popup is open. When
  `curratio:status.error` is set, it shows `Offline · <age>` and the tooltip explains the error through
  an `ERefreshError → message` map. The icon spins 360° on each click, as in the design.
- Calculator button toggles `ui.calcOpen`.

### 7.2 ⋮ menu (`MoreMenu.svelte`)
Items: **Settings**, **Changelog** (with an accent dot while `lastSeenVersion ≠ manifest
version`), **About**, divider, **Light mode / Dark mode** (theme toggle). Styling and behaviour
follow the design's menu: close on outside click, on Esc, or after an action.

### 7.3 Converter
Same as the design:
- Two rows (currency button + right-aligned 20 px input). The swap button is centred on the
  divider.
- A footer line `1 USD = 3.6754 PLN`, with `+ track` (shown only if the pair isn't tracked) and
  `Copy` / `Copied`.
- Typing in either field makes it the source (`side`). The other field is computed with the
  currency's minor units from `Intl.NumberFormat(…, { style: 'currency', currency }).resolvedOptions().maximumFractionDigits`.
- Input accepts digits plus `.`/`,`, and `,` is read as a decimal separator when it's the only
  separator. Focus selects all.
- State is persisted in `curratio:ui.calc`, with writes debounced by 300 ms.

### 7.4 Pair list (max-height 300 px, scrolls)
There are three collapsible sections, and their collapsed state persists:
1. **Bookmarked (n)**. Hint: "Daily change". Empty text: "Star a pair to pin it here."
2. **Tracking (n)**. Empty text: "No other pairs tracked."
3. **Suggested (n)**. Built from `SUGGESTED_BASES = ['USD','EUR','GBP','CHF','JPY','CNY','CAD','AUD']`:
   - Skip the primary itself and any currency where `X/P` or `P/X` is already tracked.
   - Take the first 4 and show each as `X/P`.
   - Hide the section when it's empty.

Rows follow the design: star, `BASE/QUOTE`, rate, change pill (66 px, up/down colours),
✕ "Stop tracking". Suggested rows replace star/✕ with a single `+` button titled "Track". It
adds the pair to Tracking, unstarred.
- **Row click** puts the pair into the converter (`from=base, to=quote`) and opens the converter
  if it's collapsed. This replaces the chart for v1.
- The rate uses the design's `fmt`: ≥ 100 → 2 dp, ≥ 10 → 3 dp, otherwise 4 dp. Below 0.01 it uses
  4 significant digits.
- Change is `(now − prev) / prev`:
  - `percent` mode: `+0.21%` / `−0.21%` (a true minus sign).
  - `pips` mode: one pip is 0.01 if the rate is ≥ 10, else 0.0001, shown as `+12.3 pip`.
- If a rate is missing, the row shows `—` and a neutral pill.
- A `+ track pair` button below the list opens the Add modal.

### 7.5 Modals (`Modal.svelte`)
A shared overlay and panel (350 px, as in the design). Esc closes the top-most layer
(picker → modal → menu).
- **Track a pair:**
  - Base/Quote buttons open the picker. Swap and preview work as in the design, e.g.
    `1 USD = 3.6754 PLN` plus the change.
  - Checkbox "Add to bookmarks". The CTA reads `Add pair`; it reads `Already tracked` and is
    disabled when the pair exists, and it's disabled when base = quote.
  - Defaults: `base = P≠USD ? 'USD' : 'EUR'`, `quote = P`.
- **Currency picker:**
  - The title depends on the target (`Convert from` / `Convert to` / `Base currency` /
    `Quote currency` / `Primary currency` / `Convert page prices to`).
  - The search input is autofocused and matches code, name, or symbol (case-insensitive).
  - With no query, the primary and tracked codes come first, then the rest alphabetically.
  - ↑/↓ moves the highlight, Enter picks the highlighted item (the first by default), and the
    selected item shows a ✓ and is scrolled into view.
  - Only codes present in `curratio:rates` are listed; before the first fetch, all table codes are
    listed.
  - Empty state: `No currencies match "q".`
- **Settings:**
  - **Primary currency**: a row button showing `PLN · Polish Złoty` that opens the picker.
  - **Refresh rates every**: a segmented `1m | 2m | 3m` control. Note: "Rates update in the
    background, even when the popup is closed."
  - **Display**: "Show daily change in pips" toggle; "Dark mode" toggle.
  - **On web pages**:
    - "Convert selected prices" toggle.
    - "Convert all prices on pages" toggle.
    - When the page toggle is on, a "Convert to" row shows `Primary (PLN)` or the chosen code and
      opens the picker. The picker has a "Use primary" item at the top, which sets the target to
      `null`.
  - **About**: the design's two cards, Curratio vX.Y.Z → About and What's new → Changelog.
- **About:**
  - Laid out as in the design: back arrow, 48 px icon, name, version pill, blurb.
  - Creator (lomank.com) and Source code (https://github.com/Lomank123/curratio) links. The version comes from
    `chrome.runtime.getManifest()`.
- **Changelog:**
  - Laid out as in the design, with the latest entry highlighted.
  - Opening it calls `markVersionSeen()`. head-modifier's auto "What's new" on update is **not**
    copied; the menu dot is enough.

### 7.6 Empty and error states
- With no `curratio:rates` at all (first run offline), the converter inputs are disabled and the list
  shows a dashed box: "Couldn't load rates." with a `Retry` button that sends `Refresh`.
- With stale rates and an error, everything still works from the cache, and the status shows
  `Offline`.

## 8. Price detection (`src/lib/price/*`, pure)

```ts
type PriceHints = { tld: string; lang: string };   // from location.hostname / <html lang>
type PriceMatch = { start: number; end: number; amount: number; currency: string; raw: string };
export function findPrices(text: string, hints: PriceHints): PriceMatch[];
```

**Currency markers:** the marker can go before or after the amount, with an optional (nb)space.
- **ISO codes:** uppercase three-letter codes from the currency table, with a word boundary
  (`USD 100`, `100 EUR`). Lowercase codes are ignored.
- **Unambiguous symbols:**

  | Symbols | Currency |
  |---|---|
  | `€` | EUR |
  | `£` | GBP |
  | `₹` | INR |
  | `₩` | KRW |
  | `₪` | ILS |
  | `₺` | TRY |
  | `₴` | UAH |
  | `₽` | RUB |
  | `₫` | VND |
  | `₱` | PHP |
  | `₦` | NGN |
  | `฿` | THB |
  | `zł` | PLN |
  | `Kč` | CZK |
  | `Ft` | HUF |
  | `lei` | RON |
  | `R$` | BRL |
  | `US$` | USD |
  | `C$`, `CA$` | CAD |
  | `A$`, `AU$` | AUD |
  | `NZ$` | NZD |
  | `HK$` | HKD |
  | `S$` | SGD |
  | `MX$` | MXN |
  | `CHF`, `Fr.` | CHF |
  | `￥`, `元` | CNY |

- **Ambiguous symbols are resolved from hints:**
  - **`$`:** decided by the site's TLD.

    | TLD | Currency |
    |---|---|
    | `.ca` | CAD |
    | `.au` | AUD |
    | `.nz` | NZD |
    | `.mx` | MXN |
    | `.sg` | SGD |
    | `.hk` | HKD |
    | `.ar` | ARS |
    | `.cl` | CLP |
    | `.co` | COP |
    | anything else | USD |

  - **`¥`:** CNY when the TLD is `.cn` or `lang` starts with `zh`; otherwise JPY.
  - **`kr`:** only resolved for the TLDs below. With any other TLD there's **no match**, because
    guessing would be wrong too often.

    | TLD | Currency |
    |---|---|
    | `.se` | SEK |
    | `.no` | NOK |
    | `.dk` | DKK |
    | `.is` | ISK |

**Amount grammar:** `\d[\d.,'    ]*\d|\d`, with the separators interpreted like this:
- Both `,` and `.` present: the one that appears **last** is the decimal separator, and the other
  is the thousands separator.
- Only one kind present:
  - It appears more than once → thousands.
  - It appears once and is followed by exactly 3 digits → thousands (`1,234` = 1234,
    `1.234` = 1234).
  - It appears once and is followed by 1–2 digits → decimal (`12,50` = 12.5).
- Spaces, nbsp, narrow nbsp and `'` are always thousands separators.
- A match only counts if the resulting amount is finite and > 0. Its `raw` is the exact
  substring, including the marker.

## 9. Content script

`index.ts` reads `curratio:settings`, `curratio:rates` and `curratio:prevDay`, then subscribes to
`storage.onChanged`. It makes no network calls and sends no messages. Features start and stop
live as settings change, with no page reload. The shared Shadow-DOM host (`host.ts`) is attached
to `document.documentElement` with `data-theme` from settings. Its styles are `tokens.css` +
`content.css` (both `?inline`), and it's excluded from page-convert scanning.

### 9.1 Selection card (`selection.ts`, when `selectionConvert` is on)
- **When it runs:** on `mouseup` and on `keyup` of Shift or arrow keys, debounced by 150 ms.
  - It reads `getSelection().toString().trim()` and skips selections longer than 64 characters.
  - It then runs `findPrices` and keeps matches whose currency ≠ primary, up to 3.
  - If none remain, it does nothing ("if not matched": a price already in the primary currency
    shows nothing).
- **Placement:** below the selection's bounding rect, 8 px gap. It flips above when there isn't
  room, and it's clamped to the viewport (`position: fixed`).
- **Content:**
  - One line per match: `123.00 USD ≈ 452.10 zł`, with the result in bold using
    `Intl.NumberFormat(navigator.language, { style: 'currency', currency: primary })`.
  - Subline: `1 USD = 3.6754 PLN · 2 min ago`.
  - A Copy button (copies the first result's number and code) and a ✕.
- **Dismissal:** mousedown outside the card, Esc, scroll, resize, or a new selection.
- It isn't shown while `curratio:rates` is missing.

### 9.2 Page conversion (`pageConvert.ts`, when `pageConvert` is on)
Target `T = pageConvertTarget ?? primary`.
- **Scan:** walks `document.body`, skipping `script`, `style`, `noscript`, `textarea`, `input`,
  `select`, `code`, `pre`, `[contenteditable]`, `svg`, our host, and anything already marked
  `data-curratio`. It runs in chunks of 500 nodes per `requestIdleCallback`, falling back to
  `setTimeout(0)`. The chunks are:
  1. **Split prices:** an inline element (no block-level descendants, ≤ 6 descendant elements,
     `textContent.trim().length ≤ 40`) whose whole trimmed `textContent` is exactly one price
     match. This covers markup like `<span>$</span><span>12</span><sup>99</sup>`. Only the
     outermost such element is converted. Its original child nodes go in a `WeakMap`, and its
     content is replaced by a single converted span.
  2. **Text nodes:** each match inside a text node is replaced by
     `<span data-curratio data-curratio-amount="123" data-curratio-currency="USD" title="Original: $123.00">452.10 zł</span>`.
     The surrounding text is preserved.
- Matches with `currency === T` are left untouched.
- **Output format:** `Intl.NumberFormat(document.documentElement.lang || navigator.language, { style: 'currency', currency: T })`.
- **`page.css`:** injected once as `<style id="curratio-page">`. It gives converted spans a
  dotted underline in `currentColor` so they read as converted; the rule is kept small and scoped
  to `[data-curratio]`.
- **Dynamic pages:** a `MutationObserver` (childList, subtree, characterData) queues the changed
  roots and rescans them after 300 ms. The observer is disconnected while we mutate, so our own
  changes don't retrigger it.
- **Rate update** (`curratio:rates` changes): every `[data-curratio]` span is recomputed from its
  data attributes.
- **Target change / feature off:** everything is reverted. Text spans are replaced with their
  original text, and split-price elements get their saved child nodes back. If the feature is
  still on, the page is rescanned.

## 10. Popup ↔ storage plumbing

`state/storage.ts` exposes a Svelte `writable` per key: it loads on popup open, writes on
`set`, and applies `storage.onChanged` from other contexts. Pure state transitions live in
`state/pairs.ts` (`addPair`, `removePair`, `toggleStar`, `suggestedPairs(primary, pairs)`), so
components stay thin, following head-modifier's `operations.ts` pattern.

## 11. Changelog content

```ts
export const CHANGELOG = [{ version: '1.0.0', items: [
  'Track currency pairs with daily change',
  'Bookmark pairs to pin them on top',
  'Built-in two-way converter with currency search',
  'Primary currency with suggested pairs',
  'Convert selected prices on any page',
  'Optionally convert all prices on a page',
  'Refresh every 1–3 minutes, dark and light themes',
]}];
```

## 12. Verification

Per the user's rules, only safe checks run by default:
- `svelte-check` (`npm run check`).
- `tsc --noEmit` via svelte-check.
- `eslint` and `prettier --check` on the changed files.

`vite build` (loading unpacked) is **not** run without an explicit go-ahead. Loading the
extension in Chrome and testing on real pages is a manual step for the user, described in
`docs/RUNNING.md` with a checklist:
- A selection card on an amazon.com price.
- A split price on amazon.com with page-convert on.
- A `€` price on a .de site.
- Theme toggle.
- The refresh counter.

## 13. Decisions from review

- Name: **Curratio** (the design says "FX Rates"; the name is replaced everywhere).
- The daily-change pill stays, using the §4 reference.
- No tests in v1.
- Source code link: https://github.com/Lomank123/curratio

## 14. Revision — review round 2 (supersedes earlier sections where they conflict)

- **Bookmarked → Featured.** `ESection.Featured`. Featured rows can be dragged to reorder (HTML5
  drag and drop). Order = order of starred pairs in `curratio:pairs`. A newly starred pair goes
  to the end of Featured. Copy: "Add to Featured" / "Remove from Featured".
- **Refresh options** are back to the design's set: `30s | 1m | 5m | 15m | 1h | Off`, stored as
  `settings.refreshSec` (`0 | 30 | 60 | 300 | 900 | 3600`), replacing `intervalMin`.
  - Off means no alarm. Rates update only from the top-bar timer, or once on startup if nothing
    is cached yet.
  - The popup's stale check on open is skipped when Off.
- **Pips replaced by actual value**: the "Show daily change as" segmented control (Percentage | Actual value) sets
  `settings.changeFormat` to `EChangeFormat.Value | Percent`. Value mode shows the raw rate delta
  with the rate's own decimals (`rateDecimals`), e.g. `+0.0025`.
- **`settings.showSuggested`** (default true) is a "Show suggested pairs" toggle under Display.
- **Stored settings are merged over defaults** (`withDefaults`), so added fields get defaults
  and removed ones are dropped.
- **Settings modal:**
  - The primary currency now has a hint: "Prices you select on web pages are converted into this
    currency, and suggested pairs are built around it."
  - The About section is removed. About and Changelog are only in the ⋮ menu.
- **About / Changelog:** no back button. Their titles show icons (`info` / `file`).
- **Track a pair:** no title icon.
- **Modal layout:** the header is fixed and only the body scrolls, with its own right gutter, so
  the scrollbar never covers content. The picker list scrolls inside that gutter.
- **Top bar:**
  - The calculator button no longer changes colour when active.
  - The brand icon is sized to the toolbar buttons (`--control`, 26 px).

## 15. Revision — on-demand website access (supersedes §3 and §9's static content script)

- **Manifest:** no `content_scripts`. `optional_host_permissions: ['<all_urls>']`, and
  `permissions` gains `scripting`.
- **Worker** (`src/background/contentScript.ts`, `syncContentScript()`):
  - While `<all_urls>` is granted, it registers `src/content/index.ts?script` (crxjs loader) with
    `chrome.scripting.registerContentScripts`, using id `curratio-content` and
    `persistAcrossSessions`. On grant, it also injects the script into already-open http(s) tabs.
  - When access is revoked, it unregisters the script.
  - It runs on install/startup and on `permissions.onAdded` / `onRemoved`.
- **Popup:**
  - `siteAccess` is a store that follows grants live.
  - The web-page toggles in Settings show `setting && siteAccess`.
  - Turning one on without access opens `SiteAccessConfirm`, an in-app explanation with Cancel /
    Continue. Continue saves the setting, then calls `chrome.permissions.request` inside the same
    click. If the user declines, the setting is reverted. The setting is saved before the prompt
    in case the popup closes while Chrome's prompt is showing.
  - When access is granted, Settings shows "Website access allowed · Revoke".

## 16. Revision — per-site access (supersedes §15's all-sites-only flow)

- **Manifest:** `permissions` also includes `activeTab`, so the popup can read the current tab's
  URL. `optional_host_permissions` stays `['<all_urls>']`, which lets any single origin
  (`https://host/*`) be requested.
- **`src/state/siteAccess.ts`:** `readSiteGrants()` returns `{ allSites, origins }`, excluding
  the required rate hosts. It also has `requestSiteAccess(pattern)` / `revokeSiteAccess(pattern)`.
- **Worker:**
  - The content script is registered with `matches = allSites ? ['<all_urls>'] : origins`. The
    list is updated on every grant or revoke, and the script is unregistered when it's empty.
  - `permissions.onAdded` injects the script into open tabs on the newly added origins.
- **Popup:**
  - `SiteAccessBar` appears under the converter when the current http(s) tab isn't allowed and
    either web feature is on. It reads "Convert prices on <host>? Allow" with a ✕. ✕ adds the
    origin to `ui.hiddenAccessOrigins`, so the bar stays hidden for that site.
  - Every grant goes through `SiteAccessConfirm` (site- or all-sites wording), then
    `chrome.permissions.request`.
- **Settings:**
  - The web feature toggles are plain settings again, no longer gated on access.
  - A new "Website access" section has:
    - an "Allow on all websites" toggle (grant goes through confirm; revoke is direct)
    - the list of allowed hosts, each with ✕
    - "+ Allow on <current host>"
    - a short note.
