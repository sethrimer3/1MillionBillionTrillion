import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HULLS,
  createArena,
  tickArena,
  crystalHealth,
  crystalValue,
  damageCrystal,
  shipDamage,
  shipSpeed,
  shipCost,
  arenaUpgradeCost,
  buyArenaUpgrade,
  buyShip,
  mergeShips,
  restoreArena,
  resizeArena,
  surgeFleet,
  fleetCapacity,
  weakestCrystal,
} from "../src/arena.ts";
import {
  freshState,
  advance,
  total,
  prestige,
  loadState,
  buyPrestigeUpgrade,
} from "../src/game.ts";

function field(tier = 0) {
  const s = createArena();
  s.unlocked = tier;
  Object.assign(s.ships[0], {
    tier,
    x: 220,
    y: 400,
    angle: 0,
    cooldown: 1000,
    contact: 0,
  });
  s.crystals.forEach((c, i) =>
    Object.assign(c, {
      x: 70 + i * 110,
      y: 80,
      radius: 30,
      angle: 0,
      hp: 100,
      maxHp: 100,
    }),
  );
  Object.assign(s.crystals[0], { x: 404, y: 400, radius: 45 });
  return s;
}
test("ships keep moving forward, bounce off polygon edges, and don't earn money on contact", () => {
  const s = field();
  const ship = s.ships[0];
  ship.x = 300;
  tickArena(s, 1 / 60);
  assert.ok(ship.x > 300);
  assert.equal(ship.y, 400);
  tickArena(s, 0.75);
  assert.equal(s.crystals[0].hp, 86);
  assert.ok(Math.cos(ship.angle) < 0);
  assert.equal(s.money, 0);
  assert.equal(s.destroyed, 0);
});
test("walls reflect ships and even fully upgraded ships cannot tunnel through a crystal", () => {
  const s = field();
  const ship = s.ships[0];
  ship.x = 707;
  ship.y = 600;
  tickArena(s, 0.1);
  assert.ok(Math.cos(ship.angle) < 0);
  assert.ok(ship.x <= 708);
  ship.x = 220;
  ship.y = 400;
  ship.angle = 0;
  ship.contact = 0;
  s.upgrades.speed = 1000;
  tickArena(s, 0.012);
  assert.ok(s.crystals[0].hp < 100);
  assert.ok(Math.cos(ship.angle) < 0);
});
test("crystals pay exactly once when destroyed; buying ships spends cash but keeps lifetime earnings", () => {
  const s = createArena(),
    c = s.crystals[0];
  assert.equal(damageCrystal(s, c, 13), 0);
  assert.equal(s.money, 0);
  assert.equal(damageCrystal(s, c, 1), 12);
  assert.equal(s.money, 12);
  assert.equal(s.earned, 12);
  assert.equal(damageCrystal(s, c, 99), 0);
  assert.equal(s.destroyed, 1);
  damageCrystal(s, s.crystals[1], 14);
  assert.equal(buyShip(s, 0), true);
  assert.equal(s.money, 6);
  assert.equal(s.earned, 24);
  assert.equal(buyShip(s, 0), false);
  assert.equal(buyShip(s, 5), false);
  assert.equal(damageCrystal(s, s.crystals[2], Infinity), 0);
});
test("difficulty, crystal payouts, ship costs, damage, speed, and capacity increase linearly", () => {
  assert.equal(
    crystalHealth(3) - crystalHealth(2),
    crystalHealth(2) - crystalHealth(1),
  );
  assert.equal(
    crystalValue(3) - crystalValue(2),
    crystalValue(2) - crystalValue(1),
  );
  const s = createArena();
  s.money = 1e6;
  for (const key of ["damage", "speed", "capacity"] as const) {
    const costs: number[] = [],
      stats: number[] = [];
    for (let i = 0; i < 3; i++) {
      costs.push(arenaUpgradeCost(s, key));
      stats.push(
        key === "damage"
          ? shipDamage(s, 0)
          : key === "speed"
            ? shipSpeed(s, 0)
            : fleetCapacity(s),
      );
      assert.equal(buyArenaUpgrade(s, key), true);
    }
    assert.equal(costs[2] - costs[1], costs[1] - costs[0]);
    assert.equal(stats[2] - stats[1], stats[1] - stats[0]);
  }
  const costs = [];
  for (let i = 0; i < 3; i++) {
    costs.push(shipCost(s, 0));
    buyShip(s, 0);
  }
  assert.equal(costs[2] - costs[1], costs[1] - costs[0]);
  s.upgrades.capacity = 12;
  assert.equal(fleetCapacity(s), 32);
  assert.equal(buyArenaUpgrade(s, "capacity"), false);
});
test("two matching hulls merge into one, unlocking every weapon without losing the last ship", () => {
  const s = createArena();
  s.money = 1e6;
  assert.equal(mergeShips(s, 0), false);
  assert.equal(mergeShips(s, -1), false);
  for (let tier = 0; tier < 5; tier++) {
    assert.equal(buyShip(s, tier), true);
    assert.equal(s.ships.length, 2);
    assert.equal(mergeShips(s, tier), true);
    assert.equal(s.ships.length, 1);
    assert.equal(s.ships[0].tier, tier + 1);
    assert.equal(s.unlocked, tier + 1);
  }
  assert.equal(s.merges, 5);
  assert.equal(mergeShips(s, 5), false);
  while (s.ships.length < fleetCapacity(s)) assert.equal(buyShip(s, 0), true);
  const money = s.money;
  assert.equal(buyShip(s, 0), false);
  assert.equal(s.money, money);
});
test("gun and spiral hulls fire forward and in six rotating directions", () => {
  const gun = field(1);
  gun.ships[0].cooldown = 0;
  tickArena(gun, 1 / 60);
  assert.equal(gun.shots.length, 1);
  assert.equal(gun.shots[0].angle, 0);
  assert.equal(gun.shots[0].kind, "bolt");
  const spiral = field(4);
  spiral.ships[0].cooldown = 0;
  tickArena(spiral, 1 / 60);
  assert.equal(spiral.shots.length, 6);
  assert.equal(new Set(spiral.shots.map((p) => p.angle)).size, 6);
  assert.ok(spiral.shots.every((p) => p.kind === "spiral"));
});
test("minelayers drop armed mines behind them and mines damage nearby crystals", () => {
  const s = field(2);
  s.ships[0].cooldown = 0;
  tickArena(s, 1 / 60);
  assert.equal(s.mines.length, 1);
  assert.ok(s.mines[0].x < s.ships[0].x);
  assert.ok(s.mines[0].arm > 0);
  s.mines[0].x = 404;
  s.mines[0].y = 400;
  s.mines[0].arm = 0;
  tickArena(s, 1 / 60);
  assert.equal(s.crystals[0].hp, 34);
  assert.equal(s.mines.length, 0);
});
test("a beam damages continuously and seekers retarget the currently weakest crystal", () => {
  const beam = field(3);
  tickArena(beam, 0.1);
  const hp = beam.crystals[0].hp;
  assert.ok(hp < 100);
  tickArena(beam, 0.1);
  assert.ok(beam.crystals[0].hp < hp);
  assert.equal(beam.shots.length, 0);
  const seeker = field(5);
  seeker.ships[0].cooldown = 0;
  seeker.crystals[1].hp = 5;
  tickArena(seeker, 1 / 60);
  assert.equal(seeker.shots[0].target, seeker.crystals[1].id);
  seeker.crystals[2].hp = 1;
  tickArena(seeker, 1 / 60);
  assert.equal(weakestCrystal(seeker)?.id, seeker.crystals[2].id);
  assert.equal(seeker.shots[0].target, seeker.crystals[2].id);
});
test("weapons can destroy shards, and every weapon hull also deals ram damage", () => {
  for (let tier = 0; tier < HULLS.length; tier++) {
    const s = field(tier);
    s.ships[0].x = 300;
    tickArena(s, 0.75);
    assert.ok(s.crystals[0].hp <= 100 - HULLS[tier].damage);
  }
  const s = field(1);
  s.ships[0].cooldown = 0;
  s.crystals[0].hp = 1;
  assert.ok(tickArena(s, 0.6) > 0);
  assert.equal(s.destroyed, 1);
  assert.equal(s.crystals.length, 6);
});
test("surge doubles forward speed temporarily and cannot be stacked", () => {
  const s = field();
  s.crystals.forEach((c) => (c.y = 80));
  assert.equal(surgeFleet(s), true);
  assert.equal(surgeFleet(s), false);
  const x = s.ships[0].x;
  tickArena(s, 1 / 60);
  assert.ok(Math.abs(s.ships[0].x - x - (shipSpeed(s, 0) * 2) / 60) < 0.001);
  tickArena(s, 33);
  assert.equal(s.surge, 0);
  assert.equal(s.surgeCooldown, 0);
  assert.equal(surgeFleet(s), true);
});
test("offline progress finishes real crystal health, pays whole kills, and handles eight hours efficiently", () => {
  const s = createArena();
  assert.equal(tickArena(s, 4), 0);
  assert.equal(s.money, 0);
  assert.equal(s.destroyed, 0);
  assert.ok(tickArena(s, 4) > 0);
  assert.equal(s.money, 12);
  assert.equal(s.destroyed, 1);
  tickArena(s, 28800);
  assert.ok(s.destroyed > 100);
  assert.ok(s.money > 1000);
  assert.equal(s.money, s.earned);
  assert.equal(s.crystals.length, 6);
  assert.equal(tickArena(s, -1), 0);
  assert.equal(tickArena(s, NaN), 0);
});
test("saved fleets, damaged crystals, upgrades, currency, and unlocks survive reloads and resizing", () => {
  const s = createArena();
  s.money = 2000;
  buyShip(s, 0);
  mergeShips(s, 0);
  buyArenaUpgrade(s, "damage");
  damageCrystal(s, s.crystals[0], 1);
  const r = restoreArena(JSON.parse(JSON.stringify(s)));
  assert.equal(r.money, s.money);
  assert.equal(r.unlocked, 1);
  assert.equal(r.merges, 1);
  assert.equal(r.ships[0].tier, 1);
  assert.equal(r.upgrades.damage, 1);
  assert.equal(r.crystals[0].hp, s.crystals[0].hp);
  const y = r.ships[0].y;
  resizeArena(r, 1200);
  assert.ok(Math.abs(r.ships[0].y - y * 1.5) < 0.001);
  const bad = restoreArena({
    money: Infinity,
    height: NaN,
    ships: Array(100).fill({ tier: 99, x: -100, y: 1e20 }),
    upgrades: { capacity: 100, speed: -10 },
    crystals: [null],
    surgeCooldown: 100,
  });
  assert.equal(bad.money, 0);
  assert.equal(bad.ships.length, 32);
  assert.equal(bad.upgrades.speed, 0);
  assert.ok(bad.ships.every((p) => p.x >= 12 && p.y <= bad.height - 12));
  assert.equal(bad.crystals.length, 6);
});
test("green scores come from crystal kills, continue offscreen, migrate old saves, and reset on prestige", () => {
  const s = freshState();
  s.arena = field();
  s.arena.ships[0].x = 300;
  s.arena.crystals[0].hp = 1;
  advance(s, 1);
  assert.equal(s.arena.destroyed, 0);
  assert.equal(s.worlds[3].score, 1);
  s.unlocked = 4;
  advance(s, 1);
  assert.equal(s.arena.destroyed, 1);
  assert.equal(s.worlds[3].score, 13);
  const old = s.arena.money;
  advance(s, 3600);
  assert.ok(s.arena.money > old);
  assert.ok(total(s) > 13n);
  const original = JSON.parse(JSON.stringify(s));
  delete original.arena;
  const migrated = loadState(JSON.stringify(original));
  assert.equal(migrated.worlds[3].score, s.worlds[3].score);
  assert.equal(migrated.arena.money, s.worlds[3].bank);
  assert.equal(migrated.arena.ships.length, 1);
  s.worlds[0].score = 1e40;
  assert.equal(prestige(s), true);
  assert.equal(s.arena.money, 0);
  assert.equal(s.arena.destroyed, 0);
  assert.equal(s.arena.unlocked, 0);
  assert.equal(s.arena.ships.length, 1);
});

test("late prestige speed bonuses accelerate the full offline interval while keeping live physics bounded", () => {
  const base = freshState(),
    fast = freshState();
  base.unlocked = fast.unlocked = 7;
  fast.prestige = { count: 20, shards: 0, upgrades: ["clockwork", "rhythm"] };
  advance(base, 28800);
  advance(fast, 28800);
  assert.equal(base.arena.time, 28800);
  assert.equal(fast.arena.time, 28800 * 4);
  assert.ok(fast.arena.earned > base.arena.earned * 100);
  assert.equal(fast.worlds[3].score, 1 + fast.arena.earned * 21);
});

test("legacy pockets convert once and the Full Pockets tree upgrade funds the new fleet", () => {
  const old = JSON.parse(JSON.stringify(freshState()));
  delete old.arena;
  old.unlocked = 4;
  old.worlds[3].bank = 500;
  const migrated = loadState(JSON.stringify(old));
  assert.equal(migrated.arena.money, 500);
  buyShip(migrated.arena, 0);
  const restored = loadState(JSON.stringify(migrated));
  assert.equal(restored.arena.money, 482);
  const s = freshState();
  s.prestige = { count: 1, shards: 1, upgrades: ["iridescent"] };
  assert.equal(buyPrestigeUpgrade(s, "pockets"), true);
  assert.equal(s.arena.money, 100);
  s.worlds[0].score = 1e40;
  assert.equal(prestige(s), true);
  assert.equal(s.arena.money, 100);
});
