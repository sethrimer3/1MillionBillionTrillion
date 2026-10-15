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
    name: "Pocket sunshine",
    title: "Catch a little sunshine.",
    color: "#dfbd46",
    pale: "#faf2cc",
    kind: "sun",
    noun: "sunbeams",
    action: "Catch a sunbeam",
    auto: "Sunflower friend",
    desc: "For a brighter kind of day.",
    unlock: 100n,
  },
  {
    name: "Mossy business",
    title: "Make room for something green.",
    color: "#7caa79",
    pale: "#e7efdf",
    kind: "leaf",
    noun: "leaves",
    action: "Grow a leaf",
    auto: "Sleepy snail",
    desc: "Slow is a perfectly good speed.",
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
    name: "Midnight pond",
    title: "Make a wish in the quiet.",
    color: "#888dc0",
    pale: "#e9e8f5",
    kind: "moon",
    noun: "wishes",
    action: "Make a wish",
    auto: "Moon moth",
    desc: "The stars are listening.",
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
    name: "The in-between",
    title: "You found the space between.",
    color: "#6d7775",
    pale: "#e8ece6",
    kind: "star",
    noun: "possibilities",
    action: "Imagine a possibility",
    auto: "A friendly nothing",
    desc: "Some colors don’t have a name.",
    unlock: 10000000000n,
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
  };
}
export function total(state: State): bigint {
  return state.worlds
    .slice(0, state.secret ? 8 : state.unlocked)
    .reduce((v, w) => v * BigInt(Math.max(1, Math.floor(w.score))), 1n);
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
export function rate(w: WorldState): number {
  return w.helpers * w.power * 2 * multiplier(w);
}
export function advance(state: State, seconds: number) {
  for (let i = 0; i < (state.secret ? 8 : state.unlocked); i++) {
    const w = state.worlds[i];
    const gain = Math.max(0, Math.min(seconds, 28800)) * rate(w);
    w.score += gain;
    w.bank += gain;
  }
  unlock(state);
}
export type Upgrade = "helper" | "power" | "resonance";
export function price(w: WorldState, kind: Upgrade): number {
  return kind === "helper"
    ? helperCost(w)
    : kind === "power"
      ? powerCost(w)
      : resonanceCost(w);
}
export function purchase(state: State, i: number, kind: Upgrade): boolean {
  if (
    i < 0 ||
    i >= (state.secret ? 8 : state.unlocked) ||
    !["helper", "power", "resonance"].includes(kind)
  )
    return false;
  const w = state.worlds[i],
    cost = price(w, kind);
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
  { id: "perfect", name: "Right on time", sprite: "sun" },
  { id: "bloom", name: "Something grew", sprite: "flower" },
  { id: "storm", name: "Silver lining", sprite: "storm" },
  { id: "constellation", name: "Written in stars", sprite: "moon" },
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
  ];
  return candidates.filter((id): id is string => !!id && discover(state, id));
}
export function loadState(raw: string | null): State {
  if (!raw) return freshState();
  try {
    const s = JSON.parse(raw);
    const base = freshState();
    if (!Array.isArray(s.worlds) || s.worlds.length !== 8) return base;
    base.worlds = s.worlds.map((w: WorldState) => ({
      score: safe(w.score, 1, 1e50),
      helpers: Math.floor(safe(w.helpers, 0, 1000)),
      power: Math.floor(safe(w.power, 1, 1000)),
      bank: safe(w.bank, 0, 1e50),
      resonance: Math.floor(safe(w.resonance, 0, 30)),
    }));
    base.unlocked = Math.floor(safe(s.unlocked, 1, 7));
    base.secret = s.secret === true && base.unlocked === 7;
    base.won = s.won === true && total(base) >= GOAL;
    base.saved =
      typeof s.saved === "number" && Number.isFinite(s.saved) && s.saved > 0
        ? Math.min(s.saved, Date.now())
        : Date.now();
    base.clicks = safe(s.clicks, 0, 1e12);
    base.sound = s.sound === true;
    base.motion = s.motion !== false;
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
  const x = Number(n);
  if (x < 1000) return Math.floor(x).toLocaleString("en-US");
  const units = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"];
  const tier = Math.min(Math.floor(Math.log10(x) / 3), units.length - 1);
  return (
    (x / 1000 ** tier)
      .toFixed(x / 1000 ** tier >= 100 ? 0 : 1)
      .replace(/\.0$/, "") + units[tier]
  );
}
