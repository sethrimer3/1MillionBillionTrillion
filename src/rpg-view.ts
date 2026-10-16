import {
  type State,
  format,
  rpgAction,
  rewardRenown,
  unlock,
  purchase,
  price,
  type Upgrade,
} from "./game";
import { MAP_CENTER, MAP_SIZE, WORLD_MAP } from "./rpg-map";
import {
  ABILITIES,
  MEMBER_ABILITIES,
  MEMBER_NAMES,
  COMPANIONS,
  ITEMS,
  QUESTS,
  REGIONS,
  activeMembers,
  memberStats,
  memberSprite,
  stats,
  points,
  nextXp,
  areaStats,
  navigate,
  chooseAbility,
  companionReady,
  recruit,
  party,
  allocate,
  equip,
  forge,
  forgeCost,
  claim,
  questProgress,
  nextPage,
  type MemberId,
  type AbilityId,
  type Attribute,
  type Result,
} from "./rpg";
import { sprite, uiIcon } from "./art";
import "./rpg.css";
type Tab = "world" | "party" | "bag" | "hero" | "camp" | "journal";
export type RpgController = { update: () => void };
type Hooks = { changed: (result?: Result, event?: MouseEvent) => void };
const tabs: [Tab, string, string][] = [
  ["world", "World", "rpg-map"],
  ["party", "Party", "rpg-ally-pip"],
  ["bag", "Bag", "rpg-chest"],
  ["hero", "Hero", "rpg-hero"],
  ["camp", "Forge", "rpg-hammer"],
  ["journal", "Journal", "rpg-scroll"],
];
export function mountRpg(
  root: HTMLElement,
  getState: () => State,
  hooks: Hooks,
): RpgController {
  let tab: Tab = "world",
    selected: MemberId = "hero",
    bodyKey = "",
    partyKey = "",
    battleKey = "",
    lastCell = -1,
    follow = true,
    preview = -1;
  root.innerHTML = `<section class="kingdom-app" aria-label="Pocket kingdoms"><header class="kingdom-topline"><div><small>YELLOW · III</small><h1>Pocket kingdoms</h1></div><div class="kingdom-coins">${sprite("coin")}<strong id="rpg-gold"></strong><span id="rpg-renown"></span></div></header><nav class="kingdom-tabs" aria-label="Kingdom navigation">${tabs.map(([id, name, img]) => `<button data-rpg-tab="${id}" class="${id === tab ? "current" : ""}" aria-current="${id === tab ? "page" : "false"}">${sprite(img)}<span>${name}</span></button>`).join("")}</nav><div class="kingdom-document" id="kingdom-document"></div><section class="kingdom-party" aria-label="Active party"><div class="party-portraits" id="party-portraits"></div><div class="party-commands"><div class="party-command-heading"><span id="party-command-name"></span><span id="party-mana"></span></div><div class="party-abilities" id="party-abilities" aria-label="Selected member abilities"></div></div></section></section>`;
  const body = root.querySelector<HTMLElement>("#kingdom-document")!;
  const image = (name: string) =>
    import.meta.env.BASE_URL + "sprites/" + name + ".svg";
  function meter(value: number, max: number, cls = "") {
    return `<div class="kingdom-meter ${cls}"><i style="width:${Math.max(0, Math.min(100, (value / max) * 100))}%"></i></div>`;
  }
  function text(selector: string, value: string) {
    const el = root.querySelector<HTMLElement>(selector);
    if (el && el.textContent !== value) el.textContent = value;
  }
  function percent(selector: string, value: number) {
    const el = root.querySelector<HTMLElement>(selector);
    if (el) el.style.width = Math.max(0, Math.min(100, value)) * 1 + "%";
  }
  function world(): string {
    return `<div class="kingdom-world"><section class="atlas"><header class="atlas-heading"><div><strong id="rpg-area"></strong><small id="rpg-distance"></small></div><button class="kingdom-icon-button" data-locate aria-label="Find party">${sprite("rpg-locate")}</button></header><div class="atlas-viewport" id="atlas-viewport" tabindex="0" aria-label="Scrollable maze world map"><div class="atlas-grid" style="--map-size:${MAP_SIZE}" role="group" aria-label="Maze squares">${WORLD_MAP.map((c) => (c.wall ? `<span class="atlas-wall" aria-hidden="true" style="background-image:url('${image("rpg-tile-wall-" + c.region)}')"></span>` : `<button class="atlas-cell ${c.room ? "room" : "corridor"}" data-map-cell="${c.id}" aria-label="Travel to ${c.kind === "camp" ? "camp" : REGIONS[c.region].name + " " + c.x + "," + c.y}, danger ${c.distance}" style="background-image:url('${image("rpg-tile-floor-" + c.region)}')"><span class="atlas-route">${sprite("rpg-footsteps")}</span>${c.kind === "camp" ? sprite("rpg-camp", "atlas-location") : c.kind === "lair" ? sprite("rpg-crown", "atlas-location") : c.kind === "chest" ? sprite("rpg-chest", "atlas-location") : ""}<small>${c.room && c.kind !== "camp" ? c.distance : ""}</small><span class="atlas-player">${sprite("rpg-hero")}</span><i class="atlas-cleared"></i></button>`)).join("")}</div></div><footer class="atlas-footer"><span id="rpg-route"></span><span>${sprite("rpg-sword")}<b id="rpg-preview-level"></b></span><span>${sprite("coin")}<b id="rpg-preview-gold"></b></span><span>✦ <b id="rpg-preview-renown"></b></span></footer></section><section class="kingdom-battle"><div class="kingdom-battle-canvas" id="rpg-canvas"><div class="kingdom-battle-label"><span id="rpg-battle-place"></span><strong id="rpg-battle-status"></strong></div><div class="kingdom-actors" id="kingdom-actors"></div><div class="kingdom-foes" id="kingdom-foes"></div><div class="kingdom-encounter" id="kingdom-encounter"></div></div><div class="kingdom-battle-controls"><button data-rpg-action="auto" class="kingdom-icon-button" id="rpg-auto" aria-label="Pause battle">${sprite("rpg-pause")}</button><span id="rpg-message"></span><button data-rpg-action="potion" class="kingdom-icon-button" aria-label="Use potion">${sprite("rpg-potion")}<small id="rpg-potions"></small></button><button data-rpg-action="rest" class="kingdom-icon-button" aria-label="Return to camp">${sprite("rpg-camp")}</button></div></section></div>`;
  }
  function roster(): string {
    const r = getState().rpg;
    return `<section class="kingdom-paper"><div class="kingdom-paper-heading"><h2>Good company</h2><span>${r.party.length + 1} / 4</span></div><div class="kingdom-roster">${COMPANIONS.map(
      (c) => {
        const owned = r.recruited.includes(c.id),
          joined = r.party.includes(c.id),
          ready = companionReady(r, c.id);
        return `<article class="roster-member ${ready || owned ? "" : "unmet"}">${sprite(c.sprite)}<div><h3>${c.name}</h3><small>${c.stat}</small><div class="roster-skills">${MEMBER_ABILITIES[c.id].map((id) => sprite(ABILITIES[id].sprite, "", ABILITIES[id].name)).join("")}</div></div><button class="kingdom-button" ${owned ? `data-party="${c.id}" ${r.status === "battle" || (!joined && r.party.length >= 3) ? "disabled" : ""}` : `data-recruit="${c.id}" ${!ready || r.gold < c.cost ? "disabled" : ""}`}>${owned ? (joined ? "Leave" : "Join") : ready ? "Recruit · " + c.cost : c.kills + " encounters"}</button></article>`;
      },
    ).join("")}</div></section>`;
  }
  function bag(): string {
    const r = getState().rpg;
    return `<section class="kingdom-paper"><div class="kingdom-paper-heading"><h2>Bag</h2><span>${r.owned.length}</span></div><div class="kingdom-bag">${r.owned
      .map((id) => {
        const item = ITEMS.find((i) => i.id === id)!,
          worn = r.gear[item.slot] === id;
        return `<button data-rpg-equip="${id}" class="kingdom-item ${worn ? "equipped" : ""}" aria-label="${worn ? "Equipped: " : "Equip "}${item.name}">${sprite(item.sprite)}<strong>${item.name}</strong><small>${item.slot === "weapon" ? "ATK +" + (item.attack + (r.forged[id] || 0) * 2) : item.slot === "armor" ? "DEF +" + (item.defense + (r.forged[id] || 0) * 2) : "MAG +" + (item.magic + (r.forged[id] || 0) * 2)}</small><span>${worn ? "✓" : "+"}</span></button>`;
      })
      .join("")}</div></section>`;
  }
  function hero(): string {
    const r = getState().rpg,
      s = stats(r);
    return `<section class="kingdom-paper"><div class="kingdom-hero-sheet">${sprite("rpg-hero")}<div><h2>Level ${r.level}</h2><span>ATK ${s.attack} · DEF ${s.defense} · MAG ${s.magic}</span><small>${r.xp} / ${nextXp(r.level)} XP</small>${meter(r.xp, nextXp(r.level), "xp")}</div></div><div class="kingdom-paper-heading"><h3>Attributes</h3><span>${points(r)} points</span></div>${(["might", "vigor", "wisdom"] as Attribute[]).map((a, i) => `<div class="kingdom-stat-row">${sprite(["rpg-sword", "rpg-shield", "rpg-orb"][i])}<span><strong>${a[0].toUpperCase() + a.slice(1)}</strong><small>${["+2 ATK", "+7 HP · +1 DEF", "+3 MAG · +2 MP"][i]}</small></span><b>${r.attributes[a]}</b><button class="kingdom-button" data-rpg-attribute="${a}" aria-label="Increase ${a}" ${points(r) ? "" : "disabled"}>+</button></div>`).join("")}<div class="kingdom-paper-heading"><h3>Talents</h3></div><div class="kingdom-talents">${MEMBER_ABILITIES.hero.map((id) => `<div>${sprite(ABILITIES[id].sprite)}<span>${ABILITIES[id].name}</span><small>LV ${ABILITIES[id].level}</small></div>`).join("")}</div></section>`;
  }
  function camp(): string {
    const state = getState(),
      r = state.rpg,
      w = state.worlds[2];
    return `<section class="kingdom-paper"><div class="kingdom-paper-heading"><h2>Forge</h2><span>${sprite("rpg-ink")}${r.ink}</span></div>${Object.values(
      r.gear,
    )
      .filter(Boolean)
      .map(
        (id) =>
          `<div class="kingdom-stat-row">${sprite(ITEMS.find((i) => i.id === id)!.sprite)}<span><strong>${ITEMS.find((i) => i.id === id)!.name}</strong><small>+${r.forged[id] || 0}</small></span><button class="kingdom-button" data-rpg-forge="${id}" ${r.level < 3 || r.ink < forgeCost(r, id) || (r.forged[id] || 0) >= 20 ? "disabled" : ""}>${(r.forged[id] || 0) >= 20 ? "MAX" : forgeCost(r, id) + " ink"}</button></div>`,
      )
      .join(
        "",
      )}<div class="kingdom-paper-heading"><h3>Supplies</h3><span>${r.potions} bottles</span></div><div class="kingdom-stat-row">${sprite("rpg-potion")}<span>Red bottle</span><button class="kingdom-button" data-rpg-action="buy-potion" ${r.gold < 12 || r.potions >= 99 ? "disabled" : ""}>12 gold</button></div><div class="kingdom-paper-heading"><h3>Renown</h3><span>${format(w.bank)} ✦</span></div>${(["helper", "power", "resonance"] as Upgrade[]).map((key, i) => `<div class="kingdom-stat-row">${sprite(["gnome", "rpg-pendant", "rune"][i])}<span><strong>${["Trail companion", "Renown charm", "Resonance"][i]}</strong><small>LV ${key === "helper" ? w.helpers : key === "power" ? w.power : w.resonance}</small></span><button class="kingdom-button" data-kingdom-upgrade="${key}" ${w.bank < price(w, key, state) || (key === "resonance" && w.score < 250) ? "disabled" : ""}>${format(price(w, key, state))} ✦</button></div>`).join("")}${r.cleared >= 8 ? `<button class="kingdom-button next-page" data-next-page ${r.maze.cell === MAP_CENTER ? "" : "disabled"}>The next page · ${r.depth + 2} ${uiIcon("arrow")}</button>` : ""}</section>`;
  }
  function journal(): string {
    const r = getState().rpg;
    return `<section class="kingdom-paper"><div class="kingdom-paper-heading"><h2>Journal</h2><span>${r.kills} encounters</span></div>${QUESTS.map((q) => `<article class="kingdom-quest">${sprite(q.sprite)}<div><h3>${q.name}</h3><small>${Math.min(q.goal, questProgress(r, q.kind))} / ${q.goal} · ${q.gold} gold · ${q.renown} renown</small></div><button class="kingdom-button" data-rpg-claim="${q.id}" ${r.claimed.includes(q.id) || questProgress(r, q.kind) < q.goal ? "disabled" : ""}>${r.claimed.includes(q.id) ? "✓" : "Claim"}</button></article>`).join("")}</section>`;
  }
  function centerMap(): void {
    const r = getState().rpg,
      viewport = root.querySelector<HTMLElement>("#atlas-viewport"),
      cell = root.querySelector<HTMLElement>(
        `[data-map-cell="${r.maze.cell}"]`,
      );
    if (viewport && cell) {
      viewport.scrollLeft = cell.offsetLeft + 22 - viewport.clientWidth / 2;
      viewport.scrollTop = cell.offsetTop + 22 - viewport.clientHeight / 2;
    }
  }
  function updateWorld(): void {
    const r = getState().rpg,
      tile = WORLD_MAP[r.maze.cell],
      a = areaStats(preview < 0 ? r.maze.cell : preview, r.depth);
    text(
      "#rpg-area",
      r.depth > 0
        ? "The Endless Canvas"
        : REGIONS[WORLD_MAP[preview < 0 ? r.maze.cell : preview].region].name,
    );
    text(
      "#rpg-distance",
      a.distance === 0
        ? "THE LITTLE CAMP"
        : `${a.distance} FROM CAMP${r.depth ? " · PAGE " + (r.depth + 1) : ""}`,
    );
    text(
      "#rpg-route",
      r.maze.route.length
        ? `${r.maze.route.length} STEPS`
        : r.maze.cell === MAP_CENTER
          ? "CAMP"
          : `${tile.x - 9}, ${tile.y - 9}`,
    );
    const destination = WORLD_MAP[preview < 0 ? r.maze.cell : preview];
    const factor = destination.kind === "lair" ? 3 : a.count;
    text("#rpg-preview-level", a.distance ? String(a.level) : "—");
    text(
      "#rpg-preview-gold",
      a.distance
        ? "+" +
            a.rewards.gold *
              factor *
              (destination.kind === "chest" &&
              !r.maze.cleared.includes(destination.id)
                ? 2
                : 1)
        : "—",
    );
    text(
      "#rpg-preview-renown",
      a.distance ? "+" + a.rewards.renown * factor : "—",
    );
    root.querySelectorAll<HTMLElement>("[data-map-cell]").forEach((el) => {
      const id = Number(el.dataset.mapCell);
      el.classList.toggle("visited", r.maze.visited.includes(id));
      el.classList.toggle("charted", r.maze.cleared.includes(id));
      el.classList.toggle("current", id === r.maze.cell);
      el.classList.toggle("on-route", r.maze.route.includes(id));
      if (id === r.maze.cell) el.setAttribute("aria-current", "location");
      else el.removeAttribute("aria-current");
    });
    if (lastCell !== r.maze.cell) {
      lastCell = r.maze.cell;
      if (follow) centerMap();
    }
    const key =
      r.status +
      ":" +
      r.foes.map((f) => f.id).join(",") +
      ":" +
      r.party.join(",") +
      ":" +
      r.zone;
    const canvas = root.querySelector<HTMLElement>("#rpg-canvas")!;
    canvas.style.backgroundImage = `url('${image("rpg-landscape-" + Math.min(7, r.zone))}')`;
    text(
      "#rpg-battle-place",
      r.maze.cell === MAP_CENTER ? "The little camp" : REGIONS[r.zone].short,
    );
    text(
      "#rpg-battle-status",
      !r.auto
        ? "PAUSED"
        : r.status === "battle"
          ? "BATTLE"
          : r.status === "victory"
            ? "VICTORY"
            : r.status === "down"
              ? "DOWN"
              : r.maze.route.length
                ? "ON THE PATH"
                : "AT CAMP",
    );
    if (key !== battleKey) {
      battleKey = key;
      root.querySelector("#kingdom-actors")!.innerHTML = activeMembers(r)
        .map(
          (id, i) =>
            `<div class="kingdom-actor party-actor-${i}" data-actor="${id}">${sprite(memberSprite(id))}<small data-actor-effect="${id}"></small></div>`,
        )
        .join("");
      root.querySelector("#kingdom-foes")!.innerHTML =
        r.status === "battle"
          ? r.foes
              .map(
                (f, i) =>
                  `<div class="kingdom-foe foe-position-${i}" data-foe="${i}">${sprite(f.sprite, "", f.name)}<span>${f.name}</span>${meter(f.hp, f.maxHp)}<small data-foe-hp="${i}"></small><b data-foe-intent="${i}"></b></div>`,
              )
              .join("")
          : "";
      root.querySelector("#kingdom-encounter")!.innerHTML =
        r.status === "down"
          ? `<button class="kingdom-button" data-rpg-action="rest">${sprite("rpg-camp")}Back to the fire</button>`
          : r.status === "victory"
            ? `${sprite("rpg-chest")}<strong>+${format(r.maze.reward)} ✦</strong>`
            : r.maze.cell === MAP_CENTER
              ? `${sprite("rpg-camp")}<small>${r.maze.route.length ? "ON THE PATH" : "THE LITTLE CAMP"}</small>`
              : "";
    }
    for (const id of activeMembers(r)) {
      const m = r.members[id],
        el = root.querySelector<HTMLElement>(`[data-actor="${id}"]`);
      el?.classList.toggle("acting", m.flash > 0 && m.hp > 0);
      el?.classList.toggle("fallen", m.hp <= 0);
      text(`[data-actor-effect="${id}"]`, m.flash > 0 ? m.last : "");
    }
    r.foes.forEach((f, i) => {
      const el = root.querySelector<HTMLElement>(`[data-foe="${i}"]`);
      el?.classList.toggle("hit", f.flash > 0);
      el?.classList.toggle("fallen", f.hp <= 0);
      el?.classList.toggle("marked", f.marked > 0);
      percent(`[data-foe="${i}"] .kingdom-meter i`, (f.hp / f.maxHp) * 100);
      text(`[data-foe-hp="${i}"]`, `${Math.ceil(f.hp)} / ${f.maxHp}`);
      text(`[data-foe-intent="${i}"]`, f.turn % 3 === 2 ? "!" : "");
    });
    const auto = root.querySelector<HTMLButtonElement>("#rpg-auto")!;
    auto.setAttribute("aria-label", r.auto ? "Pause battle" : "Resume battle");
    auto.setAttribute("aria-pressed", String(r.auto));
    auto.innerHTML = sprite(r.auto ? "rpg-pause" : "rpg-play");
    text("#rpg-message", r.status === "down" ? "Back to the fire." : r.log[0]);
    text("#rpg-potions", String(r.potions));
  }
  function updateParty(): void {
    const r = getState().rpg,
      ids = activeMembers(r);
    if (!ids.includes(selected)) selected = "hero";
    const key = ids.join(",") + ":" + selected + ":" + r.level;
    if (key !== partyKey) {
      partyKey = key;
      root.querySelector("#party-portraits")!.innerHTML = Array.from(
        { length: 4 },
        (_, i) => {
          const id = ids[i];
          return id
            ? `<button class="party-portrait ${selected === id ? "selected" : ""}" data-member="${id}" aria-label="Select ${MEMBER_NAMES[id]}" aria-pressed="${selected === id}">${sprite(memberSprite(id))}<span><strong>${MEMBER_NAMES[id]}</strong><small data-party-health="${id}"></small>${meter(1, 1)}</span><i class="party-clock"><b data-party-clock="${id}"></b></i></button>`
            : `<button class="party-portrait empty" data-rpg-tab="party" aria-label="Empty party slot">+<small>${i + 1}</small></button>`;
        },
      ).join("");
      root.querySelector("#party-abilities")!.innerHTML = MEMBER_ABILITIES[
        selected
      ]
        .filter((id) => r.level >= ABILITIES[id].level)
        .map(
          (id) =>
            `<button class="party-ability" data-ability="${id}" aria-label="${MEMBER_NAMES[selected]}: ${ABILITIES[id].name}">${sprite(ABILITIES[id].sprite)}<span>${ABILITIES[id].name}</span>${ABILITIES[id].mp ? `<small>${ABILITIES[id].mp}</small>` : ""}</button>`,
        )
        .join("");
    }
    for (const id of ids) {
      const m = r.members[id],
        s = memberStats(r, id);
      text(`[data-party-health="${id}"]`, `${Math.ceil(m.hp)} / ${s.maxHp}`);
      percent(`[data-member="${id}"] .kingdom-meter i`, (m.hp / s.maxHp) * 100);
      percent(`[data-party-clock="${id}"]`, (1 - m.cooldown / s.speed) * 100);
      root
        .querySelector(`[data-member="${id}"]`)
        ?.classList.toggle("fallen", m.hp <= 0);
    }
    const m = r.members[selected],
      s = memberStats(r, selected);
    text(
      "#party-command-name",
      `${MEMBER_NAMES[selected]} · ${m.hp <= 0 ? "KO" : ABILITIES[m.ability].name}`,
    );
    text("#party-mana", `${Math.floor(m.mp)} / ${s.maxMp} MP`);
    root
      .querySelectorAll<HTMLButtonElement>("[data-ability]")
      .forEach((button) => {
        const id = button.dataset.ability as AbilityId;
        button.setAttribute("aria-pressed", String(m.ability === id));
        button.classList.toggle("low-mana", m.mp < ABILITIES[id].mp);
      });
  }
  function update(): void {
    const state = getState(),
      r = state.rpg;
    text("#rpg-gold", format(r.gold));
    text("#rpg-renown", "×" + format(state.worlds[2].score));
    const key =
      tab === "world"
        ? "world"
        : "" +
          tab +
          JSON.stringify([
            r.level,
            r.kills,
            r.cleared,
            r.potions,
            r.owned,
            r.gear,
            r.forged,
            r.attributes,
            r.party,
            r.recruited,
            r.claimed,
            r.status === "battle",
            r.maze.cell === MAP_CENTER,
            state.worlds[2].helpers,
            state.worlds[2].power,
            state.worlds[2].resonance,
          ]);
    if (key !== bodyKey) {
      bodyKey = key;
      battleKey = "";
      body.innerHTML =
        tab === "world"
          ? world()
          : tab === "party"
            ? roster()
            : tab === "bag"
              ? bag()
              : tab === "hero"
                ? hero()
                : tab === "camp"
                  ? camp()
                  : journal();
      if (tab === "world") {
        lastCell = -1;
        requestAnimationFrame(centerMap);
        const viewport = root.querySelector<HTMLElement>("#atlas-viewport")!;
        viewport.onwheel = () => {
          follow = false;
        };
        viewport.ontouchstart = () => {
          follow = false;
        };
      }
    }
    if (tab === "world") updateWorld();
    else {
      root
        .querySelectorAll<HTMLButtonElement>("[data-recruit]")
        .forEach((b) => {
          const c = COMPANIONS.find((c) => c.id === b.dataset.recruit)!;
          b.disabled = !companionReady(r, c.id) || r.gold < c.cost;
        });
      root
        .querySelectorAll<HTMLButtonElement>("[data-rpg-forge]")
        .forEach((b) => {
          const id = b.dataset.rpgForge!;
          b.disabled =
            r.level < 3 ||
            r.ink < forgeCost(r, id) ||
            (r.forged[id] || 0) >= 20;
        });
      root
        .querySelectorAll<HTMLButtonElement>('[data-rpg-action="buy-potion"]')
        .forEach((b) => (b.disabled = r.gold < 12 || r.potions >= 99));
      root
        .querySelectorAll<HTMLButtonElement>("[data-kingdom-upgrade]")
        .forEach((b) => {
          const key = b.dataset.kingdomUpgrade as Upgrade,
            w = state.worlds[2];
          b.disabled =
            w.bank < price(w, key, state) ||
            (key === "resonance" && w.score < 250);
        });
    }
    updateParty();
  }
  root.onclick = (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button",
    );
    if (!button || button.disabled) return;
    const r = getState().rpg;
    let changed = false;
    if (button.dataset.rpgTab) {
      tab = button.dataset.rpgTab as Tab;
      root
        .querySelectorAll<HTMLButtonElement>("[data-rpg-tab]")
        .forEach((el) =>
          el.classList.toggle("current", el.dataset.rpgTab === tab),
        );
      root
        .querySelectorAll<HTMLButtonElement>(".kingdom-tabs button")
        .forEach((el) =>
          el.setAttribute(
            "aria-current",
            el.dataset.rpgTab === tab ? "page" : "false",
          ),
        );
      update();
      return;
    }
    if (button.dataset.member) {
      selected = button.dataset.member as MemberId;
      update();
      return;
    }
    if (button.hasAttribute("data-locate")) {
      follow = true;
      centerMap();
      return;
    }
    if (button.dataset.mapCell !== undefined) {
      preview = Number(button.dataset.mapCell);
      changed = navigate(r, preview);
      follow = true;
    }
    if (button.dataset.ability)
      changed = chooseAbility(r, selected, button.dataset.ability as AbilityId);
    if (button.dataset.recruit) changed = recruit(r, button.dataset.recruit);
    if (button.dataset.party) changed = party(r, button.dataset.party);
    if (button.dataset.rpgEquip) changed = equip(r, button.dataset.rpgEquip);
    if (button.dataset.rpgAttribute)
      changed = allocate(r, button.dataset.rpgAttribute as Attribute);
    if (button.dataset.rpgForge) changed = forge(r, button.dataset.rpgForge);
    if (button.dataset.rpgClaim) {
      const amount = claim(r, button.dataset.rpgClaim);
      if (amount) {
        rewardRenown(getState(), amount);
        unlock(getState());
        changed = true;
      }
    }
    if (button.dataset.kingdomUpgrade)
      changed = purchase(
        getState(),
        2,
        button.dataset.kingdomUpgrade as Upgrade,
      );
    if (button.hasAttribute("data-next-page")) changed = nextPage(r);
    if (button.dataset.rpgAction) {
      const result = rpgAction(
        getState(),
        button.dataset.rpgAction as Parameters<typeof rpgAction>[1],
      );
      changed = !!result?.changed;
      if (button.dataset.rpgAction === "rest") {
        preview = MAP_CENTER;
        follow = true;
      }
    }
    if (changed) {
      update();
      hooks.changed(undefined, event);
    }
  };
  update();
  return { update };
}
