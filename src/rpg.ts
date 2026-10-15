export type Slot = "weapon" | "armor" | "charm";
export type Attribute = "might" | "vigor" | "wisdom";
export type CombatAction =
  "attack" | "guard" | "stroke" | "heal" | "nova" | "potion";
export type RpgAction =
  CombatAction | "continue" | "rest" | "auto" | "buy-potion";
export type RpgState = {
  level: number;
  xp: number;
  hp: number;
  mp: number;
  gold: number;
  ink: number;
  potions: number;
  zone: number;
  wave: number;
  cleared: number;
  depth: number;
  enemyHp: number;
  turn: number;
  status: "battle" | "victory" | "camp" | "down";
  kills: number;
  bosses: number;
  owned: string[];
  gear: Record<Slot, string>;
  forged: Record<string, number>;
  attributes: Record<Attribute, number>;
  claimed: string[];
  party: string[];
  auto: boolean;
  carry: number;
  seed: number;
  color: number;
  revision: number;
  log: string[];
};
export type Item = {
  id: string;
  name: string;
  sprite: string;
  slot: Slot;
  attack: number;
  defense: number;
  magic: number;
  tier: number;
};
export const REGIONS = [
  {
    name: "Dewdrop Meadow",
    short: "Meadow",
    biome: "meadow",
    sprite: "rpg-hut",
    foes: ["Dewdrop slime", "Clover mite", "Doodle bee"],
    sprites: ["rpg-slime", "rpg-mite", "rpg-bee"],
    boss: "King Smudge",
    bossSprite: "rpg-slime-king",
  },
  {
    name: "Timberwood",
    short: "Timberwood",
    biome: "forest",
    sprite: "rpg-tree",
    foes: ["Inkcap", "Brush fox", "Splinterling"],
    sprites: ["rpg-mushroom", "rpg-wolf", "rpg-tree"],
    boss: "The Hollow Oak",
    bossSprite: "rpg-tree-boss",
  },
  {
    name: "Chalk Caverns",
    short: "Caverns",
    biome: "cave",
    sprite: "rpg-golem",
    foes: ["Pebbleling", "Crystal bat", "Stone snail"],
    sprites: ["rpg-golem", "rpg-bat", "snail"],
    boss: "The Chalk Colossus",
    bossSprite: "rpg-golem",
  },
  {
    name: "Soggy Fen",
    short: "The fen",
    biome: "marsh",
    sprite: "rpg-witch",
    foes: ["Mire jelly", "Lantern moth", "Reed goblin"],
    sprites: ["rpg-slime-blue", "moth", "rpg-goblin"],
    boss: "The Bog Witch",
    bossSprite: "rpg-witch",
  },
  {
    name: "Skyward Isles",
    short: "Sky isles",
    biome: "sky",
    sprite: "rpg-roc",
    foes: ["Cloudling", "Paper wasp", "Thunder imp"],
    sprites: ["cloud", "rpg-bee", "rpg-goblin"],
    boss: "The Storm Roc",
    bossSprite: "rpg-roc",
  },
  {
    name: "Frostbitten Page",
    short: "Frostfield",
    biome: "snow",
    sprite: "rpg-crown",
    foes: ["Snow puff", "Frost wolf", "Ice sprite"],
    sprites: ["rpg-slime-blue", "rpg-wolf", "rpg-bat"],
    boss: "The Frost Crown",
    bossSprite: "rpg-king",
  },
  {
    name: "Forgotten Margins",
    short: "The ruins",
    biome: "ruins",
    sprite: "rpg-knight",
    foes: ["Rune sentinel", "Lost shade", "Ink knight"],
    sprites: ["rpg-golem", "rpg-shade", "rpg-knight"],
    boss: "The Erased King",
    bossSprite: "rpg-king",
  },
  {
    name: "The Sunspire",
    short: "Sunspire",
    biome: "spire",
    sprite: "rpg-sun-boss",
    foes: ["Sun sprite", "Gilded wasp", "Solar knight"],
    sprites: ["sun", "rpg-bee", "rpg-knight"],
    boss: "The Unwritten",
    bossSprite: "rpg-sun-boss",
  },
  {
    name: "The Endless Canvas",
    short: "Beyond",
    biome: "void",
    sprite: "eye",
    foes: ["Unfinished thought", "Something almost real", "A familiar shadow"],
    sprites: ["rpg-shade", "rpg-slime-gold", "rpg-knight"],
    boss: "The Next Page",
    bossSprite: "rpg-sun-boss",
  },
] as const;
export const ITEMS: Item[] = [
  {
    id: "stub",
    name: "Twig sword",
    sprite: "rpg-pencil",
    slot: "weapon",
    attack: 0,
    defense: 0,
    magic: 0,
    tier: 0,
  },
  {
    id: "shirt",
    name: "Patched shirt",
    sprite: "rpg-tunic",
    slot: "armor",
    attack: 0,
    defense: 0,
    magic: 0,
    tier: 0,
  },
  ...[
    "Bramble blade",
    "Timber blade",
    "Chalk cutter",
    "Reed saber",
    "Cloud cleaver",
    "Frost nib",
    "Inkbound sword",
    "Daybreak",
  ].map((name, i) => ({
    id: "weapon-" + i,
    name,
    sprite: i < 2 ? "rpg-sword" : i < 5 ? "rpg-sword-silver" : "rpg-sword-gold",
    slot: "weapon" as const,
    attack: 3 + i * 5,
    defense: 0,
    magic: i,
    tier: i + 1,
  })),
  ...[
    "Leaf vest",
    "Bark coat",
    "Stone mail",
    "Marsh cloak",
    "Skyweave",
    "Frostguard",
    "Royal plate",
    "Sunsteel",
  ].map((name, i) => ({
    id: "armor-" + i,
    name,
    sprite: i < 3 ? "rpg-tunic" : "rpg-armor",
    slot: "armor" as const,
    attack: 0,
    defense: 2 + i * 3,
    magic: 0,
    tier: i + 1,
  })),
  ...[
    "Dew pendant",
    "Amber acorn",
    "Chalk charm",
    "Witchlight",
    "Stormglass",
    "Frozen tear",
    "Last memory",
    "Little sun",
  ].map((name, i) => ({
    id: "charm-" + i,
    name,
    sprite: i < 4 ? "rpg-pendant" : "rpg-orb",
    slot: "charm" as const,
    attack: 0,
    defense: Math.floor(i / 2),
    magic: 2 + i * 2,
    tier: i + 1,
  })),
];
export const COMPANIONS = [
  { id: "pip", name: "Pip", sprite: "gnome", cleared: 1, stat: "+2 ATK" },
  { id: "moss", name: "Moss", sprite: "snail", cleared: 3, stat: "+3 DEF" },
  {
    id: "mote",
    name: "Mote",
    sprite: "moth",
    cleared: 5,
    stat: "+1 MP / turn",
  },
  {
    id: "puddle",
    name: "Puddle",
    sprite: "duck",
    cleared: 7,
    stat: "+3 HP / turn",
  },
] as const;
export const SKILLS: {
  id: CombatAction;
  name: string;
  sprite: string;
  level: number;
  mp: number;
}[] = [
  { id: "attack", name: "Strike", sprite: "rpg-sword", level: 1, mp: 0 },
  { id: "guard", name: "Guard", sprite: "rpg-shield", level: 1, mp: 0 },
  {
    id: "stroke",
    name: "Power strike",
    sprite: "rpg-sword-gold",
    level: 2,
    mp: 3,
  },
  { id: "heal", name: "Mend", sprite: "rpg-orb", level: 4, mp: 4 },
  { id: "nova", name: "Sunburst", sprite: "sun", level: 8, mp: 6 },
];
export type Result = {
  changed: boolean;
  renown: number;
  damage: number;
  received: number;
  victory: boolean;
  levelUp: boolean;
  drop: string;
  message: string;
};
const empty = (): Result => ({
  changed: false,
  renown: 0,
  damage: 0,
  received: 0,
  victory: false,
  levelUp: false,
  drop: "",
  message: "",
});
export function createRpg(): RpgState {
  return {
    level: 1,
    xp: 0,
    hp: 45,
    mp: 7,
    gold: 0,
    ink: 0,
    potions: 2,
    zone: 0,
    wave: 0,
    cleared: 0,
    depth: 0,
    enemyHp: 14,
    turn: 0,
    status: "battle",
    kills: 0,
    bosses: 0,
    owned: ["stub", "shirt"],
    gear: { weapon: "stub", armor: "shirt", charm: "" },
    forged: {},
    attributes: { might: 0, vigor: 0, wisdom: 0 },
    claimed: [],
    party: [],
    auto: false,
    carry: 0,
    seed: Math.floor(Math.random() * 0x7fffffff) + 1,
    color: 0,
    revision: 0,
    log: ["A small path. A very large sky."],
  };
}
export function nextXp(level: number): number {
  return 12 + level * 8 + level * level * 2;
}
export function stats(r: RpgState) {
  const items = Object.values(r.gear)
    .map((id) => ITEMS.find((x) => x.id === id))
    .filter((x): x is Item => !!x);
  const weapon = items.find((x) => x.slot === "weapon"),
    armor = items.find((x) => x.slot === "armor"),
    charm = items.find((x) => x.slot === "charm");
  return {
    maxHp: 36 + r.level * 9 + r.attributes.vigor * 7,
    maxMp: 6 + r.level + r.attributes.wisdom * 2,
    attack:
      4 +
      r.level * 2 +
      r.attributes.might * 2 +
      (weapon?.attack || 0) +
      (r.forged[r.gear.weapon] || 0) * 2 +
      (r.party.includes("pip") ? 2 : 0),
    defense:
      1 +
      Math.floor(r.level / 3) +
      r.attributes.vigor +
      (armor?.defense || 0) +
      (r.forged[r.gear.armor] || 0) * 2 +
      (charm?.defense || 0) +
      (r.party.includes("moss") ? 3 : 0),
    magic:
      2 +
      r.attributes.wisdom * 3 +
      (charm?.magic || 0) +
      (r.forged[r.gear.charm] || 0) * 2,
  };
}
export function points(r: RpgState): number {
  return Math.max(
    0,
    r.level - 1 - r.attributes.might - r.attributes.vigor - r.attributes.wisdom,
  );
}
export function enemy(r: RpgState) {
  const region = REGIONS[r.zone],
    boss = r.wave === 4,
    index = r.wave % 3,
    scale =
      1.35 ** Math.min(7, r.zone) * (r.zone === 8 ? 1 + r.depth * 0.22 : 1);
  const hp = Math.round(
    (14 + Math.min(7, r.zone) * 7) * scale * (boss ? 2.8 : 1),
  );
  return {
    name: boss ? region.boss : region.foes[index],
    sprite: boss ? region.bossSprite : region.sprites[index],
    boss,
    hp,
    attack: Math.round(
      (3 + Math.min(7, r.zone) * 2 + Math.floor(Math.min(7, r.zone) ** 1.4)) *
        Math.sqrt(r.zone === 8 ? 1 + r.depth * 0.25 : 1) *
        (boss ? 1.6 : 1),
    ),
    defense: Math.floor(r.zone / 2),
    level: 1 + r.zone * 3 + (boss ? 2 : 0),
    heavy: r.turn % 3 === 2,
  };
}
function random(r: RpgState): number {
  r.seed = (Math.imul(r.seed, 1664525) + 1013904223) >>> 0;
  return r.seed / 4294967296;
}
function note(r: RpgState, text: string): void {
  r.log = [text, ...r.log].slice(0, 5);
}
function begin(r: RpgState): void {
  r.status = "battle";
  r.enemyHp = enemy(r).hp;
  r.turn = 0;
}
export function skillReady(r: RpgState, id: CombatAction): boolean {
  const s = SKILLS.find((x) => x.id === id);
  return id === "potion"
    ? r.potions > 0
    : !!s && r.level >= s.level && r.mp >= s.mp;
}
export function act(r: RpgState, action: RpgAction): Result {
  const out = empty(),
    s = stats(r),
    foe = enemy(r);
  if (action === "auto") {
    if (r.cleared < 1) return out;
    r.auto = !r.auto;
    r.carry = 0;
    out.changed = true;
    out.message = r.auto ? "On the trail." : "A moment to yourself.";
    r.revision++;
    return out;
  }
  if (action === "buy-potion") {
    if (r.gold < 12 || r.potions >= 99) return out;
    r.gold -= 12;
    r.potions++;
    out.changed = true;
    out.message = "A small bottle of courage.";
    r.revision++;
    return out;
  }
  if (action === "rest") {
    if (r.status === "victory") r.wave = (r.wave + 1) % 5;
    r.hp = s.maxHp;
    r.mp = s.maxMp;
    r.status = "camp";
    r.auto = false;
    r.carry = 0;
    r.enemyHp = enemy(r).hp;
    r.turn = 0;
    out.changed = true;
    out.message = "The fire is warm.";
    note(r, out.message);
    r.revision++;
    return out;
  }
  if (action === "continue") {
    if (r.status !== "victory" && r.status !== "camp") return out;
    if (r.status === "victory") r.wave = (r.wave + 1) % 5;
    begin(r);
    out.changed = true;
    r.revision++;
    return out;
  }
  if (r.status !== "battle" || !skillReady(r, action)) return out;
  const skill = SKILLS.find((x) => x.id === action);
  if (skill) r.mp -= skill.mp;
  let guarded = false;
  if (action === "guard") {
    guarded = true;
    r.mp = Math.min(s.maxMp, r.mp + 3);
    out.message = "Guard.";
  } else if (action === "heal") {
    const healed = Math.min(
      s.maxHp - r.hp,
      Math.floor(s.maxHp * 0.38) + s.magic,
    );
    r.hp += healed;
    out.message = "+" + healed + " HP";
  } else if (action === "potion") {
    r.potions--;
    const healed = Math.min(s.maxHp - r.hp, Math.floor(s.maxHp * 0.55));
    r.hp += healed;
    out.message = "+" + healed + " HP";
  } else {
    const critical = random(r) < 0.1;
    out.damage = Math.max(
      1,
      Math.floor(
        (s.attack * (action === "stroke" ? 2.15 : action === "nova" ? 2.8 : 1) +
          (action === "nova" ? s.magic * 2 : 0)) *
          (critical ? 1.5 : 1),
      ) - foe.defense,
    );
    r.enemyHp = Math.max(0, r.enemyHp - out.damage);
    out.message = critical ? "Critical! −" + out.damage : "−" + out.damage;
    if (action === "attack") r.mp = Math.min(s.maxMp, r.mp + 1);
  }
  out.changed = true;
  if (r.enemyHp <= 0) {
    out.victory = true;
    r.status = "victory";
    r.kills++;
    r.gold += (4 + r.zone * 5) * (foe.boss ? 3 : 1);
    r.ink += 1 + Math.floor(r.zone / 2) + (foe.boss ? 3 : 0);
    r.xp += (8 + r.zone * 8) * (foe.boss ? 3 : 1);
    out.renown =
      (10 + r.zone * 12) *
      (foe.boss ? 4 : 1) *
      (r.zone === 8 ? 1 + r.depth : 1);
    if (r.kills === 1) out.drop = "weapon-0";
    else if (foe.boss) out.drop = "weapon-" + Math.min(7, r.zone);
    else if (random(r) < 0.4)
      out.drop = (random(r) < 0.5 ? "armor-" : "charm-") + Math.min(7, r.zone);
    if (out.drop) {
      if (!r.owned.includes(out.drop)) {
        r.owned.push(out.drop);
        note(r, ITEMS.find((x) => x.id === out.drop)!.name + " found.");
      } else {
        r.gold += 5 * (r.zone + 1);
        out.drop = "";
      }
    }
    if (foe.boss) {
      r.bosses++;
      if (r.zone < 8) r.cleared = Math.max(r.cleared, r.zone + 1);
      else r.depth++;
      r.auto = false;
      note(r, foe.name + " defeated.");
    }
    while (r.level < 50 && r.xp >= nextXp(r.level)) {
      r.xp -= nextXp(r.level);
      r.level++;
      out.levelUp = true;
    }
    if (r.level === 50) r.xp = Math.min(r.xp, nextXp(50) - 1);
    if (out.levelUp) {
      const fresh = stats(r);
      r.hp = fresh.maxHp;
      r.mp = fresh.maxMp;
      note(r, "Level " + r.level + ".");
    } else r.mp = Math.min(s.maxMp, r.mp + 2);
    out.message = foe.boss
      ? foe.name + " defeated."
      : "+" + out.renown + " renown";
    if (!foe.boss) note(r, foe.name + " · +" + (8 + r.zone * 8) + " XP");
  } else {
    out.received = Math.max(
      1,
      Math.floor(
        (foe.attack * (foe.heavy ? 1.9 : 1) - s.defense) * (guarded ? 0.18 : 1),
      ),
    );
    r.hp = Math.max(0, r.hp - out.received);
    r.turn++;
    if (r.party.includes("mote")) r.mp = Math.min(s.maxMp, r.mp + 1);
    if (r.hp > 0 && r.party.includes("puddle"))
      r.hp = Math.min(s.maxHp, r.hp + 3);
    if (r.hp === 0) {
      r.status = "down";
      r.auto = false;
      out.message = "A little rest is in order.";
      note(r, "The path can wait.");
    }
  }
  r.revision++;
  return out;
}
export function travel(r: RpgState, zone: number): boolean {
  if (!Number.isInteger(zone) || zone < 0 || zone > 8 || zone > r.cleared)
    return false;
  r.zone = zone;
  r.wave = 0;
  r.turn = 0;
  r.status = "camp";
  r.auto = false;
  r.carry = 0;
  r.hp = stats(r).maxHp;
  r.mp = stats(r).maxMp;
  r.enemyHp = enemy(r).hp;
  r.revision++;
  note(r, REGIONS[zone].name + ".");
  return true;
}
export function equip(r: RpgState, id: string): boolean {
  const item = ITEMS.find((x) => x.id === id);
  if (!item || !r.owned.includes(id)) return false;
  r.gear[item.slot] = id;
  r.revision++;
  return true;
}
export function forgeCost(r: RpgState, id: string): number {
  const item = ITEMS.find((x) => x.id === id);
  return item
    ? Math.floor((3 + (r.forged[id] || 0) * 2) * Math.max(1, item.tier))
    : Infinity;
}
export function forge(r: RpgState, id: string): boolean {
  if (
    r.level < 3 ||
    !r.owned.includes(id) ||
    (r.forged[id] || 0) >= 20 ||
    r.ink < forgeCost(r, id)
  )
    return false;
  r.ink -= forgeCost(r, id);
  r.forged[id] = (r.forged[id] || 0) + 1;
  r.revision++;
  return true;
}
export function allocate(r: RpgState, attribute: Attribute): boolean {
  if (!["might", "vigor", "wisdom"].includes(attribute) || points(r) < 1)
    return false;
  r.attributes[attribute]++;
  if (attribute === "vigor") r.hp += 7;
  if (attribute === "wisdom") r.mp += 2;
  r.revision++;
  return true;
}
export function party(r: RpgState, id: string): boolean {
  const ally = COMPANIONS.find((x) => x.id === id);
  if (!ally || r.cleared < ally.cleared) return false;
  if (r.party.includes(id)) r.party = r.party.filter((x) => x !== id);
  else {
    if (r.party.length >= 2) return false;
    r.party.push(id);
  }
  r.revision++;
  return true;
}
export const QUESTS = [
  {
    id: "first-road",
    name: "A little further",
    sprite: "rpg-scroll",
    goal: 5,
    kind: "kills",
    gold: 25,
    ink: 4,
    renown: 30,
  },
  {
    id: "beyond",
    name: "Over the hill",
    sprite: "rpg-map",
    goal: 2,
    kind: "cleared",
    gold: 70,
    ink: 8,
    renown: 100,
  },
  {
    id: "collector",
    name: "Pocket treasures",
    sprite: "rpg-chest",
    goal: 6,
    kind: "items",
    gold: 50,
    ink: 10,
    renown: 60,
  },
  {
    id: "sharper",
    name: "Something stronger",
    sprite: "rpg-hammer",
    goal: 3,
    kind: "forged",
    gold: 90,
    ink: 12,
    renown: 150,
  },
  {
    id: "old-magic",
    name: "A familiar warmth",
    sprite: "sun",
    goal: 8,
    kind: "level",
    gold: 150,
    ink: 20,
    renown: 250,
  },
  {
    id: "unwritten",
    name: "The last blank page",
    sprite: "rpg-crown",
    goal: 8,
    kind: "cleared",
    gold: 500,
    ink: 50,
    renown: 1500,
  },
] as const;
export function questProgress(r: RpgState, kind: string): number {
  return kind === "items"
    ? r.owned.length
    : kind === "forged"
      ? Object.values(r.forged).reduce((a, b) => a + b, 0)
      : kind === "kills"
        ? r.kills
        : kind === "cleared"
          ? r.cleared
          : r.level;
}
export function claim(r: RpgState, id: string): number {
  const q = QUESTS.find((x) => x.id === id);
  if (!q || r.claimed.includes(id) || questProgress(r, q.kind) < q.goal)
    return 0;
  r.claimed.push(id);
  r.gold += q.gold;
  r.ink += q.ink;
  r.revision++;
  return q.renown;
}
export function tickRpg(r: RpgState, seconds: number): number {
  if (!r.auto) return 0;
  r.carry += Math.max(0, Math.min(28800, seconds));
  let renown = 0,
    turns = 0;
  while (r.carry >= 1.2 && r.auto && turns < 24000) {
    r.carry -= 1.2;
    turns++;
    if (r.status === "victory" || r.status === "camp") {
      act(r, "continue");
      continue;
    }
    if (r.status === "down") {
      r.auto = false;
      break;
    }
    const s = stats(r),
      foe = enemy(r);
    const action: RpgAction =
      r.hp < s.maxHp * 0.4 && skillReady(r, "heal")
        ? "heal"
        : r.hp < s.maxHp * 0.3 && r.potions > 0
          ? "potion"
          : foe.heavy
            ? "guard"
            : skillReady(r, "stroke")
              ? "stroke"
              : "attack";
    renown += act(r, action).renown;
  }
  if (!r.auto) r.carry = 0;
  return renown;
}
function integer(x: unknown, fallback: number, max = 1e9): number {
  return typeof x === "number" && Number.isFinite(x) && x >= 0
    ? Math.min(max, Math.floor(x))
    : fallback;
}
export function restoreRpg(value: unknown): RpgState {
  const base = createRpg();
  if (!value || typeof value !== "object") return base;
  const v = value as Record<string, unknown>;
  base.level = Math.max(1, integer(v.level, 1, 50));
  base.xp = integer(v.xp, 0, nextXp(base.level) - 1);
  base.gold = integer(v.gold, 0);
  base.ink = integer(v.ink, 0);
  base.potions = integer(v.potions, 2, 99);
  base.cleared = integer(v.cleared, 0, 8);
  base.zone = integer(v.zone, 0, base.cleared);
  base.wave = integer(v.wave, 0, 4);
  base.depth = integer(v.depth, 0, 10000);
  base.turn = integer(v.turn, 0);
  base.kills = integer(v.kills, 0);
  base.bosses = integer(v.bosses, 0);
  base.seed = integer(v.seed, base.seed, 0xffffffff);
  base.color = integer(v.color, 0, 7);
  if (Array.isArray(v.owned))
    base.owned = [
      ...new Set([
        "stub",
        "shirt",
        ...v.owned.filter(
          (id): id is string =>
            typeof id === "string" && ITEMS.some((x) => x.id === id),
        ),
      ]),
    ];
  if (v.gear && typeof v.gear === "object") {
    for (const slot of ["weapon", "armor", "charm"] as Slot[]) {
      const id = (v.gear as Record<string, unknown>)[slot];
      if (
        typeof id === "string" &&
        base.owned.includes(id) &&
        ITEMS.some((x) => x.id === id && x.slot === slot)
      )
        base.gear[slot] = id;
    }
  }
  if (v.forged && typeof v.forged === "object") {
    for (const id of base.owned)
      base.forged[id] = integer(
        (v.forged as Record<string, unknown>)[id],
        0,
        20,
      );
  }
  if (v.attributes && typeof v.attributes === "object") {
    let left = base.level - 1;
    for (const a of ["might", "vigor", "wisdom"] as Attribute[]) {
      base.attributes[a] = integer(
        (v.attributes as Record<string, unknown>)[a],
        0,
        left,
      );
      left -= base.attributes[a];
    }
  }
  if (Array.isArray(v.party))
    base.party = [
      ...new Set(
        v.party.filter(
          (id): id is string =>
            typeof id === "string" &&
            COMPANIONS.some((c) => c.id === id && c.cleared <= base.cleared),
        ),
      ),
    ].slice(0, 2);
  if (Array.isArray(v.claimed))
    base.claimed = [
      ...new Set(
        v.claimed.filter(
          (id): id is string =>
            typeof id === "string" && QUESTS.some((q) => q.id === id),
        ),
      ),
    ];
  base.status = ["battle", "victory", "camp", "down"].includes(String(v.status))
    ? (v.status as RpgState["status"])
    : "battle";
  base.hp = integer(v.hp, stats(base).maxHp, stats(base).maxHp);
  base.mp = integer(v.mp, stats(base).maxMp, stats(base).maxMp);
  base.enemyHp = integer(v.enemyHp, enemy(base).hp, enemy(base).hp);
  if (base.status === "battle" && base.hp === 0) base.status = "down";
  if (base.status === "battle" && base.enemyHp === 0) base.status = "victory";
  base.auto = v.auto === true && base.cleared >= 1 && base.status !== "down";
  base.carry = 0;
  // Text is reconstructed from trusted game data, never injected from an imported file.
  base.log = [REGIONS[base.zone].name + "."];
  return base;
}
