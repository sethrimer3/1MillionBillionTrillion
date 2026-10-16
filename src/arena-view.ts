import { sprite } from "./art";
import { format, productionBoost, type State } from "./game";
import {
  HULLS,
  arenaStage,
  arenaUpgradeCost,
  beamTarget,
  buyArenaUpgrade,
  buyShip,
  crystalPoints,
  fleetCapacity,
  mergeShips,
  resizeArena,
  shipCost,
  shipDamage,
  shipSpeed,
  surgeFleet,
  type ArenaUpgrade,
  type Crystal,
} from "./arena";
import "./arena.css";

export type ArenaController = { update: () => void; destroy: () => void };
export function mountArena(
  host: HTMLElement,
  getState: () => State,
  changed: () => void,
): ArenaController {
  let tab = "fleet",
    dockKey = "",
    frame = 0,
    dead = false;
  host.innerHTML = `<div class="arena-app"><div class="arena-field"><div class="arena-hud"><div class="arena-name"><span>GREEN · IV</span><h1>Shard drift</h1></div><div class="arena-wallet">${sprite("arena-coin")}<strong id="arena-money">0</strong></div></div><div class="arena-stage"><span id="arena-stage">STAGE 1</span><div class="arena-stage-track"><i id="arena-progress"></i></div><span id="arena-earned">×1</span></div><div class="arena-canvas-wrap"><canvas id="arena-canvas" aria-label="Crystal field with an idle triangle ship fleet" role="img"></canvas></div><div class="arena-field-footer"><span id="arena-count"></span><button class="arena-surge" id="arena-surge" aria-label="Surge fleet">${sprite("arena-speed")}<span id="arena-surge-label">Surge ×2</span></button></div></div><aside class="arena-dock"><nav class="arena-tabs" aria-label="Fleet controls"><button data-arena-tab="fleet" aria-selected="true">${sprite("arena-ship-0")}Fleet</button><button data-arena-tab="upgrades" aria-selected="false">${sprite("arena-damage")}Upgrades</button></nav><div class="arena-dock-content" id="arena-dock-content"></div></aside></div>`;
  const canvas = host.querySelector<HTMLCanvasElement>("canvas")!,
    context = canvas.getContext("2d")!;
  const images = new Map<string, HTMLImageElement>();
  function asset(name: string): HTMLImageElement {
    let image = images.get(name);
    if (!image) {
      image = new Image();
      image.src = import.meta.env.BASE_URL + "sprites/arena-" + name + ".svg";
      images.set(name, image);
    }
    return image;
  }
  const ships = HULLS.map((_, i) => asset("ship-" + i)),
    crystals = Array.from({ length: 4 }, (_, i) => asset("crystal-" + i));
  const mine = asset("mine"),
    fern = asset("fern"),
    floor = asset("floor");
  let width = 1,
    height = 1,
    dpr = 1,
    pattern: CanvasPattern | null = null;
  const observer = new ResizeObserver(() => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    resizeArena(getState().arena, (720 * height) / Math.max(1, width));
  });
  observer.observe(canvas);
  function text(id: string, value: string) {
    const el = host.querySelector<HTMLElement>("#" + id);
    if (el && el.textContent !== value) el.textContent = value;
  }
  function update(): void {
    if (dead) return;
    const state = getState(),
      s = state.arena;
    text("arena-money", format(s.money));
    text("arena-stage", `STAGE ${format(arenaStage(s))}`);
    text("arena-earned", `×${format(state.worlds[3].score)}`);
    text("arena-count", `${s.ships.length} / ${fleetCapacity(s)} SHIPS`);
    host.querySelector<HTMLElement>("#arena-progress")!.style.width =
      ((s.destroyed % 6) / 6) * 100 + "%";
    const surge = host.querySelector<HTMLButtonElement>("#arena-surge")!;
    surge.disabled = s.surgeCooldown > 0;
    surge.classList.toggle("active", s.surge > 0);
    text(
      "arena-surge-label",
      s.surge > 0
        ? `${Math.ceil(s.surge)}s · ×2`
        : s.surgeCooldown > 0
          ? `${Math.ceil(s.surgeCooldown)}s`
          : "Surge ×2",
    );
    const key = tab + ":" + s.unlocked;
    if (key !== dockKey) {
      dockKey = key;
      const dock = host.querySelector<HTMLElement>("#arena-dock-content")!;
      dock.innerHTML =
        tab === "fleet"
          ? `<div class="arena-hulls">${HULLS.slice(
              0,
              Math.min(6, s.unlocked + 2),
            )
              .map(
                (h, tier) =>
                  `<article class="arena-hull ${tier > s.unlocked ? "sealed" : ""}" data-hull="${tier}"><div class="arena-hull-heading">${sprite("arena-ship-" + tier, "", h.name)}<span><strong>${tier > s.unlocked ? "???" : h.name}</strong><small>${tier > s.unlocked ? "◇" : "" + h.weapon}</small></span><b data-fleet-count="${tier}">0</b></div><div class="arena-hull-stats"><span>${sprite("arena-damage")}<span data-ship-damage="${tier}"></span></span><span>${sprite("arena-speed")}<span data-ship-speed="${tier}"></span></span></div><button data-launch="${tier}" aria-label="Launch ${h.name}"><span>Launch</span><strong data-ship-cost="${tier}"></strong></button>${tier < 5 ? `<button class="arena-merge" data-merge="${tier}" aria-label="Merge ${h.name} pair">${sprite("arena-merge")}<span>Merge</span><small data-merge-count="${tier}">0/2</small></button>` : `<div class="arena-last-hull">✦</div>`}</article>`,
              )
              .join("")}</div>`
          : `<div class="arena-upgrades">${(["damage", "speed", "capacity"] as const).map((key) => `<button data-arena-upgrade="${key}" aria-label="Upgrade ${key}">${sprite("arena-" + key)}<span><strong>${key === "damage" ? "Impact" : key === "speed" ? "Thrusters" : "Berths"}</strong><small data-upgrade-detail="${key}"></small></span><span class="arena-upgrade-price"><strong data-upgrade-cost="${key}"></strong><small data-upgrade-level="${key}"></small></span></button>`).join("")}</div>`;
    }
    HULLS.forEach((_, tier) => {
      const count = s.ships.filter((ship) => ship.tier === tier).length;
      const set = (name: string, value: string) => {
        const el = host.querySelector<HTMLElement>(`[data-${name}="${tier}"]`);
        if (el && el.textContent !== value) el.textContent = value;
      };
      set("fleet-count", String(count));
      set("ship-damage", format(shipDamage(s, tier)));
      set("ship-speed", format(shipSpeed(s, tier)));
      set("ship-cost", tier > s.unlocked ? "◇" : format(shipCost(s, tier)));
      set("merge-count", `${Math.min(2, count)}/2`);
      const launch = host.querySelector<HTMLButtonElement>(
        `[data-launch="${tier}"]`,
      );
      if (launch)
        launch.disabled =
          tier > s.unlocked ||
          s.money < shipCost(s, tier) ||
          s.ships.length >= fleetCapacity(s);
      const merge = host.querySelector<HTMLButtonElement>(
        `[data-merge="${tier}"]`,
      );
      if (merge) merge.disabled = count < 2 || tier > s.unlocked;
    });
    for (const key of ["damage", "speed", "capacity"] as const) {
      const button = host.querySelector<HTMLButtonElement>(
        `[data-arena-upgrade="${key}"]`,
      );
      if (!button) continue;
      const max =
        key === "capacity" ? fleetCapacity(s) >= 32 : s.upgrades[key] >= 1000;
      button.disabled = max || s.money < arenaUpgradeCost(s, key);
      button.querySelector<HTMLElement>("[data-upgrade-cost]")!.textContent =
        max ? "MAX" : format(arenaUpgradeCost(s, key));
      button.querySelector<HTMLElement>("[data-upgrade-level]")!.textContent =
        `LV ${s.upgrades[key]}`;
      button.querySelector<HTMLElement>("[data-upgrade-detail]")!.textContent =
        key === "damage"
          ? `×${1 + s.upgrades.damage} → ×${2 + s.upgrades.damage}`
          : key === "speed"
            ? `+${s.upgrades.speed * 12} → +${(s.upgrades.speed + 1) * 12}`
            : `${fleetCapacity(s)} → ${Math.min(32, fleetCapacity(s) + 2)}`;
    }
    host.querySelector<HTMLElement>(".arena-app")!.title =
      productionBoost(state, 3) > 1
        ? `Shard yield ×${format(productionBoost(state, 3))}`
        : "";
  }
  host.onclick = (e) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "button",
    );
    if (!button || button.disabled) return;
    const s = getState().arena;
    let result = false;
    if (button.dataset.arenaTab) {
      tab = button.dataset.arenaTab;
      host
        .querySelectorAll("[data-arena-tab]")
        .forEach((el) =>
          el.setAttribute(
            "aria-selected",
            String((el as HTMLElement).dataset.arenaTab === tab),
          ),
        );
      update();
      return;
    }
    if (button.dataset.launch !== undefined)
      result = buyShip(s, Number(button.dataset.launch));
    if (button.dataset.merge !== undefined)
      result = mergeShips(s, Number(button.dataset.merge));
    if (button.dataset.arenaUpgrade)
      result = buyArenaUpgrade(s, button.dataset.arenaUpgrade as ArenaUpgrade);
    if (button.id === "arena-surge") result = surgeFleet(s);
    if (result) {
      changed();
      update();
    }
  };
  function drawImage(
    img: HTMLImageElement,
    x: number,
    y: number,
    size: number,
    angle = 0,
  ): void {
    if (!img.complete || !img.naturalWidth) return;
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.drawImage(img, -size / 2, -size / 2, size, size);
    context.restore();
  }
  function crystal(c: Crystal): void {
    // The sprite has the same vertices as the collision outline.
    drawImage(crystals[c.shape], c.x, c.y, (c.radius * 96) / 42, c.angle);
    if (c.flash > 0 && getState().motion) {
      context.globalAlpha = c.flash * 3;
      context.fillStyle = "#f1f2bc";
      context.beginPath();
      crystalPoints(c).forEach((p, i) =>
        i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y),
      );
      context.closePath();
      context.fill();
      context.globalAlpha = 1;
    }
    if (c.hp < c.maxHp) {
      const fraction = c.hp / c.maxHp;
      context.strokeStyle = "#122c29";
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(c.x - 22, c.y + c.radius + 10);
      context.lineTo(c.x + 22, c.y + c.radius + 11);
      context.stroke();
      context.strokeStyle = fraction < 0.3 ? "#e8ca8b" : "#afd5a1";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(c.x - 22, c.y + c.radius + 10);
      context.lineTo(c.x - 22 + 44 * fraction, c.y + c.radius + 10);
      context.stroke();
      // Ink cracks become deeper as a crystal weakens.
      context.strokeStyle = "#284e43";
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(c.x - 8, c.y - c.radius * 0.4);
      context.lineTo(c.x + 2, c.y - 3);
      context.lineTo(c.x - 5, c.y + 9);
      if (fraction < 0.5) context.lineTo(c.x + 12, c.y + c.radius * 0.6);
      context.stroke();
    }
  }
  function draw(): void {
    if (dead) return;
    const s = getState().arena;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#142c29";
    context.fillRect(0, 0, width, height);
    if (!pattern && floor.complete && floor.naturalWidth)
      pattern = context.createPattern(floor, "repeat");
    if (pattern) {
      context.fillStyle = pattern;
      context.fillRect(0, 0, width, height);
    }
    const scale = Math.min(width / s.width, height / s.height),
      offsetX = (width - s.width * scale) / 2,
      offsetY = (height - s.height * scale) / 2;
    context.translate(offsetX, offsetY);
    context.scale(scale, scale);
    // A scratched pencil frame and weeds painted directly into the playfield.
    context.strokeStyle = "#426047";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(8, 26);
    context.lineTo(9, 9);
    context.lineTo(36, 8);
    context.moveTo(s.width - 28, 9);
    context.lineTo(s.width - 9, 11);
    context.lineTo(s.width - 8, 35);
    context.moveTo(9, s.height - 30);
    context.lineTo(8, s.height - 9);
    context.lineTo(35, s.height - 8);
    context.moveTo(s.width - 35, s.height - 8);
    context.lineTo(s.width - 8, s.height - 10);
    context.lineTo(s.width - 10, s.height - 34);
    context.stroke();
    for (const [x, y, angle] of [
      [22, s.height - 28, -0.2],
      [s.width - 20, 70, Math.PI],
      [30, 130, 0.4],
      [s.width - 24, s.height - 20, -0.6],
    ])
      drawImage(fern, x, y, 90, angle);
    for (const c of s.crystals) crystal(c);
    for (const m of s.mines)
      drawImage(mine, m.x, m.y, m.arm > 0 ? 15 : 23, s.time * 0.5);
    for (const ship of s.ships) {
      context.strokeStyle = HULLS[ship.tier].color;
      context.lineWidth = 2;
      context.globalAlpha = 0.16;
      context.beginPath();
      ship.trail.forEach((p, i) =>
        i ? context.lineTo(p.x, p.y) : context.moveTo(p.x, p.y),
      );
      context.stroke();
      context.globalAlpha = 1;
      if (ship.tier === 3) {
        const length = beamTarget(s, ship).length;
        context.strokeStyle = "#4b9d8c";
        context.lineWidth = 7;
        context.beginPath();
        context.moveTo(ship.x, ship.y);
        context.lineTo(
          ship.x + Math.cos(ship.angle) * length,
          ship.y + Math.sin(ship.angle) * length,
        );
        context.stroke();
        context.strokeStyle = "#e9ffc0";
        context.lineWidth = 2;
        context.stroke();
        context.fillStyle = "#e9ffc0";
        context.fillRect(
          ship.x + Math.cos(ship.angle) * length - 2,
          ship.y + Math.sin(ship.angle) * length - 2,
          4,
          4,
        );
      }
      drawImage(ships[ship.tier], ship.x, ship.y, 46, ship.angle);
    }
    for (const shot of s.shots) {
      context.strokeStyle =
        shot.kind === "seeker"
          ? "#f5edc2"
          : shot.kind === "spiral"
            ? "#c9aee5"
            : "#f0cb8a";
      context.lineWidth = shot.kind === "seeker" ? 4 : 3;
      context.beginPath();
      context.moveTo(shot.x, shot.y);
      context.lineTo(
        shot.x - Math.cos(shot.angle) * 10,
        shot.y - Math.sin(shot.angle) * 10,
      );
      context.stroke();
      context.fillStyle = "#f8f2cc";
      context.fillRect(shot.x - 1, shot.y - 1, 2, 2);
    }
    for (const spark of s.sparks) {
      context.globalAlpha = Math.min(1, spark.ttl * 2);
      context.fillStyle = spark.color;
      if (spark.text) {
        context.font = '22px "Pixelify Sans", monospace';
        context.textAlign = "center";
        context.fillText(spark.text, spark.x, spark.y);
      } else {
        context.save();
        context.translate(spark.x, spark.y);
        context.rotate(spark.angle);
        context.fillRect(-3, -2, 7, 4);
        context.restore();
      }
    }
    context.globalAlpha = 1;
    frame = requestAnimationFrame(draw);
  }
  update();
  frame = requestAnimationFrame(draw);
  return {
    update,
    destroy: () => {
      dead = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.onclick = null;
    },
  };
}
