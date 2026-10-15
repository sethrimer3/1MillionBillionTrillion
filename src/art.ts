export const svg = (body: string, cls = '', view = '0 0 80 80') => `<svg class="${cls}" viewBox="${view}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
export function icon(kind: string, cls='') {
  const paths: Record<string,string> = {
    ember: '<path d="M40 9c6 18 20 22 19 39-1 23-36 26-39 4-2-13 9-21 11-30 5 6 6 10 6 10s5-10 3-23Z" fill="#eb8b6f"/><path d="M40 41c8 9 14 21 1 23-15-1-10-14-1-23Z" fill="#f6d37d"/><path d="m20 70 40-3m-39-4 37 10"/>',
    carrot: '<path d="m48 29 13 12-39 29c-4 2-7-1-5-5Z" fill="#eaa267"/><path d="m47 30 2-19 7 9 10-9-1 15 9 1-15 14" fill="#9ab78b"/><path d="m35 43 7 6m-16 9 5 4"/>',
    sun: '<circle cx="40" cy="40" r="18" fill="#f2d775"/><path d="M40 5v9m0 52v9M5 40h9m52 0h9M15 15l7 7m36 36 7 7m0-50-7 7M22 58l-7 7"/><path d="M32 40h1m14 0h1m-14 7q6 6 12 0"/>',
    leaf: '<path d="M15 59C10 24 35 14 65 12c3 31-8 59-41 53Z" fill="#a9c499"/><path d="M10 73 55 27M29 54l-2-15m13 4 14 1"/>',
    cloud: '<path d="M17 49C0 46 6 25 23 28 22 6 55 7 57 28c22-4 28 22 6 23Z" fill="#c1dce9"/><path d="m24 60-4 8m22-9-4 8m22-7-4 8"/>',
    moon: '<path d="M51 11c-33 3-43 46-10 58 15 5 29-3 32-16C43 64 27 33 51 11Z" fill="#b4b7d8"/><path d="m61 9 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z"/>',
    flower: '<path d="M40 45v30m-1-11C20 64 20 51 20 51s16-2 19 13m2-5c1-13 18-14 18-14s1 14-18 14" fill="#abc59b"/><path d="M39 15c-9-20-25 0-14 9-21-4-20 20-2 20-7 18 16 24 19 7 10 17 28 1 17-11 22-4 12-27-3-20 2-20-19-22-17-5Z" fill="#d5b7d8"/><circle cx="40" cy="31" r="9" fill="#f3d789"/>',
    star: '<path d="m40 7 8 23 25 2-20 16 6 25-20-15-21 14 7-24L6 31l26-1Z" fill="#e3cf94"/><path d="M32 40h1m14 0h1m-14 7q6 5 12 0"/>',
    lock: '<rect x="23" y="34" width="35" height="30" rx="4"/><path d="M30 34V24c0-17 22-17 22 0v10m-11 13v6"/>',
  };
  return svg(paths[kind] || paths.star, cls);
}
export function gate(gems: number, opened=false) {
  const colors=['#e87770','#e9a25d','#e8cc60','#92b38b','#8bbbd3','#9c9bca','#ba9bc6'];
  const positions=[[128,140],[147,101],[180,74],[220,64],[260,74],[293,101],[312,140]];
  return svg(`
  <path d="M58 415c25-5 41-1 56-3m210 3 53-2M77 427l275 2" stroke="#c8c7b7"/>
  <g fill="#e4e5d7" stroke="#787e69" stroke-width="2.8"><path d="M96 407 98 177C88 13 349-2 345 178l2 230-32 3-1-235C321 59 127 54 129 179l-2 231Z"/>
  <path d="m100 190 27 1m-27 52 26 2m-28 56 28-1m-29 56 29 2m-21-216 28 8m-10-59 22 17m14-57 12 24m24-41 7 28m39-30-3 30m40-20-13 24m42 6-22 17m39 28-28 8m5 43 31-1m-30 55 31 1m-30 55 31-1m-29 55 30 2"/>
  </g>
  ${opened?'<path d="M135 409 136 179c-2-105 168-106 171-1l1 232Z" fill="#f3e5ad" stroke="#a5ab86"/><path d="m220 218 10 29 31 2-24 19 8 30-25-18-26 18 9-30-24-19 31-2Z" fill="#fff9de" stroke="#c7b775"/><text x="220" y="349" text-anchor="middle" fill="#a69862" stroke="none" font-size="18" font-family="cursive">hello, possibility.</text>':''}
  <g class="gate-doors ${opened?'opened':''}"><path d="M135 409 136 179c-2-105 168-106 171-1l1 232Z" fill="#c4ccad" stroke="#636f56" stroke-width="3"/>
  <path d="m144 403 2-224c-1-91 147-91 151-1l2 225Z" fill="#d7ddc2" stroke="#8b9879"/>
  <path d="M221 104v301m-51-271-2 264m108-264 3 265m-83-286-1 288m50-287 2 287" stroke="#a3b18c"/>
  <path d="m143 208 64-2v14l-64 1m92-15 64 2v14l-64-2m-92 116 64-1v14l-64 1m92-14 66 1v14l-66-1" fill="#8e9b7b" stroke="#69765d"/>
  <g stroke="#68765b" fill="#d7ce89"><path d="M197 269c-15-6-18 24-1 26 14 0 15-25 1-26Zm48 0c-16-5-18 24-1 26 14 0 15-25 1-26Z"/></g>
  <path d="m151 165 137-1 1 30-139 1Z" fill="#edf0df" stroke="#7d896c"/>
  <text x="220" y="184" text-anchor="middle" fill="#59664c" stroke="none" font-size="10" font-family="monospace">1 MILLION BILLION TRILLION</text></g>
  ${positions.map(([x,y],i)=>`<path d="m${x} ${y-10} 9 10-9 11-9-11Z" fill="${i<gems?colors[i]:'#d4d6c9'}" stroke="${i<gems?'#76766b':'#a8ac9a'}"/><path d="m${x-3} ${y-4} 3-3 3 3" stroke="${i<gems?'#fff9e7':'#e9eadf'}"/>`).join('')}
  <g stroke="#8caa77" fill="#b5c599"><path d="M105 409c-16-22-21-46-13-68-21 12-17 34-3 47-21-8-30-2-30-2 5 16 27 16 39 22m232-1c13-20 20-33 15-49 16 8 13 27 3 36 21-11 29-4 29-4-4 12-24 15-40 17"/><path d="M83 377c-14-21-8-42 0-47m261 64 22-26"/></g>
  <g fill="#f4d995" stroke="#a99a6a"><circle cx="79" cy="350" r="4"/><circle cx="361" cy="375" r="4"/></g>
  <path d="m59 408 9-5 9 4m279 10 9-4 12 2" stroke="#acb29d"/>
  `,'gate-art','0 0 440 450');
}
