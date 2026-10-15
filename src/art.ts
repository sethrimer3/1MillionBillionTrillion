export const svg = (body: string, cls = "", view = "0 0 24 24") =>
  `<svg class="${cls}" viewBox="${view}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
export function uiIcon(name: string, cls = ""): string {
  const paths: Record<string, string> = {
    gate: '<path d="M5 21V10a7 7 0 0 1 14 0v11Zm4 0V10a3 3 0 0 1 6 0v11m-3-13v13M3 21h18"/>',
    worlds:
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    relics:
      '<path d="m5 8 7-5 7 5v9l-7 4-7-4Zm0 0 7 4 7-4m-7 4v9m-7-4 7-5 7 5"/>',
    settings:
      '<path d="m9 3 1-1h4l1 3 3 1 3 1v4l-2 2-1 3 1 3-3 2-3-1-3 1-3 1-3-3 1-3-1-3-2-2 1-4 3-1Z"/><circle cx="12" cy="12" r="3"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    sound: '<path d="m3 9 5-1 5-5v18l-5-5H3Zm14-2q6 5 0 10"/>',
    muted: '<path d="m3 9 5-1 5-5v18l-5-5H3Zm14 0 5 6m0-6-5 6"/>',
    check: '<path d="m5 12 4 5L20 6"/>',
    bolt: '<path d="M13 2 5 14h7l-1 8 9-13h-7Z"/>',
    bag: '<path d="m7 6-2-4 7 2 7-2-2 4-3 3q10 7 7 12H3q-3-5 7-12Zm3 3h4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    download: '<path d="M12 3v13m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    upload: '<path d="M12 17V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
    lock: '<rect x="6" y="10" width="12" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    star: '<path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z"/>',
    full: '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',
  };
  return svg(paths[name] || paths.star, cls);
}
export const sprite = (name: string, cls = "", alt = "") =>
  `<img class="sprite ${cls}" src="${import.meta.env.BASE_URL}sprites/${name}.png" alt="${alt}" draggable="false" width="48" height="48"/>`;
export function gem(i: number, lit: boolean, cls = "") {
  const colors = [
    "#e9877b",
    "#edb068",
    "#e7d187",
    "#9fbe8e",
    "#88b9d4",
    "#aaa5d5",
    "#c19cd1",
  ];
  return `<svg class="gem ${lit ? "lit" : ""} ${cls}" viewBox="0 0 16 20" fill="none" aria-hidden="true" shape-rendering="crispEdges"><path d="M6 0h4v2h2v2h2v4h2v4h-2v4h-2v2h-2v2H6v-2H4v-2H2v-4H0V8h2V4h2V2h2Z" fill="${lit ? "#252531" : "#242631"}"/><path d="m8 2 6 8-6 8-6-8Z" fill="${lit ? colors[i] : "#3c3e4b"}"/><path d="m8 2-1 8-5 0Z" fill="${lit ? "#ffe5c0" : "#57525b"}" opacity=".65"/><path d="m7 10 7 0-6 8Z" fill="#161d2e" opacity=".3"/></svg>`;
}
export function scenery() {
  return `<svg class="scene-landscape" viewBox="0 0 1000 660" preserveAspectRatio="xMidYMax slice" aria-hidden="true" shape-rendering="crispEdges"><path d="M0 310 55 290 130 320 220 254 304 306 386 280 450 320 560 277 640 318 747 250 820 296 890 278 1000 318V660H0Z" fill="#1e202d"/><path d="m0 390 80-40 105 32 100-60 110 66 96-20 104 28 115-45 120 21 110-35 60 43v280H0Z" fill="#151923"/><path d="M0 486 120 473 180 483 300 469 390 480 520 472 630 481 750 468 830 481 1000 473V660H0Z" fill="#171a22"/><path d="m367 660 88-170h92l89 170" fill="#22212a"/><path d="m391 618 221 1m-199-43 175 1m-158-38 140 1m-125-28 109 1M499 513l-3 147m-61-80-16 39m136-77 13 35m-68-1 1 42m83 0 20 42m-179-120-12 36" stroke="#35303a" stroke-width="2"/><g fill="#0c111a"><path d="M0 0h34l16 117 25 61 12 119-15 160-25 78H0Zm42 113 57-70 55-43h13L89 79l-36 75m16 129 49-66 14-85 10-33h9l-8 123-60 92M31 301l-16 86 18 101 16-7-12-102 14-74"/><path d="M1000 0h-39l-15 136-35 62 7 127 12 150 33 76h37Zm-50 140-39-64-64-52-9-24h-14l13 39 63 52 30 78m-2 137-43-88-16-89-9-33h-9l12 131 49 106m38 41 13 61-5 59-13 7 7-66-17-56"/></g><g fill="#48404b" opacity=".5"><rect x="152" y="531" width="18" height="4"/><rect x="167" y="528" width="6" height="3"/><rect x="814" y="510" width="18" height="5"/><rect x="808" y="514" width="28" height="4"/><rect x="285" y="580" width="14" height="4"/><rect x="708" y="613" width="18" height="4"/></g></svg>`;
}
export function torch(side: number, lit: boolean) {
  return `<button class="torch torch-${side} ${lit ? "burning" : "extinguished"}" data-torch="${side}" aria-label="${lit ? "Extinguish" : "Light"} ${side ? "right" : "left"} torch" aria-pressed="${lit}"><span class="torch-light"></span><span class="torch-frames">${sprite("torch-0", "torch-base")}${[0, 1, 2].map((n) => sprite("torch-" + n, "torch-frame frame-" + n)).join("")}</span><span class="torch-sparks"><i></i><i></i><i></i></span></button>`;
}
