# Running Curratio in the browser

## 1. Build

```bash
npm install      # first time only
npm run build    # produces dist/
```

`dist/` must contain `manifest.json`, `service-worker-loader.js` and `src/popup/…`. Chrome loads
`dist/`, not `src/`.

## 2. Load into Chrome

1. Go to `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick the `dist/` folder.
3. Pin Curratio from the puzzle-piece menu.

After rebuilding, click the reload icon on the Curratio card, then reload any open tabs so they
get the new content script.

## 3. Manual checklist

- Popup opens with two Featured pairs for your locale's currency and rates within a few seconds.
- Status button shows `<1 min ago`; clicking it spins the icon and shows `Updating…`.
- Converter: type in either field, swap, change currencies through the picker (search, ↑/↓,
  Enter), `+ track`, `Copy`.
- Star / ✕ on rows, collapse sections, `+` on a Suggested row.
- ⋮ menu → Settings, Changelog (dot disappears after opening), About, Light/Dark mode.
- Settings → change primary currency: Suggested section updates.
- Settings → refresh interval 30s … 1h and Off (Off: status only updates when clicking the timer).
- Drag Featured rows to reorder; the order survives reopening the popup.
- Settings → toggles for suggested pairs and "Show change as actual value".
- Select `$19.99` on amazon.com → a card shows the amount in your primary currency.
- Enable **Convert all prices on pages** → prices on amazon.com (split markup) and a `€` price on
  a `.de` shop are replaced; hover shows the original. Turn it off → originals come back.
- Pick a different **Convert to** currency → page prices switch without a reload.
- Offline (DevTools → Network → Offline on the service worker, then refresh): status shows
  `Offline · N min ago` and cached rates still work.

## Debugging

- Service worker logs: `chrome://extensions` → Curratio → **service worker** link. Search for
  `[curratio]`.
- Content script logs: the page's DevTools console, filter `[curratio]`.
