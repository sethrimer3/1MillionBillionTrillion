import { test, expect, type Page } from "@playwright/test";
import { freshState, type State } from "../../src/game";

async function seed(page: Page, count = 0, ready = true) {
  const s = freshState();
  s.unlocked = 7;
  s.secret = count > 0;
  s.prestige = {
    count,
    shards: 0,
    upgrades: count >= 3 ? ["iridescent", "void"] : count ? ["iridescent"] : [],
  };
  for (const w of s.worlds) {
    w.score = ready ? 1e10 : 1;
    w.bank = 0;
  }
  s.rpg.level = 8;
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("prestige-fixture")) {
      localStorage.setItem("mbt-save-v1", JSON.stringify(s));
      sessionStorage.setItem("prestige-fixture", "yes");
    }
  }, s);
}
async function saved(page: Page): Promise<State> {
  return page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem("mbt-save-v1")!);
  });
}
async function cross(page: Page) {
  await page.locator("#prestige-now").click();
  await expect(
    page.getByRole("heading", { name: "Cross again?" }),
  ).toBeVisible();
  await page.locator("#confirm-prestige").click();
}
test("first completion opens the prestige tree, resets once, and permanently awakens the iridescent game", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seed(page);
  await page.goto("/#gate");
  await page
    .getByRole("button", { name: "Open the gate", exact: true })
    .click();
  await expect(page.locator(".answer")).toHaveText("42.");
  await page.locator("#ending-prestige").click();
  await expect(
    page.locator('[data-prestige-buy="iridescent"]'),
  ).not.toHaveClass(/owned/);
  await cross(page);
  let s = await saved(page);
  expect(s.prestige.count).toBe(1);
  expect(s.prestige.shards).toBe(4);
  expect(s.rpg.level).toBe(1);
  expect(s.worlds.every((w) => w.score === 1)).toBe(true);
  await expect(page.locator('[data-prestige-buy="iridescent"]')).toHaveClass(
    /owned/,
  );
  await expect(page.locator('[data-prestige-buy="void"]')).not.toHaveClass(
    /owned/,
  );
  await expect(page.locator("#prestige-now")).toBeDisabled();
  await page.reload();
  expect((await saved(page)).prestige.count).toBe(1);
  await page.locator('[data-prestige-buy="kindling"]').click();
  await page.locator('[data-prestige-buy="clockwork"]').click();
  await expect(page.locator("#prestige-shards")).toHaveText("1");
  await page.goto("/#gate");
  await expect(page.locator(".door-inscription")).toHaveText(
    "1 ThousandMillionBillionTrillion",
  );
  await expect(page.locator('#score-factors [data-world="7"]')).toBeVisible();
  await expect(page.locator('#score-factors [data-world="1"]')).toHaveCount(0);
  await page.goto("/#world/7");
  const before = (await saved(page)).worlds[7].score;
  await page.locator(".refraction.aligned").click();
  expect((await saved(page)).worlds[7].score).toBeGreaterThan(before + 1000);
  await expect(page.locator(".crystal-chain")).toHaveText("×2");
  await page.goto("/#prestige");
  await page.locator('[data-prestige-buy="pockets"]').click();
  s = await saved(page);
  expect(s.prestige.shards).toBe(0);
  expect(s.worlds.every((w) => w.helpers === 2)).toBe(true);
  await page.reload();
  expect((await saved(page)).prestige.upgrades).toEqual(
    expect.arrayContaining(["iridescent", "kindling", "clockwork", "pockets"]),
  );
  expect(errors).toEqual([]);
});
test("third prestige reveals the void, its collapse payout, and both crystals work offline", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seed(page, 2);
  await page.goto("/#world/8");
  await expect(page.locator(".world-card-8")).toHaveClass(/locked/);
  await page.goto("/#prestige");
  await expect(page.locator(".rebirth-copy h2")).toHaveText(
    "1 Hundred Thousand Million Billion Trillion",
  );
  await cross(page);
  await expect(page.locator('[data-prestige-buy="void"]')).toHaveClass(/owned/);
  expect((await saved(page)).prestige.count).toBe(3);
  await page.goto("/#gate");
  await expect(page.locator(".door-inscription")).toHaveText(
    "42 HundredThousandMillionBillionTrillion",
  );
  await page.goto("/#world/8");
  await expect(page.locator(".void-collapse")).toBeDisabled();
  for (let i = 0; i < 5; i++) await page.locator(".void-heart").click();
  await expect(page.locator("#activity-status")).toHaveText("CRITICAL MASS");
  const before = (await saved(page)).worlds[8].score;
  await page.locator(".void-collapse").click();
  const after = (await saved(page)).worlds[8].score;
  expect(after - before).toBeGreaterThan(1e10);
  await expect(page.locator(".void-collapse")).toBeDisabled();
  await page.goto("/#worlds");
  await expect(page.locator(".world-card.available")).toHaveCount(9);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.goto("/#world/7");
  await page.reload();
  await expect(page.locator(".prism-heart img")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".prism-heart img")
        .evaluate((i: HTMLImageElement) => i.naturalWidth),
    )
    .toBe(96);
  await page.locator(".refraction.aligned").click();
  await page.goto("/#world/8");
  await expect
    .poll(() =>
      page
        .locator(".void-heart img")
        .evaluate((i: HTMLImageElement) => i.naturalWidth),
    )
    .toBe(96);
  await page.locator(".void-heart").click();
  expect((await saved(page)).worlds[8].score).toBeGreaterThan(after);
  await context.setOffline(false);
  expect(errors).toEqual([]);
});
test("crystals stay locked before prestige and the larger gate targets and tree fit small screens", async ({
  page,
}) => {
  await seed(page, 0, false);
  await page.goto("/#gate");
  await page.getByRole("button", { name: "Extinguish left torch" }).click();
  await page.getByRole("button", { name: "Extinguish right torch" }).click();
  await page.getByRole("button", { name: "Strange marking" }).click();
  expect((await saved(page)).secret).toBe(false);
  await page.goto("/#prestige");
  await expect(page.locator("#prestige-now")).toBeDisabled();
  const late = await saved(page);
  late.prestige = { count: 5, shards: 10, upgrades: ["iridescent", "void"] };
  late.secret = true;
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.locator("#save-file").setInputFiles({
    name: "late.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(late)),
  });
  await expect(page.locator("#modal")).not.toBeVisible();
  expect((await saved(page)).prestige.count).toBe(5);
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["gate", "prestige", "world/7", "world/8"]) {
      await page.goto("/#" + route);
      expect(
        await page.evaluate(() => {
          const screen = document.querySelector<HTMLElement>("#screen")!;
          return (
            document.documentElement.scrollWidth <= innerWidth &&
            screen.scrollWidth <= screen.clientWidth
          );
        }),
        `${route} at ${width}`,
      ).toBe(true);
    }
  }
  await page.goto("/#gate");
  await expect(page.locator(".door-inscription")).toContainText("Quintillion");
  await expect(page.locator("#open-gate")).toHaveAttribute(
    "title",
    /42 Hundred Thousand/,
  );
});
