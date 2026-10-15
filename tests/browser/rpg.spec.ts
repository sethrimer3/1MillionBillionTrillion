import { test, expect, type Page } from "@playwright/test";
import { createRpg, stats, enemy, ITEMS } from "../../src/rpg";

async function seed(page: Page, advanced = false) {
  const r = createRpg();
  r.seed = 42;
  if (advanced) {
    r.level = 12;
    r.cleared = 8;
    r.zone = 7;
    r.wave = 4;
    r.kills = 40;
    r.bosses = 8;
    r.owned = ITEMS.map((i) => i.id);
    r.gear = { weapon: "weapon-7", armor: "armor-7", charm: "charm-7" };
    r.gold = 300;
    r.ink = 100;
    r.attributes = { might: 3, vigor: 4, wisdom: 4 };
    r.hp = stats(r).maxHp;
    r.mp = stats(r).maxMp;
    r.enemyHp = enemy(r).hp;
  }
  const state = {
    worlds: Array.from({ length: 8 }, () => ({
      score: 100,
      bank: 500,
      helpers: 0,
      power: 1,
    })),
    unlocked: 7,
    secret: false,
    won: false,
    saved: Date.now(),
    clicks: 1,
    sound: false,
    rpg: r,
  };
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("rpg-fixture")) {
      localStorage.setItem("mbt-save-v1", JSON.stringify(s));
      sessionStorage.setItem("rpg-fixture", "yes");
    }
  }, state);
}
async function saved(page: Page) {
  return page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem("mbt-save-v1")!);
  });
}
async function win(page: Page) {
  let attempts = 0;
  while (await page.locator("#rpg-enemy").count()) {
    await page.locator(".chosen-command").click();
    if (++attempts > 30) throw Error("Encounter failed to complete");
  }
  await expect(page.locator(".victory-card")).toBeVisible();
}
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (e) => errors.get(page)!.push(e.message));
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("a small RPG opening expands through earned combat, equipment, attributes, maps, and forging", async ({
  page,
}, info) => {
  await seed(page);
  await page.goto("/#world/2");
  await expect(page.locator(".kingdom-app")).toBeVisible();
  await expect(
    page.locator(".paint-window, .paint-tools, .paint-palette"),
  ).toHaveCount(0);
  await expect(page.locator(".kingdom-tabs button")).toHaveCount(1);
  if (info.project.name === "mobile") {
    await page.evaluate(() => document.fonts.ready);
    const attack = await page.locator(".chosen-command").boundingBox();
    const viewport = await page.locator("#screen").boundingBox();
    const navigation = await page.locator(".scene-navigation").boundingBox();
    expect(attack!.y + attack!.height).toBeLessThanOrEqual(
      viewport!.y + viewport!.height,
    );
    expect(attack!.y).toBeGreaterThan(navigation!.y + navigation!.height);
  }
  if (info.project.name === "mobile") await page.locator("#rpg-enemy").tap();
  else await page.locator("#rpg-enemy").click();
  expect((await saved(page)).rpg.enemyHp).toBeLessThan(14);
  await win(page);
  await expect(page.locator("#world-score")).toHaveText("110");
  await page
    .locator(".kingdom-tabs")
    .getByRole("button", { name: "Bag", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Equip Bramble blade", exact: true })
    .click();
  expect((await saved(page)).rpg.gear.weapon).toBe("weapon-0");

  await page
    .locator(".kingdom-tabs")
    .getByRole("button", { name: "Adventure", exact: true })
    .click();
  for (let encounter = 1; encounter < 5; encounter++) {
    await page.locator("#rpg-continue").click();
    await win(page);
  }
  expect((await saved(page)).rpg.cleared).toBe(1);
  await expect(
    page
      .locator(".kingdom-tabs")
      .getByRole("button", { name: "Map", exact: true }),
  ).toBeVisible();
  await page
    .locator(".kingdom-tabs")
    .getByRole("button", { name: /Hero/ })
    .click();
  await page
    .getByRole("button", { name: "Increase might", exact: true })
    .click();
  expect((await saved(page)).rpg.attributes.might).toBe(1);
  await page.locator('[data-rpg-party="pip"]').click();
  expect((await saved(page)).rpg.party).toContain("pip");
  await page
    .locator(".kingdom-tabs")
    .getByRole("button", { name: "Map", exact: true })
    .click();
  await page.locator('[data-rpg-zone="1"]').click();
  await page.getByRole("button", { name: "Set out", exact: false }).click();
  await win(page);
  await page
    .locator(".kingdom-tabs")
    .getByRole("button", { name: "Camp", exact: true })
    .click();
  await page.locator('[data-rpg-forge="weapon-0"]').click();
  expect((await saved(page)).rpg.forged["weapon-0"]).toBe(1);
  await page.reload();
  expect((await saved(page)).rpg.forged["weapon-0"]).toBe(1);
});
test("advanced kingdoms expose magic, quests, companions, and endless exploration on narrow screens", async ({
  page,
}) => {
  await seed(page, true);
  await page.goto("/#world/2");
  const before = await saved(page);
  await page.getByRole("button", { name: "Sunburst", exact: true }).click();
  const after = await saved(page);
  expect(after.rpg.enemyHp).toBeLessThan(before.rpg.enemyHp);
  expect(after.rpg.mp).toBe(before.rpg.mp - 6);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const tab of ["Bag", "Hero", "Map", "Camp", "Journal"]) {
      await page
        .locator(".kingdom-tabs")
        .getByRole("button", { name: new RegExp("^" + tab) })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${tab} at ${width}`,
      ).toBe(true);
    }
  }
  await page.locator('[data-rpg-claim="first-road"]').click();
  await expect(page.locator('[data-rpg-claim="first-road"]')).toBeDisabled();
  expect((await saved(page)).rpg.claimed).toContain("first-road");
  await page
    .locator(".kingdom-tabs")
    .getByRole("button", { name: "Hero", exact: true })
    .click();
  await page.locator('[data-rpg-party="mote"]').click();
  expect((await saved(page)).rpg.party).toContain("mote");
  await page
    .locator(".kingdom-tabs")
    .getByRole("button", { name: "Map", exact: true })
    .click();
  await page.locator('[data-rpg-zone="8"]').click();
  expect((await saved(page)).rpg.zone).toBe(8);
  await page.getByRole("button", { name: "Set out", exact: false }).click();
  await expect(page.locator(".rpg-scene-label")).toContainText(
    "The Endless Canvas",
  );
});
test("mid-battle saves, navigation, and RPG sprites survive an offline relaunch", async ({
  page,
  context,
}) => {
  await seed(page);
  await page.goto("/#world/2");
  await page.locator(".chosen-command").click();
  const state = await saved(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator("#rpg-enemy")).toBeVisible();
  expect((await saved(page)).rpg.enemyHp).toBe(state.rpg.enemyHp);
  await page.locator(".chosen-command").click();
  expect((await saved(page)).rpg.enemyHp).toBeLessThan(state.rpg.enemyHp);
  expect(
    await page
      .locator(".rpg-hero img")
      .first()
      .evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBe(96);
  await page.locator("#settings").click();
  await expect(page.locator("#modal")).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await context.setOffline(false);
});
