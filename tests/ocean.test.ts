import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createOcean,
  actOcean,
  tickOcean,
  restoreOcean,
  oceanCapacity,
  oceanProgress,
  lavaPower,
  rainRate,
  oceanCost,
  oceanRate,
} from "../src/ocean.ts";
import {
  freshState,
  oceanAction,
  advance,
  loadState,
  prestige,
  buyPrestigeUpgrade,
  discoveries,
} from "../src/game.ts";

test("lava must land before it drains water or earns obsidian, and each impact pays once", () => {
  const s = createOcean();
  assert.ok(actOcean(s, { kind: "rain", id: 0 }).changed);
  assert.equal(actOcean(s, { kind: "rain", id: 0 }).changed, false);
  assert.equal(actOcean(s, { kind: "rain", id: 3 }).changed, false);
  assert.equal(actOcean(s, { kind: "rain", id: NaN }).changed, false);
  assert.equal(tickOcean(s, 0.8), 0);
  assert.equal(s.water, 1600);
  assert.equal(tickOcean(s, 0.1), 8);
  assert.equal(s.water, 1592);
  assert.equal(s.obsidian, 8);
  assert.equal(tickOcean(s, 10), 0);
  assert.equal(s.impacts, 1);
  assert.equal(s.drops.length, 0);
});
test("water never goes negative; finds and the drained ocean pay once, without recycling excess heat", () => {
  const s = createOcean();
  s.upgrades.heat = 100;
  s.upgrades.shower = 60;
  actOcean(s, { kind: "rain", id: 1 });
  tickOcean(s, 1);
  assert.equal(s.water, 0);
  assert.equal(s.drained, 1600);
  assert.equal(s.cleared, 1);
  assert.deepEqual(s.finds, [1, 1, 1, 1]);
  assert.equal(s.earned, 2000);
  assert.equal(oceanProgress(s), 1);
  tickOcean(s, 50);
  assert.equal(s.earned, 2000);
  assert.equal(s.cleared, 1);
  assert.equal(actOcean(s, { kind: "rain", id: 1 }).changed, false);
  assert.equal(actOcean(s, { kind: "next" }).changed, true);
  assert.equal(s.basin, 1);
  assert.equal(s.water, oceanCapacity(1));
  assert.equal(oceanProgress(s), 0);
  assert.equal(actOcean(s, { kind: "next" }).changed, false);
  actOcean(s, { kind: "rain", id: 1 });
  tickOcean(s, 1);
  assert.equal(s.cleared, 2);
  assert.ok(s.earned > 2000 + 6400);
});
test("partial depths uncover each find once and spending obsidian never subtracts lifetime steam", () => {
  const s = createOcean();
  s.upgrades.clouds = 1;
  tickOcean(s, 80);
  assert.equal(s.finds[0], 1);
  assert.equal(s.finds[1], 0);
  const earned = s.earned,
    wallet = s.obsidian,
    cost = oceanCost(s, "heat");
  assert.ok(actOcean(s, { kind: "upgrade", id: "heat" }).changed);
  assert.equal(s.obsidian, wallet - cost);
  assert.equal(s.earned, earned);
  tickOcean(s, 30);
  assert.equal(s.finds[0], 1);
});
test("all upgrades charge their real cost, increase production and enforce caps and discovery gates", () => {
  const s = createOcean();
  s.obsidian = 1e8;
  for (const id of ["vents", "horizon"] as const)
    assert.equal(actOcean(s, { kind: "upgrade", id }).changed, false);
  let last = oceanRate(s);
  for (const id of ["clouds", "heat", "shower"] as const) {
    const cost = oceanCost(s, id),
      money = s.obsidian;
    actOcean(s, { kind: "upgrade", id });
    assert.equal(s.obsidian, money - cost);
    assert.ok(oceanRate(s) > last);
    last = oceanRate(s);
  }
  assert.ok(lavaPower(s) > 8);
  assert.equal(rainRate(s), 0.65);
  s.cleared = 1;
  assert.ok(actOcean(s, { kind: "upgrade", id: "vents" }).changed);
  assert.ok(actOcean(s, { kind: "upgrade", id: "horizon" }).changed);
  assert.ok(s.autoVoyage);
  assert.equal(actOcean(s, { kind: "upgrade", id: "horizon" }).changed, false);
  s.upgrades.clouds = 80;
  assert.equal(actOcean(s, { kind: "upgrade", id: "clouds" }).changed, false);
  assert.equal(
    actOcean(s, { kind: "upgrade", id: "__proto__" as any }).changed,
    false,
  );
  s.obsidian = 0;
  assert.equal(actOcean(s, { kind: "upgrade", id: "heat" }).changed, false);
});
test("automatic voyages carry heat into deeper oceans, and can be paused without losing upgrades", () => {
  const s = createOcean();
  s.upgrades.clouds = 20;
  s.upgrades.horizon = 1;
  s.autoVoyage = true;
  const reward = tickOcean(s, 200);
  assert.ok(s.basin >= 1);
  assert.ok(s.water > 0);
  assert.ok(reward > 0);
  assert.ok(s.cleared >= 1);
  assert.ok(actOcean(s, { kind: "voyage" }).changed);
  assert.equal(s.autoVoyage, false);
  tickOcean(s, 28800);
  assert.equal(s.water, 0);
  const cleared = s.cleared;
  tickOcean(s, 28800);
  assert.equal(s.cleared, cleared);
  actOcean(s, { kind: "voyage" });
  tickOcean(s, 1);
  assert.ok(s.water > 0);
  assert.ok(s.basin > cleared - 1);
});
test("bulk offline evaporation matches small live clocks across voyages and manual impacts", () => {
  const a = createOcean();
  a.upgrades = { clouds: 18, heat: 8, shower: 3, vents: 2, horizon: 1 };
  a.autoVoyage = true;
  a.cleared = 1;
  actOcean(a, { kind: "rain", id: 0 });
  actOcean(a, { kind: "rain", id: 1 });
  const b = structuredClone(a);
  tickOcean(a, 1200);
  for (let i = 0; i < 12000; i++) tickOcean(b, 0.1);
  assert.equal(a.basin, b.basin);
  assert.equal(a.cleared, b.cleared);
  assert.deepEqual(a.finds, b.finds);
  assert.ok(Math.abs(a.water - b.water) < 1e-5);
  assert.ok(Math.abs(a.earned - b.earned) < 1e-5);
  const max = createOcean();
  max.upgrades = { clouds: 80, heat: 100, shower: 60, vents: 80, horizon: 1 };
  max.autoVoyage = true;
  tickOcean(max, 28800 * 384);
  assert.ok(max.basin > 100);
  assert.ok(Number.isFinite(max.earned));
  assert.ok(max.water >= 0);
  assert.equal(tickOcean(max, Infinity), 0);
  assert.equal(tickOcean(max, -1), 0);
});
test("saved lava resumes in flight, cooldowns persist, and restoring does not repeat paid finds", () => {
  const s = createOcean();
  actOcean(s, { kind: "rain", id: 2 });
  tickOcean(s, 0.1);
  const restored = restoreOcean(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.drops, s.drops);
  assert.equal(actOcean(restored, { kind: "rain", id: 2 }).changed, false);
  assert.equal(tickOcean(restored, 1), 8);
  assert.equal(tickOcean(restoreOcean(restored), 1), 0);
  s.upgrades.clouds = 1;
  tickOcean(s, 100);
  const r = restoreOcean(s),
    earned = r.earned;
  tickOcean(r, 0.01);
  assert.equal(r.finds[0], 1);
  assert.equal(r.earned, earned);
});
test("malformed saves cannot add invalid lava, duplicate impacts, negative water or unlimited tools", () => {
  const s = createOcean();
  actOcean(s, { kind: "rain", id: 0 });
  const r = restoreOcean({
    ...s,
    drops: [s.drops[0], s.drops[0], { ...s.drops[0], id: 99, power: Infinity }],
    obsidian: NaN,
    water: -1,
    upgrades: { clouds: Infinity, heat: 1e9, vents: 80, horizon: 1 },
    autoVoyage: true,
    finds: [Infinity, -4],
  });
  assert.equal(r.drops.length, 1);
  assert.equal(r.water, 0);
  assert.equal(r.obsidian, 0);
  assert.equal(r.upgrades.clouds, 0);
  assert.equal(r.upgrades.heat, 100);
  assert.equal(r.upgrades.vents, 0);
  assert.equal(r.autoVoyage, false);
  assert.deepEqual(r.finds, [0, 0, 0, 0]);
});
test("blue actions are gated; actual evaporation feeds the gate while legacy helpers don't double pay", () => {
  const s = freshState();
  assert.equal(oceanAction(s, { kind: "rain", id: 0 }).changed, false);
  s.unlocked = 5;
  s.worlds[4].helpers = 10;
  oceanAction(s, { kind: "rain", id: 0 });
  advance(s, 0.5);
  assert.equal(s.worlds[4].score, 1);
  advance(s, 0.5);
  assert.equal(s.worlds[4].score, 9);
  s.ocean.upgrades.clouds = 1;
  advance(s, 4);
  assert.ok(s.worlds[4].score > 9);
  s.ocean.upgrades.heat = 100;
  s.ocean.upgrades.shower = 60;
  advance(s, 4);
  assert.ok(discoveries(s).includes("storm"));
  assert.ok(!discoveries(s).includes("storm"));
});
test("old cloud balances and helpers migrate once without resetting blue score", () => {
  const old = JSON.parse(JSON.stringify(freshState()));
  delete old.ocean;
  old.worlds[4] = {
    score: 4200,
    bank: 150,
    helpers: 2,
    power: 4,
    resonance: 1,
  };
  const s = loadState(JSON.stringify(old));
  assert.equal(s.worlds[4].score, 4200);
  assert.equal(s.ocean.obsidian, 150);
  assert.equal(s.ocean.upgrades.clouds, 2);
  assert.equal(s.ocean.upgrades.heat, 3);
  actOcean(s.ocean, { kind: "upgrade", id: "clouds" });
  assert.equal(s.ocean.obsidian, 82);
  assert.equal(loadState(JSON.stringify(s)).ocean.obsidian, 82);
});
test("prestige resets oceans and permanent starting supplies and clocks speed up the next voyage", () => {
  const s = freshState();
  s.unlocked = 7;
  s.worlds[0].score = 1e40;
  s.ocean.cleared = 3;
  s.ocean.finds[0] = 3;
  assert.ok(prestige(s));
  assert.equal(s.ocean.cleared, 0);
  assert.equal(s.ocean.finds[0], 0);
  assert.ok(buyPrestigeUpgrade(s, "pockets"));
  assert.equal(s.ocean.obsidian, 100);
  assert.equal(s.ocean.upgrades.clouds, 2);
  s.unlocked = 5;
  const base = freshState();
  base.unlocked = 5;
  base.ocean.upgrades.clouds = 2;
  advance(s, 10);
  advance(base, 10);
  assert.ok(s.ocean.drained > base.ocean.drained);
  assert.ok(s.worlds[4].score > base.worlds[4].score);
});
test("offline ocean clocks cap at eight real hours before applying prestige speed", () => {
  const a = freshState(),
    b = freshState();
  a.unlocked = b.unlocked = 5;
  for (const s of [a, b]) {
    s.ocean.upgrades.clouds = 3;
    s.ocean.upgrades.horizon = 1;
    s.ocean.autoVoyage = true;
    s.ocean.cleared = 1;
  }
  advance(a, 28800);
  advance(b, 999999);
  assert.deepEqual(a.ocean, b.ocean);
  assert.equal(a.worlds[4].score, b.worlds[4].score);
});
