import { sprite } from "./art";
import { format, oceanAction, cycleSpeed, idleBoost, type State } from "./game";
import {
  OCEAN_TOOLS,
  SEAS,
  lavaPower,
  rainRate,
  oceanRate,
  oceanCost,
  oceanProgress,
  oceanCapacity,
  type OceanTool,
} from "./ocean";
import "./ocean.css";
export type OceanController = { update: () => void; destroy: () => void };
export function mountOcean(
  host: HTMLElement,
  getState: () => State,
  changed: () => void,
): OceanController {
  const finds = ["wreck", "bell", "temple", "pearl"],
    names = ["Old shipwreck", "Sunken bell", "Drowned temple", "Ocean pearl"];
  host.innerHTML = `<section class="ocean-app"><div class="ocean-scene"><header class="ocean-hud"><div><small>BLUE · V</small><h1>Lava tide</h1></div><div class="ocean-wallet">${sprite("ocean-obsidian")}<strong id="ocean-money"></strong><small id="ocean-score"></small></div></header><div class="ocean-stage"><canvas class="ocean-canvas" role="img" aria-label="A hand-drawn ocean beneath lava clouds, with a falling waterline and hidden ruins"></canvas><div class="ocean-clouds">${[0, 1, 2].map((i) => `<button data-ocean-rain="${i}" aria-label="Rain lava ${i + 1}">${sprite("ocean-cloud" + (i ? "-" + i : ""))}</button>`).join("")}</div><div class="ocean-sea-name"><small id="ocean-number"></small><span id="ocean-name"></span></div><div class="ocean-gauge" role="progressbar" aria-label="Ocean drained" aria-valuemin="0" aria-valuemax="100"><i id="ocean-gauge-fill"></i><span id="ocean-percent"></span></div><div class="ocean-complete" hidden><span>Seabed found</span><button data-ocean-next aria-label="Sail to the next ocean">${sprite("ocean-boat")}Sail on →</button></div></div><footer class="ocean-readout"><span>${sprite("ocean-rain")}<b id="ocean-water"></b><small>water</small></span><span>${sprite("ocean-steam")}<b id="ocean-rate"></b><small>/s</small></span></footer></div><aside class="ocean-dock"><div class="ocean-dock-heading"><span>Rainmakers</span><span id="ocean-cleared"></span></div><div class="ocean-tools">${(Object.keys(OCEAN_TOOLS) as OceanTool[]).map((id) => `<button class="ocean-tool" data-ocean-tool="${id}" aria-label="Upgrade ${OCEAN_TOOLS[id].name}">${sprite(OCEAN_TOOLS[id].sprite)}<span><strong>${OCEAN_TOOLS[id].name}</strong><small data-ocean-detail="${id}"></small></span><span class="ocean-tool-cost"><b data-ocean-cost="${id}"></b><small data-ocean-level="${id}"></small></span></button>`).join("")}</div><div class="ocean-finds" aria-label="Seabed discoveries">${finds.map((f, i) => `<span data-ocean-find="${i}" title="${names[i]}">${sprite("ocean-" + f, "", names[i])}<b>?</b></span>`).join("")}<button data-ocean-voyage aria-label="Automatic voyages" aria-pressed="false" hidden>${sprite("ocean-boat")}<small>∞</small></button></div></aside></section>`;
  const canvas = host.querySelector<HTMLCanvasElement>("canvas")!,
    ctx = canvas.getContext("2d")!;
  canvas.width = 640;
  canvas.height = 480;
  const images: Record<string, HTMLImageElement> = {};
  for (const name of [
    "basin",
    ...finds,
    "compass",
    "boat",
    "vent",
    ...Array.from({ length: 3 }, (_, i) => "lava" + (i ? "-" + i : "")),
    ...Array.from({ length: 3 }, (_, i) => "steam" + (i ? "-" + i : "")),
  ]) {
    const img = new Image();
    img.src = `${import.meta.env.BASE_URL}sprites/ocean-${name}.svg`;
    images[name] = img;
  }
  function image(
    name: string,
    x: number,
    y: number,
    w: number,
    h = w,
    alpha = 1,
  ) {
    const img = images[name];
    if (img?.complete && img.naturalWidth) {
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
      ctx.globalAlpha = 1;
    }
  }
  function text(selector: string, value: string) {
    const el = host.querySelector(selector);
    if (el && el.textContent !== value) el.textContent = value;
  }
  const short = (n: number) =>
    n < 10 ? String(Number(n.toFixed(2))) : format(n);
  const sea = new Path2D(
    "M31 206 609 206 594 238 582 273 572 300 552 329 550 367 526 394 513 425 480 451 440 463 386 471 330 463 263 471 211 466 167 462 129 439 117 408 88 375 83 327 61 299 58 251 40 241Z",
  );
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0,
    stopped = false;
  function draw() {
    if (stopped) return;
    const state = getState(),
      s = state.ocean,
      progress = oceanProgress(s),
      surface = 206 + 263 * progress;
    const animated = state.motion && !reducedMotion.matches;
    const t = animated ? s.time : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#343d43";
    ctx.fillRect(0, 0, 640, 480);
    image("basin", 0, 0, 640, 480);
    image("wreck", 138, 262, 113, 87);
    image("bell", 421, 325, 54, 62);
    image("temple", 267, 365, 111, 91);
    image("pearl", 225, 433, 35, 30);
    image("compass", 397, 416, 29);
    ctx.save();
    ctx.clip(sea);
    if (s.water > 0) {
      ctx.fillStyle = "#367d89";
      ctx.fillRect(0, surface, 640, 480 - surface);
      ctx.fillStyle = "#347581";
      ctx.fillRect(0, Math.max(surface, 325), 640, 155);
      ctx.fillStyle = "#306c78";
      ctx.fillRect(0, Math.max(surface, 400), 640, 80);
      // Uneven, hard-edged strokes, like a tiny sea painted with the pencil tool.
      ctx.strokeStyle = "#6eaaa8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, surface + 1);
      for (let x = 0; x <= 640; x += 8)
        ctx.lineTo(x, surface + Math.round(Math.sin(x * 0.06 + t * 1.5) * 1.8));
      ctx.stroke();
      ctx.strokeStyle = "#4e9299";
      ctx.lineWidth = 1;
      for (let i = 0; i < 48; i++) {
        const x = (i * 83 + Math.floor(t * 2) * (i % 2 ? 1 : -1) + 6400) % 620,
          y = 213 + ((i * 37) % 253);
        if (y > surface + 5) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 7 + (i % 14), y);
          ctx.lineTo(x + 11 + (i % 14), y - 1);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
    if (s.water > 0)
      image(
        "boat",
        323 + (animated ? Math.sin(t * 0.8) * 3 : 0),
        surface - 24,
        44,
        35,
      );
    for (let i = 0; i < Math.min(4, s.upgrades.vents); i++)
      image("vent", 160 + i * 83, 432, 31);
    for (const d of s.drops) {
      const p = Math.max(0, Math.min(1, (s.time - d.born) / (d.hit - d.born)));
      if (d.basin === s.basin)
        image(
          "lava" + (d.id % 3 ? "-" + (d.id % 3) : ""),
          d.x * 640 - 14,
          95 + (surface - 111) * p * p,
          28,
          36,
        );
    }
    // A bounded set of visible showers represents the complete idle production rate.
    const rate = rainRate(s);
    if (rate && s.water > 0) {
      const count = Math.min(14, Math.max(1, Math.ceil(rate * 1.3)));
      for (let i = 0; i < count; i++) {
        const p = (t * 0.75 + i / count) % 1,
          x = 0.16 + ((i * 37) % 68) / 100;
        image(
          "lava" + (i % 3 ? "-" + (i % 3) : ""),
          x * 640 - 11,
          97 + (surface - 110) * p * p,
          22,
          30,
        );
        if (p > 0.82)
          image("steam", x * 640 - 20, surface - 18, 40, 35, (p - 0.82) / 0.18);
      }
    }
    const age = s.time - s.lastHit;
    if (age >= 0 && age < 1.1 && s.water > 0) {
      const f = Math.min(2, Math.floor(age * 3));
      image(
        "steam" + (f ? "-" + f : ""),
        s.lastX * 640 - 25,
        surface - 30 - age * 18,
        50,
        45,
        1 - age / 1.1,
      );
      ctx.strokeStyle = "#d1c1a0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.lastX * 640 - 25, surface + 4);
      ctx.lineTo(s.lastX * 640 - 8, surface + 5);
      ctx.moveTo(s.lastX * 640 + 8, surface + 5);
      ctx.lineTo(s.lastX * 640 + 26, surface + 3);
      ctx.stroke();
    }
    frame = requestAnimationFrame(draw);
  }
  function update() {
    const state = getState(),
      s = state.ocean,
      progress = oceanProgress(s);
    text("#ocean-money", format(s.obsidian));
    text("#ocean-score", "×" + format(state.worlds[4].score) + " steam");
    text("#ocean-number", "OCEAN " + String(s.basin + 1).padStart(2, "0"));
    text("#ocean-name", SEAS[s.basin % SEAS.length]);
    text("#ocean-water", format(s.water));
    text(
      "#ocean-rate",
      short(oceanRate(s) * cycleSpeed(state) * idleBoost(state)),
    );
    text("#ocean-percent", (progress * 100).toFixed(1) + "%");
    text("#ocean-cleared", s.cleared ? format(s.cleared) + " drained" : "");
    const gauge = host.querySelector<HTMLElement>(".ocean-gauge")!;
    gauge.setAttribute("aria-valuenow", (progress * 100).toFixed(1));
    host.querySelector<HTMLElement>("#ocean-gauge-fill")!.style.height =
      100 * progress + "%";
    host.querySelector<HTMLElement>(".ocean-complete")!.hidden = s.water > 0;
    const detail: Record<OceanTool, string> = {
      clouds: short(rainRate(s)) + " drops/s",
      heat: short(lavaPower(s)) + " water/drop",
      shower: "+35% lava / level",
      vents: format(s.upgrades.vents * 12) + " water/s",
      horizon: s.autoVoyage ? "Sailing · ∞" : "Sailing · manual",
    };
    for (const id of Object.keys(OCEAN_TOOLS) as OceanTool[]) {
      const tool = OCEAN_TOOLS[id],
        button = host.querySelector<HTMLButtonElement>(
          `[data-ocean-tool="${id}"]`,
        )!,
        max = s.upgrades[id] >= tool.max,
        locked = s.cleared < tool.at;
      button.disabled = max || locked || s.obsidian < oceanCost(s, id);
      button.classList.toggle("unfound", locked);
      text(
        `[data-ocean-cost="${id}"]`,
        locked ? "?" : max ? "✓" : format(oceanCost(s, id)),
      );
      text(
        `[data-ocean-level="${id}"]`,
        locked ? "Ocean 1" : "Lv. " + s.upgrades[id],
      );
      text(`[data-ocean-detail="${id}"]`, detail[id]);
    }
    host
      .querySelectorAll<HTMLButtonElement>("[data-ocean-rain]")
      .forEach((b, i) => {
        b.disabled = s.water <= 0 || s.ready[i] > s.time;
      });
    host.querySelectorAll<HTMLElement>("[data-ocean-find]").forEach((el, i) => {
      el.classList.toggle("found", s.finds[i] > 0);
      el.querySelector("b")!.textContent = s.finds[i]
        ? format(s.finds[i])
        : "?";
    });
    const voyage = host.querySelector<HTMLButtonElement>(
      "[data-ocean-voyage]",
    )!;
    voyage.hidden = !s.upgrades.horizon;
    voyage.setAttribute("aria-pressed", String(s.autoVoyage));
    canvas.dataset.surface = String(Math.round(206 + 263 * progress));
    canvas.dataset.capacity = String(oceanCapacity(s.basin));
  }
  host.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "button",
    );
    if (!button || button.disabled) return;
    const action = button.hasAttribute("data-ocean-rain")
      ? { kind: "rain" as const, id: Number(button.dataset.oceanRain) }
      : button.hasAttribute("data-ocean-tool")
        ? {
            kind: "upgrade" as const,
            id: button.dataset.oceanTool as OceanTool,
          }
        : button.hasAttribute("data-ocean-next")
          ? { kind: "next" as const }
          : button.hasAttribute("data-ocean-voyage")
            ? { kind: "voyage" as const }
            : null;
    if (action && oceanAction(getState(), action).changed) {
      update();
      changed();
    }
  });
  update();
  draw();
  return {
    update,
    destroy: () => {
      stopped = true;
      cancelAnimationFrame(frame);
    },
  };
}
