const UI_ICONS = new Set([
  "gate",
  "worlds",
  "prestige",
  "relics",
  "settings",
  "arrow",
  "back",
  "close",
  "sound",
  "muted",
  "check",
  "bolt",
  "bag",
  "clock",
  "download",
  "upload",
  "lock",
  "star",
  "full",
  "plus",
  "spark",
  "infinity",
]);

// Keep a stable icon box while displaying original, transparent Paint-like PNGs.
export function uiIcon(name: string, cls = ""): string {
  const icon = UI_ICONS.has(name) ? name : "star";
  return `<svg class="ui-icon ${cls}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><image href="${import.meta.env.BASE_URL}sprites/ui-${icon}.png" width="64" height="64"/></svg>`;
}
export const sprite = (name: string, cls = "", alt = "") =>
  `<img class="sprite ${cls}" src="${import.meta.env.BASE_URL}sprites/${name}.${name.startsWith("rpg-") || name.startsWith("scene-") || name.startsWith("arena-") || name.startsWith("cosmos-") ? "svg" : "png"}" alt="${alt}" draggable="false" width="48" height="48"/>`;
export function gem(i: number, lit: boolean, cls = "") {
  const index = Math.max(0, Math.min(6, i));
  const image = `gem-${index}${lit ? "" : "-off"}`;
  return `<svg class="gem ${lit ? "lit" : ""} ${cls}" viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><image href="${import.meta.env.BASE_URL}sprites/ui-${image}.png" width="48" height="60"/></svg>`;
}

export function stoneSlot(i: number, lit: boolean): string {
  return `<img class="socket-cut" src="${import.meta.env.BASE_URL}sprites/ui-socket-${i}.png" alt="" draggable="false" width="64" height="76"/><span class="socket-stone-gem">${lit ? gem(i, true) : ""}</span>`;
}

export function scenery() {
  return `<svg class="scene-landscape" viewBox="0 0 1000 660" preserveAspectRatio="xMidYMax slice" aria-hidden="true" shape-rendering="crispEdges"><path d="M0 310 55 290 130 320 220 254 304 306 386 280 450 320 560 277 640 318 747 250 820 296 890 278 1000 318V660H0Z" fill="#1e202d"/><path d="m0 390 80-40 105 32 100-60 110 66 96-20 104 28 115-45 120 21 110-35 60 43v280H0Z" fill="#151923"/><path d="M0 486 120 473 180 483 300 469 390 480 520 472 630 481 750 468 830 481 1000 473V660H0Z" fill="#171a22"/><path d="m367 660 88-170h92l89 170" fill="#22212a"/><path d="m391 618 221 1m-199-43 175 1m-158-38 140 1m-125-28 109 1M499 513l-3 147m-61-80-16 39m136-77 13 35m-68-1 1 42m83 0 20 42m-179-120-12 36" stroke="#35303a" stroke-width="2"/><g fill="#0c111a"><path d="M0 0h34l16 117 25 61 12 119-15 160-25 78H0Zm42 113 57-70 55-43h13L89 79l-36 75m16 129 49-66 14-85 10-33h9l-8 123-60 92M31 301l-16 86 18 101 16-7-12-102 14-74"/><path d="M1000 0h-39l-15 136-35 62 7 127 12 150 33 76h37Zm-50 140-39-64-64-52-9-24h-14l13 39 63 52 30 78m-2 137-43-88-16-89-9-33h-9l12 131 49 106m38 41 13 61-5 59-13 7 7-66-17-56"/></g><g fill="#48404b" opacity=".5"><rect x="152" y="531" width="18" height="4"/><rect x="167" y="528" width="6" height="3"/><rect x="814" y="510" width="18" height="5"/><rect x="808" y="514" width="28" height="4"/><rect x="285" y="580" width="14" height="4"/><rect x="708" y="613" width="18" height="4"/></g></svg>`;
}
export function torch(side: number, lit: boolean) {
  return `<button class="torch torch-${side} ${lit ? "burning" : "extinguished"}" data-torch="${side}" aria-label="${lit ? "Extinguish" : "Light"} ${side ? "right" : "left"} torch" aria-pressed="${lit}"><span class="torch-light"></span><span class="torch-frames">${sprite("torch-0", "torch-base")}${[0, 1, 2].map((n) => sprite("torch-" + n, "torch-frame frame-" + n)).join("")}</span><span class="torch-sparks"><i></i><i></i><i></i></span></button>`;
}
