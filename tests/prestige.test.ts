import { test } from "node:test";
import assert from "node:assert/strict";
import {
  freshState,
  total,
  gateGoal,
  gateWords,
  prestige,
  prestigeReward,
  canPrestige,
  buyPrestigeUpgrade,
  productionBoost,
  idleBoost,
  cycleSpeed,
  worldAvailable,
  rate,
  price,
  advance,
  loadState,
  tapReward,
  rewardRenown,
  format,
  log10,
  PRESTIGE_UPGRADES,
} from "../src/game.ts";

function complete(s = freshState()) {
  s.unlocked = 7;
  s.worlds[0].score = 1e100;
  return s;
}
test("each prestige changes the exact gate number in the requested order", () => {
  const s = freshState();
  const targets = [
    10n ** 27n,
    10n ** 30n,
    10n ** 32n,
    42n * 10n ** 32n,
    42n * 10n ** 47n,
    42n * 10n ** 65n,
    42n * 10n ** 68n,
  ];
  const words = [
    "1 Million Billion Trillion",
    "1 Thousand Million Billion Trillion",
    "1 Hundred Thousand Million Billion Trillion",
    "42 Hundred Thousand Million Billion Trillion",
    "42 Hundred Thousand Million Billion Trillion Quadrillion",
    "42 Hundred Thousand Million Billion Trillion Quadrillion Quintillion",
  ];
  for (let i = 0; i < targets.length; i++) {
    assert.equal(gateGoal(s), targets[i]);
    if (words[i]) assert.equal(gateWords(s).join(" "), words[i]);
    assert.equal(s.prestige.count, i);
    assert.equal(prestige(complete(s)), true);
  }
});
test("prestige is earned, resets the run and kingdom, and keeps permanent progress", () => {
  const s = freshState();
  assert.equal(prestige(s), false);
  s.relics = ["spark"];
  s.sound = true;
  s.motion = false;
  s.clicks = 123;
  s.rpg.level = 10;
  s.rpg.gold = 999;
  s.worlds[0].helpers = 12;
  s.worlds[0].resonance = 8;
  assert.equal(prestige(complete(s)), true);
  assert.equal(s.prestige.count, 1);
  assert.equal(s.prestige.shards, 4);
  assert.deepEqual(s.prestige.upgrades, ["iridescent"]);
  assert.deepEqual(
    s.worlds.map((w) => [w.score, w.bank, w.helpers, w.power, w.resonance]),
    Array.from({ length: 9 }, () => [1, 0, 0, 1, 0]),
  );
  assert.equal(s.unlocked, 1);
  assert.equal(s.won, false);
  assert.equal(s.rpg.level, 1);
  assert.equal(s.rpg.gold, 0);
  assert.deepEqual(s.relics, ["spark", "answer"]);
  assert.equal(s.sound, true);
  assert.equal(s.motion, false);
  assert.equal(s.clicks, 123);
  assert.equal(canPrestige(s), false);
  assert.equal(prestige(s), false);
  assert.equal(s.prestige.shards, 4);
});
test("the first crystal is permanent and works while the other colors are still sealed", () => {
  const s = freshState();
  assert.equal(worldAvailable(s, 7), false);
  prestige(complete(s));
  assert.equal(worldAvailable(s, 7), true);
  assert.equal(worldAvailable(s, 1), false);
  s.worlds[7].score = 123;
  s.worlds[1].score = 999;
  assert.equal(total(s), 123n);
  s.worlds[7].helpers = 1;
  advance(s, 1);
  assert.ok(s.worlds[7].score > 123);
  assert.equal(s.worlds[1].score, 999);
});
test("the ninth crystal awakens exactly on prestige three and contributes much more", () => {
  const s = freshState();
  for (let p = 1; p <= 3; p++) {
    prestige(complete(s));
    assert.equal(worldAvailable(s, 8), p === 3);
    assert.equal(s.prestige.upgrades.includes("void"), p === 3);
  }
  assert.ok(tapReward(s, 8) > tapReward(s, 7) * 1000);
  const before = total(s);
  tapReward(s, 8, 4096);
  assert.ok(total(s) > before);
  assert.equal(tapReward(s, 9), 0);
});
test("tree purchases require their branch, prestige, and sufficient shards, and only charge once", () => {
  const s = freshState();
  assert.equal(buyPrestigeUpgrade(s, "kindling"), false);
  prestige(complete(s));
  assert.equal(buyPrestigeUpgrade(s, "iridescent"), false);
  assert.equal(buyPrestigeUpgrade(s, "void"), false);
  assert.equal(buyPrestigeUpgrade(s, "resonant"), false);
  assert.equal(buyPrestigeUpgrade(s, "bargain"), false);
  assert.equal(buyPrestigeUpgrade(s, "fake"), false);
  assert.equal(buyPrestigeUpgrade(s, "kindling"), true);
  assert.equal(s.prestige.shards, 3);
  assert.equal(buyPrestigeUpgrade(s, "kindling"), false);
  assert.equal(buyPrestigeUpgrade(s, "clockwork"), true);
  assert.equal(buyPrestigeUpgrade(s, "pockets"), true);
  assert.equal(s.prestige.shards, 0);
  assert.equal(buyPrestigeUpgrade(s, "bargain"), false);
  assert.equal(prestigeReward(s), 6);
  prestige(complete(s));
  assert.equal(s.prestige.shards, 6);
  assert.ok(s.prestige.upgrades.includes("clockwork"));
  assert.equal(buyPrestigeUpgrade(s, "resonant"), true);
});
test("permanent upgrades affect taps, helpers, RPG rewards, costs, and subsequent starting resources", () => {
  const s = freshState();
  prestige(complete(s));
  buyPrestigeUpgrade(s, "pockets");
  buyPrestigeUpgrade(s, "kindling");
  assert.equal(s.worlds[0].helpers, 2);
  assert.equal(s.worlds[0].bank, 100);
  assert.equal(tapReward(s, 0), 12);
  assert.equal(rate(s.worlds[0], s), 16);
  const score = s.worlds[0].score;
  advance(s, 10);
  assert.equal(s.worlds[0].score, score + 160);
  const oldPrice = price(s.worlds[0], "power", s);
  assert.equal(buyPrestigeUpgrade(s, "bargain"), true);
  assert.equal(price(s.worlds[0], "power", s), oldPrice / 5);
  assert.equal(rewardRenown(s, 10), 40);
  prestige(complete(s));
  assert.ok(s.worlds.every((w) => w.helpers === 2 && w.bank === 100));
  buyPrestigeUpgrade(s, "seeds");
  assert.ok(s.worlds.every((w) => w.helpers === 3 && w.resonance === 1));
  assert.ok(productionBoost(s, 0) > 1);
  assert.ok(cycleSpeed(s) > 1);
  assert.equal(idleBoost(s), 1);
});
test("late branches and void upgrades offer substantial gains without bypassing their gates", () => {
  const s = freshState();
  for (let i = 0; i < 5; i++) prestige(complete(s));
  s.prestige.shards = 200;
  const first = productionBoost(s, 0),
    voidFirst = productionBoost(s, 8);
  for (const n of PRESTIGE_UPGRADES)
    if (n.cost) assert.equal(buyPrestigeUpgrade(s, n.id), true, n.id);
  assert.ok(productionBoost(s, 0) >= first * 100);
  assert.ok(productionBoost(s, 8) >= voidFirst * 1e6);
  assert.equal(idleBoost(s), 6);
  const restored = loadState(JSON.stringify(s));
  assert.equal(restored.prestige.count, s.prestige.count);
  assert.equal(restored.prestige.shards, s.prestige.shards);
  assert.deepEqual(
    [...restored.prestige.upgrades].sort(),
    [...s.prestige.upgrades].sort(),
  );
  assert.equal(restored.worlds[8].resonance, 1);
});
test("eight-world saves migrate, including an already discovered secret, without a free prestige", () => {
  const s = freshState();
  s.worlds.pop();
  s.unlocked = 7;
  s.secret = true;
  const legacy = JSON.parse(JSON.stringify(s));
  delete legacy.prestige;
  legacy.worlds[7].score = 420;
  const restored = loadState(JSON.stringify(legacy));
  assert.equal(restored.worlds.length, 9);
  assert.equal(restored.worlds[7].score, 420);
  assert.equal(restored.secret, true);
  assert.equal(restored.prestige.count, 0);
  assert.equal(worldAvailable(restored, 8), false);
  const hidden = loadState(JSON.stringify({ ...legacy, secret: false }));
  assert.equal(worldAvailable(hidden, 7), false);
});
test("restoration rejects orphaned, premature, duplicate upgrades and endings below the new target", () => {
  const s = freshState();
  s.prestige = {
    count: 2,
    shards: -9,
    upgrades: ["genesis", "void", "rhythm", "kindling", "kindling", "fake"],
  };
  s.unlocked = 7;
  s.worlds[0].score = 1e28;
  s.won = true;
  const restored = loadState(JSON.stringify(s));
  assert.deepEqual(restored.prestige.upgrades, ["iridescent", "kindling"]);
  assert.equal(restored.prestige.shards, 0);
  assert.equal(restored.won, false);
  assert.equal(worldAvailable(restored, 8), false);
  assert.equal(
    loadState(JSON.stringify({ ...s, worlds: [null, ...s.worlds.slice(1)] }))
      .prestige.count,
    0,
  );
});
test("huge final scores format and calculate progress without Number overflow, including offline", () => {
  const s = freshState();
  s.prestige.count = 5;
  s.secret = true;
  s.unlocked = 7;
  for (const w of s.worlds) {
    w.score = 1e100;
    w.bank = 1e100;
    w.helpers = 3;
  }
  advance(s, 28800);
  assert.ok(total(s) > 10n ** 899n);
  assert.ok(Number.isFinite(log10(total(s))));
  assert.match(format(total(s)), /^\d(\.\d)?e\d+$/);
  assert.equal(format(42n * 10n ** 65n), "4.2e66");
  assert.equal(format(9999n * 10n ** 62n), "9.9e65");
  assert.ok(
    s.worlds.every(
      (w) => Number.isFinite(w.score) && w.score <= 1e100 && w.bank <= 1e100,
    ),
  );
});

test("RPG speed upgrades advance the battle clock as well as renown", () => {
  const regular = freshState();
  regular.unlocked = 3;
  regular.prestige.count = 2;
  regular.rpg.cleared = 1;
  regular.rpg.auto = true;
  const fast = loadState(JSON.stringify(regular));
  fast.prestige.upgrades = ["iridescent", "clockwork", "rhythm", "expedition"];
  const originalHp = regular.rpg.enemyHp;
  advance(regular, 0.2);
  advance(fast, 0.2);
  assert.equal(regular.rpg.enemyHp, originalHp);
  assert.ok(fast.rpg.enemyHp < originalHp);
});
