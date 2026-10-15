# million. billion. trillion.

A mobile-friendly, hand-drawn idle game in HTML, CSS, and TypeScript. Grow seven rainbow worlds, discover an eighth secret world, and multiply their lifetime scores to reach **10²⁷** and open a mysterious gate.

## Run

Requires Node.js 22.18+ or 24+.

```sh
npm ci
npm run dev
```

```sh
npm test       # progression, save recovery, offline production, and win threshold
npm run build # TypeScript validation and production output in dist/
npm run preview
```

Each world has a distinct tapping activity, spendable resources, permanent upgrades, and idle helpers. Lifetime scores never decrease when buying upgrades. Progress saves in this browser's local storage every five seconds and when leaving; helpers produce up to eight hours of offline rewards. Sound is optional. The star in the footer unlocks the secret world once all seven gems are collected and the total reaches 10 billion.

The journey bar measures progress through 27 orders of magnitude. Seven gem colors correspond to the seven rainbow games; the eighth world is secret. Opening the gate reveals the ending, and play can continue afterward.

GitHub Pages builds and deploys `dist/` through the existing Actions workflow. Configure Pages to use GitHub Actions. No server, database, or credentials are needed for local play.
