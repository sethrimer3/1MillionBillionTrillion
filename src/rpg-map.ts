export const MAP_SIZE = 19;
export const MAP_CENTER = 9 * MAP_SIZE + 9;
export type MapCell = {
  id: number;
  x: number;
  y: number;
  wall: boolean;
  room: boolean;
  distance: number;
  region: number;
  kind: "camp" | "path" | "room" | "lair" | "chest";
};

function makeMap(): MapCell[] {
  const cells: MapCell[] = Array.from(
    { length: MAP_SIZE * MAP_SIZE },
    (_, id) => {
      const x = id % MAP_SIZE,
        y = Math.floor(id / MAP_SIZE),
        distance = Math.abs(x - 9) + Math.abs(y - 9);
      return {
        id,
        x,
        y,
        wall: true,
        room: x % 2 === 1 && y % 2 === 1,
        distance,
        region: Math.min(7, Math.max(0, Math.floor((distance - 1) / 2))),
        kind: "path",
      };
    },
  );
  let seed = 7319;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const stack = [MAP_CENTER];
  cells[MAP_CENTER].wall = false;
  while (stack.length) {
    const cell = cells[stack.at(-1)!];
    const options = [
      [0, -2],
      [2, 0],
      [0, 2],
      [-2, 0],
    ]
      .map(([dx, dy]) => ({ x: cell.x + dx, y: cell.y + dy }))
      .filter(
        (p) =>
          p.x > 0 &&
          p.x < 18 &&
          p.y > 0 &&
          p.y < 18 &&
          cells[p.y * MAP_SIZE + p.x].wall,
      );
    if (!options.length) {
      stack.pop();
      continue;
    }
    const next = options[Math.floor(random() * options.length)],
      id = next.y * MAP_SIZE + next.x;
    cells[((cell.y + next.y) / 2) * MAP_SIZE + (cell.x + next.x) / 2].wall =
      false;
    cells[id].wall = false;
    stack.push(id);
  }
  // Open the four central lanes, plus a few loops among the longer branches.
  for (const [dx, dy] of [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ])
    cells[MAP_CENTER + dy * MAP_SIZE + dx].wall = false;
  for (const c of cells)
    if (
      c.wall &&
      c.x > 0 &&
      c.x < 18 &&
      c.y > 0 &&
      c.y < 18 &&
      (c.x + c.y) % 2 === 1 &&
      random() < 0.15
    )
      c.wall = false;
  for (const c of cells) {
    if (c.wall) continue;
    if (c.id === MAP_CENTER) c.kind = "camp";
    else if (c.room)
      c.kind =
        c.distance >= 10 && (c.x + c.y) % 4 === 2
          ? "lair"
          : (c.x * 7 + c.y * 11) % 9 === 0
            ? "chest"
            : "room";
  }
  return cells;
}
export const WORLD_MAP = makeMap();
export function neighbors(id: number): number[] {
  const c = WORLD_MAP[id];
  if (!c || c.wall) return [];
  return [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ]
    .map(([dx, dy]) => WORLD_MAP[(c.y + dy) * MAP_SIZE + c.x + dx])
    .filter(
      (n): n is MapCell =>
        !!n && !n.wall && Math.abs(n.x - c.x) + Math.abs(n.y - c.y) === 1,
    )
    .map((n) => n.id);
}
export function findPath(from: number, to: number): number[] | null {
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    !WORLD_MAP[from] ||
    !WORLD_MAP[to] ||
    WORLD_MAP[from].wall ||
    WORLD_MAP[to].wall
  )
    return null;
  const queue = [from],
    previous = new Map<number, number>([[from, -1]]);
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    if (id === to) break;
    for (const n of neighbors(id))
      if (!previous.has(n)) {
        previous.set(n, id);
        queue.push(n);
      }
  }
  if (!previous.has(to)) return null;
  const route: number[] = [];
  for (let id = to; id !== from; id = previous.get(id)!) route.unshift(id);
  return route;
}
