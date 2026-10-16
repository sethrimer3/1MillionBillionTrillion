import { test, expect, type Page } from "@playwright/test";
import { freshState, type State } from "../../src/game.ts";
import {
  recruit,
  rest,
  navigate,
  chooseAbility,
  ITEMS,
} from "../../src/rpg.ts";
import { MAP_CENTER, WORLD_MAP } from "../../src/rpg-map.ts";
const near = WORLD_MAP.find((c) => c.room && c.distance === 2)!.id;
const middle = WORLD_MAP.find((c) => c.room && c.distance === 8)!.id;
const outer = WORLD_MAP.find((c) => c.room && c.distance === 16)!.id;
async function seed(page: Page, edit?: (s: State) => void) {
  const s = freshState();
  s.unlocked = 7;
  s.worlds.forEach((w) => {
    w.score = 100;
    w.bank = 500;
  });
  edit?.(s);
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("kingdom-fixture")) {
      localStorage.setItem("mbt-save-v1", JSON.stringify(s));
      sessionStorage.setItem("kingdom-fixture", "yes");
    }
  }, s);
  await page.goto("/#world/2");
  await expect(page.locator(".kingdom-app")).toBeVisible();
}
function strong(s: State) {
  const r = s.rpg;
  r.level = 12;
  r.kills = 40;
  r.cleared = 8;
  r.gold = 1000;
  r.ink = 100;
  r.owned = ITEMS.map((i) => i.id);
  r.gear = { weapon: "weapon-2", armor: "armor-3", charm: "charm-3" };
  for (const id of ["pip", "moss", "mote"]) recruit(r, id);
  rest(r);
}
async function saved(page: Page): Promise<State> {
  return page.evaluate(() => {
    window.dispatchEvent(new Event("pagehide"));
    return JSON.parse(localStorage.getItem("mbt-save-v1")!);
  });
}
async function tab(page: Page, name: string) {
  await page
    .locator(".kingdom-tabs")
    .getByRole("button", { name, exact: true })
    .click();
}
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  errors.set(page, []);
  page.on("pageerror", (e) => errors.get(page)!.push(e.message));
});
test.afterEach(async ({ page }) => expect(errors.get(page)).toEqual([]));

test("a new adventurer walks clicked squares and automatically earns the first loot and level", async ({
  page,
}) => {
  await seed(page);
  expect((await saved(page)).rpg.maze.cell).toBe(MAP_CENTER);
  await expect(
    page.locator(".paint-window,.paint-palette,.paint-tools"),
  ).toHaveCount(0);
  await expect(page.locator(".atlas-cell.current")).toHaveAttribute(
    "data-map-cell",
    String(MAP_CENTER),
  );
  await page.locator(`[data-map-cell="${near}"]`).click();
  await expect(page.locator("#rpg-battle-status")).toHaveText("BATTLE");
  await expect
    .poll(async () => (await saved(page)).rpg.enemyHp)
    .toBeLessThan(38);
  await expect
    .poll(async () => (await saved(page)).rpg.kills, {
      timeout: 12000,
      intervals: [100, 250],
    })
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Pause battle", exact: true }).click();
  const s = await saved(page);
  expect(s.rpg.level).toBe(2);
  expect(s.rpg.owned).toContain("weapon-0");
  expect(s.worlds[2].score).toBe(142);
  await tab(page, "Bag");
  await page
    .getByRole("button", { name: "Equip Bramble blade", exact: true })
    .click();
  expect((await saved(page)).rpg.gear.weapon).toBe("weapon-0");
  await tab(page, "Hero");
  await page
    .getByRole("button", { name: "Increase might", exact: true })
    .click();
  expect((await saved(page)).rpg.attributes.might).toBe(1);
  await page.reload();
  expect((await saved(page)).rpg.attributes.might).toBe(1);
  expect((await saved(page)).rpg.auto).toBe(false);
});
test("recruiting fills four party slots and companions can be exchanged at camp", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.rpg.kills = 20;
    s.rpg.gold = 500;
    s.rpg.level = 5;
    rest(s.rpg);
  });
  await tab(page, "Party");
  for (const id of ["pip", "moss", "mote"]) {
    await page.locator(`[data-recruit="${id}"]`).click();
  }
  await expect(page.locator(".party-portrait:not(.empty)")).toHaveCount(4);
  expect((await saved(page)).rpg.party).toEqual(["pip", "moss", "mote"]);
  await page.locator('[data-recruit="puddle"]').click();
  await expect(page.locator('[data-party="puddle"]')).toBeDisabled();
  await page.locator('[data-party="mote"]').click();
  await page.locator('[data-party="puddle"]').click();
  expect((await saved(page)).rpg.party).toEqual(["pip", "moss", "puddle"]);
  await page
    .getByRole("button", { name: "Select Puddle", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Puddle: Mend", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Puddle: Soft rain", exact: true })
    .click();
  expect((await saved(page)).rpg.members.puddle.ability).toBe("rain");
  await page.reload();
  expect((await saved(page)).rpg.party).toEqual(["pip", "moss", "puddle"]);
});
test("all four members fight automatically and each active ability can change during battle", async ({
  page,
}) => {
  await seed(page, (s) => {
    strong(s);
    s.rpg.maze.cell = middle;
    navigate(s.rpg, middle);
  });
  await expect(page.locator(".kingdom-foe")).toHaveCount(2);
  const before = await saved(page);
  for (const [name, ability] of [
    ["You", "Power strike"],
    ["Pip", "Volley"],
    ["Moss", "Shell"],
    ["Mote", "Arc"],
  ]) {
    await page
      .getByRole("button", { name: "Select " + name, exact: true })
      .click();
    const button = page.getByRole("button", {
      name: name + ": " + ability,
      exact: true,
    });
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
  }
  const s = await saved(page);
  expect(s.rpg.auto).toBe(true);
  expect(s.rpg.members.hero.ability).toBe("stroke");
  expect(s.rpg.members.pip.ability).toBe("volley");
  expect(s.rpg.members.moss.ability).toBe("shell");
  expect(s.rpg.members.mote.ability).toBe("arc");
  await expect
    .poll(async () => {
      const s = await saved(page);
      return (
        s.rpg.enemyHp < before.rpg.enemyHp || s.rpg.kills > before.rpg.kills
      );
    })
    .toBe(true);
});
test("panning the maze and queuing an outer area displays its higher danger and reward without teleporting", async ({
  page,
}) => {
  await seed(page, (s) => strong(s));
  await page.locator(`[data-map-cell="${outer}"]`).scrollIntoViewIfNeeded();
  await page.locator(`[data-map-cell="${outer}"]`).click();
  await expect(page.locator("#rpg-distance")).toContainText("16 FROM CAMP");
  expect(
    Number((await page.locator("#rpg-preview-level").textContent())!),
  ).toBeGreaterThan(3);
  expect(
    Number(
      (await page.locator("#rpg-preview-gold").textContent())!.replace("+", ""),
    ),
  ).toBeGreaterThan(12);
  const first = await saved(page);
  expect(first.rpg.maze.cell).not.toBe(outer);
  expect(first.rpg.maze.route.at(-1)).toBe(outer);
  await expect
    .poll(async () => (await saved(page)).rpg.maze.cell)
    .not.toBe(MAP_CENTER);
  await expect(page.locator(".atlas-cell.on-route")).not.toHaveCount(0);
  await page.getByRole("button", { name: "Find party", exact: true }).click();
  await expect(page.locator(".atlas-cell.current")).toBeInViewport();
});
test("mid-battle party choices and queued paths survive reload and an offline relaunch", async ({
  page,
  context,
}) => {
  await seed(page, (s) => {
    strong(s);
    s.rpg.maze.cell = middle;
    navigate(s.rpg, middle);
    navigate(s.rpg, outer);
    chooseAbility(s.rpg, "moss", "shell");
    chooseAbility(s.rpg, "pip", "mark");
    s.rpg.auto = false;
  });
  const before = await saved(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".atlas-grid")).toBeVisible();
  const restored = await saved(page);
  expect(restored.rpg.members.moss.ability).toBe("shell");
  expect(restored.rpg.members.pip.ability).toBe("mark");
  expect(restored.rpg.enemyHp).toBe(before.rpg.enemyHp);
  expect(restored.rpg.maze.route).toEqual(before.rpg.maze.route);
  for (const img of await page.locator(".party-portrait img").all())
    expect(
      await img.evaluate(
        (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
      ),
    ).toBe(true);
  await page
    .getByRole("button", { name: "Resume battle", exact: true })
    .click();
  await expect
    .poll(async () => (await saved(page)).rpg.enemyHp)
    .toBeLessThan(before.rpg.enemyHp);
  await context.setOffline(false);
});
test("equipment, forging, quests, renown upgrades, and the next atlas page remain usable", async ({
  page,
}) => {
  await seed(page, (s) => strong(s));
  await tab(page, "Forge");
  await page.locator('[data-rpg-forge="weapon-2"]').click();
  expect((await saved(page)).rpg.forged["weapon-2"]).toBe(1);
  await page.locator('[data-kingdom-upgrade="helper"]').click();
  expect((await saved(page)).worlds[2].helpers).toBe(1);
  await page.locator("[data-next-page]").click();
  expect((await saved(page)).rpg.depth).toBe(1);
  await tab(page, "Journal");
  await page.locator('[data-rpg-claim="first-road"]').click();
  await expect(page.locator('[data-rpg-claim="first-road"]')).toBeDisabled();
  await tab(page, "Bag");
  await page
    .getByRole("button", { name: "Equip Daybreak", exact: true })
    .click();
  expect((await saved(page)).rpg.gear.weapon).toBe("weapon-7");
});
test("the maze, battle and party controls fit phones, desktop and landscape without a page scrollbar", async ({
  page,
}) => {
  await seed(page, (s) => strong(s));
  for (const [width, height] of [
    [320, 740],
    [390, 844],
    [768, 1024],
    [1440, 1000],
    [844, 390],
    [667, 375],
  ]) {
    await page.setViewportSize({ width, height });
    for (const name of ["World", "Party", "Bag", "Hero", "Forge", "Journal"]) {
      await tab(page, name);
      const bounds = await page
        .locator("#rpg-host")
        .evaluate((el) => ({ width: el.scrollWidth, height: el.scrollHeight }));
      expect(bounds.width, `${name} width at ${width}`).toBeLessThanOrEqual(
        width + 1,
      );
      expect(bounds.height, `${name} height at ${height}`).toBeLessThanOrEqual(
        height + 1,
      );
      const party = (await page.locator(".kingdom-party").boundingBox())!;
      expect(party.y + party.height).toBeLessThanOrEqual(height + 1);
      const ability = (await page
        .locator("[data-ability]")
        .first()
        .boundingBox())!;
      expect(ability.y).toBeGreaterThan(50);
      expect(ability.y + ability.height).toBeLessThanOrEqual(height + 1);
    }
    await tab(page, "World");
    await page.getByRole("button", { name: "Find party", exact: true }).click();
    await expect(page.locator(".atlas-cell.current")).toBeInViewport();
  }
});
