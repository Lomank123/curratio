# Publishing Curratio to the Chrome Web Store

## 0. Before you start

- Run the manual checklist in `docs/RUNNING.md` against a fresh build loaded unpacked from
  `dist/`.
- Search the Web Store for "Curratio" to make sure the name is free.
- Push the code to the **public** repo `github.com/Lomank123/curratio`. The About page links to
  it, and the privacy policy is served from it.

## 1. Privacy policy URL

https://github.com/Lomank123/curratio/blob/main/docs/PRIVACY.md

Open it in a private window to confirm it's publicly reachable. A dead privacy-policy link is
grounds for takedown, so keep the file at this path.

## 2. Build the package

```sh
npm run package:store
```

This builds `dist/` and writes `curratio-<version>.zip` at the repo root, with the version taken
from `package.json`. `manifest.json` must be at the zip root; the script checks this.
The first-level entries should be `manifest.json`, `icon-*.png`, `assets/`, `src/` and
`service-worker-loader.js`.

## 3. Upload

[Developer Dashboard](https://chrome.google.com/webstore/devconsole) → **Add new item** → upload
`curratio-<version>.zip`.

## 4. Fill the tabs

### Store listing

| Field                  | Value                                          |
| ---------------------- | ---------------------------------------------- |
| Description            | `docs/STORE_SUBMISSION.md` → Description       |
| Category               | Tools (Productivity)                           |
| Language               | English (United States)                        |
| Icon (128×128)         | `public/icon-128.png`                          |
| Screenshots (1280×800) | `store-assets/` (see its README)               |
| Homepage / Support URL | `docs/STORE_SUBMISSION.md` → Additional fields |

The title and summary come from the manifest. See `docs/STORE_SUBMISSION.md`.

### Privacy

| Field                     | Source                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Single purpose            | `docs/STORE_SUBMISSION.md` → Single purpose                                                                |
| Permission justifications | One per permission: `storage`, `alarms`, `scripting`, `activeTab`, host permissions, optional `<all_urls>` |
| Remote code               | "No, I am not using remote code"                                                                           |
| Data use disclosures      | Leave data types unchecked and certify all three statements                                                |
| Privacy policy URL        | The URL from step 1                                                                                        |

### Distribution

Free · Public (or Unlisted to test first) · all regions.

### Test instructions

Paste the block from `docs/STORE_SUBMISSION.md` → Test instructions.

## 5. Submit

Submit for review. All-sites access is optional and requested at runtime, which makes an
in-depth review less likely than install-time `<all_urls>` (but not guaranteed). Once approved,
you have **30 days** to publish before the submission reverts to a draft.

## Updating later

1. Bump `version` in `package.json`. The manifest reads it from there.
2. Add a `src/changelog.ts` entry for the new version.
3. Run `npm run package:store` and upload the new zip.

Listing text and images can be edited any time without a code review. The title and summary
can't, because they come from the manifest.
