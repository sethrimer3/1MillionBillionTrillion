import "@fontsource/pixelify-sans/latin-400.css";
import "@fontsource/pixelify-sans/latin-500.css";
import "@fontsource/pixelify-sans/latin-600.css";
import "@fontsource/pixelify-sans/latin-700.css";
import "./style.css";
import "./prestige.css";
import {
  gateGoal,
  gateWords,
  worldAvailable,
  PRESTIGE_UPGRADES,
  hasUpgrade,
  productionBoost,
  idleBoost,
  cycleSpeed,
  tapReward,
  buyPrestigeUpgrade,
  prestigeReward,
  canPrestige,
  prestige,
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
import { sprite, uiIcon, gem, stoneSlot, scenery, torch } from "./art";
import { mountRpg, type RpgController } from "./rpg-view";
import { mountArena, type ArenaController } from "./arena-view";
import { mountCosmos, type CosmosController } from "./cosmos-view";
import "./ui-art.css";
import "./pixel.css";
import "./scene.css";

type View = "gate" | "worlds" | "world" | "relics" | "prestige";
type Play = {
  heat: number;
  last: number;
  ripe: number;
  plots: number[];
  chain: number;
  harvested: number;
  echo: number[];
  echoAt: number;
  input: number;
  mistake: number;
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
let rpgController: RpgController | undefined;
let arenaController: ArenaController | undefined;
let cosmosController: CosmosController | undefined;
let showExact = false;
let lit = [true, true];
let sceneKey = "";
let saveTime = Date.now();
let lastTick = Date.now();
let toastTimer = 0;
let audio: AudioContext | undefined;
let deferredInstall: (Event & { prompt: () => Promise<void> }) | null = null;
const plays: (Play | undefined)[] = [];
const helpers = [
  "gnome",
  "gnome",
  "gnome",
  "arena-ship-0",
  "duck",
  "cosmos-net",
  "moth",
  "rpg-iridescent",
  "rpg-void",
];
const upgradeNames = [
  "Kindling",
  "Garden gloves",
  "Renown charm",
  "Impact",
  "Rain dance",
  "Silk net",
  "Dream thread",
  "Cut of light",
  "Event horizon",
];
const app = document.querySelector<HTMLDivElement>("#app")!;

function play(i = current): Play {
  if (!plays[i])
    plays[i] = {
      heat: 0,
      last: 0,
      ripe: Math.floor(Math.random() * 3),
      plots: [0, Date.now() + 1600, Date.now() + 2800, 0, Date.now() + 2200, 0],
      chain: 0,
      harvested: 0,
      echo: [0, 2],
      echoAt: Date.now() + 400,
      input: 0,
      mistake: 0,
    };
  return plays[i]!;
}
function available(i: number): boolean {
  return worldAvailable(state, i);
}
function count(): number {
  return WORLDS.filter((_, i) => available(i)).length;
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
  app.innerHTML = `<div class="app-shell"><nav class="scene-navigation" aria-label="Main navigation">${navItems("scene")}<button class="nav-item" id="settings" aria-label="Settings" title="Settings">${uiIcon("settings")}</button></nav><main id="screen" tabindex="-1"></main></div><div class="toast" id="toast" role="status" aria-live="polite"></div><dialog id="modal" aria-labelledby="modal-title"></dialog><div class="particles" id="particles" aria-hidden="true"></div>`;
  document
    .querySelectorAll<HTMLElement>("[data-nav]")
    .forEach((b) => (b.onclick = () => navigate(b.dataset.nav!)));
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
      ["prestige", "Prestige"],
    ] as const
  )
    .map(
      ([name, label]) =>
        `<button class="nav-item" aria-label="${label}" title="${label}" data-nav="${name}" id="${prefix}-${name}">${uiIcon(name)}<span>${label}</span>${name === "relics" ? '<i class="relic-dot" hidden></i>' : ""}</button>`,
    )
    .join("");
}
function syncPreferences(): void {
  document.documentElement.dataset.motion = state.motion ? "on" : "off";
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
    play();
  } else
    view =
      route[0] === "prestige"
        ? "prestige"
        : route[0] === "relics"
          ? "relics"
          : route[0] === "worlds" || route[0] === "world"
            ? "worlds"
            : "gate";
  renderView();
}
function renderView(): void {
  arenaController?.destroy();
  arenaController = undefined;
  cosmosController = undefined;
  document.querySelector<HTMLDialogElement>("#modal")?.close();
  document.documentElement.dataset.view = view;
  document.documentElement.dataset.world =
    view === "world" ? String(current) : "";
  document.querySelectorAll<HTMLElement>("[data-nav]").forEach((b) => {
    const selected = b.dataset.nav === (view === "world" ? "worlds" : view);
    b.classList.toggle("selected", selected);
    if (selected) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  rpgController = undefined;
  const screen = document.querySelector<HTMLElement>("#screen")!;
  screen.innerHTML =
    view === "gate"
      ? gateScreen()
      : view === "worlds"
        ? worldsScreen()
        : view === "world"
          ? worldScreen()
          : view === "prestige"
            ? prestigeScreen()
            : relicScreen();
  sceneKey = "";
  bindView();
  update();
  screen.scrollTop = 0;
}
function gateScreen(): string {
  return `<section class="gate-page"><div class="gate-stage ${state.won ? "is-open" : ""}" id="gate-stage"><div class="sky-grain"></div><div class="sky-moon"></div><div class="starfield">${Array.from({ length: 24 }, (_, i) => `<i style="--x:${(i * 37 + 9) % 98}%;--y:${(i * 13 + 3) % 55}%;--delay:${i * 0.23}s"></i>`).join("")}</div>${scenery()}<div class="gate-score"><span class="eyebrow">${state.won ? "THE IMPOSSIBLE, MADE POSSIBLE" : "EVERYTHING, MULTIPLIED"}</span><button class="total-number" id="total-score" aria-label="Show exact total score">${showExact ? total(state).toLocaleString("en-US") : format(total(state))}</button><div class="score-factors" id="score-factors">${factors()}</div></div><div class="door-aura"></div>${torch(0, lit[0])}${torch(1, lit[1])}<div class="door-container" id="gate-image"><div class="door-light"></div><button class="door-button ${total(state) >= gateGoal(state) ? "ready" : ""}" id="open-gate" title="${gateWords(state).join(" ")}" aria-label="${total(state) >= gateGoal(state) ? "Open the gate" : "The sealed gate"}"><span class="door-portal"></span>${sprite("gate-left", "door-leaf leaf-left")}${sprite("gate-right", "door-leaf leaf-right")}${sprite("gate-frame", "gate-sprite")}<span class="door-inscription">${doorInscription()}</span><span class="door-seam"></span></button><div class="gate-sockets">${WORLDS.slice(
    0,
    7,
  )
    .map(
      (w, i) =>
        `<button class="gate-socket socket-${i}" data-world="${i}" aria-label="${available(i) ? w.name : "Unfilled " + w.name + " gem"}">${stoneSlot(i, available(i))}</button>`,
    )
    .join(
      "",
    )}</div></div><button class="hidden-sigil ${!lit[0] && !lit[1] ? "revealed" : ""} ${state.secret ? "found" : ""}" id="secret-sigil" aria-label="Strange marking">${sprite(available(8) ? "rpg-void" : state.secret ? "rpg-iridescent" : "rune")}</button><div class="gate-fog fog-one"></div><div class="gate-fog fog-two"></div><div class="threshold-label">${state.won ? "THE WAY IS OPEN" : total(state) >= gateGoal(state) ? "THE SEAL IS BROKEN" : gateWords(state).join(" · ")}</div><div class="stage-corners"><i></i><i></i><i></i><i></i></div><span class="scene-coordinate">I · XXVII</span><span class="scene-ambience"><i></i> ${lit.some(Boolean) ? "THE FIRE STILL BURNS" : "ONLY THE DARK REMAINS"}</span></div></section>`;
}
function worldGem(i: number, lit = true): string {
  return i < 7
    ? gem(i, lit)
    : sprite(
        WORLDS[i].kind,
        "factor-crystal" + (lit ? "" : " dormant-crystal"),
      );
}
function factors(): string {
  return state.worlds
    .map((w, i) =>
      available(i)
        ? `<button data-world="${i}" style="--world:${WORLDS[i].color}" aria-label="${WORLDS[i].name}: ${format(w.score)}">${worldGem(i)}<span>${format(w.score)}</span></button>`
        : "",
    )
    .filter(Boolean)
    .join("<b>×</b>");
}
function doorInscription(): string {
  const n = state.prestige.count;
  const lines = [
    n >= 3
      ? "42 Hundred"
      : n >= 2
        ? "1 Hundred"
        : n >= 1
          ? "1 Thousand"
          : "1 Million",
    ...(n >= 2 ? ["Thousand"] : []),
    ...(n >= 1 ? ["Million"] : []),
    "Billion",
    "Trillion",
    ...(n >= 4 ? ["Quadrillion"] : []),
    ...(n >= 5 ? ["Quintillion"] : []),
    ...(n > 5 ? [`× 1e${(n - 5) * 3}`] : []),
  ];
  return lines.map((w) => `<span>${w}</span>`).join("");
}
function prestigeScreen(): string {
  const p = state.prestige;
  const node = (n: (typeof PRESTIGE_UPGRADES)[number]) => {
    const owned = hasUpgrade(state, n.id);
    const ready =
      !owned &&
      n.cost > 0 &&
      p.count >= n.at &&
      hasUpgrade(state, n.needs) &&
      p.shards >= n.cost;
    const parent = PRESTIGE_UPGRADES.find((x) => x.id === n.needs);
    const status = owned
      ? n.cost
        ? "REMEMBERED"
        : "AWAKENED"
      : p.count < n.at
        ? `PRESTIGE ${n.at}`
        : !hasUpgrade(state, n.needs)
          ? `NEEDS ${parent?.name.toUpperCase()}`
          : `${n.cost} SHARDS`;
    return `<button class="tree-node ${owned ? "owned" : ready ? "purchasable" : "dormant"} ${n.cost === 0 ? "awakening" : ""}" data-prestige-buy="${n.id}" ${ready ? "" : "disabled"} aria-label="${n.name}: ${n.effect}. ${status}"><span class="node-art">${sprite(n.sprite)}</span><span class="node-copy"><small>${status}</small><strong>${n.name}</strong><span>${n.effect}</span>${parent ? `<em>From ${parent.name}</em>` : ""}</span><span class="node-price">${owned ? uiIcon("check") : n.cost ? n.cost + uiIcon("star") : uiIcon("lock")}</span></button>`;
  };
  return `<section class="prestige-page"><div class="screen-heading"><h1>Prestige</h1><span class="view-count">${p.count}</span></div><div class="rebirth-panel">${sprite("rpg-rebirth", "rebirth-art")}<div class="rebirth-copy"><span class="eyebrow">RUN ${String(p.count + 1).padStart(2, "0")}</span><h2>${gateWords(state).join(" ")}</h2><div class="rebirth-stats"><span>${uiIcon("bolt")} ×${format(productionBoost(state, 0))} rainbow</span><span>${uiIcon("clock")} ×${format(idleBoost(state))} idle</span></div></div><button class="primary-button" id="prestige-now" ${canPrestige(state) ? "" : "disabled"}>Prestige</button></div><div class="tree-heading"><h2>Upgrades</h2><span class="shard-balance">${sprite("rpg-shard-1")}<b id="prestige-shards">${p.shards}</b> shards</span></div><div class="tree-root">${node(PRESTIGE_UPGRADES[0])}</div><div class="prestige-tree">${(
    [
      ["spark", "THE SPARK"],
      ["time", "THE MOMENT"],
      ["roots", "THE DEPTHS"],
    ] as const
  )
    .map(
      ([branch, title]) =>
        `<div class="tree-branch branch-${branch}"><h3>${title}</h3>${PRESTIGE_UPGRADES.filter(
          (n) => n.branch === branch || (branch === "roots" && n.id === "void"),
        )
          .map(node)
          .join("")}</div>`,
    )
    .join(
      "",
    )}</div><div class="next-threshold"><span class="eyebrow">THE NEXT THRESHOLD</span><span>${gateWords({ ...state, prestige: { ...p, count: p.count + 1 } }).join(" ")}</span></div></section>`;
}
function confirmPrestige(): void {
  if (!canPrestige(state)) return;
  const reward = prestigeReward(state);
  const d = modal(
    `<div class="prestige-confirm">${sprite("rpg-rebirth")}<span class="eyebrow">PRESTIGE ${state.prestige.count + 1}</span><h2 id="modal-title">Cross again?</h2><div class="prestige-payout">+${reward} <small>shards</small></div><p>World scores, pocket upgrades &amp; kingdom restart.<br>The tree, relics &amp; settings remain.</p><div class="awakening-preview">${sprite(state.prestige.count === 2 ? "rpg-void" : "rpg-iridescent")}<span>${state.prestige.count === 0 ? "Iridescent crystal awakens" : state.prestige.count === 2 ? "Void crystal awakens" : "A stronger beginning"}</span></div><button class="primary-button" id="confirm-prestige">Cross again ${uiIcon("prestige")}</button></div>`,
  );
  d.querySelector<HTMLButtonElement>("#confirm-prestige")!.onclick = () => {
    if (!prestige(state)) return;
    plays.fill(undefined);
    lit = [true, true];
    save();
    d.close();
    chime(4);
    if (view === "prestige") renderView();
    else navigate("prestige");
    toast(
      state.prestige.count === 3 ? "The quiet void" : "A new beginning",
      `PRESTIGE ${state.prestige.count}`,
      state.prestige.count === 3 ? "rpg-void" : "rpg-iridescent",
    );
  };
}
function worldsScreen(): string {
  return `<section class="worlds-page"><div class="screen-heading"><h1>Worlds</h1><span class="view-count">${count()} / ${WORLDS.length}</span></div><div class="world-grid">${WORLDS.map(
    (w, i) => {
      const open = available(i),
        secret = i >= 7 && !open;
      return `<button class="world-card world-card-${i} ${open ? "available" : "locked"}" data-world="${i}" style="--world:${w.color}" aria-label="${open ? "Play " + w.name : secret ? "Undiscovered world" : w.name + " locked at " + format(w.unlock)}"><div class="card-biome">${sprite(w.kind, "card-sprite")}</div><div class="world-card-info"><h2>${secret ? "???" : w.name}</h2><div class="world-card-bottom">${open ? `<span data-world-score="${i}">${format(state.worlds[i].score)} <small>${w.noun}</small></span><span class="card-enter">${uiIcon("arrow")}</span>` : `<span>${uiIcon("lock")}${secret ? (i === 7 ? "PRESTIGE I" : "PRESTIGE III") : format(w.unlock)}</span>`}</div></div></button>`;
    },
  ).join("")}</div></section>`;
}
function worldScreen(): string {
  const w = WORLDS[current];
  const header = `<section class="world-page" style="--world:${w.color}" data-world-page="${current}"><div class="screen-heading world-heading"><h1><span class="world-title-gem">${worldGem(current)}</span>${w.name}</h1><div class="chapter-mark"><span>${w.noun}</span><strong id="world-score">${format(state.worlds[current].score)}</strong></div></div>`;
  return (
    header +
    (current === 2
      ? `<div id="rpg-host"></div>`
      : current === 3
        ? `<div id="arena-host"></div>`
        : current === 5
          ? `<div id="cosmos-host"></div>`
          : `<div class="world-detail-grid"><div class="activity-column"><div class="activity-stage activity-${current}" id="playground" aria-label="${w.name} game"></div><div class="activity-status"><span id="activity-status">${activityStatus()}</span><div class="activity-pips" id="activity-pips">${pips()}</div><span class="world-multiplier" id="world-multiplier">×${format(multiplier(state.worlds[current]) * productionBoost(state, current))}</span></div></div>${worldShop()}</div>`) +
    "</section>"
  );
}
function worldShop(): string {
  const w = WORLDS[current];
  return `<aside class="world-shop"><div class="pocket-bar">${uiIcon("bag")}<span>Pocket</span><strong id="world-bank">${format(state.worlds[current].bank)}</strong></div><div class="shop-heading"><h2>Upgrades</h2><span id="world-rate">${format(rate(state.worlds[current], state))}/s</span></div>${shopRow("helper", w.auto, helpers[current])}${shopRow("power", upgradeNames[current], "glove")}${shopRow("resonance", "Resonance", "rune")}</aside>`;
}
function shopRow(kind: Upgrade, label: string, image: string): string {
  const w = state.worlds[current],
    level =
      kind === "helper" ? w.helpers : kind === "power" ? w.power : w.resonance;
  return `<button class="shop-row ${kind === "resonance" && w.score < 250 ? "unseen" : ""}" data-buy="${kind}" id="buy-${kind}" ${w.bank < price(w, kind, state) || (kind === "resonance" && w.score < 250) ? "disabled" : ""}>${sprite(image)}<span class="upgrade-name"><strong>${kind === "resonance" && w.score < 250 ? "???" : label}</strong><small id="${kind}-level">${kind === "helper" ? `${level} · +${format(w.power * 2 * multiplier(w) * productionBoost(state, current) * idleBoost(state))}/s` : kind === "power" ? `LV ${level} · +${format(w.power * 3 * multiplier(w) * productionBoost(state, current))}` : `LV ${level} · ×${format(multiplier(w) * productionBoost(state, current))}`}</small></span><span class="upgrade-cost"><span id="${kind}-price">${format(price(w, kind, state))}</span><small>${uiIcon("plus")}</small></span></button>`;
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
  if (i === 4)
    body = `<div class="rain-hills"></div><div class="rain-lake"></div><div class="cloud-targets">${[0, 1, 2].map((n) => `<button class="sprite-target rain-cloud ${n === p.ripe ? "charged" : ""}" data-tap="${n}" aria-label="${n === p.ripe ? "Storm cloud" : "Cloud"}">${sprite(n === p.ripe ? "storm" : "cloud")}<span class="cloud-rain"></span></button>`).join("")}</div><div class="lakeside">${sprite("duck")}</div>`;
  if (i === 6) {
    const phase = echoPhase(p);
    body = `<div class="dream-orbit orbit-a"></div><div class="dream-orbit orbit-b"></div><div class="dream-stars"></div><div class="echo-crystal">${sprite("crystal")}</div><div class="dream-tiles">${["flower-red", "flower-gold", "flower-blue", "flower"].map((s, n) => `<button class="dream-tile ${phase === n ? "echoing" : ""} ${p.mistake > now ? "mistake" : ""}" data-tap="${n}" aria-label="Dream ${n + 1}" ${phase !== -1 ? "disabled" : ""}>${sprite(s)}<span>${n + 1}</span></button>`).join("")}</div>`;
  }
  if (i === 7) {
    body = `<div class="crystal-cave"></div><div class="crystal-rays phase-${p.ripe % 3}"></div><button class="sprite-target prism-heart" data-tap="3" aria-label="Turn the crystal">${sprite("rpg-iridescent")}</button><div class="refraction-beams">${[0, 1, 2].map((n) => `<button class="refraction ${n === p.ripe % 3 ? "aligned" : ""}" data-tap="${n}" aria-label="Refract ${["rose", "gold", "blue"][n]}">${sprite("rpg-shard-" + n)}<span>${n === p.ripe % 3 ? uiIcon("spark") : "·"}</span></button>`).join("")}</div><div class="crystal-chain">${p.chain ? "×" + (p.chain + 1) : sprite("rpg-iridescent")}</div>`;
  }
  if (i === 8) {
    body = `<div class="void-rings"><i></i><i></i><i></i></div><div class="void-grid"></div><div class="void-orbit mass-${Math.min(p.chain, 5)}">${Array.from({ length: 5 }, (_, n) => `<i class="${n < p.chain ? "fed" : ""}" style="--orbit:${n * 72}deg">${sprite("rpg-void-mote")}</i>`).join("")}</div><button class="sprite-target void-heart ${p.chain >= 5 ? "unstable" : ""}" data-tap="0" aria-label="${p.chain >= 5 ? "Collapse the void" : "Feed the void"}">${sprite("rpg-void")}</button><button class="void-collapse" data-tap="1" ${p.chain < 5 ? "disabled" : ""}>${p.chain >= 5 ? "COLLAPSE" : p.chain + " / 5"}</button>`;
  }
  return (
    body +
    helperSprites() +
    `<div class="activity-vignette"></div><span class="activity-corner">${String(current + 1).padStart(2, "0")} : ${uiIcon("infinity")}</span>`
  );
}
function echoPhase(p: Play): number {
  const t = Date.now() - p.echoAt;
  if (t < 0) return -2;
  const step = Math.floor(t / (650 / cycleSpeed(state)));
  if (step >= p.echo.length) return -1;
  return t % (650 / cycleSpeed(state)) < 440 / cycleSpeed(state)
    ? p.echo[step]
    : -2;
}
function pips(): string {
  const p = play();
  const max = current === 0 ? 5 : current === 6 ? p.echo.length : 5;
  const filled = current === 0 ? p.heat : current === 6 ? p.input : 0;
  if (![0, 6].includes(current)) return "";
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
        ? "ON THE TRAIL"
        : current === 4
          ? "CHANCE OF RAIN"
          : current === 6
            ? echoPhase(p) === -1
              ? "ECHO"
              : "DREAMING"
            : current === 7
              ? "REFRACTION"
              : p.chain >= 5
                ? "CRITICAL MASS"
                : "EVENT HORIZON";
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
        : current === 4
          ? p.ripe
          : current === 6
            ? echoPhase(p) + ":" + Number(p.mistake > Date.now())
            : current === 7
              ? p.ripe + ":" + p.chain
              : current === 8
                ? p.chain
                : "static")
  );
}
function updateScene(force = false): void {
  if (view !== "world" || [2, 3, 5].includes(current)) return;
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
    p.plots[target] = now + (3200 + target * 250) / cycleSpeed(state);
    p.harvested++;
    if (gold) {
      word = "GOLDEN";
      earn("harvest");
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
        p.echoAt = now + 950 / cycleSpeed(state);
      }
    } else {
      bonus = 1;
      p.input = 0;
      p.mistake = now + 400;
      p.echoAt = now + 800 / cycleSpeed(state);
      word = "…";
    }
  }
  if (i === 7) {
    if (target === 3) {
      p.ripe = (p.ripe + 1) % 3;
      bonus = 1;
    } else if (target === p.ripe % 3) {
      p.chain = Math.min(20, p.chain + 1);
      bonus = 8 * (p.chain + 1);
      p.ripe = (p.ripe + 1 + Math.floor(Math.random() * 2)) % 3;
      word = "REFRACTED";
    } else {
      p.chain = 0;
      bonus = 1;
    }
  }
  if (i === 8) {
    if (p.chain >= 5) {
      bonus = 4096;
      p.chain = 0;
      word = "SINGULARITY";
    } else if (target === 1) return;
    else {
      p.chain++;
      bonus = 4 ** p.chain;
      word = "ACCRETED";
    }
  }
  const gain = tapReward(state, i, bonus);
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
  return `<section class="relic-page"><div class="screen-heading"><h1>Relics</h1><span class="view-count">${state.relics.length} / ${RELICS.length}</span></div><div class="relic-cabinet"><div class="relic-grid">${RELICS.map(
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
    .querySelector<HTMLButtonElement>("#prestige-now")
    ?.addEventListener("click", confirmPrestige);
  document
    .querySelectorAll<HTMLButtonElement>("[data-prestige-buy]")
    .forEach((b) => {
      b.onclick = () => {
        if (!buyPrestigeUpgrade(state, b.dataset.prestigeBuy!)) return;
        const y = document.querySelector<HTMLElement>("#screen")!.scrollTop;
        save();
        chime(3);
        renderView();
        document.querySelector<HTMLElement>("#screen")!.scrollTop = y;
      };
    });
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
      if (total(state) >= gateGoal(state)) ending();
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
      if (available(8)) openWorld(8);
      else if (available(7)) openWorld(7);
      else if (canPrestige(state)) navigate("prestige");
      else bump(e);
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
  if (view === "world" && current === 2) {
    rpgController = mountRpg(
      document.querySelector<HTMLElement>("#rpg-host")!,
      () => state,
      {
        changed: (result, event) => {
          if (result?.levelUp)
            toast("Level " + state.rpg.level, "A LITTLE STRONGER", "rpg-hero");
          if (result?.damage && event)
            floating(
              event,
              "−" + result.damage,
              result.victory ? "VICTORY" : "",
            );
          if (result?.changed) chime(result.victory ? 3 : 1, !result.victory);
          checkDiscoveries();
          save();
          update();
        },
      },
    );
  }
  if (view === "world" && current === 3) {
    arenaController = mountArena(
      document.querySelector<HTMLElement>("#arena-host")!,
      () => state,
      () => {
        chime(1, true);
        checkDiscoveries();
        save();
        update();
      },
    );
  }
  if (view === "world" && current === 5) {
    cosmosController = mountCosmos(
      document.querySelector<HTMLElement>("#cosmos-host")!,
      () => state,
      (result) => {
        chime(result.completed ? 3 : 1, true);
        checkDiscoveries();
        save();
        update();
      },
    );
  }
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
  rpgController?.update();
  arenaController?.update();
  cosmosController?.update();
  const n = total(state);
  const text = (id: string, value: string) => {
    const e = document.getElementById(id);
    if (e && e.textContent !== value) e.textContent = value;
  };
  text("total-score", showExact ? n.toLocaleString("en-US") : format(n));
  const exact = document.querySelector("#total-score");
  if (exact) exact.classList.toggle("exact", showExact);
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
  document
    .querySelector("#open-gate")
    ?.classList.toggle("ready", n >= gateGoal(state));
  document
    .querySelector("#open-gate")
    ?.setAttribute(
      "aria-label",
      n >= gateGoal(state) ? "Open the gate" : "The sealed gate",
    );
  const threshold = document.querySelector(".threshold-label");
  if (threshold)
    threshold.textContent = state.won
      ? "THE WAY IS OPEN"
      : n >= gateGoal(state)
        ? "THE SEAL IS BROKEN"
        : gateWords(state).join(" · ");
  document
    .querySelectorAll<HTMLElement>('[data-nav="prestige"]')
    .forEach((b) => b.classList.toggle("prestige-ready", canPrestige(state)));
  const rebirth = document.querySelector<HTMLButtonElement>("#prestige-now");
  if (rebirth) {
    rebirth.disabled = !canPrestige(state);
    rebirth.innerHTML = canPrestige(state)
      ? `Prestige · +${prestigeReward(state)} shards ${uiIcon("prestige")}`
      : `${uiIcon("lock")} ${format(n)} / ${format(gateGoal(state))}`;
  }
  document.querySelectorAll<HTMLElement>("[data-world-score]").forEach((el) => {
    const i = Number(el.dataset.worldScore);
    el.innerHTML = `${format(state.worlds[i].score)} <small>${WORLDS[i].noun}</small>`;
  });
  if (view === "world") {
    const w = state.worlds[current];
    text("world-score", format(w.score));
    text("world-bank", format(w.bank));
    text("world-rate", format(rate(w, state)) + "/s");
    text(
      "world-multiplier",
      "×" + format(multiplier(w) * productionBoost(state, current)),
    );
    text("activity-status", activityStatus());
    const pipbox = document.querySelector("#activity-pips");
    if (pipbox) pipbox.innerHTML = pips();
    for (const kind of ["helper", "power", "resonance"] as Upgrade[]) {
      text(kind + "-price", format(price(w, kind, state)));
      const button = document.querySelector<HTMLButtonElement>("#buy-" + kind);
      if (button) {
        button.disabled =
          w.bank < price(w, kind, state) ||
          (kind === "resonance" && w.score < 250);
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
          ? `${w.helpers} · +${format(w.power * 2 * multiplier(w) * productionBoost(state, current) * idleBoost(state))}/s`
          : kind === "power"
            ? `LV ${w.power} · +${format(w.power * 3 * multiplier(w) * productionBoost(state, current))}`
            : `LV ${w.resonance} · ×${format(multiplier(w) * productionBoost(state, current))}`,
      );
    }
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
    `<h2 id="modal-title">Settings</h2><div class="setting-list"><button class="setting-row" id="setting-sound">${uiIcon("sound")}<span>Sound</span><span class="toggle ${state.sound ? "on" : ""}" aria-hidden="true"></span></button><button class="setting-row" id="setting-motion">${uiIcon("star")}<span>Motion</span><span class="toggle ${state.motion ? "on" : ""}" aria-hidden="true"></span></button><button class="setting-row" id="fullscreen">${uiIcon("full")}<span>Full screen</span>${uiIcon("arrow")}</button>${deferredInstall ? `<button class="setting-row" id="install-app">${uiIcon("download")}<span>Install game</span>${uiIcon("arrow")}</button>` : ""}</div><div class="settings-divider"></div><div class="save-actions"><button class="secondary-button" id="export-save">${uiIcon("download")}Export save</button><button class="secondary-button" id="import-save">${uiIcon("upload")}Import save</button><input id="save-file" type="file" accept="application/json,.json" hidden/></div><button class="reset-button" id="reset-save">Start over</button>`,
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
        ![8, 9].includes(parsed.worlds.length) ||
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
      `<div class="eyebrow">A NEW BEGINNING</div><h2 id="modal-title">Leave it all behind?</h2><p class="reset-warning">Scores, gems, relics, and the prestige tree will be erased.</p><div class="reset-actions"><button class="primary-button" id="keep-save">Stay here</button><button class="danger-button" id="erase-save">Erase & begin</button></div>`,
    );
    confirmation.querySelector<HTMLButtonElement>("#keep-save")!.onclick = () =>
      confirmation.close();
    confirmation.querySelector<HTMLButtonElement>("#erase-save")!.onclick =
      () => {
        state = freshState();
        plays.fill(undefined);
        lit = [true, true];
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
    `<div class="ending-scene">${sprite("key")}<div class="eyebrow">THE OTHER SIDE</div><h2 id="modal-title">The answer is</h2><div class="answer">42<span>.</span></div><span class="ending-whisper">You were here all along.</span><button class="primary-button" id="ending-prestige">Prestige · +${prestigeReward(state)} shards ${uiIcon("prestige")}</button><button class="text-action" id="keep-playing">Stay a little longer ${uiIcon("arrow")}</button></div>`,
  );
  d.querySelector<HTMLButtonElement>("#ending-prestige")!.onclick = () => {
    d.close();
    navigate("prestige");
  };
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
let lastUiTick = 0;
let lastUnlocked = state.unlocked;
setInterval(() => {
  const now = Date.now();
  advance(state, (now - lastTick) / 1000);
  lastTick = now;
  if (now - lastUiTick < 150) return;
  lastUiTick = now;
  if (state.unlocked > lastUnlocked) {
    if (view !== "world") renderView();
    toast(
      WORLDS[state.unlocked - 1].name,
      "WORLD AWAKENED",
      WORLDS[state.unlocked - 1].kind,
    );
    save();
  }
  lastUnlocked = state.unlocked;
  const p = plays[0];
  if (p && p.heat > 0 && now - p.last > 1100) p.heat = 0;
  updateScene();
  update();
  checkDiscoveries();
  if (now - saveTime > 5000) save();
}, 1000 / 60);
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
