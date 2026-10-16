import { test, expect, type Page } from "@playwright/test";

function seed(score = 100) {
  return {
    worlds: Array.from({ length: 8 }, () => ({
      score,
      helpers: 0,
      power: 1,
      bank: 500,
    })),
    unlocked: 7,
    secret: false,
    won: false,
    saved: Date.now(),
    clicks: 100,
    sound: false,
  };
}
async function withSave(page: Page, data: ReturnType<typeof seed>) {
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("fixture-loaded")) {
      localStorage.setItem("mbt-save-v1", JSON.stringify(s));
      sessionStorage.setItem("fixture-loaded", "yes");
    }
  }, data);
}
async function savedScore(page: Page, index: number): Promise<number> {
  return page.evaluate((i) => {
    window.dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem("mbt-save-v1")!).worlds[i].score;
  }, index);
}
test("first world, uninterrupted unlock, helpers, relics, and save reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Extinguish left torch" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Extinguish right torch" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "How to play" })).toHaveCount(
    0,
  );
  await page.locator('.gate-socket[data-world="0"]').click();
  for (let i = 0; i < 6; i++)
    await page.getByRole("button", { name: "Feed the fire" }).click();
  await expect(page.locator('[data-world-page="0"]')).toBeVisible();
  await page.getByRole("button", { name: "Worlds", exact: true }).click();
  await expect(page.locator('.world-card[data-world="1"]')).toHaveClass(
    /available/,
  );
  await page.locator('.world-card[data-world="0"]').click();
  await page.locator("#buy-helper").click();
  await expect(page.locator("#world-rate")).toHaveText("2/s");
  const before = await savedScore(page, 0);
  await page.waitForTimeout(1100);
  expect(await savedScore(page, 0)).toBeGreaterThan(before);
  await page.reload();
  await expect(page.locator("#helper-level")).toContainText("1 ·");
  const nav = page.locator(".scene-navigation");
  await nav.getByRole("button", { name: "Relics" }).click();
  await expect(page.locator(".relic-card.owned")).toHaveCount(3);
  await page.locator('[data-relic="spark"]').click();
  await expect(
    page.locator("#modal").getByRole("heading", { name: "First light" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  expect(errors).toEqual([]);
});
test("eight migrated worlds, regrowing crops, resonance, and torch ambience", async ({
  page,
}) => {
  await withSave(page, { ...seed(), secret: true });
  await page.goto("/");
  await page.getByRole("button", { name: "Extinguish left torch" }).click();
  await page.getByRole("button", { name: "Extinguish right torch" }).click();
  await expect(page.locator("#gate-stage")).toHaveAttribute("data-fires", "0");
  await page.getByRole("button", { name: "Strange marking" }).click();
  await page.goto("/#worlds");
  await expect(page.locator(".world-card.available")).toHaveCount(8);
  for (const i of [0, 1, 2, 4, 5, 7]) {
    await page.goto("/#world/" + i);
    const before = await savedScore(page, i);
    if (i === 2) {
      await page.locator('[data-map-cell="142"]').click();
      await expect
        .poll(() => savedScore(page, i), { timeout: 15000 })
        .toBeGreaterThan(before);
      expect(await savedScore(page, i)).toBeGreaterThan(before);
      continue;
    }
    const target =
      i === 1
        ? page
            .getByRole("button", { name: "Harvest carrot", exact: true })
            .first()
        : i === 4
          ? page.getByRole("button", { name: "Rain lava 1", exact: true })
          : i === 5
            ? page.getByRole("button", { name: "Catch firefly 1", exact: true })
            : page.locator("[data-tap]").first();
    await target.click();
    await expect.poll(() => savedScore(page, i)).toBeGreaterThan(before);
  }
  await page.goto("/#world/1");
  const plot = page.locator(".plot.ripe").first();
  const index = await plot.getAttribute("data-tap");
  await plot.click();
  await expect(page.locator(`.plot[data-tap="${index}"]`)).toHaveClass(
    /growing/,
  );
  await expect(page.locator(`.plot[data-tap="${index}"]`)).toHaveClass(/ripe/, {
    timeout: 6000,
  });
  await page.goto("/#world/0");
  for (let i = 0; i < 20; i++)
    await page.getByRole("button", { name: "Feed the fire" }).click();
  await page.locator("#buy-resonance").click();
  await expect(page.locator("#world-multiplier")).toHaveText("×2");
});
test("the dream echoes a sequence and a completed gate stays open", async ({
  page,
}) => {
  await withSave(page, seed(10000));
  await page.goto("/#world/6");
  await expect(page.locator("#activity-status")).toHaveText("ECHO", {
    timeout: 6000,
  });
  const before = await savedScore(page, 6);
  await page.getByRole("button", { name: "Dream 1", exact: true }).click();
  await page.getByRole("button", { name: "Dream 3", exact: true }).click();
  expect(await savedScore(page, 6)).toBeGreaterThan(before + 40);
  await page.goto("/#relics");
  await expect(page.locator('[data-relic="echo"]')).toHaveClass(/owned/);
  await page.goto("/#gate");
  const arch = await page.locator(".gate-sprite").boundingBox();
  await page
    .getByRole("button", { name: "Open the gate", exact: true })
    .click();
  await expect(page.locator(".answer")).toHaveText("42.");
  await page.getByRole("button", { name: "Stay a little longer" }).click();
  await expect(page.locator("#gate-stage")).toHaveClass(/is-open/);
  expect(await page.locator(".gate-sprite").boundingBox()).toEqual(arch);
  await page.reload();
  await expect(page.locator("#gate-stage")).toHaveClass(/is-open/);
});
test("settings, save export and recovery, and offline relaunch", async ({
  page,
  context,
}) => {
  await withSave(page, seed());
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("switch", { name: "Sound", exact: true }).click();
  await expect(
    page.getByRole("switch", { name: "Sound", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await page.getByRole("switch", { name: "Motion", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-motion", "off");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export save", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "million-billion-trillion-save.json",
  );
  await page.locator("#save-file").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  });
  await expect(page.locator("#toast")).toContainText(
    "That save could not be read",
  );
  const fixture = seed(123);
  await page.locator("#save-file").setInputFiles({
    name: "save.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await expect(page.locator("#modal")).not.toBeVisible();
  expect(await savedScore(page, 0)).toBe(123);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".gate-stage")).toBeVisible();
  await page.locator('.gate-socket[data-world="0"]').click();
  await page.getByRole("button", { name: "Feed the fire" }).click();
  expect(
    await page
      .locator(".fire-frame")
      .first()
      .evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBe(48);
  await context.setOffline(false);
});
test("navigation and layouts fit narrow screens without horizontal scrolling", async ({
  page,
}) => {
  await withSave(page, seed());
  await page.goto("/");
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["gate", "worlds", "world/0", "relics", "prestige"]) {
      await page.goto("/#" + route);
      await expect(page.locator("#screen")).toBeVisible();
      expect(
        await page.evaluate(() => {
          const screen = document.querySelector<HTMLElement>("#screen")!;
          return (
            document.documentElement.scrollWidth <= innerWidth &&
            screen.scrollWidth <= screen.clientWidth
          );
        }),
        `${route} at ${width}px`,
      ).toBe(true);
    }
  }
});

test("the gate fills the viewport and its carved crystals are direct entrances", async ({
  page,
}) => {
  await page.goto("/#gate");
  await expect(
    page.locator(
      ".app-header, .side-rail, .bottom-dock, .world-shelf, .gate-status",
    ),
  ).toHaveCount(0);
  for (const [width, height] of [
    [320, 740],
    [390, 844],
    [808, 580],
    [1440, 1000],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    const stage = await page.locator("#gate-stage").boundingBox();
    expect(stage).toEqual({ x: 0, y: 0, width, height });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    const navigation = await page.locator(".scene-navigation").boundingBox();
    expect(navigation!.x).toBeLessThan(20);
    expect(navigation!.y).toBeLessThan(20);
    expect(navigation!.x + navigation!.width).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.gate-socket[data-world="1"]').click();
  await expect(page).toHaveURL(/#gate$/);
  await page.locator('.gate-socket[data-world="0"]').click();
  await expect(
    page.getByRole("button", { name: "Feed the fire" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "The gate", exact: true }).click();
  await expect(page.locator("#gate-stage")).toBeVisible();
});
