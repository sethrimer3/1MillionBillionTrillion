export const SEAS = [
  "The little sea",
  "Shipwreck sound",
  "The drowned gardens",
  "The bell trench",
  "The sleeping ocean",
] as const;
export const OCEAN_TOOLS = {
  clouds: {
    name: "Lava clouds",
    sprite: "ocean-cloud",
    base: 24,
    step: 22,
    max: 80,
    at: 0,
  },
  heat: {
    name: "Molten heart",
    sprite: "ocean-heart",
    base: 40,
    step: 32,
    max: 100,
    at: 0,
  },
  shower: {
    name: "Heavy rain",
    sprite: "ocean-rain",
    base: 90,
    step: 70,
    max: 60,
    at: 0,
  },
  vents: {
    name: "Seafloor vents",
    sprite: "ocean-vent",
    base: 180,
    step: 120,
    max: 80,
    at: 1,
  },
  horizon: {
    name: "Endless voyage",
    sprite: "ocean-boat",
    base: 400,
    step: 0,
    max: 1,
    at: 1,
  },
} as const;
export type OceanTool = keyof typeof OCEAN_TOOLS;
export type LavaDrop = {
  id: number;
  x: number;
  born: number;
  hit: number;
  power: number;
  basin: number;
};
export type OceanState = {
  basin: number;
  water: number;
  drained: number;
  obsidian: number;
  earned: number;
  cleared: number;
  finds: number[];
  upgrades: Record<OceanTool, number>;
  time: number;
  ready: number[];
  drops: LavaDrop[];
  serial: number;
  rainCarry: number;
  impacts: number;
  lastHit: number;
  lastX: number;
  autoVoyage: boolean;
};
export type OceanAction =
  | { kind: "rain"; id: number }
  | { kind: "upgrade"; id: OceanTool }
  | { kind: "next" | "voyage" };
const LIMIT = 1e90;
export function oceanCapacity(basin: number): number {
  return 1600 * (1 + basin) ** 2;
}
export function createOcean(): OceanState {
  return {
    basin: 0,
    water: 1600,
    drained: 0,
    obsidian: 0,
    earned: 0,
    cleared: 0,
    finds: [0, 0, 0, 0],
    upgrades: { clouds: 0, heat: 0, shower: 0, vents: 0, horizon: 0 },
    time: 0,
    ready: [0, 0, 0],
    drops: [],
    serial: 0,
    rainCarry: 0,
    impacts: 0,
    lastHit: -10,
    lastX: 0.5,
    autoVoyage: false,
  };
}
export function lavaPower(s: OceanState): number {
  return (8 + s.upgrades.heat * 5) * (1 + s.upgrades.shower * 0.35);
}
export function rainRate(s: OceanState): number {
  return s.upgrades.clouds * 0.65;
}
export function oceanRate(s: OceanState): number {
  return rainRate(s) * lavaPower(s) + s.upgrades.vents * 12;
}
export function oceanCost(s: OceanState, id: OceanTool): number {
  return OCEAN_TOOLS[id].base + OCEAN_TOOLS[id].step * s.upgrades[id];
}
export function oceanProgress(s: OceanState): number {
  return Math.max(0, Math.min(1, 1 - s.water / oceanCapacity(s.basin)));
}
function reward(s: OceanState, amount: number): number {
  const gain = Math.max(0, Math.min(LIMIT - s.earned, amount));
  s.earned += gain;
  s.obsidian = Math.min(LIMIT, s.obsidian + gain);
  return gain;
}
function nextSea(s: OceanState): void {
  s.basin++;
  s.water = oceanCapacity(s.basin);
  s.drops = [];
}
// Apply only the water actually removed. Surplus heat is lost unless a voyage is automated.
function evaporate(s: OceanState, amount: number): number {
  let gain = 0;
  for (let n = 0; amount > 0 && n < 4096; n++) {
    if (s.water <= 0) {
      if (!s.autoVoyage || !s.upgrades.horizon) break;
      nextSea(s);
    }
    const before = oceanProgress(s),
      removed = Math.min(s.water, amount);
    s.water = Math.max(0, s.water - removed);
    amount -= removed;
    s.drained = Math.min(LIMIT, s.drained + removed);
    gain += reward(s, removed * (1 + s.basin * 0.5));
    const after = oceanProgress(s);
    for (let i = 0; i < 4; i++) {
      const threshold = [0.25, 0.5, 0.75, 1][i];
      if (before < threshold && after >= threshold) {
        s.finds[i]++;
        gain += reward(s, (i + 1) * 40 * (s.basin + 1));
      }
    }
    if (s.water === 0) s.cleared++;
  }
  return gain;
}
export function actOcean(
  s: OceanState,
  action: OceanAction,
): { changed: boolean } {
  if (action.kind === "rain") {
    const i = action.id;
    if (
      !Number.isInteger(i) ||
      i < 0 ||
      i > 2 ||
      s.ready[i] > s.time ||
      s.water <= 0 ||
      s.drops.length >= 48
    )
      return { changed: false };
    s.ready[i] = s.time + 0.24;
    s.drops.push({
      id: ++s.serial,
      x: [0.24, 0.5, 0.76][i],
      born: s.time,
      hit: s.time + 0.85,
      power: lavaPower(s),
      basin: s.basin,
    });
  } else if (action.kind === "upgrade") {
    const id = action.id;
    if (!Object.hasOwn(OCEAN_TOOLS, id)) return { changed: false };
    const tool = OCEAN_TOOLS[id],
      cost = oceanCost(s, id);
    if (s.upgrades[id] >= tool.max || s.cleared < tool.at || s.obsidian < cost)
      return { changed: false };
    s.obsidian -= cost;
    s.upgrades[id]++;
    if (id === "horizon") s.autoVoyage = true;
  } else if (action.kind === "next") {
    if (s.water > 0) return { changed: false };
    nextSea(s);
  } else if (action.kind === "voyage") {
    if (!s.upgrades.horizon) return { changed: false };
    s.autoVoyage = !s.autoVoyage;
  } else return { changed: false };
  return { changed: true };
}
function idle(s: OceanState, seconds: number): number {
  const hits = s.rainCarry + seconds * rainRate(s),
    count = Math.floor(hits + 1e-9);
  s.rainCarry = Math.max(0, hits - count);
  s.impacts = Math.min(LIMIT, s.impacts + count);
  if (count && s.water > 0) {
    s.lastHit = s.time;
    s.lastX = 0.16 + ((s.impacts * 37) % 68) / 100;
  }
  return evaporate(s, count * lavaPower(s) + seconds * s.upgrades.vents * 12);
}
export function tickOcean(s: OceanState, seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  const end = s.time + Math.min(seconds, 28800 * 384);
  let gain = 0;
  // Split at saved manual impacts so they cannot pay before landing or twice after reload.
  const due = s.drops.filter((d) => d.hit <= end).sort((a, b) => a.hit - b.hit);
  for (const d of due) {
    const dt = Math.max(0, d.hit - s.time);
    s.time += dt;
    gain += idle(s, dt);
    if (d.basin === s.basin && s.water > 0) {
      gain += evaporate(s, d.power);
      s.impacts++;
      s.lastHit = s.time;
      s.lastX = d.x;
    }
  }
  s.drops = s.drops.filter((d) => d.hit > end && d.basin === s.basin);
  const dt = Math.max(0, end - s.time);
  s.time = end;
  gain += idle(s, dt);
  return gain;
}
export function restoreOcean(raw: unknown): OceanState {
  const s = createOcean();
  if (!raw || typeof raw !== "object") return s;
  const r = raw as Partial<OceanState>;
  const num = (v: unknown, max = LIMIT, fallback = 0): number =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.max(0, Math.min(max, v))
      : fallback;
  s.basin = Math.floor(num(r.basin, 1e6));
  s.water = num(r.water, oceanCapacity(s.basin), oceanCapacity(s.basin));
  for (const k of ["drained", "obsidian", "earned", "impacts"] as const)
    s[k] = num(r[k]);
  s.cleared = Math.floor(num(r.cleared, s.basin + 1));
  s.time = num(r.time, 1e14);
  s.serial = Math.floor(num(r.serial, 1e14));
  s.ready = s.ready.map((_, i) => num(r.ready?.[i], s.time + 0.24));
  s.rainCarry = num(r.rainCarry, 0.999999999);
  s.finds = s.finds.map((_, i) => Math.floor(num(r.finds?.[i], s.basin + 1)));
  for (const id of Object.keys(OCEAN_TOOLS) as OceanTool[])
    s.upgrades[id] =
      s.cleared >= OCEAN_TOOLS[id].at
        ? Math.floor(num(r.upgrades?.[id], OCEAN_TOOLS[id].max))
        : 0;
  s.autoVoyage = !!s.upgrades.horizon && r.autoVoyage === true;
  const ids = new Set<number>();
  if (Array.isArray(r.drops))
    s.drops = r.drops.slice(0, 48).flatMap((d) => {
      if (
        !d ||
        typeof d !== "object" ||
        !Number.isInteger(d.id) ||
        d.id < 1 ||
        d.id > s.serial ||
        ids.has(d.id) ||
        d.basin !== s.basin ||
        !Number.isFinite(d.hit) ||
        d.hit < s.time ||
        d.hit > s.time + 0.85 ||
        !Number.isFinite(d.born) ||
        d.born > s.time ||
        d.born < d.hit - 0.851 ||
        !Number.isFinite(d.power) ||
        d.power <= 0 ||
        !Number.isFinite(d.x)
      )
        return [];
      ids.add(d.id);
      return [
        {
          id: d.id,
          basin: s.basin,
          x: num(d.x, 1),
          born: d.born,
          hit: d.hit,
          power: num(d.power, 1e6),
        },
      ];
    });
  return s;
}
