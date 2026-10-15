import "@fontsource/caveat/latin-500.css";
import "@fontsource/caveat/latin-600.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/pixelify-sans/latin-400.css";
import "./style.css";
import {
  GOAL,
  WORLDS,
  RELICS,
  SAVE_KEY,
  freshState,
  total,
  unlock,
  advance,
  loadState,
  format,
  price,
  purchase,
  rate,
  multiplier,
  discover,
  discoveries,
  type Upgrade,
} from "./game";
import { sprite, uiIcon, gem, scenery, torch } from "./art";

type View = "gate" | "worlds" | "world" | "relics";
type Play = {
  heat: number;
  last: number;
  ripe: number;
  plots: number[];
  growth: number;
  chain: number;
  harvested: number;
  echo: number[];
  echoAt: number;
  input: number;
  mistake: number;
  position: number;
};
let raw: string | null = null;
try {
  raw = localStorage.getItem(SAVE_KEY);
} catch {
  /* Play is still available without storage. */
}
let state = loadState(raw);
const oldTotal = total(state);
const elapsed = Math.max(0, Math.min(28800, (Date.now() - state.saved) / 1000));
advance(state, elapsed);
let view: View = "gate";
let current = 0;
let showExact = false;
let lit = [true, true];
let sceneKey = "";
let saveTime = Date.now();
let lastTick = Date.now();
let toastTimer = 0;
let audio: AudioContext | undefined;
let deferredInstall: (Event & { prompt: () => Promise<void> }) | null = null;
const seen = new Set([0]);
const plays: (Play | undefined)[] = [];
const helpers = [
  "gnome",
  "gnome",
  "flower-gold",
  "snail",
  "duck",
  "moth",
  "moth",
  "eye",
];
const upgradeNames = [
  "Kindling",
  "Garden gloves",
  "Sun catcher",
  "Watering can",
  "Rain dance",
  "Wishing stone",
  "Dream thread",
  "Uncertainty",
];
const app = document.querySelector<HTMLDivElement>("#app")!;

function play(i = current): Play {
  if (!plays[i])
    plays[i] = {
      heat: 0,
      last: 0,
      ripe: Math.floor(Math.random() * 3),
      plots: [0, Date.now() + 1600, Date.now() + 2800, 0, Date.now() + 2200, 0],
      growth: 0,
      chain: 0,
      harvested: 0,
      echo: [0, 2],
      echoAt: Date.now() + 400,
      input: 0,
      mistake: 0,
      position: 0,
    };
  return plays[i]!;
}
function available(i: number): boolean {
  return i >= 0 && (i < state.unlocked || (i === 7 && state.secret));
}
function count(): number {
  return state.unlocked + Number(state.secret);
}
function save(): void {
  state.saved = Date.now();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    saveTime = Date.now();
  } catch {
    document.querySelector("#save-state")?.setAttribute("data-failed", "true");
  }
}
function chime(note = 0, quiet = false): void {
  if (!state.sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = "triangle";
    o.connect(g);
    g.connect(audio.destination);
    o.frequency.setValueAtTime(
      [261.63, 329.63, 392, 523.25, 659.25][Math.abs(note) % 5],
      audio.currentTime,
    );
    g.gain.setValueAtTime(quiet ? 0.018 : 0.045, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.22);
    o.start();
    o.stop(audio.currentTime + 0.22);
  } catch {
    /* Sound is optional. */
  }
}
function toast(title: string, subtitle = "", image = "star"): void {
  const box = document.querySelector<HTMLDivElement>("#toast")!;
  box.innerHTML = `${sprite(image)}<span><small>${subtitle}</small><strong>${title}</strong></span>`;
  window.clearTimeout(toastTimer);
  box.classList.add("visible");
  toastTimer = window.setTimeout(() => box.classList.remove("visible"), 3200);
}
function earn(id: string): void {
  if (!discover(state, id)) return;
  const relic = RELICS.find((r) => r.id === id)!;
  toast(relic.name, "RELIC FOUND", relic.sprite);
  chime(4);
  save();
  updateRelicBadge();
}
function checkDiscoveries(): void {
  const found = discoveries(state);
  if (found.length) {
    const r = RELICS.find((r) => r.id === found[found.length - 1])!;
    toast(r.name, "RELIC FOUND", r.sprite);
    save();
    updateRelicBadge();
  }
}
function shell(): void {
  app.innerHTML = `<div class="app-shell"><header class="app-header"><a class="brand" href="#gate" aria-label="Million Billion Trillion">${sprite("gate", "brand-sprite")}<span class="brand-title">million<span>.</span> billion<span>.</span> trillion<span>.</span></span></a><div class="header-location" id="header-location"></div><div class="header-actions"><span class="save-light" id="save-state" title="Saved on this device" aria-label="Autosave active"></span><button class="icon-button" id="sound" aria-label="Toggle sound" aria-pressed="${state.sound}">${uiIcon(state.sound ? "sound" : "muted")}</button><button class="icon-button" id="settings" aria-label="Settings">${uiIcon("settings")}</button></div></header><aside class="side-rail" aria-label="Main navigation">${navItems("rail")}<div class="rail-bottom"><span class="rail-mark">MBT</span><span class="version">02</span></div></aside><main id="screen" tabindex="-1"></main><nav class="bottom-dock" aria-label="Main navigation">${navItems("dock")}</nav></div><div class="toast" id="toast" role="status" aria-live="polite"></div><dialog id="modal" aria-labelledby="modal-title"></dialog><div class="particles" id="particles" aria-hidden="true"></div>`;
  document
    .querySelectorAll<HTMLElement>("[data-nav]")
    .forEach((b) => (b.onclick = () => navigate(b.dataset.nav!)));
  document.querySelector<HTMLButtonElement>("#sound")!.onclick = () => {
    state.sound = !state.sound;
    syncPreferences();
    save();
    chime(2);
  };
  document.querySelector<HTMLButtonElement>("#settings")!.onclick =
    showSettings;
  document
    .querySelector<HTMLDialogElement>("#modal")!
    .addEventListener("click", (e) => {
      const d = e.currentTarget as HTMLDialogElement;
      if (e.target === d) {
        const r = d.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          d.close();
      }
    });
  syncPreferences();
}
function navItems(prefix: string): string {
  return (
    [
      ["gate", "The gate"],
      ["worlds", "Worlds"],
      ["relics", "Relics"],
    ] as const
  )
    .map(
      ([name, label]) =>
        `<button class="nav-item" data-nav="${name}" id="${prefix}-${name}">${uiIcon(name)}<span>${label}</span>${name === "relics" ? '<i class="relic-dot" hidden></i>' : ""}</button>`,
    )
    .join("");
}
function syncPreferences(): void {
  document.documentElement.dataset.motion = state.motion ? "on" : "off";
  const button = document.querySelector<HTMLButtonElement>("#sound");
  if (button) {
    button.innerHTML = uiIcon(state.sound ? "sound" : "muted");
    button.setAttribute("aria-pressed", String(state.sound));
    button.setAttribute(
      "aria-label",
      state.sound ? "Mute sound" : "Enable sound",
    );
  }
}
function navigate(route: string): void {
  if (location.hash === "#" + route) renderView();
  else location.hash = route;
}
function readRoute(): void {
  const route = location.hash.slice(1).split("/");
  if (
    route[0] === "world" &&
    /^\d$/.test(route[1] || "") &&
    available(Number(route[1]))
  ) {
    current = Number(route[1]);
    view = "world";
    seen.add(current);
    play();
  } else
    view =
      route[0] === "relics"
        ? "relics"
        : route[0] === "worlds" || route[0] === "world"
          ? "worlds"
          : "gate";
  renderView();
}
function renderView(): void {
  document.querySelector<HTMLDialogElement>("#modal")?.close();
  document.documentElement.dataset.view = view;
  document.querySelectorAll<HTMLElement>("[data-nav]").forEach((b) => {
    const selected = b.dataset.nav === (view === "world" ? "worlds" : view);
    b.classList.toggle("selected", selected);
    if (selected) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  const name =
    view === "world"
      ? WORLDS[current].name
      : view === "gate"
        ? "The threshold"
        : view === "worlds"
          ? "Little worlds"
          : "The collection";
  document.querySelector("#header-location")!.innerHTML = `<i></i>${name}`;
  const screen = document.querySelector<HTMLElement>("#screen")!;
  screen.innerHTML =
    view === "gate"
      ? gateScreen()
      : view === "worlds"
        ? worldsScreen()
        : view === "world"
          ? worldScreen()
          : relicScreen();
  sceneKey = "";
  bindView();
  update();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function gateScreen(): string {
  return `<section class="gate-page"><div class="screen-heading"><div><div class="eyebrow"><span class="tiny-diamond"></span> THE THRESHOLD</div><h1>The other side.</h1></div><div class="chapter-mark"><span>SEALS</span><strong>${String(state.unlocked).padStart(2, "0")}<small> / 07</small></strong></div></div><div class="gate-stage ${state.won ? "is-open" : ""}" id="gate-stage"><div class="sky-grain"></div><div class="sky-moon"></div><div class="starfield">${Array.from({ length: 24 }, (_, i) => `<i style="--x:${(i * 37 + 9) % 98}%;--y:${(i * 13 + 3) % 55}%;--delay:${i * 0.23}s"></i>`).join("")}</div>${scenery()}<div class="gate-score"><span class="eyebrow">${state.won ? "THE IMPOSSIBLE, MADE POSSIBLE" : "EVERYTHING, MULTIPLIED"}</span><button class="total-number" id="total-score" aria-label="Show exact total score">${showExact ? total(state).toLocaleString("en-US") : format(total(state))}</button><div class="score-factors" id="score-factors">${factors()}</div></div><div class="door-aura"></div>${torch(0, lit[0])}${torch(1, lit[1])}<div class="door-container" id="gate-image"><div class="door-light"></div><button class="door-button ${total(state) >= GOAL ? "ready" : ""}" id="open-gate" aria-label="${total(state) >= GOAL ? "Open the gate" : "The sealed gate"}">${sprite("gate", "gate-sprite")}<span class="door-inscription">1 MILLION<br>1 BILLION<br>1 TRILLION</span><span class="door-seam"></span></button><div class="gate-sockets">${WORLDS.slice(
    0,
    7,
  )
    .map(
      (w, i) =>
        `<button class="gate-socket socket-${i}" data-world="${i}" aria-label="${available(i) ? w.name : "Unfilled " + w.name + " gem"}">${gem(i, available(i))}</button>`,
    )
    .join(
      "",
    )}</div></div><button class="hidden-sigil ${!lit[0] && !lit[1] ? "revealed" : ""} ${state.secret ? "found" : ""}" id="secret-sigil" aria-label="Strange marking">${sprite(state.secret ? "eye" : "rune")}</button><div class="gate-fog fog-one"></div><div class="gate-fog fog-two"></div><div class="threshold-label">${state.won ? "THE WAY IS OPEN" : total(state) >= GOAL ? "THE SEAL IS BROKEN" : "1,000,000 × 1,000,000,000 × 1,000,000,000,000"}</div><div class="stage-corners"><i></i><i></i><i></i><i></i></div><span class="scene-coordinate">I · XXVII</span><span class="scene-ambience"><i></i> ${lit.some(Boolean) ? "THE FIRE STILL BURNS" : "ONLY THE DARK REMAINS"}</span></div><div class="gate-status"><span class="gate-status-label">${state.won ? "OPEN" : "SEALED"}</span><div class="seal-progress"><i style="width:${progress()}%" id="gate-progress"></i></div><span id="gate-progress-text">${progress().toFixed(1)}<small> / 100</small></span></div><section class="world-shelf"><div class="shelf-heading"><h2>Little worlds <span>${String(count()).padStart(2, "0")} / 08</span></h2><button class="text-action" data-route="worlds">All worlds ${uiIcon("arrow")}</button></div><div class="shelf-grid">${WORLDS.slice(
    0,
    4,
  )
    .map((_, i) => miniWorld(i))
    .join("")}</div></section></section>`;
}
function factors(): string {
  return state.worlds
    .slice(0, state.secret ? 8 : state.unlocked)
    .map(
      (w, i) =>
        `<button data-world="${i}" style="--world:${WORLDS[i].color}" aria-label="${WORLDS[i].name}: ${Math.floor(w.score)}">${gem(Math.min(i, 6), true)}<span>${format(w.score)}</span></button>`,
    )
    .join("<b>×</b>");
}
function progress(): number {
  return Math.min(
    100,
    Math.max(0, (Math.log10(Number(total(state))) / 27) * 100),
  );
}
function miniWorld(i: number): string {
  const w = WORLDS[i],
    open = available(i);
  return `<button class="mini-world ${open ? "" : "locked"}" data-world="${i}" style="--world:${w.color}">${sprite(w.kind)}<span><strong>${w.name}</strong><small data-mini="${i}">${open ? format(state.worlds[i].score) : format(w.unlock)}</small></span>${open ? uiIcon("arrow") : uiIcon("lock")}</button>`;
}
function worldsScreen(): string {
  return `<section class="worlds-page"><div class="screen-heading"><div><div class="eyebrow"><span class="tiny-diamond"></span> THE SPECTRUM</div><h1>Little worlds.</h1></div><div class="chapter-mark"><span>DISCOVERED</span><strong>${String(count()).padStart(2, "0")}<small> / 08</small></strong></div></div><div class="world-grid">${WORLDS.map(
    (w, i) => {
      const open = available(i),
        secret = i === 7 && !open;
      return `<button class="world-card world-card-${i} ${open ? "available" : "locked"}" data-world="${i}" style="--world:${w.color}" aria-label="${open ? "Play " + w.name : secret ? "Undiscovered world" : w.name + " locked at " + format(w.unlock)}"><div class="world-card-top"><span class="world-number">${secret ? "??" : String(i + 1).padStart(2, "0")}</span>${open ? `<span class="world-active"><i></i>${rate(state.worlds[i]) > 0 ? format(rate(state.worlds[i])) + "/s" : "AWAKE"}</span>` : uiIcon("lock")}</div><div class="card-biome"><div class="biome-moon"></div><div class="biome-ground"></div>${sprite(secret ? "eye" : w.kind, "card-sprite")}${i === 0 ? '<i class="biome-spark"></i>' : ""}${i === 5 ? '<i class="biome-star star-a"></i><i class="biome-star star-b"></i>' : ""}</div><div class="world-card-info"><h2>${secret ? "The in-between" : w.name}</h2><div class="world-card-bottom">${open ? `<span data-world-score="${i}">${format(state.worlds[i].score)} <small>${w.noun}</small></span><span class="card-enter">${uiIcon("arrow")}</span>` : `<span>${uiIcon("lock")}${secret ? "???" : format(w.unlock)}</span><span class="unfilled-gem">${i < 7 ? gem(i, false) : "?"}</span>`}</div></div>${open && !seen.has(i) ? '<span class="new-mark">NEW</span>' : ""}</button>`;
    },
  ).join("")}</div><div class="spectrum-line">${WORLDS.slice(0, 7)
    .map(
      (w, i) =>
        `<span class="${available(i) ? "active" : ""}" style="--world:${w.color}"></span>`,
    )
    .join("")}<i>∞</i></div></section>`;
}
function worldScreen(): string {
  const w = WORLDS[current];
  return `<section class="world-page" style="--world:${w.color}" data-world-page="${current}"><div class="world-nav"><button class="text-action" data-route="worlds">${uiIcon("back")} Worlds</button><div class="world-tabs" aria-label="World shortcuts">${WORLDS.map((x, i) => `<button class="${i === current ? "active" : ""} ${available(i) ? "" : "locked"}" data-world="${i}" aria-label="${available(i) ? x.name : "Locked world"}" ${i === current ? 'aria-current="page"' : ""}>${sprite(i === 7 && !state.secret ? "lock" : x.kind)}</button>`).join("")}</div><span class="world-index">${String(current + 1).padStart(2, "0")} / 08</span></div><div class="screen-heading world-heading"><div><div class="eyebrow"><span class="tiny-diamond"></span> ${current === 7 ? "SOMETHING ELSE" : ["VERMILION", "AMBER", "GOLD", "FERN", "SKY", "INDIGO", "VIOLET"][current]}</div><h1>${w.name}<span class="world-title-gem">${current < 7 ? gem(current, true) : uiIcon("star")}</span></h1></div><div class="chapter-mark"><span>${w.noun.toUpperCase()}</span><strong id="world-score">${format(state.worlds[current].score)}</strong></div></div><div class="world-detail-grid"><div class="activity-column"><div class="activity-stage activity-${current}" id="playground" aria-label="${w.name} game"></div><div class="activity-status"><span id="activity-status">${activityStatus()}</span><div class="activity-pips" id="activity-pips">${pips()}</div><span class="world-multiplier" id="world-multiplier">×${multiplier(state.worlds[current])}</span></div><div class="world-milestones">${[100, 1000, 10000].map((n) => `<div class="milestone ${state.worlds[current].score >= n ? "achieved" : ""}" data-milestone="${n}">${sprite(state.worlds[current].score >= n ? "coin" : "lock")}<span>${format(n)}</span></div>`).join("")}</div></div><aside class="world-shop"><div class="pocket-bar">${uiIcon("bag")}<span>Pocket</span><strong id="world-bank">${format(state.worlds[current].bank)}</strong></div><div class="shop-heading"><h2>A little more.</h2><span id="world-rate">${format(rate(state.worlds[current]))}/s</span></div>${shopRow("helper", w.auto, helpers[current])}${shopRow("power", upgradeNames[current], "glove")}${shopRow("resonance", "Resonance", "rune")}<div class="world-total"><span>THE WHOLE OF IT</span><strong id="world-total">${format(total(state))}</strong><div id="world-equation">${factors()}</div></div></aside></div></section>`;
}
function shopRow(kind: Upgrade, label: string, image: string): string {
  const w = state.worlds[current],
    level =
      kind === "helper" ? w.helpers : kind === "power" ? w.power : w.resonance;
  return `<button class="shop-row ${kind === "resonance" && w.score < 250 ? "unseen" : ""}" data-buy="${kind}" id="buy-${kind}" ${w.bank < price(w, kind) || (kind === "resonance" && w.score < 250) ? "disabled" : ""}>${sprite(image)}<span class="upgrade-name"><strong>${kind === "resonance" && w.score < 250 ? "???" : label}</strong><small id="${kind}-level">${kind === "helper" ? `${level} · +${format(w.power * 2 * multiplier(w))}/s` : kind === "power" ? `LV ${level} · +${format(w.power * 3 * multiplier(w))}` : `LV ${level} · ×${multiplier(w)}`}</small></span><span class="upgrade-cost"><span id="${kind}-price">${format(price(w, kind))}</span><small>+</small></span></button>`;
}
function helperSprites(): string {
  return `<div class="scene-helpers">${Array.from({ length: Math.min(5, state.worlds[current].helpers) }, (_, i) => sprite(helpers[current], "helper-sprite helper-" + i)).join("")}</div>`;
}
function activity(): string {
  const p = play(),
    now = Date.now(),
    i = current;
  let body = "";
  if (i === 0)
    body = `<div class="camp-mountains"></div><div class="camp-ground"></div><div class="fire-glow"></div><div class="fire-motes"><i></i><i></i><i></i></div><button class="sprite-target campfire ${p.heat >= 5 ? "roaring" : ""}" data-tap="0" aria-label="Feed the fire"><span class="fire-animation">${[0, 1, 2].map((n) => sprite(n ? "ember-" + n : "ember", "fire-frame f-" + n)).join("")}</span></button><span class="scene-detail fire-log log-left"></span><span class="scene-detail fire-log log-right"></span>`;
  if (i === 1)
    body = `<div class="garden-fence"></div><div class="garden-ground"></div><div class="carrot-plots">${p.plots
      .map((t, n) => {
        const ready = t <= now,
          golden =
            ready && p.harvested > 0 && p.harvested % 5 === 0 && n === p.ripe;
        return `<button class="plot ${ready ? "ripe" : "growing"} ${golden ? "golden" : ""}" data-tap="${n}" aria-label="${golden ? "Golden carrot" : ready ? "Harvest carrot" : "Sprout"}">${sprite("soil", "plot-soil")}${sprite(ready ? (golden ? "gold-carrot" : "carrot") : "sprout", "plot-plant")}<span class="plot-shadow"></span></button>`;
      })
      .join("")}</div>`;
  if (i === 2)
    body = `<div class="sun-hills hill-back"></div><div class="sun-hills hill-front"></div><div class="sun-cloud cloud-a"></div><div class="sun-cloud cloud-b"></div><div class="sun-window"><i></i><i></i></div><button class="sun-orbit" data-tap="0" aria-label="Catch a sunbeam"><span class="sky-sun">${sprite("sun")}</span></button><div class="sun-flowers">${sprite("flower-gold")}${sprite("flower-gold")}${sprite("flower-gold")}</div>`;
  if (i === 3)
    body = `<div class="moss-rain"></div><div class="moss-ground"></div><div class="plant-pot"><div class="pot-dirt"></div></div><button class="sprite-target growing-plant growth-${p.growth}" data-tap="0" aria-label="Water the plant">${sprite(p.growth >= 4 ? "flower" : p.growth >= 2 ? "leaf" : "sprout")}<span class="water-drop"></span></button><div class="moss-stones"></div>`;
  if (i === 4)
    body = `<div class="rain-hills"></div><div class="rain-lake"></div><div class="cloud-targets">${[0, 1, 2].map((n) => `<button class="sprite-target rain-cloud ${n === p.ripe ? "charged" : ""}" data-tap="${n}" aria-label="${n === p.ripe ? "Storm cloud" : "Cloud"}">${sprite(n === p.ripe ? "storm" : "cloud")}<span class="cloud-rain"></span></button>`).join("")}</div><div class="lakeside">${sprite("duck")}</div>`;
  if (i === 5)
    body = `<div class="pond-moon">${sprite("moon")}</div><div class="pond-water"></div><div class="pond-reflection"></div><svg class="constellation-lines" viewBox="0 0 500 280" preserveAspectRatio="none" aria-hidden="true"><path d="M65 80 160 125 252 60 355 110 430 45" fill="none" stroke="#aaa3d8" stroke-width="1" stroke-dasharray="3 5" opacity=".3"/></svg><div class="star-targets">${[0, 1, 2, 3, 4].map((n) => `<button class="sprite-target pond-star star-${n} ${n === p.ripe ? "bright" : ""}" data-tap="${n}" aria-label="${n === p.ripe ? "Bright star" : "Star"}">${sprite("star")}</button>`).join("")}</div><div class="pond-reeds"></div>`;
  if (i === 6) {
    const phase = echoPhase(p);
    body = `<div class="dream-orbit orbit-a"></div><div class="dream-orbit orbit-b"></div><div class="dream-stars"></div><div class="echo-crystal">${sprite("crystal")}</div><div class="dream-tiles">${["flower-red", "flower-gold", "flower-blue", "flower"].map((s, n) => `<button class="dream-tile ${phase === n ? "echoing" : ""} ${p.mistake > now ? "mistake" : ""}" data-tap="${n}" aria-label="Dream ${n + 1}" ${phase !== -1 ? "disabled" : ""}>${sprite(s)}<span>${n + 1}</span></button>`).join("")}</div>`;
  }
  if (i === 7)
    body = `<div class="void-rings"><i></i><i></i><i></i></div><div class="void-grid"></div><button class="sprite-target void-eye position-${p.position}" data-tap="0" aria-label="Touch the possibility">${sprite("eye")}<span>?</span></button>`;
  return (
    body +
    helperSprites() +
    `<div class="activity-vignette"></div><span class="activity-corner">${String(current + 1).padStart(2, "0")} : ∞</span>`
  );
}
function echoPhase(p: Play): number {
  const t = Date.now() - p.echoAt;
  if (t < 0) return -2;
  const step = Math.floor(t / 650);
  if (step >= p.echo.length) return -1;
  return t % 650 < 440 ? p.echo[step] : -2;
}
function pips(): string {
  const p = play();
  const max =
    current === 0 ? 5 : current === 5 ? 5 : current === 6 ? p.echo.length : 5;
  const filled =
    current === 0
      ? p.heat
      : current === 3
        ? p.growth
        : current === 5
          ? p.chain
          : current === 6
            ? p.input
            : 0;
  if (![0, 3, 5, 6].includes(current)) return "";
  return Array.from(
    { length: max },
    (_, i) => `<i class="${i < filled ? "filled" : ""}"></i>`,
  ).join("");
}
function activityStatus(): string {
  const p = play();
  return current === 0
    ? p.heat >= 5
      ? "ROARING"
      : "EMBER"
    : current === 1
      ? "THE PATCH"
      : current === 2
        ? "GOLDEN HOUR"
        : current === 3
          ? p.growth === 4
            ? "IN BLOOM"
            : "GROWING"
          : current === 4
            ? "CHANCE OF RAIN"
            : current === 5
              ? p.chain > 2
                ? "CONSTELLATION"
                : "STILL WATER"
              : current === 6
                ? echoPhase(p) === -1
                  ? "ECHO"
                  : "DREAMING"
                : "BETWEEN THINGS";
}
function activityKey(): string {
  const p = play();
  return (
    `${current}:${state.worlds[current].helpers}:` +
    (current === 0
      ? Math.min(5, p.heat)
      : current === 1
        ? p.plots.map((t) => Number(t <= Date.now())).join("") +
          ":" +
          p.harvested
        : current === 3
          ? p.growth
          : current === 4
            ? p.ripe
            : current === 5
              ? p.ripe
              : current === 6
                ? echoPhase(p) + ":" + Number(p.mistake > Date.now())
                : current === 7
                  ? p.position
                  : "static")
  );
}
function updateScene(force = false): void {
  if (view !== "world") return;
  const key = activityKey();
  if (!force && key === sceneKey) return;
  const container = document.querySelector<HTMLDivElement>("#playground");
  if (!container) return;
  const focus = (document.activeElement as HTMLElement)?.closest<HTMLElement>(
    "[data-tap]",
  )?.dataset.tap;
  container.innerHTML = activity();
  sceneKey = key;
  container
    .querySelectorAll<HTMLButtonElement>("[data-tap]")
    .forEach((b) => (b.onclick = (e) => tap(Number(b.dataset.tap), e)));
  if (focus !== undefined)
    container
      .querySelector<HTMLButtonElement>(`[data-tap="${focus}"]`)
      ?.focus({ preventScroll: true });
}
function tap(target: number, event: MouseEvent): void {
  if (view !== "world" || !available(current)) return;
  const i = current,
    p = play(),
    w = state.worlds[i],
    now = Date.now();
  let bonus = 1,
    word = "";
  if (i === 0) {
    p.heat = now - p.last < 950 ? Math.min(5, p.heat + 1) : 1;
    bonus = p.heat === 5 ? 3 : 1;
    if (bonus > 1) {
      word = "ROARING";
      earn("roaring");
    }
  }
  if (i === 1) {
    if (p.plots[target] > now) {
      bump(event);
      return;
    }
    const gold = p.harvested > 0 && p.harvested % 5 === 0 && target === p.ripe;
    bonus = gold ? 12 : 5;
    p.plots[target] = now + 3200 + target * 250;
    p.harvested++;
    if (gold) {
      word = "GOLDEN";
      earn("harvest");
    }
  }
  if (i === 2) {
    const phase =
      document
        .querySelector(".sky-sun")
        ?.getAnimations()[0]
        ?.effect?.getComputedTiming().progress ?? 0.5;
    bonus = Math.abs(phase - 0.5) < 0.12 ? 6 : 1;
    if (bonus > 1) {
      word = "PERFECT";
      earn("perfect");
    }
  }
  if (i === 3) {
    p.growth = (p.growth + 1) % 5;
    bonus = p.growth === 0 ? 10 : 1;
    if (bonus > 1) {
      word = "BLOOM";
      earn("bloom");
    }
  }
  if (i === 4) {
    bonus = target === p.ripe ? 5 : 1;
    if (bonus > 1) {
      word = "DOWNPOUR";
      p.chain++;
      if (p.chain >= 5) earn("storm");
    }
    p.ripe = (p.ripe + 1 + Math.floor(Math.random() * 2)) % 3;
  }
  if (i === 5) {
    if (target === p.ripe) {
      p.chain++;
      bonus = Math.min(7, p.chain + 1);
      p.ripe = (p.ripe + 1 + Math.floor(Math.random() * 4)) % 5;
      if (p.chain >= 5) {
        word = "CONSTELLATION";
        earn("constellation");
      }
    } else {
      p.chain = 0;
      bonus = 1;
    }
  }
  if (i === 6) {
    if (echoPhase(p) !== -1) return;
    if (target === p.echo[p.input]) {
      p.input++;
      bonus = 2;
      if (p.input === p.echo.length) {
        bonus = p.echo.length * 8;
        word = "REMEMBERED";
        earn("echo");
        const length = Math.min(5, p.echo.length + 1);
        p.echo = Array.from({ length }, () => Math.floor(Math.random() * 4));
        p.input = 0;
        p.echoAt = now + 950;
      }
    } else {
      bonus = 1;
      p.input = 0;
      p.mistake = now + 400;
      p.echoAt = now + 800;
      word = "…";
    }
  }
  if (i === 7) {
    bonus = 1 + Math.floor(Math.random() * 12);
    p.position = (p.position + 1 + Math.floor(Math.random() * 3)) % 5;
    if (bonus >= 10) word = "IMPOSSIBLE";
  }
  const gain = w.power * 3 * multiplier(w) * bonus;
  w.score += gain;
  w.bank += gain;
  state.clicks++;
  p.last = now;
  floating(event, `+${format(gain)}`, word);
  chime(i === 6 ? target : bonus > 1 ? 3 : 0, bonus === 1);
  const unlocked = unlock(state);
  if (unlocked.length) {
    toast(
      unlocked[unlocked.length - 1],
      "WORLD AWAKENED",
      WORLDS[state.unlocked - 1].kind,
    );
    save();
  }
  checkDiscoveries();
  updateScene();
  update();
  const stage = document.querySelector("#playground");
  stage?.classList.remove("reward-flash");
  void (stage as HTMLElement)?.offsetWidth;
  stage?.classList.add("reward-flash");
}
function floating(event: MouseEvent, value: string, word = ""): void {
  const b = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX || b.x + b.width / 2,
    y = event.clientY || b.y + b.height / 2;
  const el = document.createElement("span");
  el.className = "floating-gain";
  el.style.left = `${Math.min(innerWidth - 75, Math.max(65, x))}px`;
  el.style.top = `${Math.max(75, y - 28)}px`;
  el.innerHTML = `${word ? `<small>${word}</small>` : ""}<strong>${value}</strong>`;
  document.querySelector("#particles")!.append(el);
  window.setTimeout(() => el.remove(), 1000);
}
function bump(event: MouseEvent): void {
  const el = event.currentTarget as HTMLElement;
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
  chime(0, true);
}
function relicScreen(): string {
  return `<section class="relic-page"><div class="screen-heading"><div><div class="eyebrow"><span class="tiny-diamond"></span> FOUND ALONG THE WAY</div><h1>Odd little things.</h1></div><div class="chapter-mark"><span>RELICS</span><strong>${String(state.relics.length).padStart(2, "0")}<small> / ${RELICS.length}</small></strong></div></div><div class="relic-cabinet"><div class="cabinet-top"><span>THE COLLECTION</span><i></i><span>PRIVATE · ${new Date().getFullYear()}</span></div><div class="relic-grid">${RELICS.map(
    (r, i) => {
      const owned = state.relics.includes(r.id);
      return `<button class="relic-card ${owned ? "owned" : "unknown"}" data-relic="${r.id}" aria-label="${owned ? r.name : "Undiscovered relic " + (i + 1)}"><span class="relic-number">${String(i + 1).padStart(2, "0")}</span><div class="relic-plinth">${sprite(r.sprite)}<i></i></div><h2>${owned ? r.name : "???"}</h2><span class="relic-seal">${owned ? uiIcon("check") : "· · ·"}</span></button>`;
    },
  ).join("")}</div></div></section>`;
}
function updateRelicBadge(): void {
  document
    .querySelectorAll<HTMLElement>(".relic-dot")
    .forEach((el) => (el.hidden = false));
}
function bindView(): void {
  document
    .querySelectorAll<HTMLButtonElement>("#screen [data-world]")
    .forEach((b) => (b.onclick = (e) => openWorld(Number(b.dataset.world), e)));
  document
    .querySelectorAll<HTMLButtonElement>("#screen [data-route]")
    .forEach((b) => (b.onclick = () => navigate(b.dataset.route!)));
  document
    .querySelector<HTMLButtonElement>("#total-score")
    ?.addEventListener("click", () => {
      showExact = !showExact;
      update();
    });
  document
    .querySelectorAll<HTMLButtonElement>("[data-torch]")
    .forEach(
      (b) => (b.onclick = () => toggleTorch(Number(b.dataset.torch), b)),
    );
  document
    .querySelector<HTMLButtonElement>("#open-gate")
    ?.addEventListener("click", (e) => {
      if (total(state) >= GOAL) ending();
      else {
        bump(e);
        const stage = document.querySelector("#gate-stage");
        stage?.classList.remove("gate-knock");
        void (stage as HTMLElement)?.offsetWidth;
        stage?.classList.add("gate-knock");
      }
    });
  document
    .querySelector<HTMLButtonElement>("#secret-sigil")
    ?.addEventListener("click", (e) => {
      if (state.secret) {
        openWorld(7);
        return;
      }
      if (
        !lit[0] &&
        !lit[1] &&
        state.unlocked === 7 &&
        total(state) >= WORLDS[7].unlock
      ) {
        state.secret = true;
        earn("secret");
        save();
        renderView();
        toast(WORLDS[7].name, "WORLD AWAKENED", "eye");
      } else bump(e);
    });
  document.querySelectorAll<HTMLButtonElement>("[data-buy]").forEach(
    (b) =>
      (b.onclick = () => {
        const kind = b.dataset.buy as Upgrade;
        if (purchase(state, current, kind)) {
          chime(2);
          checkDiscoveries();
          save();
          updateScene(true);
          update();
        }
      }),
  );
  document.querySelectorAll<HTMLButtonElement>("[data-relic]").forEach(
    (b) =>
      (b.onclick = (e) => {
        const r = RELICS.find((x) => x.id === b.dataset.relic)!;
        if (!state.relics.includes(r.id)) {
          bump(e);
          return;
        }
        modal(
          `<div class="relic-reveal">${sprite(r.sprite)}<span class="eyebrow">RELIC ${String(RELICS.indexOf(r) + 1).padStart(2, "0")}</span><h2 id="modal-title">${r.name}</h2><span class="relic-reveal-mark">${uiIcon("check")} FOUND</span></div>`,
        );
      }),
  );
  if (view === "relics")
    document
      .querySelectorAll<HTMLElement>(".relic-dot")
      .forEach((e) => (e.hidden = true));
  updateScene();
  updateGateDarkness();
}
function toggleTorch(i: number, button: HTMLButtonElement): void {
  lit[i] = !lit[i];
  button.classList.toggle("burning", lit[i]);
  button.classList.toggle("extinguished", !lit[i]);
  button.setAttribute(
    "aria-label",
    `${lit[i] ? "Extinguish" : "Light"} ${i ? "right" : "left"} torch`,
  );
  button.setAttribute("aria-pressed", String(lit[i]));
  updateGateDarkness();
  chime(lit[i] ? 1 : 0, true);
}
function updateGateDarkness(): void {
  const stage = document.querySelector<HTMLElement>("#gate-stage");
  if (!stage) return;
  stage.dataset.fires = String(lit.filter(Boolean).length);
  document
    .querySelector("#secret-sigil")
    ?.classList.toggle("revealed", !lit[0] && !lit[1]);
  const ambience = document.querySelector(".scene-ambience");
  if (ambience)
    ambience.innerHTML = `<i></i> ${lit.some(Boolean) ? "THE FIRE STILL BURNS" : "ONLY THE DARK REMAINS"}`;
}
function openWorld(i: number, e?: MouseEvent): void {
  if (available(i)) {
    navigate("world/" + i);
    return;
  }
  if (e) bump(e);
}
function update(): void {
  const n = total(state);
  const text = (id: string, value: string) => {
    const e = document.getElementById(id);
    if (e && e.textContent !== value) e.textContent = value;
  };
  text("total-score", showExact ? n.toLocaleString("en-US") : format(n));
  const exact = document.querySelector("#total-score");
  if (exact) exact.classList.toggle("exact", showExact);
  const fill = document.querySelector<HTMLElement>("#gate-progress");
  if (fill) fill.style.width = progress() + "%";
  const prog = document.querySelector("#gate-progress-text");
  if (prog) prog.innerHTML = progress().toFixed(1) + "<small> / 100</small>";
  const factorsBox = document.querySelector("#score-factors");
  if (factorsBox) {
    const html = factors();
    if (factorsBox.innerHTML !== html) {
      factorsBox.innerHTML = html;
      factorsBox
        .querySelectorAll<HTMLButtonElement>("[data-world]")
        .forEach((b) => (b.onclick = () => openWorld(Number(b.dataset.world))));
    }
  }
  document.querySelector("#open-gate")?.classList.toggle("ready", n >= GOAL);
  document.querySelectorAll<HTMLElement>("[data-world-score]").forEach((el) => {
    const i = Number(el.dataset.worldScore);
    el.innerHTML = `${format(state.worlds[i].score)} <small>${WORLDS[i].noun}</small>`;
  });
  document.querySelectorAll<HTMLElement>("[data-mini]").forEach((el) => {
    const i = Number(el.dataset.mini);
    el.textContent = available(i)
      ? format(state.worlds[i].score)
      : format(WORLDS[i].unlock);
  });
  if (view === "world") {
    const w = state.worlds[current];
    text("world-score", format(w.score));
    text("world-bank", format(w.bank));
    text("world-rate", format(rate(w)) + "/s");
    text("world-total", format(n));
    text("world-multiplier", "×" + multiplier(w));
    text("activity-status", activityStatus());
    const pipbox = document.querySelector("#activity-pips");
    if (pipbox) pipbox.innerHTML = pips();
    for (const kind of ["helper", "power", "resonance"] as Upgrade[]) {
      text(kind + "-price", format(price(w, kind)));
      const button = document.querySelector<HTMLButtonElement>("#buy-" + kind);
      if (button) {
        button.disabled =
          w.bank < price(w, kind) || (kind === "resonance" && w.score < 250);
        if (
          kind === "resonance" &&
          w.score >= 250 &&
          button.classList.contains("unseen")
        ) {
          button.classList.remove("unseen");
          button.querySelector("strong")!.textContent = "Resonance";
        }
      }
      text(
        kind + "-level",
        kind === "helper"
          ? `${w.helpers} · +${format(w.power * 2 * multiplier(w))}/s`
          : kind === "power"
            ? `LV ${w.power} · +${format(w.power * 3 * multiplier(w))}`
            : `LV ${w.resonance} · ×${multiplier(w)}`,
      );
    }
    const equation = document.querySelector<HTMLElement>("#world-equation");
    const equationKey = state.worlds
      .slice(0, state.secret ? 8 : state.unlocked)
      .map((w) => format(w.score))
      .join(":");
    if (equation && equation.dataset.key !== equationKey) {
      equation.dataset.key = equationKey;
      equation.innerHTML = factors();
      equation
        .querySelectorAll<HTMLButtonElement>("[data-world]")
        .forEach((b) => (b.onclick = () => openWorld(Number(b.dataset.world))));
    }
    document.querySelectorAll<HTMLElement>("[data-milestone]").forEach((el) => {
      if (
        w.score >= Number(el.dataset.milestone) &&
        !el.classList.contains("achieved")
      ) {
        el.classList.add("achieved");
        el.querySelector("img")!.src =
          import.meta.env.BASE_URL + "sprites/coin.png";
      }
    });
    document
      .querySelectorAll<HTMLButtonElement>(".world-tabs [data-world]")
      .forEach((b) =>
        b.classList.toggle("locked", !available(Number(b.dataset.world))),
      );
  }
}
function modal(html: string): HTMLDialogElement {
  const d = document.querySelector<HTMLDialogElement>("#modal")!;
  if (d.open) d.close();
  d.innerHTML =
    `<button class="close-dialog icon-button" aria-label="Close">${uiIcon("close")}</button>` +
    html;
  d.querySelector<HTMLButtonElement>(".close-dialog")!.onclick = () =>
    d.close();
  d.showModal();
  return d;
}
function showSettings(): void {
  const d = modal(
    `<div class="eyebrow">PREFERENCES</div><h2 id="modal-title">Make yourself at home.</h2><div class="setting-list"><button class="setting-row" id="setting-sound">${uiIcon("sound")}<span>Sound</span><span class="toggle ${state.sound ? "on" : ""}" aria-hidden="true"></span></button><button class="setting-row" id="setting-motion">${uiIcon("star")}<span>Motion</span><span class="toggle ${state.motion ? "on" : ""}" aria-hidden="true"></span></button><button class="setting-row" id="fullscreen">${uiIcon("full")}<span>Full screen</span>${uiIcon("arrow")}</button>${deferredInstall ? `<button class="setting-row" id="install-app">${uiIcon("download")}<span>Install game</span>${uiIcon("arrow")}</button>` : ""}</div><div class="settings-divider"></div><div class="save-actions"><button class="secondary-button" id="export-save">${uiIcon("download")}Export save</button><button class="secondary-button" id="import-save">${uiIcon("upload")}Import save</button><input id="save-file" type="file" accept="application/json,.json" hidden/></div><button class="reset-button" id="reset-save">Start over</button><div class="settings-version">MILLION BILLION TRILLION <span>v0.2</span></div>`,
  );
  const wireToggle = (id: string, key: "sound" | "motion") => {
    const b = d.querySelector<HTMLButtonElement>(id)!;
    b.setAttribute("role", "switch");
    b.setAttribute("aria-checked", String(state[key]));
    b.onclick = () => {
      state[key] = !state[key];
      b.setAttribute("aria-checked", String(state[key]));
      b.querySelector(".toggle")!.classList.toggle("on", state[key]);
      syncPreferences();
      save();
      if (key === "sound") chime(2);
    };
  };
  wireToggle("#setting-sound", "sound");
  wireToggle("#setting-motion", "motion");
  d.querySelector<HTMLButtonElement>("#fullscreen")!.onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast("Full screen unavailable");
    }
  };
  d.querySelector<HTMLButtonElement>("#install-app")?.addEventListener(
    "click",
    () => {
      void deferredInstall?.prompt();
    },
  );
  d.querySelector<HTMLButtonElement>("#export-save")!.onclick = () => {
    save();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "million-billion-trillion-save.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  d.querySelector<HTMLButtonElement>("#import-save")!.onclick = () =>
    d.querySelector<HTMLInputElement>("#save-file")!.click();
  d.querySelector<HTMLInputElement>("#save-file")!.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      if (file.size > 1000000) throw Error();
      const value = await file.text(),
        parsed = JSON.parse(value);
      if (
        !parsed ||
        !Array.isArray(parsed.worlds) ||
        parsed.worlds.length !== 8 ||
        !parsed.worlds.every(
          (w: { score: unknown }) =>
            w &&
            typeof w.score === "number" &&
            Number.isFinite(w.score) &&
            w.score >= 1,
        )
      )
        throw Error();
      state = loadState(value);
      advance(state, Math.max(0, (Date.now() - state.saved) / 1000));
      plays.fill(undefined);
      save();
      syncPreferences();
      d.close();
      readRoute();
      toast("Welcome back", "SAVE RESTORED", "key");
    } catch {
      toast("That save could not be read", "IMPORT FAILED", "lock");
    }
  };
  d.querySelector<HTMLButtonElement>("#reset-save")!.onclick = () => {
    const confirmation = modal(
      `<div class="eyebrow">A NEW BEGINNING</div><h2 id="modal-title">Leave it all behind?</h2><p class="reset-warning">Scores, gems, and relics will be erased.</p><div class="reset-actions"><button class="primary-button" id="keep-save">Stay here</button><button class="danger-button" id="erase-save">Erase & begin</button></div>`,
    );
    confirmation.querySelector<HTMLButtonElement>("#keep-save")!.onclick = () =>
      confirmation.close();
    confirmation.querySelector<HTMLButtonElement>("#erase-save")!.onclick =
      () => {
        state = freshState();
        plays.fill(undefined);
        lit = [true, true];
        seen.clear();
        seen.add(0);
        save();
        syncPreferences();
        confirmation.close();
        if (location.hash === "#gate") readRoute();
        else navigate("gate");
      };
  };
}
function ending(): void {
  state.won = true;
  earn("answer");
  save();
  const d = modal(
    `<div class="ending-scene">${sprite("key")}<div class="eyebrow">THE OTHER SIDE</div><h2 id="modal-title">The answer is</h2><div class="answer">42<span>.</span></div><span class="ending-whisper">You were here all along.</span><button class="primary-button" id="keep-playing">Stay a little longer ${uiIcon("arrow")}</button></div>`,
  );
  d.querySelector<HTMLButtonElement>("#keep-playing")!.onclick = () =>
    d.close();
  d.addEventListener(
    "close",
    () => {
      if (view === "gate") renderView();
    },
    { once: true },
  );
  chime(4);
}
shell();
readRoute();
window.addEventListener("hashchange", readRoute);
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredInstall = e as typeof deferredInstall;
});
window.addEventListener("appinstalled", () => {
  deferredInstall = null;
});
if (elapsed > 60 && total(state) > oldTotal)
  setTimeout(
    () =>
      toast(
        "+" + format(total(state) - oldTotal),
        "WHILE YOU WERE AWAY",
        "moth",
      ),
    900,
  );
// Older saves receive the discoveries they already earned, without a notification parade.
discoveries(state);
save();
setInterval(() => {
  const now = Date.now(),
    oldUnlocked = state.unlocked;
  advance(state, (now - lastTick) / 1000);
  lastTick = now;
  if (state.unlocked !== oldUnlocked) {
    if (view !== "world") renderView();
    toast(
      WORLDS[state.unlocked - 1].name,
      "WORLD AWAKENED",
      WORLDS[state.unlocked - 1].kind,
    );
    save();
  }
  const p = plays[0];
  if (p && p.heat > 0 && now - p.last > 1100) p.heat = 0;
  updateScene();
  update();
  checkDiscoveries();
  if (now - saveTime > 5000) save();
}, 150);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) save();
});
window.addEventListener("pagehide", save);
if (import.meta.env.PROD && "serviceWorker" in navigator)
  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register(import.meta.env.BASE_URL + "sw.js")
      .catch(() => {});
  });
