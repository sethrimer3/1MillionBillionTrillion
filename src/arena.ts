// The simulation is independent of the canvas, including collisions and offline progress.
export const HULLS = [
  { name: "Dart", weapon: "Ram", color: "#c8efad", damage: 14, speed: 105 },
  {
    name: "Needle",
    weapon: "Forward gun",
    color: "#f2ce83",
    damage: 22,
    speed: 110,
  },
  {
    name: "Bramble",
    weapon: "Mines",
    color: "#e59caa",
    damage: 30,
    speed: 115,
  },
  { name: "Sunray", weapon: "Beam", color: "#9dded8", damage: 38, speed: 120 },
  { name: "Whorl", weapon: "Spiral", color: "#b4a0e4", damage: 46, speed: 125 },
  { name: "Wisp", weapon: "Seeker", color: "#eef2c1", damage: 54, speed: 130 },
] as const;
export type Point = { x: number; y: number };
export type Ship = Point & {
  id: number;
  tier: number;
  angle: number;
  cooldown: number;
  contact: number;
  trail: Point[];
};
export type Crystal = Point & {
  id: number;
  hp: number;
  maxHp: number;
  radius: number;
  shape: number;
  angle: number;
  flash: number;
};
export type Shot = Point & {
  angle: number;
  damage: number;
  ttl: number;
  kind: "bolt" | "spiral" | "seeker";
  target: number;
};
export type Mine = Point & { damage: number; ttl: number; arm: number };
export type Spark = Point & {
  angle: number;
  ttl: number;
  color: string;
  text?: string;
};
export type ArenaState = {
  width: number;
  height: number;
  money: number;
  earned: number;
  destroyed: number;
  purchased: number[];
  unlocked: number;
  merges: number;
  upgrades: { damage: number; speed: number; capacity: number };
  ships: Ship[];
  crystals: Crystal[];
  shots: Shot[];
  mines: Mine[];
  sparks: Spark[];
  seed: number;
  nextId: number;
  carry: number;
  time: number;
  surge: number;
  surgeCooldown: number;
};
export type ArenaUpgrade = keyof ArenaState["upgrades"];
export const SHAPES: readonly (readonly Point[])[] = [
  [
    { x: -0.85, y: -0.38 },
    { x: -0.3, y: -1 },
    { x: 0.5, y: -0.78 },
    { x: 1, y: 0.03 },
    { x: 0.65, y: 0.82 },
    { x: -0.25, y: 1 },
    { x: -1, y: 0.4 },
  ],
  [
    { x: -0.9, y: -0.5 },
    { x: 0.15, y: -1 },
    { x: 1, y: -0.28 },
    { x: 0.72, y: 0.6 },
    { x: -0.25, y: 0.97 },
    { x: -1, y: 0.16 },
  ],
  [
    { x: -0.72, y: -0.8 },
    { x: 0.2, y: -1 },
    { x: 0.95, y: -0.3 },
    { x: 0.55, y: 0.9 },
    { x: -0.5, y: 0.75 },
    { x: -1, y: 0.1 },
  ],
  [
    { x: -1, y: -0.3 },
    { x: -0.4, y: -1 },
    { x: 0.7, y: -0.72 },
    { x: 1, y: 0.3 },
    { x: 0.2, y: 1 },
    { x: -0.72, y: 0.6 },
  ],
];
const TAU = Math.PI * 2;
function random(s: ArenaState): number {
  s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0;
  return s.seed / 4294967296;
}
export function arenaStage(s: ArenaState): number {
  return 1 + Math.floor(s.destroyed / 6);
}
export function crystalHealth(stage: number): number {
  return 14 + 8 * Math.max(0, stage - 1);
}
export function crystalValue(stage: number): number {
  return 12 + 4 * Math.max(0, stage - 1);
}
export function fleetCapacity(s: ArenaState): number {
  return Math.min(32, 8 + 2 * s.upgrades.capacity);
}
export function shipDamage(s: ArenaState, tier: number): number {
  return HULLS[tier].damage * (1 + s.upgrades.damage);
}
export function shipSpeed(s: ArenaState, tier: number): number {
  return HULLS[tier].speed + s.upgrades.speed * 12;
}
export function shipCost(s: ArenaState, tier: number): number {
  return 18 + tier * 24 + s.purchased[tier] * (8 + tier * 8);
}
export function arenaUpgradeCost(s: ArenaState, key: ArenaUpgrade): number {
  const base = key === "capacity" ? 48 : key === "speed" ? 26 : 22;
  return base * (1 + s.upgrades[key]);
}
function addShip(s: ArenaState, tier: number, at?: Point): void {
  s.ships.push({
    id: s.nextId++,
    tier,
    x: at?.x ?? s.width * (0.4 + random(s) * 0.2),
    y: at?.y ?? s.height * (0.4 + random(s) * 0.2),
    angle: random(s) * TAU,
    cooldown: 0.2 + random(s),
    contact: 0,
    trail: [],
  });
}
function addCrystal(s: ArenaState): void {
  const radius = 38 + random(s) * 24;
  let x = 0,
    y = 0;
  for (let attempt = 0; attempt < 60; attempt++) {
    x = radius + 12 + random(s) * (s.width - 2 * radius - 24);
    y = radius + 12 + random(s) * (s.height - 2 * radius - 24);
    if (Math.hypot(x - s.width / 2, y - s.height / 2) < 95) continue;
    if (
      s.crystals.every(
        (c) => Math.hypot(c.x - x, c.y - y) > c.radius + radius + 20,
      ) &&
      s.ships.every((ship) => Math.hypot(ship.x - x, ship.y - y) > radius + 22)
    )
      break;
  }
  const hp = crystalHealth(arenaStage(s));
  s.crystals.push({
    id: s.nextId++,
    x,
    y,
    radius,
    hp,
    maxHp: hp,
    shape: Math.floor(random(s) * SHAPES.length),
    angle: random(s) * TAU,
    flash: 0,
  });
}
export function createArena(): ArenaState {
  const s: ArenaState = {
    width: 720,
    height: 800,
    money: 0,
    earned: 0,
    destroyed: 0,
    purchased: [0, 0, 0, 0, 0, 0],
    unlocked: 0,
    merges: 0,
    upgrades: { damage: 0, speed: 0, capacity: 0 },
    ships: [],
    crystals: [],
    shots: [],
    mines: [],
    sparks: [],
    seed: 728013,
    nextId: 1,
    carry: 0,
    time: 0,
    surge: 0,
    surgeCooldown: 0,
  };
  addShip(s, 0);
  while (s.crystals.length < 6) addCrystal(s);
  s.ships[0].angle = Math.atan2(
    s.crystals[0].y - s.ships[0].y,
    s.crystals[0].x - s.ships[0].x,
  );
  return s;
}
export function buyShip(s: ArenaState, tier: number): boolean {
  if (
    !Number.isInteger(tier) ||
    tier < 0 ||
    tier > s.unlocked ||
    tier >= HULLS.length ||
    s.ships.length >= fleetCapacity(s) ||
    s.money < shipCost(s, tier)
  )
    return false;
  s.money -= shipCost(s, tier);
  s.purchased[tier]++;
  addShip(s, tier);
  return true;
}
export function mergeShips(s: ArenaState, tier: number): boolean {
  if (!Number.isInteger(tier) || tier < 0 || tier >= HULLS.length - 1)
    return false;
  const pair = s.ships.filter((ship) => ship.tier === tier).slice(0, 2);
  if (pair.length < 2) return false;
  const at = { x: (pair[0].x + pair[1].x) / 2, y: (pair[0].y + pair[1].y) / 2 };
  s.ships = s.ships.filter((ship) => !pair.includes(ship));
  addShip(s, tier + 1, at);
  s.merges++;
  s.unlocked = Math.max(s.unlocked, tier + 1);
  for (let i = 0; i < 12; i++)
    s.sparks.push({
      ...at,
      angle: (i * TAU) / 12,
      ttl: 0.7,
      color: HULLS[tier + 1].color,
    });
  return true;
}
export function buyArenaUpgrade(s: ArenaState, key: ArenaUpgrade): boolean {
  if (
    !["damage", "speed", "capacity"].includes(key) ||
    s.upgrades[key] >= 1000 ||
    (key === "capacity" && fleetCapacity(s) >= 32) ||
    s.money < arenaUpgradeCost(s, key)
  )
    return false;
  s.money -= arenaUpgradeCost(s, key);
  s.upgrades[key]++;
  return true;
}
export function surgeFleet(s: ArenaState): boolean {
  if (s.surgeCooldown > 0) return false;
  s.surge = 8;
  s.surgeCooldown = 32;
  return true;
}
export function resizeArena(s: ArenaState, height: number): void {
  const next = Math.max(240, Math.min(1400, height));
  if (Math.abs(next - s.height) < 1) return;
  const ratio = next / s.height;
  for (const item of [...s.ships, ...s.crystals, ...s.shots, ...s.mines])
    item.y *= ratio;
  s.height = next;
  for (const c of s.crystals)
    c.y = Math.max(c.radius + 8, Math.min(next - c.radius - 8, c.y));
  for (const ship of s.ships) {
    ship.y = Math.max(12, Math.min(next - 12, ship.y));
    ship.angle = Math.atan2(Math.sin(ship.angle) * ratio, Math.cos(ship.angle));
    ship.trail = [];
  }
}
export function crystalPoints(c: Crystal): Point[] {
  const cos = Math.cos(c.angle),
    sin = Math.sin(c.angle);
  return SHAPES[c.shape].map((p) => ({
    x: c.x + (p.x * cos - p.y * sin) * c.radius,
    y: c.y + (p.x * sin + p.y * cos) * c.radius,
  }));
}
// Signed edge tests work for the convex, clockwise hand-drawn crystal outlines.
function touches(c: Crystal, p: Point, radius: number): Point | null {
  if (Math.hypot(c.x - p.x, c.y - p.y) > c.radius * 1.1 + radius) return null;
  const points = crystalPoints(c);
  let inside = true,
    closest: Point = { x: 0, y: 0 },
    distance = Infinity;
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length],
      dx = b.x - a.x,
      dy = b.y - a.y;
    if (dx * (p.y - a.y) - dy * (p.x - a.x) < 0) inside = false;
    const t = Math.max(
      0,
      Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)),
    );
    const q = { x: a.x + dx * t, y: a.y + dy * t },
      d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < distance) {
      distance = d;
      closest = q;
    }
  }
  if (!inside && distance > radius) return null;
  const dx = inside ? closest.x - p.x : p.x - closest.x,
    dy = inside ? closest.y - p.y : p.y - closest.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}
export function weakestCrystal(s: ArenaState): Crystal | undefined {
  return s.crystals
    .filter((c) => c.hp > 0)
    .reduce<Crystal | undefined>(
      (a, c) => (!a || c.hp < a.hp ? c : a),
      undefined,
    );
}
export function beamTarget(
  s: ArenaState,
  ship: Ship,
): { crystal?: Crystal; length: number } {
  const direction = { x: Math.cos(ship.angle), y: Math.sin(ship.angle) };
  let length = 260,
    crystal: Crystal | undefined;
  for (const c of s.crystals) {
    if (c.hp <= 0) continue;
    const points = crystalPoints(c);
    for (let i = 0; i < points.length; i++) {
      const a = points[i],
        b = points[(i + 1) % points.length],
        dx = b.x - a.x,
        dy = b.y - a.y;
      const denominator = direction.x * dy - direction.y * dx;
      if (Math.abs(denominator) < 0.00001) continue;
      const t = ((a.x - ship.x) * dy - (a.y - ship.y) * dx) / denominator;
      const u =
        ((a.x - ship.x) * direction.y - (a.y - ship.y) * direction.x) /
        denominator;
      if (t >= 0 && t < length && u >= 0 && u <= 1) {
        length = t;
        crystal = c;
      }
    }
  }
  return { crystal, length };
}
export function damageCrystal(
  s: ArenaState,
  c: Crystal,
  amount: number,
): number {
  if (
    c.hp <= 0 ||
    !s.crystals.includes(c) ||
    !Number.isFinite(amount) ||
    amount <= 0
  )
    return 0;
  c.hp = Math.max(0, c.hp - amount);
  c.flash = 0.12;
  if (c.hp > 0) return 0;
  const reward = crystalValue(arenaStage(s));
  s.destroyed++;
  s.money = Math.min(1e100, s.money + reward);
  s.earned = Math.min(1e100, s.earned + reward);
  for (let i = 0; i < 9; i++)
    s.sparks.push({
      x: c.x,
      y: c.y,
      angle: random(s) * TAU,
      ttl: 0.45 + random(s) * 0.4,
      color: ["#c7f0b0", "#7db895", "#f4e7ad"][i % 3],
    });
  s.sparks.push({
    x: c.x,
    y: c.y,
    angle: 0,
    ttl: 1.1,
    color: "#e5f3bb",
    text: `+${reward}`,
  });
  return reward;
}
function emit(
  s: ArenaState,
  ship: Ship,
  angle: number,
  kind: Shot["kind"],
  damage: number,
): void {
  if (s.shots.length >= 180) return;
  s.shots.push({
    x: ship.x + Math.cos(angle) * 15,
    y: ship.y + Math.sin(angle) * 15,
    angle,
    damage,
    ttl: 3.6,
    kind,
    target: weakestCrystal(s)?.id ?? 0,
  });
}
function step(s: ArenaState, dt: number, strength: number): number {
  let reward = 0;
  s.time += dt;
  s.surge = Math.max(0, s.surge - dt);
  s.surgeCooldown = Math.max(0, s.surgeCooldown - dt);
  for (const c of s.crystals) c.flash = Math.max(0, c.flash - dt);
  for (const ship of s.ships) {
    ship.cooldown -= dt;
    ship.contact = Math.max(0, ship.contact - dt);
    const speed = shipSpeed(s, ship.tier) * (s.surge > 0 ? 2 : 1),
      damage = shipDamage(s, ship.tier) * strength;
    ship.trail.unshift({ x: ship.x, y: ship.y });
    if (ship.trail.length > 8) ship.trail.pop();
    ship.x += Math.cos(ship.angle) * speed * dt;
    ship.y += Math.sin(ship.angle) * speed * dt;
    if (ship.x < 12 || ship.x > s.width - 12) {
      ship.angle = Math.PI - ship.angle;
      ship.x = Math.max(12, Math.min(s.width - 12, ship.x));
    }
    if (ship.y < 12 || ship.y > s.height - 12) {
      ship.angle = -ship.angle;
      ship.y = Math.max(12, Math.min(s.height - 12, ship.y));
    }
    for (const c of s.crystals) {
      if (c.hp <= 0) continue;
      const normal = touches(c, ship, 9);
      if (!normal) continue;
      if (ship.contact <= 0) {
        reward += damageCrystal(s, c, damage);
        ship.contact = 0.16;
      }
      const dot =
        Math.cos(ship.angle) * normal.x + Math.sin(ship.angle) * normal.y;
      if (dot < 0)
        ship.angle = Math.atan2(
          Math.sin(ship.angle) - 2 * dot * normal.y,
          Math.cos(ship.angle) - 2 * dot * normal.x,
        );
      ship.x += normal.x * 4;
      ship.y += normal.y * 4;
    }
    if (ship.tier === 3) {
      // An uninterrupted forward beam; only the first crystal in its path is hit.
      const hit = beamTarget(s, ship);
      if (hit.crystal)
        reward += damageCrystal(s, hit.crystal, damage * dt * 1.8);
    }
    if (ship.cooldown <= 0) {
      if (ship.tier === 1) emit(s, ship, ship.angle, "bolt", damage * 0.8);
      if (ship.tier === 2 && s.mines.length < 60)
        s.mines.push({
          x: ship.x - Math.cos(ship.angle) * 18,
          y: ship.y - Math.sin(ship.angle) * 18,
          damage: damage * 2.2,
          ttl: 9,
          arm: 0.25,
        });
      if (ship.tier === 4)
        for (let i = 0; i < 6; i++)
          emit(s, ship, s.time * 2 + (i * TAU) / 6, "spiral", damage * 0.5);
      if (ship.tier === 5) emit(s, ship, ship.angle, "seeker", damage * 1.6);
      ship.cooldown += ship.tier === 2 ? 1.5 : ship.tier === 4 ? 0.65 : 0.7;
    }
  }
  for (const shot of s.shots) {
    shot.ttl -= dt;
    if (shot.kind === "seeker") {
      const target = weakestCrystal(s);
      shot.target = target?.id ?? 0;
      if (target) {
        const desired = Math.atan2(target.y - shot.y, target.x - shot.x);
        let turn = ((desired - shot.angle + Math.PI * 3) % TAU) - Math.PI;
        shot.angle += Math.max(-dt * 5, Math.min(dt * 5, turn));
      }
    }
    const speed = shot.kind === "seeker" ? 225 : 290;
    shot.x += Math.cos(shot.angle) * speed * dt;
    shot.y += Math.sin(shot.angle) * speed * dt;
    for (const c of s.crystals)
      if (c.hp > 0 && touches(c, shot, 3)) {
        reward += damageCrystal(s, c, shot.damage);
        shot.ttl = 0;
        break;
      }
    if (shot.x < 0 || shot.x > s.width || shot.y < 0 || shot.y > s.height)
      shot.ttl = 0;
  }
  for (const mine of s.mines) {
    mine.ttl -= dt;
    mine.arm -= dt;
    if (
      mine.arm <= 0 &&
      s.crystals.some(
        (c) =>
          c.hp > 0 && Math.hypot(c.x - mine.x, c.y - mine.y) < c.radius + 32,
      )
    ) {
      for (const c of s.crystals)
        if (c.hp > 0 && Math.hypot(c.x - mine.x, c.y - mine.y) < c.radius + 76)
          reward += damageCrystal(s, c, mine.damage);
      mine.ttl = 0;
      s.sparks.push({
        x: mine.x,
        y: mine.y,
        angle: 0,
        ttl: 0.4,
        color: "#e59caa",
        text: "✳",
      });
    }
  }
  for (const spark of s.sparks) {
    spark.ttl -= dt;
    spark.x += Math.cos(spark.angle) * (spark.text ? 0 : 35) * dt;
    spark.y += (spark.text ? -25 : Math.sin(spark.angle) * 35) * dt;
  }
  s.shots = s.shots.filter((p) => p.ttl > 0);
  s.mines = s.mines.filter((p) => p.ttl > 0);
  s.sparks = s.sparks.filter((p) => p.ttl > 0).slice(-120);
  s.crystals = s.crystals.filter((c) => c.hp > 0);
  while (s.crystals.length < 6) addCrystal(s);
  return reward;
}
// Integrate complete crystal breaks during long absences. Difficulty and rewards
// are arithmetic sequences, so hours away don't require millions of physics steps.
function offline(s: ArenaState, seconds: number, strength: number): number {
  const weaponDuty = [0, 0.35, 0.4, 0.65, 1.1, 1.7];
  let budget =
    seconds *
    s.ships.reduce(
      (d, ship) =>
        d +
        shipDamage(s, ship.tier) *
          strength *
          (shipSpeed(s, ship.tier) / 650 + weaponDuty[ship.tier]),
      0,
    );
  let reward = 0;
  // Resolve the visible field's remaining health before generating new shards.
  for (const c of [...s.crystals]) {
    const damage = Math.min(c.hp, budget);
    budget -= damage;
    reward += damageCrystal(s, c, damage);
    if (budget <= 0) break;
  }
  s.crystals = s.crystals.filter((c) => c.hp > 0);
  // Finish the current six-shard stage, then solve complete stages in one step.
  while (budget >= crystalHealth(arenaStage(s)) && s.destroyed % 6 !== 0) {
    budget -= crystalHealth(arenaStage(s));
    const value = crystalValue(arenaStage(s));
    s.destroyed++;
    reward += value;
    s.money += value;
    s.earned += value;
  }
  if (s.destroyed % 6 === 0) {
    const stage = arenaStage(s),
      a = 24,
      b = 6 * crystalHealth(stage) - 24;
    const count = Math.max(
      0,
      Math.floor((2 * budget) / (b + Math.sqrt(b * b + 4 * a * budget))),
    );
    if (count > 0) {
      budget -= a * count * count + b * count;
      const value = 6 * (count * crystalValue(stage) + 2 * count * (count - 1));
      s.destroyed += count * 6;
      reward += value;
      s.money += value;
      s.earned += value;
    }
  }
  for (let i = 0; i < 6 && budget >= crystalHealth(arenaStage(s)); i++) {
    budget -= crystalHealth(arenaStage(s));
    const value = crystalValue(arenaStage(s));
    s.destroyed++;
    reward += value;
    s.money += value;
    s.earned += value;
  }
  while (s.crystals.length < 6) addCrystal(s);
  if (budget > 0) {
    const c = s.crystals.find((c) => c.hp > budget) ?? s.crystals[0];
    c.hp = Math.max(0.001, c.hp - budget);
  }
  s.time += seconds;
  s.shots = [];
  s.mines = [];
  s.sparks = [];
  s.surge = 0;
  s.surgeCooldown = Math.max(0, s.surgeCooldown - seconds);
  return reward;
}
export function tickArena(
  s: ArenaState,
  seconds: number,
  strength = 1,
): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  const elapsed = Math.min(seconds, 28800 * 128),
    power = Math.max(
      1,
      Math.min(1e12, Number.isFinite(strength) ? strength : 1),
    );
  if (elapsed > 3) return offline(s, elapsed, power);
  s.carry += elapsed;
  let reward = 0;
  // Keep even fully upgraded hulls from crossing an entire crystal in one step.
  const fastest =
    Math.max(...s.ships.map((ship) => shipSpeed(s, ship.tier))) *
    (s.surge > 0 ? 2 : 1);
  const dt = Math.min(1 / 60, 8 / fastest);
  while (s.carry >= dt) {
    reward += step(s, dt, power);
    s.carry -= dt;
  }
  return reward;
}
function number(n: unknown, fallback: number, min = 0, max = 1e100): number {
  return typeof n === "number" && Number.isFinite(n)
    ? Math.max(min, Math.min(max, n))
    : fallback;
}
export function restoreArena(raw: unknown): ArenaState {
  const s = createArena();
  if (!raw || typeof raw !== "object") return s;
  const r = raw as Record<string, unknown>;
  s.height = number(r.height, 800, 240, 1400);
  s.money = number(r.money, 0);
  s.earned = number(r.earned, 0);
  s.destroyed = Math.floor(number(r.destroyed, 0, 0, 1e14));
  s.unlocked = Math.floor(number(r.unlocked, 0, 0, 5));
  s.merges = Math.floor(number(r.merges, 0, 0, 1e9));
  s.seed = number(r.seed, 728013, 0, 4294967295) >>> 0;
  s.purchased = Array.from({ length: 6 }, (_, i) =>
    Math.floor(
      number(Array.isArray(r.purchased) ? r.purchased[i] : 0, 0, 0, 1e9),
    ),
  );
  const upgrades =
    r.upgrades && typeof r.upgrades === "object"
      ? (r.upgrades as Record<string, unknown>)
      : {};
  for (const key of ["damage", "speed", "capacity"] as const)
    s.upgrades[key] = Math.floor(
      number(upgrades[key], 0, 0, key === "capacity" ? 12 : 1000),
    );
  s.ships = [];
  s.nextId = 1;
  if (Array.isArray(r.ships))
    for (const item of r.ships.slice(0, fleetCapacity(s))) {
      if (!item || typeof item !== "object") continue;
      const tier = Math.floor(number(item.tier, 0, 0, 5));
      s.unlocked = Math.max(s.unlocked, tier);
      addShip(s, tier, {
        x: number(item.x, 360, 12, 708),
        y: number(item.y, s.height / 2, 12, s.height - 12),
      });
      s.ships.at(-1)!.angle = number(item.angle, 0, -1e6, 1e6) % TAU;
    }
  if (!s.ships.length) addShip(s, 0);
  s.crystals = [];
  if (Array.isArray(r.crystals))
    for (const item of r.crystals.slice(0, 6)) {
      if (!item || typeof item !== "object") continue;
      const hp = number(item.hp, 14, 0.001, 1e16),
        maxHp = Math.max(hp, number(item.maxHp, hp, 0.001, 1e16));
      s.crystals.push({
        id: s.nextId++,
        x: number(item.x, 100, 70, 650),
        y: number(item.y, 100, 70, s.height - 70),
        radius: number(item.radius, 45, 30, 65),
        shape: Math.floor(number(item.shape, 0, 0, 3)),
        angle: number(item.angle, 0, -1e6, 1e6) % TAU,
        hp,
        maxHp,
        flash: 0,
      });
    }
  while (s.crystals.length < 6) addCrystal(s);
  s.surgeCooldown = number(r.surgeCooldown, 0, 0, 32);
  s.time = number(r.time, 0, 0, 1e12);
  return s;
}
