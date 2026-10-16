import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRpg,
  navigate,
  tickRpg,
  areaStats,
  encounterRewards,
  activeMembers,
  memberStats,
  chooseAbility,
  act,
  rest,
  recruit,
  party,
  restoreRpg,
  allocate,
  stats,
  points,
  equip,
  forge,
  forgeCost,
  claim,
  nextPage,
  ITEMS,
  type RpgState,
  type MemberId,
} from "../src/rpg.ts";
import { MAP_CENTER, WORLD_MAP, findPath, neighbors } from "../src/rpg-map.ts";
import {
  freshState,
  advance,
  total,
  loadState,
  prestige,
} from "../src/game.ts";
const near = WORLD_MAP.find((c) => c.room && c.distance === 2)!.id;
const farther = WORLD_MAP.find((c) => c.room && c.distance === 4)!.id;
function until(r: RpgState, condition: () => boolean, limit = 500) {
  let n = 0,
    reward = 0;
  while (!condition() && n++ < limit) reward += tickRpg(r, 0.1);
  assert.ok(condition(), `condition failed: ${r.status}`);
  return reward;
}
function team(ids: MemberId[] = ["pip", "moss", "mote"]) {
  const r = createRpg();
  r.level = 8;
  r.kills = 100;
  r.gold = 1000;
  for (const id of ids) recruit(r, id);
  rest(r);
  return r;
}
function battle(r = createRpg(), cell = near) {
  r.maze.cell = cell;
  navigate(r, cell);
  return r;
}

test("the maze has branches, loops, connected rooms, and no path through walls", () => {
  const open = WORLD_MAP.filter((c) => !c.wall);
  assert.ok(open.length > 160);
  assert.equal(open.filter((c) => c.room).length, 81);
  for (const c of open) {
    const route = findPath(MAP_CENTER, c.id)!;
    assert.ok(route);
    let previous = MAP_CENTER;
    for (const id of route) {
      assert.ok(neighbors(previous).includes(id));
      previous = id;
    }
  }
  assert.ok(
    open.reduce((n, c) => n + neighbors(c.id).length, 0) / 2 > open.length - 1,
  );
  assert.equal(findPath(MAP_CENTER, 0), null);
  assert.equal(findPath(MAP_CENTER, NaN), null);
  assert.equal(findPath(-1, near), null);
});
test("difficulty and every reward rise with distance, independently of compass direction", () => {
  let hp = 0,
    gold = 0,
    renown = 0;
  for (let distance = 2; distance <= 16; distance += 2) {
    const cells = WORLD_MAP.filter((c) => c.room && c.distance === distance),
      a = areaStats(cells[0].id);
    assert.ok(a.hp > hp);
    assert.ok(a.rewards.gold > gold);
    assert.ok(a.rewards.renown > renown);
    for (const c of cells) assert.deepEqual(areaStats(c.id), a);
    hp = a.hp;
    gold = a.rewards.gold;
    renown = a.rewards.renown;
  }
  assert.ok(areaStats(farther, 2).hp > areaStats(farther).hp);
  assert.ok(
    areaStats(farther, 2).rewards.renown > areaStats(farther).rewards.renown,
  );
});
test("clicking a destination walks adjacent squares and starts a fight instead of teleporting", () => {
  const r = createRpg();
  assert.equal(tickRpg(r, 60), 0);
  assert.equal(r.maze.cell, MAP_CENTER);
  assert.equal(r.status, "camp");
  assert.equal(navigate(r, 0), false);
  assert.equal(navigate(r, near), true);
  assert.equal(r.maze.route.length, 2);
  tickRpg(r, 0.3);
  assert.ok(neighbors(MAP_CENTER).includes(r.maze.cell));
  assert.notEqual(r.maze.cell, near);
  tickRpg(r, 0.3);
  assert.equal(r.maze.cell, near);
  assert.equal(r.status, "battle");
  assert.equal(r.foes.length, 1);
  assert.equal(r.hp, 45);
});
test("automatic battles award renown, gold, experience and loot only on completed victories", () => {
  const s = freshState();
  s.unlocked = 3;
  navigate(s.rpg, near);
  const start = total(s);
  advance(s, 2);
  assert.equal(s.rpg.kills, 0);
  assert.equal(total(s), start);
  assert.ok(s.rpg.enemyHp < 38);
  for (let i = 0; i < 120 && s.rpg.kills === 0; i++) advance(s, 0.1);
  assert.equal(s.rpg.kills, 1);
  assert.ok(s.worlds[2].score > 1);
  assert.ok(s.rpg.owned.includes("weapon-0"));
  assert.equal(s.rpg.level, 2);
  assert.equal(s.rpg.gold, 12);
  s.rpg.auto = false;
  const gold = s.rpg.gold;
  advance(s, 60);
  assert.equal(s.rpg.gold, gold);
  assert.equal(tickRpg(s.rpg, NaN), 0);
  assert.equal(tickRpg(s.rpg, -1), 0);
});
test("recruitment is earned and paid once; party size is four including the adventurer", () => {
  const r = createRpg();
  r.gold = 1000;
  assert.equal(recruit(r, "pip"), false);
  r.kills = 2;
  assert.equal(recruit(r, "pip"), true);
  assert.equal(r.gold, 988);
  assert.equal(recruit(r, "pip"), false);
  r.kills = 100;
  recruit(r, "moss");
  recruit(r, "mote");
  recruit(r, "puddle");
  assert.equal(activeMembers(r).length, 4);
  assert.equal(party(r, "puddle"), false);
  assert.equal(party(r, "moss"), true);
  assert.equal(party(r, "puddle"), true);
  assert.equal(activeMembers(r).length, 4);
  battle(r);
  assert.equal(party(r, "pip"), false);
  assert.equal(recruit(r, "unknown"), false);
});
test("each party member acts on an independent clock and a KO hero does not stop living allies", () => {
  const r = battle(team());
  r.foes[0].hp = r.foes[0].maxHp = 1000;
  r.foes[0].cooldown = 100;
  r.members.hero.hp = 0;
  const hp = r.foes[0].hp;
  tickRpg(r, 1);
  assert.ok(r.foes[0].hp < hp);
  assert.equal(r.status, "battle");
  assert.equal(r.members.hero.hp, 0);
  assert.ok(r.members.pip.cooldown < r.members.moss.cooldown);
});
test("ability switching during combat changes the next cast without resetting cooldown or dealing free damage", () => {
  const r = battle();
  r.level = 8;
  r.foes[0].hp = r.foes[0].maxHp = 1000;
  r.enemyHp = 1000;
  const hp = r.enemyHp,
    clock = r.members.hero.cooldown;
  assert.equal(chooseAbility(r, "hero", "stroke"), true);
  assert.equal(r.enemyHp, hp);
  assert.equal(r.members.hero.cooldown, clock);
  assert.equal(chooseAbility(r, "hero", "guard"), true);
  assert.equal(chooseAbility(r, "hero", "stroke"), true);
  assert.equal(r.members.hero.cooldown, clock);
  assert.equal(chooseAbility(r, "pip", "shot"), false);
  assert.equal(chooseAbility(r, "hero", "rain"), false);
  r.members.hero.mp = 7;
  tickRpg(r, 0.7);
  assert.ok(r.enemyHp < hp);
  assert.equal(r.members.hero.mp, 4);
  const low = battle();
  assert.equal(chooseAbility(low, "hero", "nova"), false);
  assert.equal(act(low, "attack").damage, 0);
});
test("volley hits the whole enemy group and insufficient mana falls back to a basic action", () => {
  const r = battle(team(["pip"]), farther);
  r.members.hero.cooldown = 100;
  r.members.pip.cooldown = 0;
  chooseAbility(r, "pip", "volley");
  const hp = r.foes.map((f) => f.hp);
  tickRpg(r, 0.1);
  assert.equal(r.foes.length, 2);
  r.foes.forEach((f, i) => assert.ok(f.hp < hp[i]));
  r.members.pip.mp = 0;
  r.members.pip.cooldown = 0;
  const before = r.foes.map((f) => f.hp);
  tickRpg(r, 0.1);
  assert.ok(r.foes[0].hp < before[0]);
  assert.equal(r.foes[1].hp, before[1]);
  assert.equal(r.members.pip.mp, 1);
  assert.equal(r.members.pip.ability, "volley");
});
test("the guardian redirects damage and the healer mends the weakest living party member", () => {
  const tank = battle(team());
  for (const id of activeMembers(tank)) tank.members[id].cooldown = 100;
  tank.members.moss.cooldown = 0;
  chooseAbility(tank, "moss", "taunt");
  tank.foes[0].cooldown = 0.1;
  tank.foes[0].attack = 50;
  const hp = tank.members.hero.hp,
    moss = tank.members.moss.hp;
  tickRpg(tank, 0.1);
  assert.equal(tank.members.hero.hp, hp);
  assert.ok(tank.members.moss.hp < moss);
  const r = battle(team(["pip", "moss", "puddle"]));
  for (const id of activeMembers(r)) r.members[id].cooldown = 100;
  r.members.pip.hp = 5;
  r.members.hero.hp = 30;
  r.members.puddle.cooldown = 0;
  const mana = r.members.puddle.mp;
  tickRpg(r, 0.1);
  assert.ok(r.members.pip.hp > 5);
  assert.equal(r.members.hero.hp, 30);
  assert.equal(r.members.puddle.mp, mana - 2);
});
test("mark amplifies allied damage, shell absorbs hits, and siphon restores party mana", () => {
  const r = battle(team());
  for (const id of activeMembers(r)) r.members[id].cooldown = 100;
  r.foes[0].hp = r.foes[0].maxHp = 10000;
  chooseAbility(r, "pip", "mark");
  r.members.pip.cooldown = 0;
  tickRpg(r, 0.1);
  assert.ok(r.foes[0].marked > 0);
  const start = r.foes[0].hp;
  r.members.hero.cooldown = 0;
  tickRpg(r, 0.1);
  assert.ok(start - r.foes[0].hp > memberStats(r, "hero").attack);
  chooseAbility(r, "moss", "shell");
  r.members.moss.cooldown = 0;
  tickRpg(r, 0.1);
  assert.ok(activeMembers(r).every((id) => r.members[id].shield > 0));
  chooseAbility(r, "mote", "siphon");
  r.members.mote.cooldown = 0;
  r.members.hero.mp = 0;
  tickRpg(r, 0.1);
  assert.equal(r.members.hero.mp, 2);
});
test("a defeated party earns no partial victory and camp rescues all members without soft locks", () => {
  const r = battle(team());
  for (const id of activeMembers(r)) {
    r.members[id].hp = 1;
    r.members[id].cooldown = 100;
  }
  r.foes[0].hp = 10000;
  r.foes[0].attack = 1000;
  tickRpg(r, 30);
  assert.equal(r.status, "down");
  assert.equal(r.auto, false);
  assert.equal(r.kills, 100);
  assert.equal(r.maze.route.length, 0);
  act(r, "rest");
  assert.equal(r.maze.cell, MAP_CENTER);
  assert.equal(r.status, "camp");
  assert.ok(
    activeMembers(r).every(
      (id) => r.members[id].hp === memberStats(r, id).maxHp,
    ),
  );
  assert.equal(navigate(r, near), true);
});
test("routes cross camp without being discarded and stop at uncleared encounters", () => {
  const r = team();
  r.level = 50;
  rest(r);
  r.owned.push("weapon-7");
  equip(r, "weapon-7");
  navigate(r, near);
  until(r, () => r.maze.cell === near);
  assert.equal(r.status, "battle");
  const opposite = WORLD_MAP.find((c) => c.room && c.x === 9 && c.y === 11)!.id;
  navigate(r, opposite);
  until(r, () => r.maze.cell === opposite, 1000);
  assert.ok(r.maze.visited.includes(MAP_CENTER));
  assert.equal(r.status, "battle");
});
test("equipment, forging, attributes and quests strengthen the whole party and cannot be overspent", () => {
  const r = team();
  assert.equal(equip(r, "weapon-7"), false);
  r.owned.push("weapon-0");
  const before = memberStats(r, "pip").attack;
  equip(r, "weapon-0");
  assert.ok(memberStats(r, "pip").attack > before);
  r.ink = 100;
  const cost = forgeCost(r, "weapon-0");
  assert.equal(forge(r, "weapon-0"), true);
  assert.equal(r.ink, 100 - cost);
  const hp = stats(r).maxHp;
  allocate(r, "vigor");
  assert.equal(stats(r).maxHp, hp + 7);
  while (points(r)) allocate(r, "might");
  assert.equal(allocate(r, "wisdom"), false);
  const reward = claim(r, "first-road");
  assert.equal(reward, 30);
  const gold = r.gold;
  assert.equal(claim(r, "first-road"), 0);
  assert.equal(r.gold, gold);
});
test("mid-battle saves retain the route, four members, selected abilities, health and cooldowns", () => {
  const r = battle(team());
  navigate(r, farther);
  chooseAbility(r, "moss", "shell");
  tickRpg(r, 0.8);
  const restored = restoreRpg(JSON.parse(JSON.stringify(r)));
  assert.equal(restored.enemyHp, r.enemyHp);
  assert.deepEqual(restored.party, r.party);
  assert.deepEqual(restored.maze.route, r.maze.route);
  assert.equal(restored.members.moss.ability, "shell");
  assert.equal(restored.members.hero.hp, r.members.hero.hp);
  assert.equal(restored.members.pip.cooldown, r.members.pip.cooldown);
  const original = structuredClone(r);
  tickRpg(original, 0.5);
  tickRpg(restored, 0.5);
  assert.equal(restored.enemyHp, original.enemyHp);
  assert.equal(restored.hp, original.hp);
});
test("legacy saves keep earned levels, gear, companions, currency and quests in the new safe camp", () => {
  const r = team();
  r.cleared = 8;
  r.owned.push("weapon-7");
  equip(r, "weapon-7");
  r.gold = 321;
  r.ink = 42;
  r.claimed = ["first-road"];
  const old = JSON.parse(JSON.stringify(r));
  delete old.maze;
  delete old.members;
  delete old.recruited;
  old.hp = 1;
  old.zone = 7;
  const loaded = restoreRpg(old);
  assert.equal(loaded.maze.cell, MAP_CENTER);
  assert.equal(loaded.level, 8);
  assert.equal(loaded.gold, 321);
  assert.equal(loaded.ink, 42);
  assert.equal(loaded.gear.weapon, "weapon-7");
  assert.deepEqual(loaded.party, r.party);
  assert.deepEqual(loaded.claimed, ["first-road"]);
  assert.equal(loaded.hp, stats(loaded).maxHp);
});
test("corrupt saves cannot add unearned allies, invalid abilities, broken routes or injected labels", () => {
  const r = restoreRpg({
    level: 3,
    gold: Infinity,
    kills: 0,
    party: ["pip", "moss", "not-real"],
    recruited: ["pip"],
    owned: ["unknown"],
    gear: { weapon: "weapon-7" },
    attributes: { might: 99, vigor: 99 },
    maze: {
      version: 1,
      cell: 0,
      route: [0, 999],
      visited: [null, NaN, "<script>"],
      cleared: [0],
    },
    members: { hero: { hp: -1, mp: NaN, ability: "rain", cooldown: Infinity } },
    log: ["<script>alert(1)</script>"],
  });
  assert.equal(r.maze.cell, MAP_CENTER);
  assert.deepEqual(r.maze.route, []);
  assert.deepEqual(r.party, []);
  assert.equal(r.members.hero.ability, "attack");
  assert.equal(r.gear.weapon, "stub");
  assert.equal(points(r), 0);
  assert.equal(r.gold, 0);
  assert.ok(!r.log.join("").includes("<script>"));
  assert.ok(Number.isFinite(r.hp));
});
test("offline battles progress offscreen, stop safely on defeat, and preserve the main multiplier", () => {
  const s = freshState();
  s.unlocked = 3;
  s.rpg = team();
  navigate(s.rpg, near);
  advance(s, 3600);
  assert.ok(s.rpg.kills > 100);
  assert.ok(s.worlds[2].score > 1);
  const saved = loadState(JSON.stringify(s));
  assert.equal(saved.rpg.kills, s.rpg.kills);
  assert.equal(saved.worlds[2].score, s.worlds[2].score);
  s.worlds[0].score = 1e40;
  assert.equal(prestige(s), true);
  assert.equal(s.rpg.maze.cell, MAP_CENTER);
  assert.deepEqual(s.rpg.party, []);
  assert.equal(s.rpg.level, 1);
});
test("clearing the outer regions opens harder, richer atlas pages while keeping the party and equipment", () => {
  const r = team();
  assert.equal(nextPage(r), false);
  r.cleared = 8;
  r.owned.push("weapon-7");
  equip(r, "weapon-7");
  const a = areaStats(near, r.depth);
  assert.equal(nextPage(r), true);
  assert.equal(r.depth, 1);
  assert.deepEqual(r.maze.visited, [MAP_CENTER]);
  assert.equal(activeMembers(r).length, 4);
  assert.equal(r.gear.weapon, "weapon-7");
  assert.ok(areaStats(near, r.depth).rewards.renown > a.rewards.renown);
});
