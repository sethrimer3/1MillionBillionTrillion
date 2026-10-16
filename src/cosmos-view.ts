import { sprite } from "./art";
import { cosmosAction, format, type State } from "./game";
import {
  BODIES,
  PATTERNS,
  TOOLS,
  catchRate,
  catchYield,
  cosmosRates,
  cosmosStage,
  patternAvailable,
  toolCost,
  type CosmosAction,
  type CosmosResult,
  type CosmosTool,
} from "./cosmos";
import "./cosmos.css";
export type CosmosController = { update: () => void };
type Mode = "field" | "sky" | "cosmos";
export function mountCosmos(
  host: HTMLElement,
  getState: () => State,
  changed: (result: CosmosResult) => void,
): CosmosController {
  let mode: Mode = "field",
    tab = "create",
    sceneKey = "",
    dockKey = "",
    focus = Math.max(2, cosmosStage(getState().cosmos)),
    lastMade = getState().cosmos.made[1],
    celebrate = 0,
    celebratedPattern = 0;
  const seenReady = Array(12).fill(-1),
    gainUntil = Array(12).fill(0);
  const positions = [
    [14, 24],
    [36, 13],
    [69, 25],
    [85, 43],
    [23, 55],
    [49, 43],
    [70, 66],
    [37, 77],
    [86, 81],
    [11, 82],
    [59, 83],
    [56, 15],
  ];
  host.innerHTML = `<section class="cosmos-app"><div class="cosmos-scene"><header class="cosmos-hud"><div><small>INDIGO · VI</small><h1>Firefly field</h1></div><div class="cosmos-wallet">${sprite("cosmos-glow")}<strong id="cosmos-glow"></strong><small id="cosmos-score"></small></div></header><div class="cosmos-inventory" aria-label="Cosmic collection">${BODIES.map((b, i) => `<div class="cosmos-resource" data-resource-chip="${i}" title="${b.name}">${sprite(b.sprite, "", b.name)}<strong data-cosmos-resource="${i}">0</strong></div>`).join("")}</div><div class="cosmos-stage" id="cosmos-stage"></div><nav class="cosmos-modes" aria-label="Sky views"><button data-cosmos-mode="field" aria-pressed="true">${sprite("cosmos-firefly")}Field</button><button data-cosmos-mode="sky" aria-pressed="false">${sprite("cosmos-constellation")}Stars</button><button data-cosmos-mode="cosmos" aria-pressed="false" id="cosmos-mode-unlock">${sprite("cosmos-planet")}Cosmos</button><span id="cosmos-rate"></span></nav></div><aside class="cosmos-dock"><nav class="cosmos-dock-tabs" aria-label="Cosmic controls"><button data-cosmos-tab="create" aria-selected="true">${sprite("cosmos-star")}Create</button><button data-cosmos-tab="tools" aria-selected="false">${sprite("cosmos-net")}Tools</button></nav><div class="cosmos-dock-content" id="cosmos-dock-content"></div></aside></section>`;
  function text(selector: string, value: string) {
    const el = host.querySelector<HTMLElement>(selector);
    if (el && el.textContent !== value) el.textContent = value;
  }
  function rateText(n: number): string {
    return n < 10 ? String(Number(n.toFixed(2))) : format(n);
  }
  function patternLines(pattern: number, small = false): string {
    const p = PATTERNS[pattern];
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${p.edges
      .map(([a, b], i) => {
        const x = p.nodes[a],
          y = p.nodes[b];
        return `<path data-thread="${i}" d="M${x[0]} ${x[1]} ${(x[0] + y[0]) / 2 + 0.7} ${(x[1] + y[1]) / 2} ${y[0]} ${y[1]}"/>`;
      })
      .join(
        "",
      )}${small ? p.nodes.map(([x, y]) => `<path class="mini-star" d="m${x} ${y - 3} 1 2 3 1-3 1-1 3-1-3-3-1 3-1Z"/>`).join("") : ""}</svg>`;
  }
  function field(): string {
    return `<div class="cosmos-field"><div class="cosmos-field-skies" id="cosmos-field-skies"></div><div class="cosmos-fireflies">${positions.map(([x, y], i) => `<button class="cosmos-firefly fly-${i}" data-firefly="${i}" aria-label="Catch firefly ${i + 1}" style="--fly-x:${x}%;--fly-y:${y}%;--fly-delay:${-i * 0.7}s"><span class="firefly-wings">${[0, 1, 2].map((n) => sprite("cosmos-firefly" + (n ? "-" + n : ""), "wing-frame wing-" + n)).join("")}</span><span class="firefly-gain" data-fly-gain="${i}"></span></button>`).join("")}</div><div class="cosmos-field-jar">${sprite("cosmos-jar")}<span id="cosmos-jar-count"></span></div><div class="cosmos-field-tools" id="cosmos-field-tools"></div></div>`;
  }
  function sky(): string {
    const s = getState().cosmos,
      p = PATTERNS[s.pattern];
    return `<div class="cosmos-sky"><header class="cosmos-sky-heading"><span>${p.name}</span><div class="cosmos-patterns">${PATTERNS.map((p, i) => `<button data-pattern="${i}" aria-label="Weave ${p.name}" aria-pressed="${s.pattern === i}" ${patternAvailable(s, i) ? "" : "disabled"}>${patternLines(i, true)}</button>`).join("")}</div></header><div class="cosmos-sky-drawing"><div class="cosmos-star-board">${patternLines(s.pattern)}${p.nodes.map(([x, y], i) => `<button class="cosmos-star" data-star="${i}" aria-label="Light star ${i + 1}" style="left:${x}%;top:${y}%">${sprite("cosmos-star-off")}</button>`).join("")}</div></div><footer class="cosmos-sky-footer"><span id="cosmos-stitches"></span><span>${sprite("cosmos-firefly")} ${p.cost} / ★</span><span>+${p.reward} ${sprite("cosmos-constellation")}</span></footer></div>`;
  }
  function cosmos(): string {
    const s = getState().cosmos;
    focus = Math.max(2, Math.min(cosmosStage(s), focus));
    return `<div class="cosmos-observatory cosmos-scale-${focus}"><div class="cosmos-observatory-title"><span>${BODIES[focus].single}</span><strong id="cosmos-body-count"></strong></div><div class="cosmos-diorama"><svg class="cosmos-orbit-lines" viewBox="0 0 400 400" aria-hidden="true"><path d="M31 198Q36 25 202 27t170 173Q367 372 199 373T31 198Zm46 1Q76 77 201 77t121 124q-1 122-123 122T77 199Z"/></svg><div class="cosmos-central-body">${sprite(BODIES[focus].sprite, "", BODIES[focus].single)}</div>${Array.from({ length: Math.min(7, Math.max(3, focus + 1)) }, (_, i) => `<div class="cosmos-satellite satellite-${i}" style="--satellite-turn:${(i * 360) / Math.max(3, focus + 1)}deg;--satellite-time:${24 + i * 8}s">${sprite(i % 3 === 0 ? "cosmos-constellation" : BODIES[Math.max(1, focus - 1)].sprite)}</div>`).join("")}<span class="cosmos-diorama-star star-a">${sprite("cosmos-star")}</span><span class="cosmos-diorama-star star-b">${sprite("cosmos-star")}</span><span class="cosmos-diorama-star star-c">${sprite("cosmos-star")}</span></div><div class="cosmos-scales">${BODIES.slice(
      2,
    )
      .map(
        (b, i) =>
          `<button data-scale="${i + 2}" aria-label="View ${b.name}" aria-pressed="${focus === i + 2}" ${s.made[i + 2] > 0 ? "" : "disabled"}>${sprite(b.sprite)}</button>`,
      )
      .join("")}</div></div>`;
  }
  function tools(): string {
    return `<div class="cosmos-tools">${(Object.keys(TOOLS) as CosmosTool[]).map((id) => `<button class="cosmos-tool" data-cosmos-tool="${id}" aria-label="Upgrade ${TOOLS[id].name}">${sprite(TOOLS[id].sprite)}<span><strong>${TOOLS[id].name}</strong><small data-tool-detail="${id}"></small></span><span class="cosmos-tool-price"><strong data-tool-price="${id}"></strong><small data-tool-level="${id}"></small></span></button>`).join("")}</div>`;
  }
  function create(): string {
    const s = getState().cosmos,
      stage = cosmosStage(s),
      p = PATTERNS[s.pattern];
    return `<div class="cosmos-recipes">${BODIES.slice(
      1,
      Math.min(6, stage + 3),
    )
      .map((b, index) => {
        const tier = index + 1;
        return `<article class="cosmos-recipe" data-recipe="${tier}"><div class="cosmos-recipe-heading">${sprite(b.sprite)}<span><strong>${b.single}</strong><small data-recipe-count="${tier}"></small></span></div><div class="cosmos-ingredients">${sprite(BODIES[tier === 1 ? 0 : tier - 1].sprite)}<span>${tier === 1 ? p.cost * p.nodes.length : b.cost}</span><b>→</b>${sprite(b.sprite)}<span>${tier === 1 ? p.reward : 1}</span></div><button class="cosmos-make" data-craft="${tier}" aria-label="${tier === 1 ? "Weave a constellation" : "Make " + b.single}">${tier === 1 ? "Weave" : "Make"}${sprite("cosmos-star")}</button>${tier >= 2 ? `<button class="cosmos-automation" data-cosmos-auto="${tier}" aria-label="Automate ${b.name}" aria-pressed="false">${sprite("cosmos-loop")}<span>AUTO</span><small data-auto-label="${tier}">OFF</small></button>` : `<div class="cosmos-loom-state">${sprite("cosmos-loom")}<span id="cosmos-loom-state"></span></div>`}</article>`;
      })
      .join("")}</div>`;
  }
  function update(): void {
    const state = getState(),
      s = state.cosmos,
      stage = cosmosStage(s),
      now = Date.now();
    if (s.made[1] > lastMade && mode === "sky") {
      celebrate = now + 650;
      celebratedPattern = s.pattern;
    }
    lastMade = s.made[1];
    text("#cosmos-glow", format(s.glow));
    text("#cosmos-score", "×" + format(state.worlds[5].score));
    const rate = cosmosRates(s);
    text(
      "#cosmos-rate",
      `${rateText(rate.glow + catchRate(s) * catchYield(s))}/s`,
    );
    BODIES.forEach((_, i) => {
      text(`[data-cosmos-resource="${i}"]`, format(Math.floor(s.resources[i])));
      host
        .querySelector(`[data-resource-chip="${i}"]`)
        ?.classList.toggle("unseen", i > stage + 1);
    });
    host.querySelector<HTMLButtonElement>("#cosmos-mode-unlock")!.disabled =
      stage < 2;
    host
      .querySelectorAll<HTMLButtonElement>("[data-cosmos-mode]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.cosmosMode === mode)),
      );
    const nextScene =
      mode +
      ":" +
      (mode === "sky"
        ? s.pattern + ":" + stage
        : mode === "cosmos"
          ? focus + ":" + stage
          : stage);
    if (sceneKey !== nextScene) {
      sceneKey = nextScene;
      host.querySelector("#cosmos-stage")!.innerHTML =
        mode === "field" ? field() : mode === "sky" ? sky() : cosmos();
      if (mode === "field") {
        seenReady.fill(-1);
        const sky = host.querySelector("#cosmos-field-skies")!;
        sky.innerHTML = BODIES.slice(1, stage + 1)
          .map(
            (b, i) =>
              `<span class="cosmos-sky-body sky-body-${i}" style="--body-index:${i}">${sprite(b.sprite)}</span>`,
          )
          .join("");
      }
    }
    if (mode === "field") {
      for (let i = 0; i < 12; i++) {
        const b = host.querySelector<HTMLButtonElement>(
          `[data-firefly="${i}"]`,
        )!;
        if (
          seenReady[i] >= 0 &&
          seenReady[i] !== s.ready[i] &&
          s.ready[i] > s.time
        )
          gainUntil[i] = now + 650;
        seenReady[i] = s.ready[i];
        b.disabled = s.ready[i] > s.time;
        b.classList.toggle("caught", b.disabled);
        b.classList.toggle("show-gain", gainUntil[i] > now);
        text(`[data-fly-gain="${i}"]`, "+" + catchYield(s));
      }
      text("#cosmos-jar-count", format(Math.floor(s.resources[0])));
      const decor = host.querySelector<HTMLElement>("#cosmos-field-tools")!,
        key = s.upgrades.nets + ":" + s.upgrades.lure;
      if (decor.dataset.key !== key) {
        decor.dataset.key = key;
        decor.innerHTML =
          Array.from({ length: Math.min(3, s.upgrades.nets) }, () =>
            sprite("cosmos-net"),
          ).join("") +
          Array.from({ length: Math.min(4, s.upgrades.lure) }, () =>
            sprite("cosmos-flower"),
          ).join("");
      }
    }
    if (mode === "sky") {
      const p = PATTERNS[s.pattern],
        stitches = s.stitches[s.pattern],
        done = now < celebrate && celebratedPattern === s.pattern;
      text(
        "#cosmos-stitches",
        `${done ? p.nodes.length : stitches.filter(Boolean).length} / ${p.nodes.length}`,
      );
      host.querySelectorAll<HTMLButtonElement>("[data-star]").forEach((b) => {
        const id = Number(b.dataset.star),
          lit = done || stitches[id];
        b.classList.toggle("lit", lit);
        b.disabled = lit || s.resources[0] < p.cost;
        b.setAttribute("aria-pressed", String(lit));
        const img = b.querySelector<HTMLImageElement>("img")!,
          src =
            import.meta.env.BASE_URL +
            "sprites/cosmos-star" +
            (lit ? "" : "-off") +
            ".svg";
        if (img.getAttribute("src") !== src) img.src = src;
      });
      host
        .querySelectorAll<SVGPathElement>(".cosmos-star-board [data-thread]")
        .forEach((line) => {
          const [a, b] = p.edges[Number(line.dataset.thread)];
          line.classList.toggle(
            "stitched",
            done || (stitches[a] && stitches[b]),
          );
        });
      host
        .querySelector(".cosmos-star-board")
        ?.classList.toggle("finished", done);
    }
    if (mode === "cosmos")
      text(
        "#cosmos-body-count",
        `${format(Math.floor(s.resources[focus]))} · +${rateText(s.resources[focus] * BODIES[focus].glow * (1 + s.upgrades.orbit * 0.5))}/s`,
      );
    const nextDock =
      tab + ":" + stage + (tab === "create" ? ":" + s.pattern : "");
    if (dockKey !== nextDock) {
      dockKey = nextDock;
      host.querySelector("#cosmos-dock-content")!.innerHTML =
        tab === "tools" ? tools() : create();
    }
    if (tab === "tools")
      for (const id of Object.keys(TOOLS) as CosmosTool[]) {
        const b = host.querySelector<HTMLButtonElement>(
            `[data-cosmos-tool="${id}"]`,
          )!,
          level = s.upgrades[id],
          max = level >= TOOLS[id].max;
        b.disabled = stage < TOOLS[id].at || max || s.glow < toolCost(s, id);
        b.classList.toggle("undiscovered", stage < TOOLS[id].at);
        text(`[data-tool-level="${id}"]`, `LV ${level}`);
        text(
          `[data-tool-price="${id}"]`,
          max ? "MAX" : format(toolCost(s, id)),
        );
        text(
          `[data-tool-detail="${id}"]`,
          id === "nets"
            ? `${rateText(catchRate(s))} catches/s`
            : id === "mesh"
              ? `${catchYield(s)} → ${catchYield(s) + 2} / catch`
              : id === "lure"
                ? `×${(1 + level * 0.2).toFixed(1)} swarm`
                : id === "loom"
                  ? `${rateText(level * 0.4)} stars/s`
                  : `×${1 + level * 0.5} orbit`,
        );
      }
    else
      for (let tier = 1; tier < 6; tier++) {
        const b = host.querySelector<HTMLButtonElement>(
          `[data-craft="${tier}"]`,
        );
        if (!b) continue;
        b.disabled =
          tier > 1 &&
          (s.made[tier - 1] <= 0 || s.resources[tier - 1] < BODIES[tier].cost);
        host
          .querySelector(`[data-recipe="${tier}"]`)
          ?.classList.toggle("undiscovered", tier > stage + 1);
        text(
          `[data-recipe-count="${tier}"]`,
          `${format(Math.floor(s.resources[tier]))} · +${rateText(BODIES[tier].glow)}/s`,
        );
        const auto = host.querySelector<HTMLButtonElement>(
          `[data-cosmos-auto="${tier}"]`,
        );
        if (auto) {
          auto.disabled = s.made[tier] <= 0;
          auto.setAttribute("aria-pressed", String(s.auto[tier]));
          text(`[data-auto-label="${tier}"]`, s.auto[tier] ? "ON" : "OFF");
        }
        text(
          "#cosmos-loom-state",
          s.upgrades.loom ? `${rateText(s.upgrades.loom * 0.4)} stars/s` : "—",
        );
      }
  }
  host.onclick = (event) => {
    const b = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button",
    );
    if (!b || b.disabled) return;
    if (b.dataset.cosmosMode) {
      mode = b.dataset.cosmosMode as Mode;
      update();
      return;
    }
    if (b.dataset.cosmosTab) {
      tab = b.dataset.cosmosTab;
      host
        .querySelectorAll<HTMLButtonElement>("[data-cosmos-tab]")
        .forEach((el) =>
          el.setAttribute(
            "aria-selected",
            String(el.dataset.cosmosTab === tab),
          ),
        );
      update();
      return;
    }
    if (b.dataset.scale) {
      focus = Number(b.dataset.scale);
      mode = "cosmos";
      update();
      return;
    }
    if (b.dataset.craft === "1") {
      mode = "sky";
      update();
      return;
    }
    let action: CosmosAction | undefined;
    if (b.dataset.firefly !== undefined)
      action = { kind: "catch", id: Number(b.dataset.firefly) };
    if (b.dataset.star !== undefined)
      action = { kind: "star", id: Number(b.dataset.star) };
    if (b.dataset.craft)
      action = { kind: "craft", id: Number(b.dataset.craft) };
    if (b.dataset.pattern)
      action = { kind: "pattern", id: Number(b.dataset.pattern) };
    if (b.dataset.cosmosAuto)
      action = { kind: "auto", id: Number(b.dataset.cosmosAuto) };
    if (b.dataset.cosmosTool)
      action = { kind: "upgrade", id: b.dataset.cosmosTool as CosmosTool };
    if (!action) return;
    const result = cosmosAction(getState(), action);
    if (result.changed) {
      if (result.completed && result.completed >= 2) {
        mode = "cosmos";
        focus = result.completed;
      }
      update();
      if (result.completed && result.completed >= 2)
        host
          .querySelector<HTMLElement>(`[data-recipe="${result.completed}"]`)
          ?.scrollIntoView({ block: "nearest", inline: "center" });
      changed(result);
    }
  };
  update();
  return { update };
}
