import { test, expect, type Page } from "@playwright/test";
import { freshState, type State } from "../../src/game.ts";
async function seed(page: Page, edit?: (s: State) => void) {
  const s = freshState();
  s.unlocked = 7;
  s.clicks = 100;
  s.worlds.forEach((w) => (w.score = 100));
  edit?.(s);
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("ocean-fixture")) {
      localStorage.setItem("mbt-save-v1", JSON.stringify(s));
      sessionStorage.setItem("ocean-fixture", "yes");
    }
  }, s);
  await page.goto("/#world/4");
  await expect(page.locator(".ocean-canvas")).toBeVisible();
}
async function saved(page: Page): Promise<State> {
  return page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem("mbt-save-v1")!);
  });
}
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (e) => errors.get(page)!.push(e.message));
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("clouds drop lava that lowers the visible waterline and raises the blue score on impact", async ({
  page,
}) => {
  await seed(page);
  await expect(page.locator(".ocean-canvas")).toHaveAttribute(
    "data-surface",
    "206",
  );
  for (let i = 1; i <= 3; i++)
    await page
      .getByRole("button", { name: "Rain lava " + i, exact: true })
      .click();
  await expect.poll(async () => (await saved(page)).ocean.drained).toBe(24);
  expect((await saved(page)).worlds[4].score).toBe(124);
  await expect(
    page.getByRole("progressbar", { name: "Ocean drained" }),
  ).toHaveAttribute("aria-valuenow", "1.5");
  expect(
    Number(await page.locator(".ocean-canvas").getAttribute("data-surface")),
  ).toBeGreaterThan(206);
  await expect(
    page.getByRole("button", { name: "Upgrade Lava clouds", exact: true }),
  ).toBeEnabled();
  expect(
    await page
      .locator(".ocean-clouds img")
      .evaluateAll((els) =>
        els.every(
          (el) =>
            (el as HTMLImageElement).complete &&
            (el as HTMLImageElement).naturalWidth > 0,
        ),
      ),
  ).toBe(true);
});
test("bought rainmakers evaporate water offscreen, and an existing save retains spent currency", async ({
  page,
}) => {
  await seed(page, (s) => (s.ocean.obsidian = 150));
  await page
    .getByRole("button", { name: "Upgrade Lava clouds", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Upgrade Molten heart", exact: true })
    .click();
  expect((await saved(page)).ocean.obsidian).toBe(86);
  await expect(page.locator('[data-ocean-detail="clouds"]')).toHaveText(
    "0.65 drops/s",
  );
  await page.getByRole("button", { name: "The gate", exact: true }).click();
  await expect
    .poll(async () => (await saved(page)).ocean.drained, { timeout: 5000 })
    .toBeGreaterThan(0);
  const before = await saved(page);
  await page.goto("/#world/4");
  await page.reload();
  const after = await saved(page);
  expect(after.ocean.upgrades.clouds).toBe(1);
  expect(after.ocean.upgrades.heat).toBe(1);
  expect(after.ocean.drained).toBeGreaterThanOrEqual(before.ocean.drained);
  expect(after.ocean.obsidian).toBeLessThan(150);
});
test("empty seas reveal their finds, sailing increases the ocean depth and voyages can be automated", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.ocean.water = 8;
    s.ocean.obsidian = 600;
  });
  await page.getByRole("button", { name: "Rain lava 2", exact: true }).click();
  const sail = page.getByRole("button", {
    name: "Sail to the next ocean",
    exact: true,
  });
  await expect(sail).toBeVisible();
  await expect(page.locator('[data-ocean-find="3"]')).toHaveClass(/found/);
  expect((await saved(page)).ocean.cleared).toBe(1);
  await sail.click();
  await expect(page.locator("#ocean-number")).toHaveText("OCEAN 02");
  await expect(page.locator(".ocean-canvas")).toHaveAttribute(
    "data-capacity",
    "6400",
  );
  await page
    .getByRole("button", { name: "Upgrade Endless voyage", exact: true })
    .click();
  const auto = page.getByRole("button", {
    name: "Automatic voyages",
    exact: true,
  });
  await expect(auto).toHaveAttribute("aria-pressed", "true");
  await auto.click();
  await expect(auto).toHaveAttribute("aria-pressed", "false");
  await page.reload();
  await expect(auto).toHaveAttribute("aria-pressed", "false");
  expect((await saved(page)).ocean.cleared).toBe(1);
});
test("offline reload keeps buried finds, purchased tools and original art available without a network", async ({
  page,
  context,
}) => {
  await seed(page, (s) => {
    s.ocean.obsidian = 100;
    s.ocean.water = 790;
    s.ocean.drained = 810;
    s.ocean.finds = [1, 1, 0, 0];
  });
  await page
    .getByRole("button", { name: "Upgrade Lava clouds", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('[data-ocean-find="0"]')).toHaveClass(/found/);
  await page.getByRole("button", { name: "Rain lava 1", exact: true }).click();
  await expect
    .poll(async () => (await saved(page)).ocean.drained)
    .toBeGreaterThan(810);
  expect((await saved(page)).ocean.upgrades.clouds).toBe(1);
  expect(
    await page.evaluate(async () => {
      const img = new Image();
      img.src = new URL("./sprites/ocean-basin.svg", location.href).href;
      try {
        await img.decode();
        return img.naturalWidth > 0;
      } catch {
        return false;
      }
    }),
  ).toBe(true);
  await context.setOffline(false);
});
test("ocean controls, canvas and navigation fit narrow phones, tablets, desktop and landscape", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.ocean.obsidian = 10000;
    s.ocean.cleared = 1;
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
    const bounds = await page
      .locator("#ocean-host")
      .evaluate((el) => ({ width: el.scrollWidth, height: el.scrollHeight }));
    expect(bounds.width).toBeLessThanOrEqual(width + 1);
    expect(bounds.height).toBeLessThanOrEqual(height + 1);
    const stage = (await page.locator(".ocean-stage").boundingBox())!;
    expect(stage.height).toBeGreaterThan(100);
    const nav = (await page.locator(".scene-navigation").boundingBox())!;
    for (const name of [
      "Rain lava 1",
      "Rain lava 3",
      "Upgrade Lava clouds",
      "Upgrade Endless voyage",
    ]) {
      const button = page.getByRole("button", { name, exact: true });
      await button.scrollIntoViewIfNeeded();
      const box = (await button.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
      expect(box.y >= nav.y + nav.height || box.x >= nav.x + nav.width).toBe(
        true,
      );
    }
  }
});
