import { defineConfig } from "vite";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";

// Cache the actual production files, including locally bundled fonts and sprites.
function offlineGame() {
  return {
    name: "offline-game",
    closeBundle() {
      const output = resolve("dist");
      const walk = (path: string): string[] =>
        readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
          entry.isDirectory()
            ? walk(resolve(path, entry.name))
            : [resolve(path, entry.name)],
        );
      const files = walk(output)
        .filter((path) => !path.endsWith("/sw.js"))
        .sort();
      const hash = createHash("sha256");
      files.forEach((path) => hash.update(readFileSync(path)));
      const assets = files.map(
        (path) => "./" + relative(output, path).replaceAll("\\", "/"),
      );
      writeFileSync(
        resolve(output, "sw.js"),
        `
const CACHE = 'mbt-${hash.digest("hex").slice(0, 12)}';
const ASSETS = ${JSON.stringify(assets)};
const INDEX = new URL('./index.html', self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new URL(path, self.registration.scope).href))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('mbt-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(INDEX)));
    return;
  }
  // These are public, same-origin static assets. A host's Vary: Origin header
  // must not split precached files from module-script and font requests.
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then(cached => cached || fetch(event.request)));
});
`,
      );
    },
  };
}
export default defineConfig({ base: "./", plugins: [offlineGame()] });
