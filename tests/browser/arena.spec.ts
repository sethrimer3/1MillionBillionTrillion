import { test, expect, type Page } from "@playwright/test";
import { freshState, type State } from "../../src/game.ts";
import { buyShip, mergeShips } from "../../src/arena.ts";

async function start(page: Page, edit?: (s: State) => void) {
  const s = freshState();
  s.unlocked = 7;
  s.worlds.forEach((w) => (w.score = 100));
  edit?.(s);
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("arena-fixture")) {
      localStorage.setItem("mbt-save-v1", JSON.stringify(s));
      sessionStorage.setItem("arena-fixture", "yes");
    }
  }, s);
  await page.goto("/#world/3");
  await expect(page.locator("#arena-canvas")).toBeVisible();
}
async function saved(page: Page): Promise<State> {
  return page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem("mbt-save-v1")!);
  });
}
test("a drawn fleet flies, destroys crystals, pays out, and keeps producing at the gate", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  const initial = await saved(page);
  await expect
    .poll(async () => {
      const s = await saved(page);
      return Math.hypot(
        s.arena.ships[0].x - initial.arena.ships[0].x,
        s.arena.ships[0].y - initial.arena.ships[0].y,
      );
    })
    .toBeGreaterThan(5);
  await expect
    .poll(async () => (await saved(page)).arena.destroyed, { timeout: 15000 })
    .toBeGreaterThan(0);
  const s = await saved(page);
  expect(s.arena.earned).toBeGreaterThan(0);
  expect(s.worlds[3].score).toBe(100 + s.arena.earned);
  await expect(page.locator("#arena-money")).not.toHaveText("0");
  // Rendered sprites are original local assets, and the canvas is actually painted.
  expect(
    await page.locator("#arena-canvas").evaluate((el: HTMLCanvasElement) =>
      el
        .getContext("2d")!
        .getImageData(0, 0, el.width, el.height)
        .data.some((v, i) => i % 4 !== 3 && v > 80),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "The gate", exact: true }).click();
  const before = (await saved(page)).arena.time;
  await expect
    .poll(async () => (await saved(page)).arena.time)
    .toBeGreaterThan(before + 0.2);
  await page.goto("/#world/3");
  await expect(page.locator("#arena-canvas")).toBeVisible();
  expect(errors).toEqual([]);
});
test("launch, merge, upgrade, and surge work through mobile controls and survive reload", async ({
  page,
}) => {
  await start(page, (s) => (s.arena.money = 2000));
  await page.getByRole("button", { name: "Launch Dart", exact: true }).click();
  await expect(page.locator('[data-fleet-count="0"]')).toHaveText("2");
  await page
    .getByRole("button", { name: "Merge Dart pair", exact: true })
    .click();
  await expect(page.locator('[data-hull="1"]')).not.toHaveClass(/sealed/);
  await expect(page.locator('[data-fleet-count="1"]')).toHaveText("1");
  await page
    .getByRole("button", { name: "Launch Needle", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Merge Needle pair", exact: true })
    .click();
  await expect(page.locator('[data-fleet-count="2"]')).toHaveText("1");
  await page.getByRole("button", { name: "Upgrades", exact: true }).click();
  for (const key of ["damage", "speed", "capacity"]) {
    await page
      .getByRole("button", { name: "Upgrade " + key, exact: true })
      .click();
    await expect(page.locator(`[data-upgrade-level="${key}"]`)).toHaveText(
      "LV 1",
    );
  }
  await page.getByRole("button", { name: "Surge fleet" }).click();
  await expect(page.locator("#arena-surge")).toBeDisabled();
  const before = await saved(page);
  expect(before.arena.upgrades).toEqual({ damage: 1, speed: 1, capacity: 1 });
  expect(before.arena.ships.map((s) => s.tier)).toEqual([2]);
  await page.reload();
  await expect(page.locator('[data-fleet-count="2"]')).toHaveText("1");
  const after = await saved(page);
  expect(after.arena.money).toBeGreaterThanOrEqual(before.arena.money);
  expect(after.arena.upgrades).toEqual(before.arena.upgrades);
  await expect(page.locator("#arena-surge")).toBeDisabled();
});
test("all weapon hulls remain usable after an offline return, without missing sprite files", async ({
  page,
  context,
}) => {
  const broken: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400) broken.push(r.url());
  });
  await start(page, (s) => {
    s.arena.money = 1e6;
    for (let tier = 0; tier < 5; tier++) {
      buyShip(s.arena, tier);
      mergeShips(s.arena, tier);
    }
    for (let tier = 0; tier < 5; tier++) buyShip(s.arena, tier);
    s.saved = Date.now() - 3600000;
  });
  expect((await saved(page)).arena.destroyed).toBeGreaterThan(100);
  expect((await saved(page)).worlds[3].score).toBeGreaterThan(100);
  for (let tier = 0; tier < 6; tier++) {
    const hull = page.locator(`[data-hull="${tier}"]`);
    await hull.scrollIntoViewIfNeeded();
    await expect(hull.locator("img").first()).toBeVisible();
    expect(
      await hull
        .locator("img")
        .first()
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    ).toBe(true);
    await expect(hull.locator(`[data-fleet-count="${tier}"]`)).toHaveText("1");
  }
  await expect
    .poll(
      async () => {
        const s = await saved(page);
        return s.arena.shots.length + s.arena.mines.length;
      },
      { timeout: 5000 },
    )
    .toBeGreaterThan(0);
  expect(broken).toEqual([]);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#arena-canvas")).toBeVisible();
  const before = (await saved(page)).arena.time;
  await expect
    .poll(async () => (await saved(page)).arena.time)
    .toBeGreaterThan(before + 0.2);
  expect(
    await page
      .locator('[data-hull="0"] img')
      .first()
      .evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
  ).toBe(true);
  await context.setOffline(false);
});
test("arena and both control tabs fit narrow phones, tablets, desktop, and landscape", async ({
  page,
}) => {
  await start(page, (s) => {
    s.arena.unlocked = 5;
    s.arena.money = 10000;
  });
  for (const [width, height] of [
    [320, 740],
    [390, 844],
    [768, 1024],
    [1440, 1000],
    [844, 390],
    [667, 375],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(page.locator("#arena-canvas")).toBeVisible();
    for (const tab of ["Fleet", "Upgrades"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      const bounds = await page.locator("#arena-host").evaluate((el) => ({
        width: el.scrollWidth,
        height: el.scrollHeight,
        rect: el.getBoundingClientRect().toJSON(),
      }));
      expect(bounds.width).toBeLessThanOrEqual(width + 1);
      expect(bounds.height).toBeLessThanOrEqual(height + 1);
      const button = page.getByRole("button", {
        name: tab === "Fleet" ? "Launch Dart" : "Upgrade damage",
        exact: true,
      });
      await button.scrollIntoViewIfNeeded();
      const rect = (await button.boundingBox())!;
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(width + 1);
      expect(rect.y + rect.height).toBeLessThanOrEqual(height + 1);
      const canvas = (await page.locator("#arena-canvas").boundingBox())!;
      expect(canvas.width).toBeGreaterThan(100);
      expect(canvas.height).toBeGreaterThan(100);
    }
    expect(
      await page
        .locator(".scene-navigation")
        .getByRole("button", { name: "Worlds", exact: true })
        .isVisible(),
    ).toBe(true);
  }
});
