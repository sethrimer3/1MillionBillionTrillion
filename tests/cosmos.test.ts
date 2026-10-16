import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BODIES,
  PATTERNS,
  createCosmos,
  actCosmos,
  tickCosmos,
  restoreCosmos,
  cosmosStage,
  cosmosRates,
  catchRate,
  catchYield,
  toolCost,
  patternAvailable,
  type CosmosState,
} from "../src/cosmos.ts";
import {
  freshState,
  cosmosAction,
  advance,
  loadState,
  total,
  prestige,
  buyPrestigeUpgrade,
  discoveries,
} from "../src/game.ts";
function pattern(s: CosmosState) {
  let glow = 0;
  for (let i = 0; i < PATTERNS[s.pattern].nodes.length; i++) {
    const out = actCosmos(s, { kind: "star", id: i });
    assert.equal(out.changed, true);
    glow += out.glow;
  }
  return glow;
}
test("fireflies can be caught once, replenish, and pay light and ingredients together", () => {
  const s = createCosmos();
  const out = actCosmos(s, { kind: "catch", id: 0 });
  assert.equal(out.glow, 3);
  assert.equal(s.resources[0], 3);
  assert.equal(s.glow, 3);
  assert.equal(s.caught, 1);
  assert.equal(actCosmos(s, { kind: "catch", id: 0 }).changed, false);
  assert.equal(actCosmos(s, { kind: "catch", id: 12 }).changed, false);
  assert.equal(actCosmos(s, { kind: "catch", id: NaN }).changed, false);
  tickCosmos(s, 3);
  assert.equal(actCosmos(s, { kind: "catch", id: 0 }).changed, true);
  assert.equal(s.resources[0], 6);
});
test("individual fireflies become drawn stars, and a completed constellation pays once", () => {
  const s = createCosmos();
  s.resources[0] = 15;
  assert.equal(actCosmos(s, { kind: "star", id: 4 }).changed, true);
  assert.equal(s.resources[0], 12);
  assert.equal(s.resources[1], 0);
  assert.equal(actCosmos(s, { kind: "star", id: 4 }).changed, false);
  assert.equal(s.resources[0], 12);
  let reward = 0;
  for (let i = 0; i < 4; i++)
    reward += actCosmos(s, { kind: "star", id: i }).glow;
  assert.equal(reward, 25);
  assert.equal(s.resources[0], 0);
  assert.equal(s.resources[1], 1);
  assert.equal(s.made[1], 1);
  assert.equal(s.gallery[0], 1);
  assert.ok(s.stitches[0].every((x) => !x));
  assert.equal(actCosmos(s, { kind: "star", id: 0 }).changed, false);
  assert.equal(s.resources[1], 1);
});
test("new patterns are earned, keep separate unfinished drawings, and have their own costs and yields", () => {
  const s = createCosmos();
  s.resources[0] = 100;
  assert.equal(patternAvailable(s, 1), false);
  assert.equal(actCosmos(s, { kind: "pattern", id: 1 }).changed, false);
  pattern(s);
  pattern(s);
  pattern(s);
  assert.equal(patternAvailable(s, 1), true);
  actCosmos(s, { kind: "star", id: 0 });
  actCosmos(s, { kind: "pattern", id: 1 });
  const before = s.resources[0];
  assert.equal(pattern(s), 50);
  assert.equal(before - s.resources[0], 24);
  actCosmos(s, { kind: "pattern", id: 0 });
  assert.equal(s.stitches[0][0], true);
  assert.equal(s.resources[1], 5);
  actCosmos(s, { kind: "craft", id: 2 });
  assert.equal(patternAvailable(s, 2), true);
  actCosmos(s, { kind: "pattern", id: 2 });
  s.resources[0] = 35;
  assert.equal(pattern(s), 75);
  assert.equal(s.resources[1], 3);
});
test("constellations become planets, systems, galaxies and universes through real ingredient costs", () => {
  const s = createCosmos();
  s.resources[0] = 15 * 5 * 4 * 4 * 3;
  const count = 5 * 4 * 4 * 3;
  for (let i = 0; i < count; i++) pattern(s);
  for (let tier = 2; tier < 6; tier++) {
    const possible = Math.floor(s.resources[tier - 1] / BODIES[tier].cost);
    assert.ok(possible > 0);
    for (let i = 0; i < possible; i++)
      assert.equal(actCosmos(s, { kind: "craft", id: tier }).changed, true);
    assert.equal(s.resources[tier - 1], 0);
    assert.equal(s.resources[tier], possible);
    assert.equal(cosmosStage(s), tier);
  }
  assert.equal(s.resources[5], 1);
  assert.ok(cosmosRates(s).glow >= 75000);
  assert.equal(actCosmos(s, { kind: "craft", id: 5 }).changed, false);
  assert.equal(s.resources[5], 1);
});
test("held bodies generate light and fireflies, and consumed ingredients stop producing", () => {
  const s = createCosmos();
  s.resources[1] = 5;
  s.made[1] = 5;
  assert.deepEqual(cosmosRates(s), { glow: 3, flies: 1 });
  actCosmos(s, { kind: "craft", id: 2 });
  assert.equal(s.resources[1], 0);
  assert.deepEqual(cosmosRates(s), { glow: 10, flies: 3 });
  const glow = s.glow;
  assert.equal(tickCosmos(s, 10), 100);
  assert.equal(s.glow, glow + 100);
  assert.equal(s.resources[0], 30);
});
test("nets, silk, flowers, looms and orbit upgrades are gated, paid once per level, and bounded", () => {
  const s = createCosmos();
  s.glow = 10000;
  assert.equal(actCosmos(s, { kind: "upgrade", id: "loom" }).changed, false);
  assert.equal(actCosmos(s, { kind: "upgrade", id: "orbit" }).changed, false);
  const cost = toolCost(s, "nets");
  actCosmos(s, { kind: "upgrade", id: "nets" });
  assert.equal(s.glow, 10000 - cost);
  assert.equal(catchRate(s), 0.25);
  actCosmos(s, { kind: "upgrade", id: "mesh" });
  assert.equal(catchYield(s), 5);
  actCosmos(s, { kind: "upgrade", id: "lure" });
  assert.ok(catchRate(s) > 0.25);
  s.made[1] = 1;
  assert.equal(actCosmos(s, { kind: "upgrade", id: "loom" }).changed, true);
  s.made[2] = 1;
  assert.equal(actCosmos(s, { kind: "upgrade", id: "orbit" }).changed, true);
  s.upgrades.nets = 40;
  assert.equal(actCosmos(s, { kind: "upgrade", id: "nets" }).changed, false);
  assert.equal(
    actCosmos(s, { kind: "upgrade", id: "__proto__" as any }).changed,
    false,
  );
});
test("automatic catching does not remove the fireflies available for manual catches", () => {
  const s = createCosmos();
  s.upgrades.nets = 40;
  s.upgrades.lure = 40;
  s.upgrades.mesh = 50;
  tickCosmos(s, 4);
  assert.ok(s.caught > 100);
  assert.equal(actCosmos(s, { kind: "catch", id: 0 }).changed, true);
});
test("a loom consumes one firefly cost per star, finishes partial work, and batches complete patterns", () => {
  const s = createCosmos();
  s.made[1] = 1;
  s.upgrades.loom = 1;
  s.resources[0] = 30;
  actCosmos(s, { kind: "star", id: 3 });
  const gain = tickCosmos(s, 10);
  assert.equal(s.made[1], 2);
  assert.equal(s.resources[1], 1);
  assert.ok(gain >= 25);
  assert.equal(s.stitches[0].filter(Boolean).length, 0);
  assert.ok(s.resources[0] >= 15 && s.resources[0] < 16); // the completed constellation also starts producing.
  const dry = createCosmos();
  dry.made[1] = 1;
  dry.upgrades.loom = 80;
  tickCosmos(dry, 300);
  assert.equal(dry.resources[1], 0);
  assert.equal(dry.made[1], 1);
});
test("automatic recipes require a first manual creation and consume their inputs", () => {
  const s = createCosmos();
  s.resources[1] = 100;
  s.made[1] = 100;
  assert.equal(actCosmos(s, { kind: "auto", id: 2 }).changed, false);
  actCosmos(s, { kind: "craft", id: 2 });
  actCosmos(s, { kind: "auto", id: 2 });
  tickCosmos(s, 8);
  assert.equal(s.made[2], 3);
  assert.equal(s.resources[1], 85);
  actCosmos(s, { kind: "auto", id: 2 });
  const made = s.made[2];
  tickCosmos(s, 10);
  assert.equal(s.made[2], made);
});
test("offline construction preserves material costs through the complete chain and stays finite", () => {
  const s = createCosmos();
  s.made = [0, 1, 1, 1, 1, 1];
  s.resources[0] = 1e7;
  s.upgrades.loom = 80;
  s.upgrades.nets = 20;
  s.upgrades.mesh = 20;
  s.upgrades.orbit = 30;
  s.auto = [false, false, true, true, true, true];
  const glow = tickCosmos(s, 28800 * 384);
  assert.ok(glow > 0);
  assert.ok(s.resources[5] > 0);
  assert.ok(s.made[5] > 1);
  assert.ok(
    [...s.resources, ...s.made, s.glow, s.earned, s.time].every(
      (n) => Number.isFinite(n) && n >= 0,
    ),
  );
  assert.equal(tickCosmos(s, -10), 0);
  assert.equal(tickCosmos(s, Infinity), 0);
});
test("saves retain resources, partial constellations, cooldowns, tools and automation without paying again", () => {
  const s = createCosmos();
  s.resources[0] = 100;
  s.made[1] = 5;
  s.made[2] = 1;
  s.resources[2] = 1;
  actCosmos(s, { kind: "star", id: 2 });
  actCosmos(s, { kind: "catch", id: 4 });
  s.upgrades.loom = 2;
  actCosmos(s, { kind: "auto", id: 2 });
  const restored = restoreCosmos(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.resources, s.resources);
  assert.deepEqual(restored.stitches, s.stitches);
  assert.deepEqual(restored.auto, s.auto);
  assert.equal(restored.upgrades.loom, 2);
  assert.equal(restored.glow, s.glow);
  assert.equal(actCosmos(restored, { kind: "catch", id: 4 }).changed, false);
  const all = restoreCosmos({
    ...s,
    stitches: PATTERNS.map((p) => p.nodes.map(() => true)),
  });
  assert.ok(all.stitches.every((row) => row.every((x) => !x)));
  assert.equal(all.glow, s.glow);
});
test("corrupt saves cannot inject labels, invalid automations, unlimited tool levels or non-finite resources", () => {
  const s = restoreCosmos({
    resources: [Infinity, -1, NaN],
    made: [null],
    glow: NaN,
    earned: -1,
    pattern: 99,
    upgrades: { nets: Infinity, mesh: -4, loom: 9999 },
    auto: Array(99).fill(true),
    ready: [Infinity, -100],
    gallery: ["<script>"],
    stitches: [null],
  });
  assert.ok(s.resources.every((n) => n === 0));
  assert.equal(s.glow, 0);
  assert.equal(s.upgrades.loom, 0);
  assert.equal(s.pattern, 0);
  assert.equal(s.auto.some(Boolean), false);
  assert.equal(s.ready.length, 12);
  assert.equal(s.stitches[0].length, 5);
});
test("indigo actions are gated and feed the multiplied score without spending lifetime light", () => {
  const s = freshState();
  assert.equal(cosmosAction(s, { kind: "catch", id: 0 }).changed, false);
  assert.equal(s.cosmos.caught, 0);
  s.unlocked = 6;
  const before = total(s);
  cosmosAction(s, { kind: "catch", id: 0 });
  assert.ok(total(s) > before);
  assert.equal(s.worlds[5].score, 4);
  s.cosmos.glow = 100;
  const score = s.worlds[5].score;
  cosmosAction(s, { kind: "upgrade", id: "nets" });
  assert.equal(s.worlds[5].score, score);
  advance(s, 4);
  assert.ok(s.cosmos.caught >= 2);
  assert.ok(s.worlds[5].score > score);
  s.cosmos.resources[0] = 15;
  for (let i = 0; i < 5; i++) cosmosAction(s, { kind: "star", id: i });
  assert.ok(discoveries(s).includes("constellation"));
  assert.ok(!discoveries(s).includes("constellation"));
});
test("old pond currency and upgrades migrate once, while new partial drawings survive reloading", () => {
  const old = JSON.parse(JSON.stringify(freshState()));
  delete old.cosmos;
  old.worlds[5].bank = 123;
  old.worlds[5].score = 420;
  old.worlds[5].helpers = 3;
  old.worlds[5].power = 4;
  const s = loadState(JSON.stringify(old));
  assert.equal(s.cosmos.glow, 123);
  assert.equal(s.cosmos.upgrades.nets, 3);
  assert.equal(s.cosmos.upgrades.mesh, 3);
  assert.equal(s.worlds[5].score, 420);
  actCosmos(s.cosmos, { kind: "upgrade", id: "nets" });
  const reload = loadState(JSON.stringify(s));
  assert.equal(reload.cosmos.glow, s.cosmos.glow);
  assert.notEqual(reload.cosmos.glow, 123);
});
test("prestige resets the cosmos and permanent starting supplies and speed improve subsequent runs", () => {
  const s = freshState();
  s.unlocked = 7;
  s.worlds[0].score = 1e40;
  s.cosmos.made[5] = 1;
  s.cosmos.resources[5] = 1;
  assert.equal(prestige(s), true);
  assert.equal(s.cosmos.made[5], 0);
  assert.equal(s.cosmos.resources[0], 0);
  assert.equal(buyPrestigeUpgrade(s, "pockets"), true);
  assert.equal(s.cosmos.glow, 100);
  assert.equal(s.cosmos.upgrades.nets, 2);
  s.unlocked = 6;
  const base = freshState();
  base.unlocked = 6;
  base.cosmos.upgrades.nets = 2;
  advance(base, 20);
  advance(s, 20);
  assert.ok(s.cosmos.caught > base.cosmos.caught);
  assert.ok(s.worlds[5].score > base.worlds[5].score);
});

test("offline catches are capped at eight real hours and large legacy banks remain usable", () => {
  const a = freshState(),
    b = freshState();
  a.unlocked = b.unlocked = 6;
  a.cosmos.upgrades.nets = b.cosmos.upgrades.nets = 1;
  advance(a, 28800);
  advance(b, 999999);
  assert.equal(a.cosmos.caught, b.cosmos.caught);
  assert.equal(a.cosmos.caught, 7200);
  assert.equal(a.worlds[5].score, 21601);
  const legacy = JSON.parse(JSON.stringify(a));
  delete legacy.cosmos;
  legacy.worlds[5].bank = 1e100;
  const loaded = loadState(JSON.stringify(legacy));
  assert.equal(loaded.cosmos.glow, 1e90);
  assert.ok(actCosmos(loaded.cosmos, { kind: "upgrade", id: "nets" }).changed);
});
