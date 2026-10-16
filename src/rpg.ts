import { MAP_CENTER, WORLD_MAP, findPath, neighbors } from "./rpg-map.ts";
import {
  ITEMS,
  REGIONS,
  COMPANIONS,
  QUESTS,
  SKILLS,
  type Slot,
  type Attribute,
  type CombatAction,
  type RpgAction,
} from "./rpg-data.ts";
export * from "./rpg-data.ts";
export type MemberId = "hero" | "pip" | "moss" | "mote" | "puddle";
export type AbilityId =
  | Exclude<CombatAction, "potion">
  | "shot"
  | "volley"
  | "mark"
  | "bash"
  | "shell"
  | "taunt"
  | "spark"
  | "arc"
  | "siphon"
  | "peck"
  | "mend"
  | "rain";
export type Member = {
  hp: number;
  mp: number;
  cooldown: number;
  ability: AbilityId;
  shield: number;
  guard: number;
  flash: number;
  last: string;
};
export type Foe = {
  id: number;
  name: string;
  sprite: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  cooldown: number;
  marked: number;
  flash: number;
  boss: boolean;
  level: number;
  turn: number;
};
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
  recruited: string[];
  auto: boolean;
  carry: number;
  seed: number;
  color: number;
  revision: number;
  log: string[];
  maze: {
    version: 1;
    cell: number;
    visited: number[];
    cleared: number[];
    route: number[];
    walk: number;
    wait: number;
    serial: number;
    reward: number;
  };
  members: Record<MemberId, Member>;
  foes: Foe[];
};
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
export const ABILITIES: Record<
  AbilityId,
  { name: string; sprite: string; mp: number; level: number }
> = {
  attack: { name: "Strike", sprite: "rpg-sword", mp: 0, level: 1 },
  guard: { name: "Brace", sprite: "rpg-shield", mp: 0, level: 1 },
  stroke: { name: "Power strike", sprite: "rpg-sword-gold", mp: 3, level: 2 },
  heal: { name: "Mend", sprite: "rpg-heart", mp: 4, level: 4 },
  nova: { name: "Sunburst", sprite: "rpg-sun-boss", mp: 6, level: 8 },
  shot: { name: "Quick shot", sprite: "rpg-arrow", mp: 0, level: 1 },
  volley: { name: "Volley", sprite: "rpg-volley", mp: 3, level: 1 },
  mark: { name: "Mark", sprite: "rpg-target", mp: 2, level: 1 },
  bash: { name: "Bash", sprite: "rpg-hammer", mp: 0, level: 1 },
  shell: { name: "Shell", sprite: "rpg-shell", mp: 2, level: 1 },
  taunt: { name: "Provoke", sprite: "rpg-horn", mp: 2, level: 1 },
  spark: { name: "Spark", sprite: "rpg-spark", mp: 0, level: 1 },
  arc: { name: "Arc", sprite: "rpg-arc", mp: 3, level: 1 },
  siphon: { name: "Siphon", sprite: "rpg-siphon", mp: 0, level: 1 },
  peck: { name: "Peck", sprite: "rpg-arrow", mp: 0, level: 1 },
  mend: { name: "Mend", sprite: "rpg-heart", mp: 2, level: 1 },
  rain: { name: "Soft rain", sprite: "rpg-rain", mp: 4, level: 1 },
};
export const MEMBER_ABILITIES: Record<MemberId, AbilityId[]> = {
  hero: ["attack", "guard", "stroke", "heal", "nova"],
  pip: ["shot", "volley", "mark"],
  moss: ["bash", "shell", "taunt"],
  mote: ["spark", "arc", "siphon"],
  puddle: ["peck", "mend", "rain"],
};
export const MEMBER_NAMES: Record<MemberId, string> = {
  hero: "You",
  pip: "Pip",
  moss: "Moss",
  mote: "Mote",
  puddle: "Puddle",
};
export function memberSprite(id: MemberId): string {
  return id === "hero" ? "rpg-hero" : "rpg-ally-" + id;
}
export function nextXp(level: number): number {
  return 12 + level * 8 + level * level * 2;
}
export function stats(r: RpgState) {
  const weapon = ITEMS.find((i) => i.id === r.gear.weapon),
    armor = ITEMS.find((i) => i.id === r.gear.armor),
    charm = ITEMS.find((i) => i.id === r.gear.charm);
  return {
    maxHp: 36 + r.level * 9 + r.attributes.vigor * 7,
    maxMp: 6 + r.level + r.attributes.wisdom * 2,
    attack:
      4 +
      r.level * 2 +
      r.attributes.might * 2 +
      (weapon?.attack || 0) +
      (r.forged[r.gear.weapon] || 0) * 2,
    defense:
      1 +
      Math.floor(r.level / 3) +
      r.attributes.vigor +
      (armor?.defense || 0) +
      (r.forged[r.gear.armor] || 0) * 2 +
      (charm?.defense || 0),
    magic:
      2 +
      r.level +
      r.attributes.wisdom * 3 +
      (charm?.magic || 0) +
      (r.forged[r.gear.charm] || 0) * 2,
  };
}
export function memberStats(r: RpgState, id: MemberId) {
  const s = stats(r),
    hp = { hero: 1, pip: 0.82, moss: 1.6, mote: 0.75, puddle: 0.9 }[id],
    atk = { hero: 1, pip: 0.95, moss: 0.65, mote: 0.6, puddle: 0.55 }[id];
  return {
    ...s,
    maxHp: Math.round(s.maxHp * hp),
    maxMp: s.maxMp + (id === "mote" || id === "puddle" ? 6 : 0),
    attack: Math.max(1, Math.round(s.attack * atk)),
    defense: s.defense + (id === "moss" ? 4 + r.level : 0),
    magic: Math.round(
      s.magic * (id === "mote" ? 1.8 : id === "puddle" ? 1.4 : 1),
    ),
    speed: id === "pip" ? 0.85 : id === "moss" ? 1.55 : 1.25,
  };
}
export function activeMembers(r: RpgState): MemberId[] {
  return ["hero", ...r.party] as MemberId[];
}
export function createRpg(): RpgState {
  const members = {} as Record<MemberId, Member>;
  const r: RpgState = {
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
    enemyHp: 0,
    turn: 0,
    status: "camp",
    kills: 0,
    bosses: 0,
    owned: ["stub", "shirt"],
    gear: { weapon: "stub", armor: "shirt", charm: "" },
    forged: {},
    attributes: { might: 0, vigor: 0, wisdom: 0 },
    claimed: [],
    party: [],
    recruited: [],
    auto: true,
    carry: 0,
    seed: 7319,
    color: 0,
    revision: 0,
    log: ["The little camp."],
    maze: {
      version: 1,
      cell: MAP_CENTER,
      visited: [MAP_CENTER],
      cleared: [MAP_CENTER],
      route: [],
      walk: 0,
      wait: 0,
      serial: 0,
      reward: 0,
    },
    members,
    foes: [],
  };
  for (const id of Object.keys(MEMBER_ABILITIES) as MemberId[]) {
    const s = memberStats(r, id);
    members[id] = {
      hp: s.maxHp,
      mp: s.maxMp,
      cooldown: 0.65,
      ability: id === "puddle" ? "mend" : MEMBER_ABILITIES[id][0],
      shield: 0,
      guard: 0,
      flash: 0,
      last: "",
    };
  }
  return r;
}
export function points(r: RpgState): number {
  return Math.max(
    0,
    r.level - 1 - r.attributes.might - r.attributes.vigor - r.attributes.wisdom,
  );
}
export function areaStats(cell: number, depth = 0) {
  const tile = WORLD_MAP[cell] ?? WORLD_MAP[MAP_CENTER],
    d = tile.distance;
  return {
    distance: d,
    level: 1 + d + depth * 4,
    hp: Math.round((14 + d * 6 + d * d * 3) * (1 + depth * 0.35)),
    attack: Math.round(
      (3 + d * 2 + Math.floor((d * d) / 6)) * (1 + depth * 0.18),
    ),
    defense: Math.floor(d / 3) + depth,
    rewards: {
      gold: (4 + d * 3 + Math.floor((d * d) / 2)) * (1 + depth),
      xp: (8 + d * 5 + d * d) * (1 + depth),
      renown: (10 + d * 10 + d * d * 3) * (1 + depth),
      ink: (1 + Math.floor(d / 3)) * (1 + depth),
    },
    count: d >= 10 ? 3 : d >= 4 ? 2 : 1,
  };
}
export function enemy(r: RpgState) {
  const f = r.foes.find((f) => f.hp > 0) ?? r.foes[0],
    a = areaStats(r.maze.cell, r.depth),
    region = REGIONS[r.zone];
  return {
    name: f?.name ?? region.foes[0],
    sprite: f?.sprite ?? region.sprites[0],
    boss: f?.boss ?? false,
    hp: r.foes.reduce((n, f) => n + f.maxHp, 0),
    attack: f?.attack ?? a.attack,
    defense: f?.defense ?? a.defense,
    level: f?.level ?? a.level,
    heavy: !!f && f.turn % 3 === 2,
  };
}
function random(r: RpgState) {
  r.seed = (Math.imul(r.seed, 1664525) + 1013904223) >>> 0;
  return r.seed / 4294967296;
}
function note(r: RpgState, text: string) {
  r.log = [text, ...r.log].slice(0, 5);
}
function sync(r: RpgState) {
  r.hp = r.members.hero.hp;
  r.mp = r.members.hero.mp;
  r.enemyHp = r.foes.reduce((n, f) => n + f.hp, 0);
}
function begin(r: RpgState): void {
  const tile = WORLD_MAP[r.maze.cell],
    a = areaStats(tile.id, r.depth),
    region = REGIONS[r.zone],
    boss = tile.kind === "lair" || r.wave % 5 === 4;
  r.foes = Array.from({ length: boss ? 1 : a.count }, (_, i) => {
    const hp = Math.round(a.hp * (boss ? 2.4 : 1) * (i === 0 ? 1 : 0.8));
    return {
      id: ++r.maze.serial,
      name: boss ? region.boss : region.foes[(i + r.wave) % 3],
      sprite: boss ? region.bossSprite : region.sprites[(i + r.wave) % 3],
      hp,
      maxHp: hp,
      attack: Math.round(a.attack * (boss ? 1.35 : i === 0 ? 1 : 0.75)),
      defense: a.defense,
      cooldown: 1.6 + i * 0.5,
      marked: 0,
      flash: 0,
      boss,
      level: a.level + (boss ? 2 : 0),
      turn: 0,
    };
  });
  r.status = "battle";
  r.turn = 0;
  r.maze.wait = 0;
  r.maze.reward = 0;
  for (const id of activeMembers(r)) {
    const m = r.members[id];
    m.cooldown = Math.max(0.2, m.cooldown);
    m.shield = 0;
    m.guard = 0;
  }
  sync(r);
  r.revision++;
}
export function navigate(r: RpgState, cell: number): boolean {
  if (r.status === "down") return false;
  const route = findPath(r.maze.cell, cell);
  if (!route) return false;
  r.maze.route = route;
  r.maze.walk = 0;
  r.auto = true;
  r.revision++;
  if (
    !route.length &&
    cell !== MAP_CENTER &&
    r.status !== "battle" &&
    WORLD_MAP[cell].room
  )
    begin(r);
  return true;
}
export function chooseAbility(
  r: RpgState,
  id: MemberId,
  ability: AbilityId,
): boolean {
  if (
    !activeMembers(r).includes(id) ||
    !MEMBER_ABILITIES[id]?.includes(ability) ||
    r.level < ABILITIES[ability].level ||
    r.members[id].ability === ability
  )
    return false;
  r.members[id].ability = ability;
  r.revision++;
  return true;
}
export function skillReady(r: RpgState, id: CombatAction): boolean {
  return id === "potion"
    ? r.potions > 0
    : !!ABILITIES[id] && r.level >= ABILITIES[id].level;
}
export function rest(r: RpgState): void {
  r.maze.cell = MAP_CENTER;
  r.maze.route = [];
  r.maze.walk = 0;
  r.maze.wait = 0;
  r.foes = [];
  r.status = "camp";
  r.zone = 0;
  r.carry = 0;
  r.auto = true;
  for (const id of Object.keys(r.members) as MemberId[]) {
    const m = r.members[id],
      s = memberStats(r, id);
    m.hp = s.maxHp;
    m.mp = s.maxMp;
    m.cooldown = 0.65;
    m.shield = 0;
    m.guard = 0;
  }
  sync(r);
  note(r, "The fire is warm.");
  r.revision++;
}
export function act(r: RpgState, action: RpgAction): Result {
  const out = empty();
  if (action === "rest") {
    rest(r);
    out.changed = true;
  } else if (action === "auto") {
    r.auto = !r.auto;
    out.changed = true;
    r.revision++;
  } else if (action === "buy-potion" && r.gold >= 12 && r.potions < 99) {
    r.gold -= 12;
    r.potions++;
    out.changed = true;
    r.revision++;
  } else if (action === "potion" && r.potions > 0 && r.status !== "down") {
    const id = activeMembers(r)
      .filter((id) => r.members[id].hp > 0)
      .sort(
        (a, b) =>
          r.members[a].hp / memberStats(r, a).maxHp -
          r.members[b].hp / memberStats(r, b).maxHp,
      )[0];
    if (id && r.members[id].hp < memberStats(r, id).maxHp) {
      r.potions--;
      r.members[id].hp = Math.min(
        memberStats(r, id).maxHp,
        r.members[id].hp + Math.round(memberStats(r, id).maxHp * 0.55),
      );
      sync(r);
      out.changed = true;
      r.revision++;
    }
  } else if (
    action === "continue" &&
    r.maze.cell !== MAP_CENTER &&
    r.status !== "battle" &&
    r.status !== "down"
  ) {
    r.auto = true;
    begin(r);
    out.changed = true;
  } else if (["attack", "guard", "stroke", "heal", "nova"].includes(action))
    out.changed = chooseAbility(r, "hero", action as AbilityId);
  return out;
}
export function companionReady(r: RpgState, id: string): boolean {
  const c = COMPANIONS.find((c) => c.id === id);
  return !!c && (r.kills >= c.kills || r.cleared >= c.cleared);
}
export function recruit(r: RpgState, id: string): boolean {
  const c = COMPANIONS.find((c) => c.id === id);
  if (
    !c ||
    r.recruited.includes(id) ||
    !companionReady(r, id) ||
    r.gold < c.cost
  )
    return false;
  r.gold -= c.cost;
  r.recruited.push(id);
  if (r.party.length < 3 && r.status !== "battle") r.party.push(id);
  r.revision++;
  return true;
}
export function party(r: RpgState, id: string): boolean {
  if (!r.recruited.includes(id) || r.status === "battle") return false;
  if (r.party.includes(id)) r.party = r.party.filter((x) => x !== id);
  else {
    if (r.party.length >= 3) return false;
    r.party.push(id);
  }
  r.revision++;
  return true;
}
function healMember(r: RpgState, id: MemberId, amount: number): void {
  const m = r.members[id];
  if (m.hp <= 0) return;
  m.hp = Math.min(memberStats(r, id).maxHp, m.hp + Math.round(amount));
  m.flash = 0.4;
  m.last = "+HP";
}
function useAbility(r: RpgState, id: MemberId): void {
  const m = r.members[id],
    s = memberStats(r, id),
    living = r.foes.filter((f) => f.hp > 0);
  if (!living.length) return;
  let ability = m.ability;
  if (m.mp < ABILITIES[ability].mp) ability = MEMBER_ABILITIES[id][0];
  m.mp -= ABILITIES[ability].mp;
  m.cooldown = s.speed;
  m.flash = 0.35;
  m.last = ABILITIES[ability].name;
  m.guard = 0;
  const front = living[0],
    weakest = activeMembers(r)
      .filter((id) => r.members[id].hp > 0)
      .sort(
        (a, b) =>
          r.members[a].hp / memberStats(r, a).maxHp -
          r.members[b].hp / memberStats(r, b).maxHp,
      )[0];
  const hit = (f: Foe, power: number) => {
    const damage = Math.max(
      1,
      Math.round(power * (f.marked > 0 ? 1.3 : 1)) - f.defense,
    );
    f.hp = Math.max(0, f.hp - damage);
    f.flash = 0.3;
  };
  if (ability === "heal" || ability === "mend")
    healMember(r, weakest, s.magic + memberStats(r, weakest).maxHp * 0.28);
  else if (ability === "rain")
    for (const ally of activeMembers(r))
      healMember(r, ally, s.magic * 0.7 + memberStats(r, ally).maxHp * 0.12);
  else if (ability === "guard") {
    m.guard = 2;
    hit(front, s.attack * 0.35);
    m.mp = Math.min(s.maxMp, m.mp + 2);
  } else if (ability === "shell") {
    for (const ally of activeMembers(r))
      r.members[ally].shield = Math.max(
        r.members[ally].shield,
        Math.round(s.defense + s.maxHp * 0.13),
      );
    hit(front, s.attack * 0.35);
  } else if (ability === "taunt") {
    m.guard = 3;
    hit(front, s.attack * 0.55);
  } else if (ability === "volley" || ability === "arc" || ability === "nova")
    for (const f of living)
      hit(
        f,
        ability === "volley"
          ? s.attack * 0.75
          : ability === "arc"
            ? s.magic * 1.2 + s.attack * 0.65
            : s.attack * 1.8 + s.magic * 2,
      );
  else if (ability === "mark") {
    front.marked = 3.8;
    hit(front, s.attack * 1.15);
  } else if (ability === "siphon") {
    hit(front, s.magic * 0.7 + s.attack * 0.5);
    for (const ally of activeMembers(r))
      r.members[ally].mp = Math.min(
        memberStats(r, ally).maxMp,
        r.members[ally].mp + 2,
      );
  } else {
    hit(
      front,
      ability === "stroke"
        ? s.attack * 2.1
        : ability === "spark"
          ? s.magic * 1.5 + s.attack
          : ability === "bash"
            ? s.attack * 0.9
            : s.attack,
    );
    if (ability === "bash")
      r.members[weakest].shield = Math.max(
        r.members[weakest].shield,
        s.defense,
      );
  }
  if (ABILITIES[ability].mp === 0) m.mp = Math.min(s.maxMp, m.mp + 1);
}
export function encounterRewards(r: RpgState) {
  const a = areaStats(r.maze.cell, r.depth),
    factor = r.foes.some((f) => f.boss) ? 3 : a.count;
  const chest =
    WORLD_MAP[r.maze.cell].kind === "chest" &&
    !r.maze.cleared.includes(r.maze.cell)
      ? 2
      : 1;
  return {
    gold: a.rewards.gold * factor * chest,
    xp: a.rewards.xp * factor,
    renown: a.rewards.renown * factor,
    ink: a.rewards.ink * factor,
  };
}
function victory(r: RpgState): number {
  const rewards = encounterRewards(r),
    boss = r.foes.some((f) => f.boss);
  r.gold += rewards.gold;
  r.xp += rewards.xp;
  r.ink += rewards.ink;
  r.kills += r.foes.length;
  r.wave++;
  if (boss) r.bosses++;
  if (!r.maze.cleared.includes(r.maze.cell)) r.maze.cleared.push(r.maze.cell);
  r.cleared = Math.max(
    r.cleared,
    Math.min(8, WORLD_MAP[r.maze.cell].region + 1),
  );
  let drop = "";
  if (r.kills === 1) drop = "weapon-0";
  else if (boss || random(r) < 0.35)
    drop =
      (boss ? "weapon-" : random(r) < 0.5 ? "armor-" : "charm-") +
      Math.min(7, WORLD_MAP[r.maze.cell].region);
  if (drop && !r.owned.includes(drop)) r.owned.push(drop);
  let leveled = false;
  while (r.level < 50 && r.xp >= nextXp(r.level)) {
    r.xp -= nextXp(r.level);
    r.level++;
    leveled = true;
  }
  if (r.level === 50) r.xp = Math.min(r.xp, nextXp(50) - 1);
  for (const id of activeMembers(r)) {
    const m = r.members[id],
      s = memberStats(r, id);
    m.hp = leveled
      ? s.maxHp
      : Math.min(
          s.maxHp,
          m.hp +
            (m.hp === 0
              ? Math.round(s.maxHp * 0.3)
              : Math.round(s.maxHp * 0.14)),
        );
    m.mp = leveled ? s.maxMp : Math.min(s.maxMp, m.mp + 2);
    m.shield = 0;
    m.guard = 0;
  }
  r.status = "victory";
  r.maze.reward = rewards.renown;
  r.maze.wait = 0.9;
  sync(r);
  r.revision++;
  note(r, `+${rewards.renown} renown${leveled ? " · Level " + r.level : ""}`);
  return rewards.renown;
}
function step(r: RpgState, dt: number): number {
  for (const id of activeMembers(r)) {
    const m = r.members[id];
    m.flash = Math.max(0, m.flash - dt);
    m.guard = Math.max(0, m.guard - dt);
  }
  if (r.status === "battle") {
    for (const f of r.foes) {
      f.flash = Math.max(0, f.flash - dt);
      f.marked = Math.max(0, f.marked - dt);
    }
    for (const id of activeMembers(r)) {
      const m = r.members[id];
      if (m.hp <= 0) continue;
      m.cooldown -= dt;
      if (m.cooldown <= 0) useAbility(r, id);
    }
    if (r.foes.every((f) => f.hp <= 0)) return victory(r);
    for (const f of r.foes) {
      if (f.hp <= 0) continue;
      f.cooldown -= dt;
      if (f.cooldown > 0) continue;
      const living = activeMembers(r).filter((id) => r.members[id].hp > 0);
      if (!living.length) break;
      const target =
        living.includes("moss") && r.members.moss.guard > 0
          ? "moss"
          : living[r.turn % living.length];
      const m = r.members[target],
        s = memberStats(r, target),
        heavy = f.turn % 3 === 2;
      const raw = Math.max(
        1,
        Math.round(
          (f.attack * (heavy ? 1.65 : 1) - s.defense) *
            (m.guard > 0 ? 0.28 : 1),
        ),
      );
      const absorbed = Math.min(m.shield, raw);
      m.shield -= absorbed;
      m.hp = Math.max(0, m.hp - (raw - absorbed));
      m.flash = 0.35;
      m.last = absorbed === raw ? "BLOCK" : "−" + (raw - absorbed);
      f.cooldown = heavy ? 2.2 : 1.7;
      f.turn++;
      r.turn++;
      r.revision++;
    }
    if (activeMembers(r).every((id) => r.members[id].hp <= 0)) {
      r.status = "down";
      r.auto = false;
      r.maze.route = [];
      note(r, "Back to the fire.");
      r.revision++;
    }
    sync(r);
    return 0;
  }
  if (r.status === "down") return 0;
  if (r.maze.wait > 0) {
    r.maze.wait = Math.max(0, r.maze.wait - dt);
    return 0;
  }
  if (r.maze.route.length) {
    r.maze.walk += dt;
    if (r.maze.walk < 0.24) return 0;
    r.maze.walk -= 0.24;
    const next = r.maze.route.shift()!;
    if (!neighbors(r.maze.cell).includes(next)) {
      r.maze.route = [];
      return 0;
    }
    r.maze.cell = next;
    if (!r.maze.visited.includes(next)) r.maze.visited.push(next);
    const tile = WORLD_MAP[next];
    r.zone = r.depth > 0 ? 8 : tile.region;
    r.revision++;
    if (next === MAP_CENTER) {
      const route = r.maze.route;
      rest(r);
      r.maze.route = route;
      return 0;
    }
    if (tile.room && !r.maze.cleared.includes(next)) begin(r);
    else r.status = "camp";
  } else if (WORLD_MAP[r.maze.cell].room && r.maze.cell !== MAP_CENTER)
    begin(r);
  return 0;
}
export function tickRpg(r: RpgState, seconds: number): number {
  if (!r.auto || !Number.isFinite(seconds) || seconds <= 0) return 0;
  r.carry += Math.min(28800, seconds);
  let renown = 0;
  // Bounded fixed steps keep long absences deterministic, including travel and KOs.
  while (r.carry + 1e-9 >= 0.1 && r.auto) {
    if (
      r.status !== "battle" &&
      !r.maze.route.length &&
      r.maze.cell === MAP_CENTER
    ) {
      r.carry = 0;
      break;
    }
    let dt = 0.1;
    if (r.carry > 5) {
      const next =
        r.status === "battle"
          ? Math.min(
              ...activeMembers(r)
                .filter((id) => r.members[id].hp > 0)
                .map((id) => r.members[id].cooldown),
              ...r.foes.filter((f) => f.hp > 0).map((f) => f.cooldown),
            )
          : r.maze.wait > 0
            ? r.maze.wait
            : r.maze.route.length
              ? 0.24 - r.maze.walk
              : 0.1;
      dt = 0.1 * Math.max(1, Math.ceil(next / 0.1 - 1e-8));
      dt = Math.min(dt, Math.floor(r.carry / 0.1) * 0.1);
    }
    r.carry = Math.max(0, r.carry - dt);
    renown += step(r, dt);
  }
  if (!r.auto) r.carry = 0;
  return renown;
}
export function nextPage(r: RpgState): boolean {
  if (r.maze.cell !== MAP_CENTER || r.cleared < 8 || r.depth >= 10000)
    return false;
  r.depth++;
  r.maze.visited = [MAP_CENTER];
  r.maze.cleared = [MAP_CENTER];
  r.maze.route = [];
  r.wave = 0;
  r.revision++;
  return true;
}
// Kept as a model entry point for callers; destinations now correspond to maze areas.
export function travel(r: RpgState, zone: number): boolean {
  if (!Number.isInteger(zone) || zone < 0 || zone > 8) return false;
  const tile = WORLD_MAP.find(
    (c) =>
      !c.wall &&
      c.room &&
      c.id !== MAP_CENTER &&
      c.region === Math.min(7, zone),
  );
  return !!tile && navigate(r, tile.id);
}
export function equip(r: RpgState, id: string): boolean {
  const item = ITEMS.find((x) => x.id === id);
  if (!item || !r.owned.includes(id)) return false;
  r.gear[item.slot] = id;
  for (const member of activeMembers(r)) {
    r.members[member].mp = Math.min(
      r.members[member].mp,
      memberStats(r, member).maxMp,
    );
  }
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
export function allocate(r: RpgState, a: Attribute): boolean {
  if (!["might", "vigor", "wisdom"].includes(a) || points(r) < 1) return false;
  r.attributes[a]++;
  for (const id of activeMembers(r)) {
    if (a === "vigor")
      r.members[id].hp = Math.min(
        memberStats(r, id).maxHp,
        r.members[id].hp + 7,
      );
    if (a === "wisdom") r.members[id].mp += 2;
  }
  sync(r);
  r.revision++;
  return true;
}
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
function num(x: unknown, fallback: number, max = 1e9): number {
  return typeof x === "number" && Number.isFinite(x) && x >= 0
    ? Math.min(max, x)
    : fallback;
}
function integer(x: unknown, fallback: number, max = 1e9): number {
  return Math.floor(num(x, fallback, max));
}
export function restoreRpg(value: unknown): RpgState {
  const r = createRpg();
  if (!value || typeof value !== "object") return r;
  const v = value as Record<string, any>;
  r.level = Math.max(1, integer(v.level, 1, 50));
  r.xp = integer(v.xp, 0, nextXp(r.level) - 1);
  r.gold = integer(v.gold, 0);
  r.ink = integer(v.ink, 0);
  r.potions = integer(v.potions, 2, 99);
  r.cleared = integer(v.cleared, 0, 8);
  r.depth = integer(v.depth, 0, 10000);
  r.kills = integer(v.kills, 0);
  r.bosses = integer(v.bosses, 0);
  r.wave = integer(v.wave, 0);
  r.seed = integer(v.seed, 7319, 0xffffffff);
  r.color = integer(v.color, 0, 7);
  if (Array.isArray(v.owned))
    r.owned = [
      ...new Set([
        "stub",
        "shirt",
        ...v.owned.filter(
          (id: unknown) =>
            typeof id === "string" && ITEMS.some((i) => i.id === id),
        ),
      ]),
    ] as string[];
  for (const slot of ["weapon", "armor", "charm"] as Slot[]) {
    const id = v.gear?.[slot];
    if (
      typeof id === "string" &&
      r.owned.includes(id) &&
      ITEMS.some((i) => i.id === id && i.slot === slot)
    )
      r.gear[slot] = id;
  }
  for (const id of r.owned) r.forged[id] = integer(v.forged?.[id], 0, 20);
  let left = r.level - 1;
  for (const a of ["might", "vigor", "wisdom"] as Attribute[]) {
    r.attributes[a] = integer(v.attributes?.[a], 0, left);
    left -= r.attributes[a];
  }
  const validIds = (array: unknown) =>
    Array.isArray(array)
      ? [
          ...new Set(
            array.filter(
              (id: unknown): id is string =>
                typeof id === "string" &&
                COMPANIONS.some((c) => c.id === id) &&
                companionReady(r, id),
            ),
          ),
        ]
      : [];
  r.recruited = validIds(v.recruited ?? v.party);
  r.party = validIds(v.party)
    .filter((id) => r.recruited.includes(id))
    .slice(0, 3);
  if (Array.isArray(v.claimed))
    r.claimed = [
      ...new Set(
        v.claimed.filter(
          (id: unknown): id is string =>
            typeof id === "string" && QUESTS.some((q) => q.id === id),
        ),
      ),
    ];
  // Old kingdom saves keep levels, gear, currency, unlocked allies and achievements.
  // Their old linear encounter becomes a safe camp in the new atlas.
  const maze = v.maze && typeof v.maze === "object" ? v.maze : null;
  if (maze?.version === 1) {
    const cell = integer(maze.cell, MAP_CENTER, 360);
    r.maze.cell = WORLD_MAP[cell]?.wall ? MAP_CENTER : cell;
    const cellIds = (list: unknown) =>
      Array.isArray(list)
        ? [
            ...new Set(
              list.filter(
                (id: unknown): id is number =>
                  typeof id === "number" &&
                  Number.isInteger(id) &&
                  !!WORLD_MAP[id] &&
                  !WORLD_MAP[id].wall,
              ),
            ),
          ]
        : [];
    r.maze.visited = [
      ...new Set([MAP_CENTER, r.maze.cell, ...cellIds(maze.visited)]),
    ];
    r.maze.cleared = [...new Set([MAP_CENTER, ...cellIds(maze.cleared)])];
    const route = Array.isArray(maze.route) ? maze.route.slice(0, 361) : [];
    let previous = r.maze.cell;
    for (const id of route) {
      if (!Number.isInteger(id) || !neighbors(previous).includes(id)) {
        r.maze.route = [];
        break;
      }
      r.maze.route.push(id);
      previous = id;
    }
    r.maze.walk = num(maze.walk, 0, 0.24);
    r.maze.wait = num(maze.wait, 0, 0.9);
    r.maze.serial = integer(maze.serial, 0, 1e12);
    r.maze.reward = num(maze.reward, 0);
    r.zone = r.depth > 0 ? 8 : WORLD_MAP[r.maze.cell].region;
    r.status = ["battle", "victory", "camp", "down"].includes(v.status)
      ? v.status
      : "camp";
    if (r.maze.cell === MAP_CENTER) r.status = "camp";
    if (r.status === "battle") {
      begin(r);
      if (Array.isArray(v.foes) && v.foes.length === r.foes.length)
        r.foes.forEach((f, i) => {
          const saved = v.foes[i];
          if (!saved || typeof saved !== "object") return;
          f.hp = num(saved.hp, f.maxHp, f.maxHp);
          f.cooldown = num(saved.cooldown, 1.6, 3);
          f.turn = integer(saved.turn, 0);
          f.marked = num(saved.marked, 0, 4);
        });
      if (r.foes.every((f) => f.hp <= 0)) r.status = "victory";
    }
  }
  for (const id of Object.keys(r.members) as MemberId[]) {
    const s = memberStats(r, id),
      m = r.members[id],
      saved = v.members?.[id];
    m.hp = num(
      saved?.hp,
      id === "hero" ? num(v.hp, s.maxHp, s.maxHp) : s.maxHp,
      s.maxHp,
    );
    m.mp = num(
      saved?.mp,
      id === "hero" ? num(v.mp, s.maxMp, s.maxMp) : s.maxMp,
      s.maxMp,
    );
    m.cooldown = num(saved?.cooldown, 0.65, 3);
    m.shield = num(saved?.shield, 0, s.maxHp);
    m.guard = num(saved?.guard, 0, 3);
    if (
      typeof saved?.ability === "string" &&
      MEMBER_ABILITIES[id].includes(saved.ability as AbilityId) &&
      ABILITIES[saved.ability as AbilityId].level <= r.level
    )
      m.ability = saved.ability;
  }
  if (!maze || maze.version !== 1) {
    for (const id of Object.keys(r.members) as MemberId[]) {
      r.members[id].hp = memberStats(r, id).maxHp;
      r.members[id].mp = memberStats(r, id).maxMp;
    }
  }
  if (
    r.status === "battle" &&
    activeMembers(r).every((id) => r.members[id].hp <= 0)
  )
    r.status = "down";
  r.auto = v.auto !== false && r.status !== "down";
  r.carry = num(v.carry, 0, 0.1);
  r.turn = integer(v.turn, 0);
  r.revision = 0;
  r.log = [REGIONS[r.zone].name + "."];
  sync(r);
  return r;
}
