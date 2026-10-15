# million. billion. trillion.

An installable mobile idle game built with HTML, TypeScript, CSS, original Paint-style sprites, and Pixelify Sans throughout. A dark, torchlit gate connects seven rainbow worlds and two prestige crystal worlds. The interface has no tutorial screens or walkthroughs.

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
- `src/rpg.ts`: saved RPG combat, regions, equipment, companions, quests, and automatic battles.
- `src/rpg-view.ts`: the yellow world's battles, inventory, map, and character views.
- `src/rpg.css`: illustrated RPG scenery and in-game panels.
- `src/prestige.css`: permanent upgrade tree, crystal caves, and prestige UI.
- `src/pixel.css`: pixel typography sizing, crystal badges, and illustrated scene props.
- `src/ui-art.css`: sprite icons, hand-drawn frame borders, and settings toggles.
- `src/art.ts`: sprite presentation and environmental artwork.
- `src/style.css`: app layout, world scenery, and sprite animations.
- `public/sprites/`: original hand-drawn RPG doodles and raster artwork, including three-frame flame animations.
- `scripts/draw_scene_sprites.py`: original drawn scenery including mountains, fences, pots, reeds, and lanterns; Python 3, no packages needed.
- `scripts/draw_ui_sprites.py`: original transparent bitmap icons, seven distinct rainbow crystal silhouettes and their unfilled sockets, frame corners, and toggles; Python 3, no packages needed.
- `scripts/draw_sprites.py`: reproducible sprite sources; run with Python 3, no packages needed.
- `scripts/draw_rpg_sprites.py`: reproducible RPG characters, enemies, props, and equipment; Python 3, no packages needed.
- `scripts/draw_crystal_sprites.py`: reproducible iridescent/void crystals and prestige doodles; Python 3, no packages needed.
- `vite.config.ts`: production asset caching and service-worker generation.

Existing `mbt-save-v1` saves migrate in place. Progress remains local to the browser; export/import is available in Settings. Assets and fonts are bundled locally. The production app works offline after its first completed load; processes and offline caches are independent of gameplay saves.

The GitHub Pages workflow tests, builds, and deploys `dist/`. Configure Pages to use GitHub Actions. Relative asset URLs, manifest scope, and service-worker registration support the repository's Pages subdirectory.

Prestige uses a persistent, three-branch upgrade tree. The first reset awakens the iridescent eighth world; the third awakens the void ninth world. Run scores, pocket upgrades, and RPG progress restart; tree purchases, relics, and preferences remain. Existing eight-world saves retain their progress, including an already discovered secret world.

Gate targets are exact products: `10^27`, `10^30`, `10^32`, `42 × 10^32`, `42 × 10^47`, then `42 × 10^65`. Further prestiges multiply the final target by 1,000 each time. All available world scores multiply, even when a permanent crystal is awake before the other rainbow worlds.
