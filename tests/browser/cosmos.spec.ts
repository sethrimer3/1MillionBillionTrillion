import { test, expect, type Page } from "@playwright/test";
import { freshState, type State } from "../../src/game.ts";
async function seed(page: Page, edit?: (s: State) => void) {
  const s = freshState();
  s.unlocked = 7;
  s.clicks = 100;
  s.worlds.forEach((w) => (w.score = 100));
  edit?.(s);
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("cosmos-fixture")) {
      localStorage.setItem("mbt-save-v1", JSON.stringify(s));
      sessionStorage.setItem("cosmos-fixture", "yes");
    }
  }, s);
  await page.goto("/#world/5");
  await expect(page.locator(".cosmos-field")).toBeVisible();
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

test("catching drawn fireflies and placing them into a constellation raises the indigo multiplier", async ({
  page,
}) => {
  await seed(page);
  await expect(
    page.getByRole("button", { name: "Cosmos", exact: true }),
  ).toBeDisabled();
  for (let i = 1; i <= 5; i++)
    await page
      .getByRole("button", { name: "Catch firefly " + i, exact: true })
      .click();
  expect((await saved(page)).cosmos.caught).toBe(5);
  await expect(page.locator('[data-cosmos-resource="0"]')).toHaveText("15");
  await page.getByRole("button", { name: "Stars", exact: true }).click();
  await page.getByRole("button", { name: "Light star 1", exact: true }).click();
  await page.getByRole("button", { name: "Light star 2", exact: true }).click();
  await expect(
    page.locator('.cosmos-star-board [data-thread="0"]'),
  ).toHaveClass(/stitched/);
  for (let i = 3; i <= 5; i++)
    await page
      .getByRole("button", { name: "Light star " + i, exact: true })
      .click();
  const s = await saved(page);
  expect(s.cosmos.made[1]).toBe(1);
  expect(s.cosmos.resources[1]).toBe(1);
  expect(s.worlds[5].score).toBeGreaterThanOrEqual(140);
  expect(s.relics).toContain("constellation");
  await page.getByRole("button", { name: "Field", exact: true }).click();
  await expect(page.locator(".sky-body-0 img")).toBeVisible();
});
test("unfinished constellations, field cooldowns and locally drawn assets survive an offline reload", async ({
  page,
  context,
}) => {
  await seed(page);
  for (let i = 1; i <= 5; i++)
    await page
      .getByRole("button", { name: "Catch firefly " + i, exact: true })
      .click();
  await page.getByRole("button", { name: "Stars", exact: true }).click();
  for (let i = 1; i <= 2; i++)
    await page
      .getByRole("button", { name: "Light star " + i, exact: true })
      .click();
  const before = await saved(page);
  expect(before.cosmos.stitches[0].filter(Boolean).length).toBe(2);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Stars", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Light star 1", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect((await saved(page)).cosmos.resources[0]).toBe(9);
  for (let i = 3; i <= 5; i++)
    await page
      .getByRole("button", { name: "Light star " + i, exact: true })
      .click();
  expect((await saved(page)).cosmos.made[1]).toBe(1);
  await page.getByRole("button", { name: "Field", exact: true }).click();
  await page
    .getByRole("button", { name: "Catch firefly 6", exact: true })
    .click();
  expect(
    await page
      .locator(".wing-0")
      .first()
      .evaluate(
        (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
      ),
  ).toBe(true);
  await context.setOffline(false);
});
test("nets catch in the background and star looms consume their catches while another world is open", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.cosmos.glow = 500;
    s.cosmos.resources[0] = 30;
    s.cosmos.made[1] = 1;
  });
  await page.getByRole("button", { name: "Tools", exact: true }).click();
  await page
    .getByRole("button", { name: "Upgrade Lantern nets", exact: true })
    .click();
  await expect(page.locator('[data-tool-detail="nets"]')).toHaveText(
    "0.25 catches/s",
  );
  await page
    .getByRole("button", { name: "Upgrade Silk net", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Upgrade Star loom", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Upgrade Star loom", exact: true })
    .click();
  expect((await saved(page)).cosmos.upgrades).toMatchObject({
    nets: 1,
    mesh: 1,
    loom: 2,
  });
  await page.getByRole("button", { name: "The gate", exact: true }).click();
  await expect
    .poll(async () => (await saved(page)).cosmos.made[1], { timeout: 12000 })
    .toBeGreaterThan(1);
  expect((await saved(page)).cosmos.caught).toBeGreaterThan(0);
  await page.goto("/#world/5");
  await expect(
    page.getByRole("button", { name: "Catch firefly 1", exact: true }),
  ).toBeEnabled();
});
test("planets grow into solar systems, galaxies and universes with illustrated views and automatic recipes", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.cosmos.resources = [30, 5, 3, 3, 2, 0];
    s.cosmos.made = [30, 80, 15, 11, 2, 0];
  });
  for (const [name, tier] of [
    ["Planet", 2],
    ["Solar system", 3],
    ["Galaxy", 4],
    ["Universe", 5],
  ] as const) {
    await page
      .getByRole("button", { name: "Make " + name, exact: true })
      .click();
    await expect(page.locator(".cosmos-central-body img")).toBeVisible();
    expect((await saved(page)).cosmos.resources[tier]).toBe(
      tier === 5 ? 1 : tier === 4 ? 3 : 4,
    );
    expect(
      await page
        .locator(".cosmos-central-body img")
        .evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0,
        ),
    ).toBe(true);
  }
  await expect(page.locator(".cosmos-central-body img")).toHaveAttribute(
    "src",
    /cosmos-universe\.svg$/,
  );
  const s = await saved(page);
  expect(s.cosmos.resources.slice(1)).toEqual([0, 0, 0, 0, 1]);
  const auto = page.getByRole("button", {
    name: "Automate Planets",
    exact: true,
  });
  await auto.click();
  await expect(auto).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  expect((await saved(page)).cosmos.auto[2]).toBe(true);
  await page.getByRole("button", { name: "Cosmos", exact: true }).click();
  await page
    .getByRole("button", { name: "View Universes", exact: true })
    .click();
  await expect(page.locator(".cosmos-central-body img")).toHaveAttribute(
    "src",
    /cosmos-universe\.svg$/,
  );
});
test("larger constellation patterns unlock, retain their drawings and show new shapes", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.cosmos.resources[0] = 100;
    s.cosmos.made[1] = 3;
  });
  await page.getByRole("button", { name: "Stars", exact: true }).click();
  await page.getByRole("button", { name: "Light star 1", exact: true }).click();
  await page
    .getByRole("button", { name: "Weave The wandering moth", exact: true })
    .click();
  await expect(
    page.locator('[data-recipe="1"] .cosmos-ingredients'),
  ).toHaveText("24→2");
  await expect(page.locator("[data-star]")).toHaveCount(6);
  await page.getByRole("button", { name: "Light star 3", exact: true }).click();
  expect((await saved(page)).cosmos.stitches[1][2]).toBe(true);
  await page
    .getByRole("button", { name: "Weave The little kite", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Light star 1", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("the field, star board, cosmic views and controls fit phones, desktop and landscape", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.cosmos.resources = [100, 10, 4, 4, 3, 1];
    s.cosmos.made = [100, 100, 20, 15, 4, 1];
    s.cosmos.glow = 10000;
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
    for (const mode of ["Field", "Stars", "Cosmos"]) {
      await page.getByRole("button", { name: mode, exact: true }).click();
      for (const tab of ["Create", "Tools"]) {
        await page.getByRole("button", { name: tab, exact: true }).click();
        const bounds = await page.locator("#cosmos-host").evaluate((el) => ({
          width: el.scrollWidth,
          height: el.scrollHeight,
        }));
        expect(bounds.width, mode + " width at " + width).toBeLessThanOrEqual(
          width + 1,
        );
        expect(
          bounds.height,
          mode + " height at " + height,
        ).toBeLessThanOrEqual(height + 1);
        const stage = (await page.locator(".cosmos-stage").boundingBox())!;
        expect(stage.height).toBeGreaterThan(100);
        const button = page.getByRole("button", {
          name:
            tab === "Create" ? "Weave a constellation" : "Upgrade Lantern nets",
          exact: true,
        });
        await button.scrollIntoViewIfNeeded();
        const rect = (await button.boundingBox())!;
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(width + 1);
        expect(rect.y + rect.height).toBeLessThanOrEqual(height + 1);
      }
      if (mode === "Stars") {
        for (let star = 1; star <= 5; star++)
          await page
            .getByRole("button", { name: "Light star " + star, exact: true })
            .click();
      }
    }
  }
});
