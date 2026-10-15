import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRpg,
  act,
  enemy,
  stats,
  nextXp,
  equip,
  forge,
  forgeCost,
  allocate,
  points,
  travel,
  party,
  claim,
  tickRpg,
  restoreRpg,
  skillReady,
  ITEMS,
  COMPANIONS,
  QUESTS,
  type RpgState,
} from "../src/rpg.ts";
import {
  freshState,
  rpgAction,
  total,
  advance,
  loadState,
} from "../src/game.ts";

function win(r: RpgState) {
  let count = 0;
  while (r.status === "battle" && count++ < 100) act(r, "attack");
  assert.equal(r.status, "victory");
}
test("a simple opening awards loot and renown only after an enemy is beaten", () => {
  const s = freshState();
  assert.equal(rpgAction(s, "attack"), null);
  s.unlocked = 3;
  s.rpg.seed = 42;
  const before = total(s);
  rpgAction(s, "attack");
  assert.equal(total(s), before);
  assert.ok(s.rpg.enemyHp < enemy(s.rpg).hp);
  for (let i = 0; i < 5 && s.rpg.status === "battle"; i++)
    rpgAction(s, "attack");
  assert.equal(s.rpg.kills, 1);
  assert.ok(s.rpg.owned.includes("weapon-0"));
  assert.ok(total(s) > before);
  const gold = s.rpg.gold,
    score = s.worlds[2].score;
  assert.equal(rpgAction(s, "attack")!.changed, false);
  assert.equal(s.rpg.gold, gold);
  assert.equal(s.worlds[2].score, score);
});
test("skills unlock with levels, spend mana, and guard mitigates a charged attack", () => {
  const r = createRpg();
  assert.equal(skillReady(r, "stroke"), false);
  assert.equal(act(r, "stroke").changed, false);
  r.level = 4;
  r.hp = stats(r).maxHp;
  r.mp = stats(r).maxMp;
  r.enemyHp = 200;
  r.turn = 2;
  const copy = structuredClone(r);
  const guarded = act(r, "guard"),
    hit = act(copy, "attack");
  assert.ok(guarded.received < hit.received);
  const mana = r.mp;
  act(r, "stroke");
  assert.equal(r.mp, mana - 3);
  r.hp = 10;
  const out = act(r, "heal");
  assert.equal(out.changed, true);
  assert.ok(r.hp > 10);
});
test("level growth unlocks attributes without allowing overspending", () => {
  const r = createRpg();
  assert.equal(allocate(r, "might"), false);
  r.level = 3;
  const hp = stats(r).maxHp;
  assert.equal(allocate(r, "vigor"), true);
  assert.equal(stats(r).maxHp, hp + 7);
  assert.equal(allocate(r, "might"), true);
  assert.equal(points(r), 0);
  assert.equal(allocate(r, "wisdom"), false);
});
test("equipment, forging, quests, and companions consume or award resources once", () => {
  const r = createRpg();
  assert.equal(equip(r, "weapon-0"), false);
  r.owned.push("weapon-0");
  assert.equal(equip(r, "weapon-0"), true);
  r.level = 3;
  r.ink = 20;
  const cost = forgeCost(r, "weapon-0"),
    attack = stats(r).attack;
  assert.equal(forge(r, "weapon-0"), true);
  assert.equal(r.ink, 20 - cost);
  assert.equal(stats(r).attack, attack + 2);
  r.kills = 5;
  assert.equal(claim(r, "first-road"), 30);
  const gold = r.gold;
  assert.equal(claim(r, "first-road"), 0);
  assert.equal(r.gold, gold);
  assert.equal(party(r, "pip"), false);
  r.cleared = 5;
  assert.equal(party(r, "pip"), true);
  assert.equal(party(r, "moss"), true);
  assert.equal(party(r, "mote"), false);
  assert.equal(r.party.length, 2);
});
test("camp and defeat recovery preserve the next encounter and prevent soft locks", () => {
  const r = createRpg();
  r.seed = 42;
  win(r);
  assert.equal(r.wave, 0);
  act(r, "rest");
  assert.equal(r.wave, 1);
  act(r, "continue");
  assert.equal(r.status, "battle");
  r.hp = 1;
  r.level = 1;
  r.enemyHp = 999;
  r.turn = 2;
  act(r, "attack");
  assert.equal(r.status, "down");
  assert.equal(r.auto, false);
  act(r, "rest");
  assert.equal(r.hp, stats(r).maxHp);
  act(r, "continue");
  assert.equal(r.status, "battle");
  assert.equal(r.enemyHp, enemy(r).hp);
});
test("save migration keeps an in-progress battle and rejects invalid inventory and stats", () => {
  const r = createRpg();
  r.seed = 42;
  act(r, "attack");
  const restored = restoreRpg(JSON.parse(JSON.stringify(r)));
  assert.equal(restored.enemyHp, r.enemyHp);
  assert.equal(restored.hp, r.hp);
  assert.equal(restored.seed, r.seed);
  const a = act(r, "attack"),
    b = act(restored, "attack");
  assert.equal(a.damage, b.damage);
  assert.equal(r.enemyHp, restored.enemyHp);
  const bad = restoreRpg({
    level: 3,
    zone: 99,
    cleared: 1,
    hp: -10,
    owned: ["not-real"],
    gear: { weapon: "weapon-7" },
    attributes: { might: 999, vigor: 999 },
    log: ["<script>bad</script>"],
    party: ["mote", "unknown"],
  });
  assert.equal(bad.zone, 1);
  assert.equal(bad.gear.weapon, "stub");
  assert.equal(points(bad), 0);
  assert.deepEqual(bad.party, []);
  assert.ok(!bad.log.join("").includes("<script>"));
  const s = freshState();
  s.rpg = r;
  const loaded = loadState(JSON.stringify(s));
  assert.equal(loaded.rpg.enemyHp, r.enemyHp);
});
test("automatic battles work away from the RPG screen and stop safely at bosses or defeat", () => {
  const s = freshState();
  s.unlocked = 3;
  s.rpg.cleared = 1;
  s.rpg.level = 10;
  s.rpg.hp = stats(s.rpg).maxHp;
  s.rpg.mp = stats(s.rpg).maxMp;
  s.rpg.auto = true;
  advance(s, 28800);
  assert.equal(s.rpg.auto, false);
  assert.equal(s.rpg.kills, 5);
  assert.equal(s.rpg.status, "victory");
  assert.ok(s.worlds[2].score > 1);
  const r = createRpg();
  r.auto = true;
  r.cleared = 1;
  r.hp = 1;
  r.turn = 2;
  r.enemyHp = 999;
  tickRpg(r, 1000);
  assert.equal(r.status, "down");
  assert.equal(r.auto, false);
});
test("all eight regions are reachable through earned progression, then expand into the endless canvas", () => {
  const r = createRpg();
  r.seed = 42;
  let turns = 0;
  assert.equal(travel(r, 1), false);
  while (r.cleared < 8 && turns++ < 1500) {
    for (const slot of ["weapon", "armor", "charm"]) {
      const item = ITEMS.filter(
        (i) => r.owned.includes(i.id) && i.slot === slot,
      ).sort((a, b) => b.tier - a.tier)[0];
      if (item) equip(r, item.id);
    }
    while (points(r))
      allocate(
        r,
        r.level % 3 === 0 ? "vigor" : r.level % 3 === 1 ? "wisdom" : "might",
      );
    for (const id of Object.values(r.gear))
      while (r.ink >= forgeCost(r, id) && (r.forged[id] || 0) < 6) {
        if (!forge(r, id)) break;
      }
    for (const ally of COMPANIONS)
      if (
        r.cleared >= ally.cleared &&
        r.party.length < 2 &&
        !r.party.includes(ally.id)
      )
        party(r, ally.id);
    for (const q of QUESTS) claim(r, q.id);
    if (r.status === "victory") {
      if (r.cleared > r.zone) travel(r, r.cleared);
      else act(r, "continue");
      continue;
    }
    if (r.status === "camp") {
      act(r, "continue");
      continue;
    }
    assert.notEqual(
      r.status,
      "down",
      "ordinary earned equipment should support the main route",
    );
    const s = stats(r),
      foe = enemy(r);
    act(
      r,
      r.hp < s.maxHp * 0.5 && skillReady(r, "heal")
        ? "heal"
        : foe.heavy
          ? "guard"
          : skillReady(r, "stroke")
            ? "stroke"
            : "attack",
    );
  }
  assert.equal(r.cleared, 8);
  assert.equal(r.kills, 40);
  assert.equal(r.bosses, 8);
  assert.ok(r.level >= 10);
  assert.ok(r.owned.length > 8);
  assert.equal(travel(r, 8), true);
  assert.equal(r.zone, 8);
  const first = enemy(r).hp;
  r.depth = 10;
  assert.ok(enemy(r).hp > first);
  assert.ok(nextXp(r.level) > nextXp(1));
});
