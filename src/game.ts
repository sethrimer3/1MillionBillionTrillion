import {
  createRpg,
  restoreRpg,
  tickRpg,
  act,
  type RpgState,
  type RpgAction,
} from "./rpg.ts";
import {
  createArena,
  restoreArena,
  tickArena,
  type ArenaState,
} from "./arena.ts";
import {
  createCosmos,
  restoreCosmos,
  actCosmos,
  tickCosmos,
  type CosmosState,
  type CosmosAction,
} from "./cosmos.ts";
export const GOAL = 10n ** 27n;
export const SAVE_KEY = "mbt-save-v1";
export const WORLDS = [
  {
    name: "Little ember",
    title: "Keep the little fire alive.",
    color: "#e46b64",
    pale: "#f9e4de",
    kind: "ember",
    noun: "embers",
    action: "Feed the fire",
    auto: "Tiny firekeeper",
    desc: "A little warmth goes a long way.",
    unlock: 0n,
  },
  {
    name: "Carrot patch",
    title: "Good things take a little dirt.",
    color: "#df984b",
    pale: "#f7ead8",
    kind: "carrot",
    noun: "carrots",
    action: "Pick a carrot",
    auto: "Garden gnome",
    desc: "Plant a little. Grow a lot.",
    unlock: 10n,
  },
  {
    name: "Pocket kingdoms",
    title: "A world beyond the canvas.",
    color: "#dfbd46",
    pale: "#faf2cc",
    kind: "rpg-sword-gold",
    noun: "renown",
    action: "Strike",
    auto: "Trail companion",
    desc: "For a brighter kind of day.",
    unlock: 100n,
  },
  {
    name: "Shard drift",
    title: "Small ships. Quiet collisions.",
    color: "#7caa79",
    pale: "#e7efdf",
    kind: "arena-ship-0",
    noun: "shards",
    action: "Launch a dart",
    auto: "Dart fleet",
    desc: "A little fleet in a sea of green.",
    unlock: 1000n,
  },
  {
    name: "Cloud collector",
    title: "A small cloud with big dreams.",
    color: "#73a6c8",
    pale: "#e3edf4",
    kind: "cloud",
    noun: "raindrops",
    action: "Make it rain",
    auto: "Weather duck",
    desc: "A chance of very big numbers.",
    unlock: 10000n,
  },
  {
    name: "Firefly field",
    title: "A pocketful of little skies.",
    color: "#888dc0",
    pale: "#e9e8f5",
    kind: "cosmos-firefly",
    noun: "light",
    action: "Catch a firefly",
    auto: "Lantern net",
    desc: "A field. A sky. Everything beyond.",
    unlock: 1000000n,
  },
  {
    name: "Violet daydream",
    title: "Let your imagination wander.",
    color: "#af8cba",
    pale: "#f0e5f2",
    kind: "flower",
    noun: "dreams",
    action: "Dream a little",
    auto: "Dream catcher",
    desc: "Something wonderful is growing.",
    unlock: 100000000n,
  },
  {
    name: "Prismatic heart",
    title: "Every color. All at once.",
    color: "#b9dedb",
    pale: "#eff9f5",
    kind: "rpg-iridescent",
    noun: "refractions",
    action: "Turn the crystal",
    auto: "Prism wisp",
    desc: "Some colors don’t have a name.",
    unlock: 0n,
  },
  {
    name: "The quiet void",
    title: "Even nothing has a weight.",
    color: "#9d87c9",
    pale: "#ded4ed",
    kind: "rpg-void",
    noun: "singularities",
    action: "Feed the void",
    auto: "Orbiting shadow",
    desc: "Beyond the other side.",
    unlock: 0n,
  },
] as const;
export type WorldState = {
  score: number;
  helpers: number;
  power: number;
  bank: number;
  resonance: number;
};
export type State = {
  worlds: WorldState[];
  unlocked: number;
  secret: boolean;
  won: boolean;
  saved: number;
  clicks: number;
  sound: boolean;
  motion: boolean;
  relics: string[];
  rpg: RpgState;
  arena: ArenaState;
  cosmos: CosmosState;
  prestige: { count: number; shards: number; upgrades: string[] };
};
export function freshState(): State {
  return {
    worlds: WORLDS.map(() => ({
      score: 1,
      helpers: 0,
      power: 1,
      bank: 0,
      resonance: 0,
    })),
    unlocked: 1,
    secret: false,
    won: false,
    saved: Date.now(),
    clicks: 0,
    sound: false,
    motion: true,
    relics: [],
    rpg: createRpg(),
    arena: createArena(),
    cosmos: createCosmos(),
    prestige: { count: 0, shards: 0, upgrades: [] },
  };
}
export function total(state: State): bigint {
  return state.worlds
    .filter((_, i) => worldAvailable(state, i))
    .reduce((v, w) => v * BigInt(Math.max(1, Math.floor(w.score))), 1n);
}
export function worldAvailable(state: State, i: number): boolean {
  return (
    Number.isInteger(i) &&
    i >= 0 &&
    (i < state.unlocked ||
      (i === 7 && state.secret) ||
      (i === 8 && state.prestige.count >= 3))
  );
}
export function gateGoal(state: State): bigint {
  const n = state.prestige.count;
  if (n === 0) return GOAL;
  if (n === 1) return 10n ** 30n;
  if (n === 2) return 10n ** 32n;
  if (n === 3) return 42n * 10n ** 32n;
  if (n === 4) return 42n * 10n ** 47n;
  return 42n * 10n ** (65n + BigInt(n - 5) * 3n);
}
export function gateWords(state: State): string[] {
  const n = state.prestige.count;
  return [
    n >= 3 ? "42" : "1",
    ...(n >= 2 ? ["Hundred"] : []),
    ...(n >= 1 ? ["Thousand"] : []),
    "Million",
    "Billion",
    "Trillion",
    ...(n >= 4 ? ["Quadrillion"] : []),
    ...(n >= 5 ? ["Quintillion"] : []),
    ...(n > 5 ? [`× 1e${(n - 5) * 3}`] : []),
  ];
}
export const PRESTIGE_UPGRADES = [
  {
    id: "iridescent",
    name: "A color beyond",
    effect: "Eighth world · iridescent crystal",
    cost: 0,
    at: 1,
    needs: "",
    sprite: "rpg-iridescent",
    branch: "root",
  },
  {
    id: "kindling",
    name: "Remembered fire",
    effect: "×2 all production",
    cost: 1,
    at: 1,
    needs: "iridescent",
    sprite: "ember",
    branch: "spark",
  },
  {
    id: "clockwork",
    name: "Restless hands",
    effect: "×2 idle production",
    cost: 2,
    at: 1,
    needs: "iridescent",
    sprite: "rpg-hourglass",
    branch: "time",
  },
  {
    id: "pockets",
    name: "Full pockets",
    effect: "Start with 2 helpers + 100 pocket / world",
    cost: 1,
    at: 1,
    needs: "iridescent",
    sprite: "rpg-chest",
    branch: "roots",
  },
  {
    id: "resonant",
    name: "A louder echo",
    effect: "×2 all production",
    cost: 3,
    at: 2,
    needs: "kindling",
    sprite: "rune",
    branch: "spark",
  },
  {
    id: "rhythm",
    name: "Borrowed hours",
    effect: "×3 idle production",
    cost: 3,
    at: 2,
    needs: "clockwork",
    sprite: "rpg-hourglass",
    branch: "time",
  },
  {
    id: "bargain",
    name: "Old friends",
    effect: "80% cheaper world upgrades",
    cost: 2,
    at: 1,
    needs: "pockets",
    sprite: "gnome",
    branch: "roots",
  },
  {
    id: "spectrum",
    name: "Sevenfold sunrise",
    effect: "×2 rainbow world production",
    cost: 3,
    at: 2,
    needs: "resonant",
    sprite: "prism",
    branch: "spark",
  },
  {
    id: "expedition",
    name: "Longer strides",
    effect: "×8 RPG auto battle speed",
    cost: 2,
    at: 2,
    needs: "rhythm",
    sprite: "rpg-hero",
    branch: "time",
  },
  {
    id: "seeds",
    name: "Deep roots",
    effect: "Start with 3 helpers + 1 resonance / world",
    cost: 3,
    at: 2,
    needs: "bargain",
    sprite: "sprout",
    branch: "roots",
  },
  {
    id: "void",
    name: "The missing dark",
    effect: "Ninth world · void crystal",
    cost: 0,
    at: 3,
    needs: "iridescent",
    sprite: "rpg-void",
    branch: "root",
  },
  {
    id: "echoes",
    name: "The world remembers",
    effect: "×2 all production",
    cost: 4,
    at: 3,
    needs: "spectrum",
    sprite: "crystal",
    branch: "spark",
  },
  {
    id: "gravity",
    name: "Impossible weight",
    effect: "×100 void production",
    cost: 4,
    at: 3,
    needs: "void",
    sprite: "rpg-void",
    branch: "roots",
  },
  {
    id: "eternity",
    name: "A thousand tomorrows",
    effect: "×3 all production",
    cost: 6,
    at: 4,
    needs: "echoes",
    sprite: "star",
    branch: "spark",
  },
  {
    id: "abyss",
    name: "Unfathomable",
    effect: "×10,000 void production",
    cost: 6,
    at: 4,
    needs: "gravity",
    sprite: "rpg-void",
    branch: "roots",
  },
  {
    id: "genesis",
    name: "Begin again, brighter",
    effect: "×4 all production",
    cost: 8,
    at: 5,
    needs: "eternity",
    sprite: "rpg-iridescent",
    branch: "spark",
  },
] as const;
export function hasUpgrade(state: State, id: string): boolean {
  return state.prestige.upgrades.includes(id);
}
export function productionBoost(state: State, i: number): number {
  let boost = 1 + state.prestige.count;
  for (const [id, factor] of [
    ["kindling", 2],
    ["resonant", 2],
    ["echoes", 2],
    ["eternity", 3],
    ["genesis", 4],
  ] as const)
    if (hasUpgrade(state, id)) boost *= factor;
  if (i < 7 && hasUpgrade(state, "spectrum")) boost *= 2;
  if (i === 7) boost *= 128;
  if (i === 8) {
    boost *= 1e6;
    if (hasUpgrade(state, "gravity")) boost *= 1e2;
    if (hasUpgrade(state, "abyss")) boost *= 1e4;
  }
  return boost;
}
export function idleBoost(state: State): number {
  return (
    (hasUpgrade(state, "clockwork") ? 2 : 1) *
    (hasUpgrade(state, "rhythm") ? 3 : 1)
  );
}
export function cycleSpeed(state: State): number {
  return (
    Math.min(32, 1 + state.prestige.count * 2) *
    (hasUpgrade(state, "clockwork") ? 2 : 1)
  );
}
function seedWorlds(state: State) {
  for (const w of state.worlds) {
    w.helpers = Math.max(
      w.helpers,
      hasUpgrade(state, "seeds") ? 3 : hasUpgrade(state, "pockets") ? 2 : 0,
    );
    w.resonance = Math.max(w.resonance, hasUpgrade(state, "seeds") ? 1 : 0);
    w.bank = Math.max(w.bank, hasUpgrade(state, "pockets") ? 100 : 0);
  }
  if (hasUpgrade(state, "pockets"))
    state.arena.money = Math.max(state.arena.money, 100);
  if (hasUpgrade(state, "pockets"))
    state.cosmos.glow = Math.max(state.cosmos.glow, 100);
  state.cosmos.upgrades.nets = Math.max(
    state.cosmos.upgrades.nets,
    hasUpgrade(state, "seeds") ? 3 : hasUpgrade(state, "pockets") ? 2 : 0,
  );
}
export function buyPrestigeUpgrade(state: State, id: string): boolean {
  const node = PRESTIGE_UPGRADES.find((n) => n.id === id);
  if (
    !node ||
    node.cost === 0 ||
    hasUpgrade(state, id) ||
    state.prestige.count < node.at ||
    !hasUpgrade(state, node.needs) ||
    state.prestige.shards < node.cost
  )
    return false;
  state.prestige.shards -= node.cost;
  state.prestige.upgrades.push(id);
  if (id === "pockets" || id === "seeds") seedWorlds(state);
  return true;
}
export function prestigeReward(state: State): number {
  return 4 + 2 * Math.min(state.prestige.count, 5);
}
export function canPrestige(state: State): boolean {
  return state.prestige.count < 100 && total(state) >= gateGoal(state);
}
export function prestige(state: State): boolean {
  if (!canPrestige(state)) return false;
  const meta = state.prestige;
  meta.shards += prestigeReward(state);
  meta.count++;
  if (!meta.upgrades.includes("iridescent")) meta.upgrades.push("iridescent");
  if (meta.count >= 3 && !meta.upgrades.includes("void"))
    meta.upgrades.push("void");
  state.worlds = freshState().worlds;
  state.rpg = createRpg();
  state.arena = createArena();
  state.cosmos = createCosmos();
  state.unlocked = 1;
  state.secret = true;
  state.won = false;
  state.saved = Date.now();
  discover(state, "answer");
  seedWorlds(state);
  return true;
}
export function credit(state: State, i: number, amount: number): number {
  if (!worldAvailable(state, i) || !Number.isFinite(amount) || amount < 0)
    return 0;
  const w = state.worlds[i],
    gain = Math.min(1e100 - w.score, amount);
  w.score += gain;
  w.bank = Math.min(1e100, w.bank + gain);
  return gain;
}
export function tapReward(state: State, i: number, bonus = 1): number {
  if (!worldAvailable(state, i) || !Number.isFinite(bonus) || bonus <= 0)
    return 0;
  return credit(
    state,
    i,
    state.worlds[i].power *
      3 *
      multiplier(state.worlds[i]) *
      productionBoost(state, i) *
      Math.min(bonus, 1e6),
  );
}
export function unlock(state: State): string[] {
  const names: string[] = [];
  while (state.unlocked < 7 && total(state) >= WORLDS[state.unlocked].unlock) {
    names.push(WORLDS[state.unlocked].name);
    state.unlocked++;
  }
  return names;
}
export function helperCost(w: WorldState): number {
  return Math.floor(12 * 1.65 ** w.helpers);
}
export function powerCost(w: WorldState): number {
  return Math.floor(20 * 1.8 ** (w.power - 1));
}
export function resonanceCost(w: WorldState): number {
  return Math.floor(250 * 2.4 ** w.resonance);
}
export function multiplier(w: WorldState): number {
  return 2 ** w.resonance;
}
export function rate(w: WorldState, state?: State): number {
  return (
    w.helpers *
    w.power *
    2 *
    multiplier(w) *
    (state
      ? productionBoost(state, state.worlds.indexOf(w)) * idleBoost(state)
      : 1)
  );
}
export function advance(state: State, seconds: number) {
  const elapsed = Number.isFinite(seconds)
    ? Math.max(0, Math.min(seconds, 28800))
    : 0;
  for (let i = 0; i < state.worlds.length; i++) {
    if (!worldAvailable(state, i)) continue;
    if (i === 3 || i === 5) continue;
    const w = state.worlds[i];
    credit(state, i, elapsed * rate(w, state));
  }
  if (worldAvailable(state, 3)) {
    const w = state.worlds[3];
    const tempo = cycleSpeed(state) * idleBoost(state);
    // Carry large prestige bonuses into impact strength so the visible fleet
    // stays readable and never needs hundreds of physics clocks per frame.
    const clock = Math.min(4, tempo);
    const reward = tickArena(
      state.arena,
      elapsed * clock,
      (w.power * multiplier(w) * (1 + w.helpers * 0.2) * tempo) / clock,
    );
    credit(state, 3, reward * productionBoost(state, 3));
  }
  if (state.unlocked >= 3) {
    // Bound real time first; each sped-up battle clock gets the full offline interval.
    const clocks = hasUpgrade(state, "expedition") ? 8 : 1;
    for (let n = 0; n < clocks; n++)
      rewardRenown(state, tickRpg(state.rpg, elapsed));
  }
  if (worldAvailable(state, 5)) {
    const glow = tickCosmos(
      state.cosmos,
      elapsed * cycleSpeed(state) * idleBoost(state),
    );
    credit(
      state,
      5,
      glow *
        state.worlds[5].power *
        multiplier(state.worlds[5]) *
        productionBoost(state, 5),
    );
  }
  unlock(state);
}
export function cosmosAction(state: State, action: CosmosAction) {
  if (!worldAvailable(state, 5)) return { changed: false, glow: 0 };
  const result = actCosmos(state.cosmos, action);
  if (result.changed) {
    credit(
      state,
      5,
      result.glow *
        state.worlds[5].power *
        multiplier(state.worlds[5]) *
        productionBoost(state, 5),
    );
    if (action.kind === "catch" || action.kind === "star") state.clicks++;
    unlock(state);
  }
  return result;
}
export function rewardRenown(state: State, amount: number): number {
  const gained =
    Math.max(0, amount) *
    state.worlds[2].power *
    multiplier(state.worlds[2]) *
    productionBoost(state, 2);
  return credit(state, 2, gained);
}
export function rpgAction(state: State, action: RpgAction) {
  if (state.unlocked < 3) return null;
  const result = act(state.rpg, action);
  if (result.changed) {
    rewardRenown(state, result.renown);
    if (
      ["attack", "guard", "stroke", "heal", "nova", "potion"].includes(action)
    )
      state.clicks++;
    unlock(state);
  }
  return result;
}
export type Upgrade = "helper" | "power" | "resonance";
export function price(w: WorldState, kind: Upgrade, state?: State): number {
  const value =
    kind === "helper"
      ? helperCost(w)
      : kind === "power"
        ? powerCost(w)
        : resonanceCost(w);
  return Math.max(
    1,
    Math.floor(value * (state && hasUpgrade(state, "bargain") ? 0.2 : 1)),
  );
}
export function purchase(state: State, i: number, kind: Upgrade): boolean {
  if (
    !worldAvailable(state, i) ||
    !["helper", "power", "resonance"].includes(kind)
  )
    return false;
  const w = state.worlds[i],
    cost = price(w, kind, state);
  if (w.bank < cost || (kind === "resonance" && w.score < 250)) return false;
  w.bank -= cost;
  if (kind === "helper") w.helpers++;
  else if (kind === "power") w.power++;
  else w.resonance++;
  return true;
}
export const RELICS = [
  { id: "spark", name: "First light", sprite: "ember" },
  { id: "company", name: "Small company", sprite: "gnome" },
  { id: "hundred", name: "Restless hands", sprite: "glove" },
  { id: "million", name: "Six zeroes", sprite: "coin" },
  { id: "roaring", name: "Wild at heart", sprite: "flame" },
  { id: "harvest", name: "Golden roots", sprite: "gold-carrot" },
  { id: "perfect", name: "A kingdom in your pocket", sprite: "rpg-crown" },
  { id: "bloom", name: "A little constellation", sprite: "arena-ship-1" },
  { id: "storm", name: "Silver lining", sprite: "storm" },
  {
    id: "constellation",
    name: "Written in stars",
    sprite: "cosmos-constellation",
  },
  { id: "echo", name: "A familiar dream", sprite: "crystal" },
  { id: "resonance", name: "Strange frequency", sprite: "rune" },
  { id: "rainbow", name: "Every color", sprite: "prism" },
  { id: "secret", name: "Between the lines", sprite: "eye" },
  { id: "crowd", name: "Never alone", sprite: "moth" },
  { id: "answer", name: "The other side", sprite: "key" },
] as const;
export function discover(state: State, id: string): boolean {
  if (state.relics.includes(id) || !RELICS.some((r) => r.id === id))
    return false;
  state.relics.push(id);
  return true;
}
export function discoveries(state: State): string[] {
  const candidates = [
    state.clicks > 0 && "spark",
    state.clicks >= 100 && "hundred",
    state.worlds.some((w) => w.helpers > 0) && "company",
    total(state) >= 1000000n && "million",
    state.worlds.some((w) => w.resonance > 0) && "resonance",
    state.unlocked === 7 && "rainbow",
    state.secret && "secret",
    state.worlds.reduce((n, w) => n + w.helpers, 0) >= 10 && "crowd",
    state.won && "answer",
    state.rpg.cleared > 0 && "perfect",
    state.arena.merges > 0 && "bloom",
    state.cosmos.made[1] > 0 && "constellation",
  ];
  return candidates.filter((id): id is string => !!id && discover(state, id));
}
export function loadState(raw: string | null): State {
  if (!raw) return freshState();
  try {
    const s = JSON.parse(raw);
    const base = freshState();
    if (
      !Array.isArray(s.worlds) ||
      ![8, 9].includes(s.worlds.length) ||
      s.worlds.some((w: unknown) => !w || typeof w !== "object")
    )
      return base;
    base.worlds = base.worlds.map((initial, i) => {
      const w = s.worlds[i];
      if (!w) return initial;
      return {
        score: safe(w.score, 1, 1e100),
        helpers: Math.floor(safe(w.helpers, 0, 1000)),
        power: Math.floor(safe(w.power, 1, 1000)),
        bank: safe(w.bank, 0, 1e100),
        resonance: Math.floor(safe(w.resonance, 0, 200)),
      };
    });
    base.prestige.count = Math.floor(safe(s.prestige?.count, 0, 100));
    base.prestige.shards = Math.floor(safe(s.prestige?.shards, 0, 2000));
    // Keep only valid, earned branches, in dependency order.
    const owned = Array.isArray(s.prestige?.upgrades)
      ? s.prestige.upgrades
      : [];
    if (
      base.prestige.count > 0 ||
      (!s.prestige && s.secret === true && s.unlocked === 7)
    )
      base.prestige.upgrades.push("iridescent");
    for (const node of PRESTIGE_UPGRADES) {
      if (node.id === "iridescent") continue;
      if (node.id === "void" && base.prestige.count >= 3)
        base.prestige.upgrades.push(node.id);
      else if (
        owned.includes(node.id) &&
        base.prestige.count >= node.at &&
        hasUpgrade(base, node.needs)
      )
        base.prestige.upgrades.push(node.id);
    }
    base.unlocked = Math.floor(safe(s.unlocked, 1, 7));
    base.secret = hasUpgrade(base, "iridescent");
    base.won = s.won === true && total(base) >= gateGoal(base);
    base.saved =
      typeof s.saved === "number" && Number.isFinite(s.saved) && s.saved > 0
        ? Math.min(s.saved, Date.now())
        : Date.now();
    base.clicks = safe(s.clicks, 0, 1e12);
    base.sound = s.sound === true;
    base.motion = s.motion !== false;
    base.rpg = restoreRpg(s.rpg);
    base.arena = restoreArena(s.arena);
    base.cosmos = restoreCosmos(s.cosmos);
    if (!s.cosmos || typeof s.cosmos !== "object") {
      base.cosmos.glow = Math.min(1e90, base.worlds[5].bank);
      base.cosmos.earned = base.cosmos.glow;
      base.cosmos.upgrades.nets = Math.min(40, base.worlds[5].helpers);
      base.cosmos.upgrades.mesh = Math.min(50, base.worlds[5].power - 1);
    }
    // Convert the former garden's unspent leaves once, on migration only.
    if (!s.arena || typeof s.arena !== "object")
      base.arena.money = base.worlds[3].bank;
    base.relics = Array.isArray(s.relics)
      ? [
          ...new Set<string>(
            (s.relics as unknown[]).filter(
              (id: unknown): id is string =>
                typeof id === "string" && RELICS.some((r) => r.id === id),
            ),
          ),
        ]
      : [];
    return base;
  } catch {
    return freshState();
  }
}
function safe(n: unknown, fallback: number, max: number) {
  return typeof n === "number" && Number.isFinite(n) && n >= fallback
    ? Math.min(n, max)
    : fallback;
}
export function format(n: number | bigint): string {
  if (typeof n === "bigint" && n >= 10n ** 30n) {
    const digits = n.toString();
    const lead = Number(digits.slice(0, 3)) / 100;
    return (
      (Math.floor(lead * 10) / 10).toFixed(1).replace(/\.0$/, "") +
      "e" +
      (digits.length - 1)
    );
  }
  const x = Number(n);
  if (!Number.isFinite(x)) return "∞";
  if (x >= 1e30)
    return x
      .toExponential(1)
      .replace(/\.0e\+?/, "e")
      .replace("e+", "e");
  if (x < 1000) return Math.floor(x).toLocaleString("en-US");
  const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];
  const tier = Math.min(Math.floor(Math.log10(x) / 3), units.length - 1);
  return (
    (x / 1000 ** tier)
      .toFixed(x / 1000 ** tier >= 100 ? 0 : 1)
      .replace(/\.0$/, "") + units[tier]
  );
}
export function log10(n: bigint): number {
  const digits = n.toString();
  return (
    digits.length -
    1 +
    Math.log10(
      Number(digits.slice(0, 15)) / 10 ** (Math.min(15, digits.length) - 1),
    )
  );
}
