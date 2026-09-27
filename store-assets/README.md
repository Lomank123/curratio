# Store assets

Chrome Web Store listing artwork. **None of this ships in the extension.**

Don't put these in `public/`. Vite copies `public/` verbatim into `dist/`, which is the package
users download. Only the icons the manifest declares belong there.

| File                                                      | Used for                                                               |
| --------------------------------------------------------- | ---------------------------------------------------------------------- |
| `screenshot-1-1280x800.png` … `screenshot-5-1280x800.png` | Listing screenshots. Upload in numeric order; at least one is required |
| `promo-440x280.jpg`                                       | Small promo tile (optional; RGB, no alpha)                             |
| `promo-marquee-1400x560.jpg`                              | Marquee promo tile (optional; RGB, no alpha)                           |

The 128×128 store icon is uploaded from `public/icon-128.png`. The vector source is
`src/assets/icon.svg`; `npm run icons` renders the PNGs.

Capture screenshots from the real, loaded extension, not from a mock. Suggested set:

1. Popup with the converter and Featured pairs (dark theme).
2. Selection card over a price on a shop page.
3. A shop page with "Convert all prices on pages" on.
4. Currency picker with a search.
5. Settings (light theme).
