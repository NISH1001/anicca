# anicca — new tab (Firefox)

Replaces Firefox's new-tab page with [anicca](../), defaulting to the **stillness**
lens: the hours of stillness still ahead of you, streaming in real time as light
against the dark. Open a new tab, remember impermanence.

It reuses the web app's engine verbatim (`style.css`, `anicca.js`) — this folder
just adds the manifest, a new-tab wrapper, and an icon.

## Try it (temporary install)

1. Go to `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…**
3. Pick `extension/manifest.json`
4. Open a new tab. Firefox will ask to allow the new-tab override — accept.

Temporary add-ons last until you restart Firefox.

## Make it yours

Click **tune** (top-right) on the new tab and set your birth year, daily hours,
and horizon. The config persists in the extension's own storage. Switch lenses
at the bottom (`life · stillness · together`) or with keys `1 / 2 / 3`.

## Keeping it in sync with the web app

`style.css` and `anicca.js` here are copies of the repo root. After changing the
root engine, re-sync:

```sh
cp ../style.css ../anicca.js .
```

## Before submitting to addons.mozilla.org (AMO)

This first cut loads fonts from Google Fonts over the network (allowed in Firefox
extension pages, and fine for `about:debugging`). For a store release we should:

- **Bundle the fonts locally** (`Fraunces`, `IBM Plex Mono`) as `woff2` + a local
  `@font-face`, so the new tab is fully offline and self-contained, then drop the
  remote `style-src` / `font-src` entries from the manifest CSP.
- Add real raster icons (PNG 48/96/128) if the SVG icon is ever rejected.
- Package: zip the **contents** of this folder (manifest at the zip root).

## Notes

- Manifest V3, `chrome_url_overrides.newtab`. Min Firefox 115.
- Default lens is set via `window.ANICCA_DEFAULT_LENS = 'stillness'` in `newtab.html`;
  the engine reads it (falling back to `?lens=` param, then `anu`).
