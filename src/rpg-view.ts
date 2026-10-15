import { type State, format, rpgAction, rewardRenown, unlock } from "./game";
import {
  REGIONS,
  ITEMS,
  COMPANIONS,
  SKILLS,
  QUESTS,
  enemy,
  stats,
  nextXp,
  points,
  skillReady,
  travel,
  equip,
  forge,
  forgeCost,
  allocate,
  party,
  claim,
  questProgress,
  type RpgAction,
  type Result,
  type Attribute,
} from "./rpg";
import { sprite, uiIcon } from "./art";
import "./rpg.css";

type Tab = "trail" | "bag" | "hero" | "map" | "camp" | "scraps";
export type RpgController = { update: () => void };
type Hooks = {
  changed: (result?: Result, event?: MouseEvent) => void;
};
export function mountRpg(
  root: HTMLElement,
  getState: () => State,
  hooks: Hooks,
): RpgController {
  let tab: Tab = "trail",
    filter = "all",
    key = "",
    lastResult: Result | undefined;
  const tabArt: Record<Tab, string> = {
    trail: "rpg-sword",
    bag: "rpg-chest",
    hero: "rpg-hero",
    map: "rpg-map",
    camp: "rpg-camp",
    scraps: "rpg-scroll",
  };
  function tabs(): { id: Tab; name: string; open: boolean }[] {
    const r = getState().rpg;
    return [
      { id: "trail", name: "Adventure", open: true },
      { id: "bag", name: "Bag", open: r.kills > 0 },
      { id: "hero", name: "Hero", open: r.level >= 2 },
      { id: "map", name: "Map", open: r.cleared > 0 },
      { id: "camp", name: "Camp", open: r.level >= 3 },
      { id: "scraps", name: "Journal", open: r.kills >= 5 },
    ];
  }
  function abilities(): string {
    const r = getState().rpg;
    return `<div class="rpg-abilities" aria-label="Combat abilities">${SKILLS.filter(
      (s) => s.id !== "attack" && r.level >= s.level,
    )
      .map(
        (s) =>
          `<button class="rpg-ability" data-rpg-action="${s.id}" aria-label="${s.name}" ${r.status !== "battle" || !skillReady(r, s.id) ? "disabled" : ""}>${sprite(s.sprite)}<span>${s.name}${s.mp ? "<small>" + s.mp + " MP</small>" : ""}</span></button>`,
      )
      .join("")}</div>`;
  }
  function bar(label: string, value: number, max: number, cls: string): string {
    return `<div class="rpg-bar-row"><span>${label}</span><div class="rpg-meter ${cls}"><i style="width:${Math.min(100, Math.max(0, (value / max) * 100))}%"></i></div><strong>${Math.floor(value)}<small>/${max}</small></strong></div>`;
  }
  function trail(): string {
    const r = getState().rpg,
      s = stats(r),
      foe = enemy(r),
      region = REGIONS[r.zone],
      skill = SKILLS.find((x) => x.id === "attack")!;
    const battle = r.status === "battle",
      victory = r.status === "victory",
      camp = r.status === "camp";
    return `<div class="rpg-canvas biome-${region.biome} ${lastResult?.damage ? "last-strike" : ""}" id="rpg-canvas"><div class="rpg-sky-sun"></div><div class="rpg-cloud rpg-cloud-one"></div><div class="rpg-cloud rpg-cloud-two"></div><div class="rpg-back-hills"></div><div class="rpg-front-hills"></div><div class="rpg-ground"></div><div class="rpg-path"></div><div class="rpg-scene-label"><span>${region.name}${r.zone === 8 ? " · " + (r.depth + 1) : ""}</span><small>${foe.boss ? "BOSS" : String(r.wave + 1).padStart(2, "0") + " / 05"}</small></div><div class="rpg-scenery scenery-left">${sprite(r.zone === 0 ? "rpg-hut" : r.zone === 1 ? "rpg-tree" : r.zone === 2 ? "crystal" : r.zone === 3 ? "rpg-mushroom" : r.zone === 4 ? "cloud" : r.zone === 5 ? "rpg-tree" : r.zone === 6 ? "rpg-golem" : "rpg-orb")}</div><div class="rpg-scenery scenery-right">${sprite(r.zone < 2 ? "rpg-tree" : r.zone === 2 ? "crystal" : r.zone === 3 ? "rpg-mushroom" : "rpg-tree")}</div><div class="rpg-hero actor" style="--cloak:${r.color * 43}deg">${sprite("rpg-hero")}<i class="actor-shadow"></i><span>you</span></div>${r.party
      .map((id, i) => {
        const ally = COMPANIONS.find((c) => c.id === id)!;
        return `<div class="rpg-party-actor ally-${i}">${sprite(ally.sprite)}</div>`;
      })
      .join(
        "",
      )}${battle ? `<div class="foe-label"><span>${foe.boss ? "♛ " : ""}${foe.name}</span><small>LV ${foe.level}</small><div class="foe-meter"><i style="width:${(r.enemyHp / foe.hp) * 100}%"></i></div><strong>${r.enemyHp} / ${foe.hp}</strong></div><button class="rpg-enemy actor ${foe.boss ? "boss" : ""}" id="rpg-enemy" data-rpg-action="attack" aria-label="${skill.name} ${foe.name}">${sprite(foe.sprite)}<i class="actor-shadow"></i></button><span class="enemy-intent ${foe.heavy ? "heavy" : ""}">${sprite(foe.heavy ? "rpg-sword-gold" : "rpg-sword")}<span>${foe.heavy ? "WINDING UP" : "WATCHING"}</span></span>` : camp ? `<div class="rpg-campfire">${sprite("ember")}</div><div class="encounter-card camp-card"><span class="encounter-kicker">A QUIET MOMENT</span><h3>The trail is waiting.</h3><button class="rpg-button rpg-primary" data-rpg-action="continue">${sprite("rpg-map")}Set out ${uiIcon("arrow")}</button></div>` : victory ? `<div class="encounter-card victory-card"><span class="encounter-kicker">${foe.boss ? "TRAIL CLEARED" : "VICTORY"}</span><h3>${foe.boss ? foe.name : "A little braver."}</h3><div class="victory-rewards"><span>${sprite("coin")}+${(4 + r.zone * 5) * (foe.boss ? 3 : 1)}</span><span>+${(8 + r.zone * 8) * (foe.boss ? 3 : 1)} XP</span>${lastResult?.drop ? `<span>${sprite(ITEMS.find((x) => x.id === lastResult!.drop)?.sprite || "rpg-chest")}</span>` : ""}</div>${lastResult?.levelUp ? `<span class="new-level">LEVEL ${r.level}</span>` : ""}<button class="rpg-button rpg-primary" id="rpg-continue" data-rpg-action="continue">Continue ${uiIcon("arrow")}</button>${foe.boss && r.cleared > r.zone ? '<button class="canvas-map-link" data-rpg-tab="map">' + sprite("rpg-map") + " A new horizon</button>" : ""}</div>` : `<div class="encounter-card down-card"><span class="encounter-kicker">JUST A SCRATCH.</span><h3>The path can wait.</h3><button class="rpg-button rpg-primary" data-rpg-action="rest">${sprite("rpg-camp")}Back to the fire</button></div>`}<div class="rpg-grass grass-a"></div><div class="rpg-grass grass-b"></div><div class="canvas-hand-note">${r.zone === 0 ? "somewhere, a story begins." : r.zone === 8 ? "there is always another page." : ""}</div></div><div class="rpg-combat-dock"><div class="hero-vitals"><div class="hero-name"><strong>The little adventurer</strong><span>LV ${r.level}</span></div>${bar("HP", r.hp, s.maxHp, "health")}${r.level >= 2 ? bar("MP", r.mp, s.maxMp, "mana") : ""}${bar("XP", r.xp, nextXp(r.level), "experience")}</div>${abilities()}<div class="rpg-command-row"><button class="rpg-button rpg-primary chosen-command" data-rpg-action="attack" ${!battle || !skillReady(r, "attack") ? "disabled" : ""}>${sprite(skill.sprite)}<span>${skill.name}${skill.mp ? "<small>" + skill.mp + " MP</small>" : ""}</span></button><button class="rpg-button compact-command" data-rpg-action="potion" aria-label="Use potion" title="Potion" ${!battle || r.potions === 0 ? "disabled" : ""}>${sprite("rpg-potion")}<span>${r.potions}</span></button><button class="rpg-button compact-command" data-rpg-action="rest" aria-label="Rest at camp" title="Camp">${sprite("rpg-camp")}</button>${r.cleared > 0 ? `<button class="rpg-button compact-command ${r.auto ? "auto-on" : ""}" data-rpg-action="auto" aria-label="Auto battle" aria-pressed="${r.auto}">${uiIcon("clock")}<span>AUTO</span></button>` : ""}</div></div>`;
  }
  function bag(): string {
    const r = getState().rpg;
    return `<section class="rpg-paper rpg-bag"><div class="paper-heading"><div><span class="paper-kicker">THINGS PICKED UP ALONG THE WAY</span><h3>A pocketful of possibility.</h3></div>${sprite("rpg-chest")}</div><div class="bag-filters">${[
      ["all", "All"],
      ["weapon", "Weapons"],
      ["armor", "Armor"],
      ["charm", "Charms"],
    ]
      .map(
        ([id, label]) =>
          `<button class="rpg-button ${filter === id ? "pressed" : ""}" data-bag-filter="${id}">${label}</button>`,
      )
      .join("")}</div><div class="bag-grid">${r.owned
      .filter(
        (id) =>
          filter === "all" || ITEMS.find((x) => x.id === id)?.slot === filter,
      )
      .map((id) => {
        const item = ITEMS.find((x) => x.id === id)!,
          active = r.gear[item.slot] === id;
        return `<button class="bag-item ${active ? "equipped" : ""}" data-rpg-equip="${id}" aria-label="${active ? "Equipped: " : "Equip "}${item.name}"><div class="item-portrait">${sprite(item.sprite)}${r.forged[id] ? "<span>+" + r.forged[id] + "</span>" : ""}</div><strong>${item.name}</strong><small>${item.slot === "weapon" ? "ATK +" + (item.attack + (r.forged[id] || 0) * 2) : item.slot === "armor" ? "DEF +" + (item.defense + (r.forged[id] || 0) * 2) : "MAG +" + (item.magic + (r.forged[id] || 0) * 2)}</small><span class="equipped-tag">${active ? "EQUIPPED" : "EQUIP"}</span></button>`;
      })
      .join("")}</div></section>`;
  }
  function hero(): string {
    const r = getState().rpg,
      s = stats(r);
    return `<section class="rpg-paper"><div class="hero-sheet"><div class="portrait-paper" style="--cloak:${r.color * 43}deg">${sprite("rpg-hero")}<span>the little adventurer</span></div><div class="character-summary"><span class="paper-kicker">A WORK IN PROGRESS</span><h3>Level ${r.level}</h3><div class="character-stats"><span>ATK <strong>${s.attack}</strong></span><span>DEF <strong>${s.defense}</strong></span><span>MAG <strong>${s.magic}</strong></span></div><div class="stat-points">${points(r)} unspent ${points(r) === 1 ? "point" : "points"}</div></div></div><div class="attribute-list">${(["might", "vigor", "wisdom"] as Attribute[]).map((a, i) => `<div class="attribute-row">${sprite(["rpg-sword", "rpg-shield", "rpg-orb"][i])}<span><strong>${a[0].toUpperCase() + a.slice(1)}</strong><small>${["ATK +2", "HP +7 · DEF +1", "MAG +3 · MP +2"][i]}</small></span><b>${r.attributes[a]}</b><button class="rpg-button" data-rpg-attribute="${a}" aria-label="Increase ${a}" ${points(r) < 1 ? "disabled" : ""}>+</button></div>`).join("")}</div><div class="paper-section-heading"><h4>Little talents</h4><span>${r.level}/50</span></div><div class="skill-collection">${SKILLS.map((s) => `<div class="skill-card ${r.level < s.level ? "unknown" : ""}">${sprite(s.sprite)}<strong>${r.level >= s.level ? s.name : "???"}</strong><small>${r.level >= s.level ? (s.mp ? s.mp + " MP" : "—") : "LV " + s.level}</small></div>`).join("")}</div>${r.cleared > 0 ? `<div class="paper-section-heading"><h4>Good company</h4><span>${r.party.length} / 2</span></div><div class="companion-grid">${COMPANIONS.map((c) => `<button class="companion ${r.party.includes(c.id) ? "traveling" : ""} ${r.cleared < c.cleared ? "unknown" : ""}" data-rpg-party="${c.id}" ${r.cleared < c.cleared ? "disabled" : ""}>${sprite(c.sprite)}<span><strong>${r.cleared >= c.cleared ? c.name : "???"}</strong><small>${r.cleared >= c.cleared ? c.stat : "· · ·"}</small></span><i>${r.party.includes(c.id) ? "✓" : "+"}</i></button>`).join("")}</div>` : ""}</section>`;
  }
  function map(): string {
    const r = getState().rpg;
    return `<section class="rpg-paper rpg-map-paper"><div class="paper-heading"><div><span class="paper-kicker">A MAP WITH UNFINISHED EDGES</span><h3>Beyond the next hill.</h3></div>${sprite("rpg-map")}</div><div class="region-map">${REGIONS.map((region, i) => `<button class="map-region ${i <= r.cleared ? "charted" : "uncharted"} ${i === r.zone ? "current" : ""} ${i < r.cleared ? "cleared" : ""}" data-rpg-zone="${i}" ${i > r.cleared ? "disabled" : ""}><span class="map-number">${i === 8 ? "∞" : String(i + 1).padStart(2, "0")}</span>${sprite(region.sprite)}<strong>${i <= r.cleared ? region.short : "???"}</strong><small>${i === r.zone ? "YOU ARE HERE" : i < r.cleared ? "CLEARED" : i === r.cleared ? "EXPLORE" : "· · ·"}</small>${i < r.cleared ? "<i>✓</i>" : ""}</button>`).join("")}</div></section>`;
  }
  function camp(): string {
    const r = getState().rpg;
    return `<section class="rpg-paper camp-paper"><div class="camp-banner">${sprite("rpg-camp")}<div><span class="paper-kicker">SOMETHING LIKE HOME</span><h3>The little camp.</h3></div><button class="rpg-button" data-rpg-action="rest">Rest ${uiIcon("clock")}</button></div><div class="camp-supplies"><div>${sprite("rpg-potion")}<span><strong>Red bottle</strong><small>${r.potions} in your bag</small></span><button class="rpg-button" data-rpg-action="buy-potion" ${r.gold < 12 || r.potions >= 99 ? "disabled" : ""}>12 ${sprite("coin")}+</button></div></div><div class="paper-section-heading"><h4>A sharper idea.</h4><span>${sprite("rpg-ink")}${r.ink}</span></div><div class="forge-list">${(
      ["weapon", "armor", "charm"] as const
    )
      .filter((slot) => !!r.gear[slot])
      .map((slot) => {
        const id = r.gear[slot],
          item = ITEMS.find((x) => x.id === id)!;
        return `<div class="forge-row">${sprite(item.sprite)}<span><strong>${item.name}</strong><small>+${r.forged[id] || 0} ${slot === "weapon" ? "ATK +2" : slot === "armor" ? "DEF +2" : "MAG +2"}</small></span><button class="rpg-button" data-rpg-forge="${id}" ${r.ink < forgeCost(r, id) || (r.forged[id] || 0) >= 20 ? "disabled" : ""}>${(r.forged[id] || 0) >= 20 ? "MAX" : forgeCost(r, id)} ${sprite("rpg-ink")}+</button></div>`;
      })
      .join("")}</div></section>`;
  }
  function scraps(): string {
    const r = getState().rpg;
    return `<section class="rpg-paper"><div class="paper-heading"><div><span class="paper-kicker">BITS OF A BIGGER STORY</span><h3>Unfinished business.</h3></div>${sprite("rpg-scroll")}</div><div class="quest-list">${QUESTS.map(
      (q) => {
        const n = questProgress(r, q.kind),
          done = r.claimed.includes(q.id);
        return `<div class="quest-card ${done ? "claimed" : ""}">${sprite(q.sprite)}<div><h4>${q.name}</h4><span>${Math.min(n, q.goal)} / ${q.goal} ${q.kind === "cleared" ? "trails" : q.kind === "items" ? "treasures" : q.kind === "forged" ? "forgings" : q.kind === "level" ? "levels" : "creatures"}</span><div class="quest-rewards">${sprite("coin")} ${q.gold} <b>·</b> ${sprite("rpg-ink")} ${q.ink} <b>·</b> ${q.renown} renown</div></div><button class="rpg-button" data-rpg-claim="${q.id}" ${done || n < q.goal ? "disabled" : ""}>${done ? "✓" : "Claim"}</button></div>`;
      },
    ).join("")}</div></section>`;
  }
  function render(force = false): void {
    const state = getState(),
      r = state.rpg,
      newKey = `${r.revision}:${tab}:${filter}`;
    if (!force && key === newKey) return;
    key = newKey;
    if (!tabs().find((t) => t.id === tab)?.open) tab = "trail";
    const active = (document.activeElement as HTMLElement)?.closest("button");
    const attribute =
      active && root.contains(active)
        ? [
            "data-rpg-action",
            "data-rpg-equip",
            "data-rpg-attribute",
            "data-rpg-party",
            "data-rpg-forge",
            "data-rpg-claim",
            "data-rpg-tab",
            "data-bag-filter",
          ].find((a) => active.hasAttribute(a))
        : undefined;
    const focus = attribute
      ? { attribute, value: active!.getAttribute(attribute)! }
      : null;
    root.innerHTML = `<section class="kingdom-app" aria-label="Pocket kingdoms"><div class="kingdom-topline"><span class="kingdom-chapter">${sprite("rpg-map")}${r.zone < 8 ? "CHAPTER " + String(r.zone + 1).padStart(2, "0") : "BEYOND THE MAP"}</span><span class="rpg-gold">${sprite("coin")}<span id="rpg-gold">${format(r.gold)}</span></span></div><nav class="kingdom-tabs" aria-label="Kingdom navigation">${tabs()
      .filter((t) => t.open)
      .map(
        (t) =>
          `<button class="${tab === t.id ? "current" : ""}" data-rpg-tab="${t.id}" ${tab === t.id ? 'aria-current="page"' : ""}>${sprite(tabArt[t.id])}<span>${t.name}</span>${t.id === "hero" && points(r) > 0 ? "<i>" + points(r) + "</i>" : ""}</button>`,
      )
      .join(
        "",
      )}</nav><div class="kingdom-document ${tab === "trail" ? "" : "paper-document"}">${tab === "trail" ? trail() : tab === "bag" ? bag() : tab === "hero" ? hero() : tab === "map" ? map() : tab === "camp" ? camp() : scraps()}</div><div class="rpg-log"><span id="rpg-message">${r.log[0]}</span><span>${r.kills} encounters</span></div></section>`;
    if (focus)
      (
        root.querySelector<HTMLButtonElement>(
          `[${focus.attribute}="${focus.value}"]:not(:disabled)`,
        ) ||
        root.querySelector<HTMLButtonElement>(".kingdom-tabs button.current")
      )?.focus({ preventScroll: true });
  }
  root.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
      "button",
    );
    if (!button || button.disabled) return;
    const r = getState().rpg;
    if (button.dataset.rpgTab) {
      tab = button.dataset.rpgTab as Tab;
      lastResult = undefined;
      render(true);
      return;
    }
    if (button.dataset.bagFilter) {
      filter = button.dataset.bagFilter;
      render(true);
      return;
    }
    if (button.dataset.rpgAction) {
      const action = button.dataset.rpgAction as RpgAction;
      const out = rpgAction(getState(), action);
      if (!out?.changed) return;
      lastResult = out;
      if (action === "rest") tab = "trail";
      render();
      hooks.changed(out, event);
      const message = root.querySelector("#rpg-message");
      if (message && out.message) message.textContent = out.message;
      return;
    }
    let changed = false;
    if (button.dataset.rpgZone) {
      changed = travel(r, Number(button.dataset.rpgZone));
      if (changed) {
        tab = "trail";
        lastResult = undefined;
      }
    }
    if (button.dataset.rpgEquip) changed = equip(r, button.dataset.rpgEquip);
    if (button.dataset.rpgAttribute)
      changed = allocate(r, button.dataset.rpgAttribute as Attribute);
    if (button.dataset.rpgParty) changed = party(r, button.dataset.rpgParty);
    if (button.dataset.rpgForge) changed = forge(r, button.dataset.rpgForge);
    if (button.dataset.rpgClaim) {
      const amount = claim(r, button.dataset.rpgClaim);
      if (amount) {
        rewardRenown(getState(), amount);
        unlock(getState());
        changed = true;
      }
    }
    if (changed) {
      render();
      hooks.changed();
    }
  });
  render();
  return {
    update: () => {
      render();
      const renown = root.querySelector("#rpg-renown");
      if (renown) renown.textContent = format(getState().worlds[2].score);
    },
  };
}
