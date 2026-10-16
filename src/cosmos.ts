export const BODIES = [
  {
    name: "Fireflies",
    single: "Firefly",
    sprite: "cosmos-firefly",
    cost: 0,
    glow: 0,
    flies: 0,
    reward: 0,
  },
  {
    name: "Constellations",
    single: "Constellation",
    sprite: "cosmos-constellation",
    cost: 0,
    glow: 0.6,
    flies: 0.2,
    reward: 25,
  },
  {
    name: "Planets",
    single: "Planet",
    sprite: "cosmos-planet",
    cost: 5,
    glow: 10,
    flies: 3,
    reward: 250,
  },
  {
    name: "Solar systems",
    single: "Solar system",
    sprite: "cosmos-system",
    cost: 4,
    glow: 180,
    flies: 16,
    reward: 2500,
  },
  {
    name: "Galaxies",
    single: "Galaxy",
    sprite: "cosmos-galaxy",
    cost: 4,
    glow: 3500,
    flies: 90,
    reward: 25000,
  },
  {
    name: "Universes",
    single: "Universe",
    sprite: "cosmos-universe",
    cost: 3,
    glow: 75000,
    flies: 600,
    reward: 250000,
  },
] as const;
export type ConstellationPattern = {
  name: string;
  cost: number;
  reward: number;
  nodes: readonly (readonly [number, number])[];
  edges: readonly (readonly [number, number])[];
};
export const PATTERNS: readonly ConstellationPattern[] = [
  {
    name: "The little kite",
    cost: 3,
    reward: 1,
    nodes: [
      [50, 15],
      [76, 42],
      [50, 71],
      [24, 42],
      [50, 91],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
    ],
  },
  {
    name: "The wandering moth",
    cost: 4,
    reward: 2,
    nodes: [
      [48, 40],
      [15, 17],
      [23, 65],
      [50, 78],
      [78, 65],
      [85, 17],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      [0, 3],
    ],
  },
  {
    name: "A boat for the moon",
    cost: 5,
    reward: 3,
    nodes: [
      [13, 65],
      [32, 78],
      [67, 78],
      [87, 65],
      [50, 17],
      [50, 60],
      [27, 60],
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [4, 6],
      [5, 6],
    ],
  },
] as const;
export const TOOLS = {
  nets: {
    name: "Lantern nets",
    sprite: "cosmos-net",
    base: 20,
    step: 15,
    at: 0,
    max: 40,
  },
  mesh: {
    name: "Silk net",
    sprite: "cosmos-mesh",
    base: 45,
    step: 35,
    at: 0,
    max: 50,
  },
  lure: {
    name: "Moonflowers",
    sprite: "cosmos-flower",
    base: 35,
    step: 25,
    at: 0,
    max: 40,
  },
  loom: {
    name: "Star loom",
    sprite: "cosmos-loom",
    base: 70,
    step: 55,
    at: 1,
    max: 80,
  },
  orbit: {
    name: "Clockwork sky",
    sprite: "cosmos-orbit",
    base: 250,
    step: 200,
    at: 2,
    max: 60,
  },
} as const;
export type CosmosTool = keyof typeof TOOLS;
export type CosmosState = {
  resources: number[];
  made: number[];
  glow: number;
  earned: number;
  caught: number;
  upgrades: Record<CosmosTool, number>;
  auto: boolean[];
  pattern: number;
  stitches: boolean[][];
  gallery: number[];
  time: number;
  ready: number[];
  netCarry: number;
  loomCarry: number;
  forgeCarry: number;
  revision: number;
};
export type CosmosAction =
  | { kind: "catch" | "star" | "craft" | "pattern" | "auto"; id: number }
  | { kind: "upgrade"; id: CosmosTool };
export type CosmosResult = {
  changed: boolean;
  glow: number;
  completed?: number;
};
const LIMIT = 1e90;
export function createCosmos(): CosmosState {
  return {
    resources: [0, 0, 0, 0, 0, 0],
    made: [0, 0, 0, 0, 0, 0],
    glow: 0,
    earned: 0,
    caught: 0,
    upgrades: { nets: 0, mesh: 0, lure: 0, loom: 0, orbit: 0 },
    auto: [false, false, false, false, false, false],
    pattern: 0,
    stitches: PATTERNS.map((p) => p.nodes.map(() => false)),
    gallery: [0, 0, 0],
    time: 0,
    ready: Array(12).fill(0),
    netCarry: 0,
    loomCarry: 0,
    forgeCarry: 0,
    revision: 0,
  };
}
export function cosmosStage(s: CosmosState): number {
  let stage = 0;
  for (let i = 1; i < 6; i++) if (s.made[i] > 0) stage = i;
  return stage;
}
export function catchYield(s: CosmosState): number {
  return 3 + 2 * s.upgrades.mesh;
}
export function catchRate(s: CosmosState): number {
  return s.upgrades.nets * 0.25 * (1 + s.upgrades.lure * 0.2);
}
export function toolCost(s: CosmosState, id: CosmosTool): number {
  return TOOLS[id].base + TOOLS[id].step * s.upgrades[id];
}
export function patternAvailable(s: CosmosState, id: number): boolean {
  return (
    Number.isInteger(id) &&
    id >= 0 &&
    id < 3 &&
    (id === 0 || (id === 1 && s.made[1] >= 3) || (id === 2 && s.made[2] >= 1))
  );
}
export function cosmosRates(s: CosmosState): { glow: number; flies: number } {
  const orbit = 1 + s.upgrades.orbit * 0.5;
  return BODIES.reduce(
    (rate, b, i) => ({
      glow: rate.glow + s.resources[i] * b.glow * orbit,
      flies: rate.flies + s.resources[i] * b.flies * orbit,
    }),
    { glow: 0, flies: 0 },
  );
}
function addGlow(s: CosmosState, amount: number): number {
  const gain = Math.max(0, Math.min(LIMIT - s.earned, amount));
  s.earned += gain;
  s.glow = Math.min(LIMIT, s.glow + gain);
  return gain;
}
function addFlies(s: CosmosState, amount: number): void {
  s.resources[0] = Math.min(LIMIT, s.resources[0] + amount);
  s.made[0] = Math.min(LIMIT, s.made[0] + amount);
}
function catchBatch(s: CosmosState, count: number): number {
  const amount = count * catchYield(s);
  s.caught = Math.min(LIMIT, s.caught + count);
  addFlies(s, amount);
  return addGlow(s, amount);
}
function finishPattern(s: CosmosState, pattern: number, count = 1): number {
  const made = PATTERNS[pattern].reward * count;
  s.resources[1] = Math.min(LIMIT, s.resources[1] + made);
  s.made[1] = Math.min(LIMIT, s.made[1] + made);
  s.gallery[pattern] = Math.min(LIMIT, s.gallery[pattern] + count);
  s.stitches[pattern].fill(false);
  s.revision++;
  return addGlow(s, made * BODIES[1].reward);
}
function weave(s: CosmosState, nodes: number): number {
  const index = s.pattern,
    p = PATTERNS[index],
    stitches = s.stitches[index];
  let budget = Math.min(nodes, Math.floor(s.resources[0] / p.cost)),
    glow = 0;
  // Finish an existing drawing before batch-processing complete constellations.
  for (let i = 0; i < stitches.length && budget > 0; i++)
    if (!stitches[i]) {
      stitches[i] = true;
      s.resources[0] -= p.cost;
      budget--;
      s.revision++;
      if (stitches.every(Boolean)) {
        glow += finishPattern(s, index);
        break;
      }
    }
  const complete = Math.floor(budget / p.nodes.length);
  if (complete > 0) {
    s.resources[0] -= complete * p.nodes.length * p.cost;
    budget -= complete * p.nodes.length;
    glow += finishPattern(s, index, complete);
  }
  for (let i = 0; i < stitches.length && budget > 0; i++)
    if (!stitches[i]) {
      stitches[i] = true;
      s.resources[0] -= p.cost;
      budget--;
      s.revision++;
    }
  return glow;
}
function craftBatch(s: CosmosState, tier: number, count: number): number {
  const made = Math.min(
    count,
    Math.floor(s.resources[tier - 1] / BODIES[tier].cost),
  );
  if (made <= 0) return 0;
  s.resources[tier - 1] -= made * BODIES[tier].cost;
  s.resources[tier] = Math.min(LIMIT, s.resources[tier] + made);
  s.made[tier] = Math.min(LIMIT, s.made[tier] + made);
  s.revision++;
  return addGlow(s, made * BODIES[tier].reward);
}
export function actCosmos(s: CosmosState, action: CosmosAction): CosmosResult {
  const unchanged: CosmosResult = { changed: false, glow: 0 };
  if (action.kind === "upgrade") {
    if (!Object.hasOwn(TOOLS, action.id)) return unchanged;
    const tool = TOOLS[action.id];
    if (
      cosmosStage(s) < tool.at ||
      s.upgrades[action.id] >= tool.max ||
      s.glow < toolCost(s, action.id)
    )
      return unchanged;
    s.glow -= toolCost(s, action.id);
    s.upgrades[action.id]++;
    s.revision++;
    return { changed: true, glow: 0 };
  }
  const id = action.id;
  if (!Number.isInteger(id)) return unchanged;
  if (action.kind === "catch") {
    if (id < 0 || id >= 12 || s.ready[id] > s.time) return unchanged;
    s.ready[id] = s.time + 3 / (1 + s.upgrades.lure * 0.25);
    s.revision++;
    return { changed: true, glow: catchBatch(s, 1) };
  }
  if (action.kind === "pattern") {
    if (!patternAvailable(s, id) || s.pattern === id) return unchanged;
    s.pattern = id;
    s.revision++;
    return { changed: true, glow: 0 };
  }
  if (action.kind === "star") {
    const p = PATTERNS[s.pattern],
      stitches = s.stitches[s.pattern];
    if (
      id < 0 ||
      id >= p.nodes.length ||
      stitches[id] ||
      s.resources[0] < p.cost
    )
      return unchanged;
    s.resources[0] -= p.cost;
    stitches[id] = true;
    s.revision++;
    const completed = stitches.every(Boolean);
    return {
      changed: true,
      glow: completed ? finishPattern(s, s.pattern) : 0,
      completed: completed ? 1 : undefined,
    };
  }
  if (id < 2 || id > 5 || s.made[id - 1] <= 0) return unchanged;
  if (action.kind === "auto") {
    if (s.made[id] <= 0) return unchanged;
    s.auto[id] = !s.auto[id];
    s.revision++;
    return { changed: true, glow: 0 };
  }
  if (action.kind === "craft") {
    if (s.resources[id - 1] < BODIES[id].cost) return unchanged;
    return { changed: true, glow: craftBatch(s, id, 1), completed: id };
  }
  return unchanged;
}
export function tickCosmos(s: CosmosState, seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  const elapsed = Math.min(seconds, 28800 * 384);
  // Long absences use bounded production steps. Recipes still consume every
  // ingredient, including fireflies spent on each automatically woven star.
  const steps = Math.max(1, Math.min(1024, Math.ceil(elapsed))),
    dt = elapsed / steps;
  let glow = 0;
  for (let n = 0; n < steps; n++) {
    const rates = cosmosRates(s);
    s.time += dt;
    addFlies(s, rates.flies * dt);
    glow += addGlow(s, rates.glow * dt);
    s.netCarry += catchRate(s) * dt;
    const catches = Math.floor(s.netCarry + 1e-9);
    s.netCarry = Math.max(0, s.netCarry - catches);
    if (catches > 0) {
      glow += catchBatch(s, catches);
    }
    s.loomCarry += s.upgrades.loom * 0.4 * dt;
    const nodes = Math.floor(s.loomCarry + 1e-9);
    s.loomCarry = Math.max(0, s.loomCarry - nodes);
    if (nodes > 0) glow += weave(s, nodes);
    s.forgeCarry += (dt * (1 + s.upgrades.orbit * 0.5)) / 4;
    const crafts = Math.floor(s.forgeCarry + 1e-9);
    s.forgeCarry = Math.max(0, s.forgeCarry - crafts);
    if (crafts > 0)
      for (let tier = 2; tier < 6; tier++)
        if (s.auto[tier] && s.made[tier] > 0)
          glow += craftBatch(s, tier, crafts);
  }
  return glow;
}
function safe(n: unknown, fallback = 0, max = LIMIT): number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0
    ? Math.min(max, n)
    : fallback;
}
export function restoreCosmos(raw: unknown): CosmosState {
  const s = createCosmos();
  if (!raw || typeof raw !== "object") return s;
  const r = raw as Record<string, unknown>;
  s.resources = Array.from({ length: 6 }, (_, i) =>
    safe(Array.isArray(r.resources) ? r.resources[i] : 0),
  );
  s.made = Array.from({ length: 6 }, (_, i) =>
    Math.max(s.resources[i], safe(Array.isArray(r.made) ? r.made[i] : 0)),
  );
  s.glow = safe(r.glow);
  s.earned = Math.max(s.glow, safe(r.earned));
  s.caught = safe(r.caught);
  for (const key of Object.keys(TOOLS) as CosmosTool[]) {
    const value =
      r.upgrades && typeof r.upgrades === "object"
        ? (r.upgrades as Record<string, unknown>)[key]
        : 0;
    s.upgrades[key] =
      cosmosStage(s) >= TOOLS[key].at
        ? Math.floor(safe(value, 0, TOOLS[key].max))
        : 0;
  }
  s.auto = Array.from(
    { length: 6 },
    (_, i) =>
      i >= 2 && s.made[i] > 0 && Array.isArray(r.auto) && r.auto[i] === true,
  );
  s.pattern = patternAvailable(s, Number(r.pattern)) ? Number(r.pattern) : 0;
  s.stitches = PATTERNS.map((p, i) =>
    p.nodes.map(
      (_, j) =>
        Array.isArray(r.stitches) &&
        Array.isArray(r.stitches[i]) &&
        r.stitches[i][j] === true,
    ),
  );
  // A completed pattern has already paid out; never award it again on load.
  s.stitches.forEach((row) => {
    if (row.every(Boolean)) row.fill(false);
  });
  s.gallery = Array.from({ length: 3 }, (_, i) =>
    Math.floor(safe(Array.isArray(r.gallery) ? r.gallery[i] : 0)),
  );
  s.time = safe(r.time, 0, 1e14);
  s.ready = Array.from({ length: 12 }, (_, i) =>
    Math.max(
      s.time,
      Math.min(
        s.time + 3,
        safe(Array.isArray(r.ready) ? r.ready[i] : 0, s.time),
      ),
    ),
  );
  s.netCarry = safe(r.netCarry, 0, 0.999999);
  s.loomCarry = safe(r.loomCarry, 0, 0.999999);
  s.forgeCarry = safe(r.forgeCarry, 0, 0.999999);
  return s;
}
