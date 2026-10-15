# million. billion. trillion.

An installable mobile idle game built with HTML, TypeScript, CSS, and original Paint-style PNG sprites. A dark, torchlit gate connects eight small worlds. The interface has no tutorial screens or walkthroughs.

## Development

Node.js 22.18+ or 24+.

```sh
npm ci
npm run dev
```

```sh
npm test              # progression, upgrades, save migration, offline production
npm run build         # type checking, production bundle, offline service worker
npm run preview       # serve the production app
npm run test:browser  # desktop/mobile gameplay, navigation, save recovery, offline relaunch
```

Browser tests use system Chromium when available. Otherwise, run `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to a Chromium executable. The browser test runner builds and starts its own production server.

## Files

- `src/main.ts`: application navigation, activities, settings, and UI feedback.
- `src/game.ts`: progression, purchases, save migration, and discoveries.
- `src/art.ts`: sprite presentation and environmental artwork.
- `src/style.css`: app layout, world scenery, and sprite animations.
- `public/sprites/`: original raster artwork, including three-frame flame animations.
- `scripts/draw_sprites.py`: reproducible sprite sources; run with Python 3, no packages needed.
- `vite.config.ts`: production asset caching and service-worker generation.

Existing `mbt-save-v1` saves migrate in place. Progress remains local to the browser; export/import is available in Settings. Assets and fonts are bundled locally. The production app works offline after its first completed load; processes and offline caches are independent of gameplay saves.

The GitHub Pages workflow tests, builds, and deploys `dist/`. Configure Pages to use GitHub Actions. Relative asset URLs, manifest scope, and service-worker registration support the repository's Pages subdirectory.
