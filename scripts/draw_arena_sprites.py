"""Original mouse-drawn-looking sprites for Shard Drift. No external artwork."""
from pathlib import Path
import random

OUT = Path(__file__).resolve().parents[1] / "public" / "sprites"
OUT.mkdir(parents=True, exist_ok=True)

def save(name, body, box="0 0 96 96"):
    (OUT / f"arena-{name}.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" shape-rendering="crispEdges">{body}</svg>')

colors = ["#c8efad", "#f2ce83", "#e59caa", "#9dded8", "#b4a0e4", "#eef2c1"]
for tier, color in enumerate(colors):
    # Right-facing asymmetric paper darts, with a second wobbly pencil outline.
    body = f'<path d="m8 18 78 28-3 5-34 9-23 23-1-34Z" fill="#101e22" stroke="#101e22" stroke-width="5"/><path d="m9 19 72 28-28 9-24 23-1-33Z" fill="{color}" stroke="#344c44" stroke-width="2"/><path d="m11 22 40 30 20-5-27 12-12 17-5-30Z" fill="#709784"/><path d="m14 24 50 21-24-3-11-3m4 12 2 12" fill="none" stroke="#f3f2ce" stroke-width="2"/><path d="m12 19 22 8m-7 37 1 12m36-25 11-3" stroke="#1b3731" fill="none" stroke-width="2"/>'
    if tier == 1:
        body += '<path d="m41 43 39 2v7H43Z" fill="#405c60" stroke="#172d30" stroke-width="3"/><path d="m47 44 29 2" stroke="#efead0" stroke-width="2"/>'
    elif tier == 2:
        body += '<path d="m29 42 13-8 15 11-2 14-15 3-12-9Z" fill="#a65f80" stroke="#352f49" stroke-width="3"/><path d="m41 36 1 20m-9-10 17 1" stroke="#f2c0bb" stroke-width="3"/><path d="m19 39-7-5m8 19-8 4" stroke="#a65f80" stroke-width="5"/>'
    elif tier == 3:
        body += '<path d="m36 36 34 6 4 9-37 8-8-11Z" fill="#3d8588" stroke="#1c454e" stroke-width="3"/><path d="m42 41 25 4v5l-27 4Z" fill="#e8ffc7"/><path d="m73 42 1 12" stroke="#edf8c3" stroke-width="4"/>'
    elif tier == 4:
        body += '<path d="m41 29 10 12 14-2-6 13 8 11-16-2-10 12-2-15-14-5 14-8Z" fill="#7867a8" stroke="#363653" stroke-width="3"/><path d="m39 47 6-6 9 6-5 9-10-3Z" fill="#f0d5e1" stroke="#464361" stroke-width="2"/>'
    elif tier == 5:
        body += '<path d="m28 44 17-13 22 15-21 16Z" fill="#e5df97" stroke="#575c47" stroke-width="3"/><path d="m35 45 11-6 12 7-12 8Z" fill="#fff9dd"/><path d="m43 41 3-2 3 8-4 4Z" fill="#2b6156"/><path d="m20 33-8-8m8 36-7 8" stroke="#eeeab8" stroke-width="3"/>'
    save(f"ship-{tier}", body)

shapes = [
    [(-.85,-.38),(-.3,-1),(.5,-.78),(1,.03),(.65,.82),(-.25,1),(-1,.4)],
    [(-.9,-.5),(.15,-1),(1,-.28),(.72,.6),(-.25,.97),(-1,.16)],
    [(-.72,-.8),(.2,-1),(.95,-.3),(.55,.9),(-.5,.75),(-1,.1)],
    [(-1,-.3),(-.4,-1),(.7,-.72),(1,.3),(.2,1),(-.72,.6)],
]
palettes = [["#487565", "#91bd86", "#c3d794", "#72a782", "#355751"], ["#5d8f8d", "#a7cfa2", "#d4dfb4", "#7ab0a0", "#426d70"], ["#476b69", "#7fb6a6", "#bce1b0", "#628e80", "#36534f"], ["#767e66", "#b0c68b", "#e3dfa5", "#8dada0", "#526e64"]]
for idx, points in enumerate(shapes):
    pts = [(48+x*42,48+y*42) for x,y in points]
    path = "M"+" ".join(f"{x:.0f} {y:.0f}" for x,y in pts)+"Z"
    palette=palettes[idx]
    body=f'<path d="{path}" fill="{palette[0]}" stroke="#1b3936" stroke-width="5" stroke-linejoin="miter"/>'
    for i in range(len(pts)):
        a,b=pts[i],pts[(i+1)%len(pts)]
        body+=f'<path d="M{a[0]:.0f} {a[1]:.0f} {b[0]:.0f} {b[1]:.0f} 44 43Z" fill="{palette[i%len(palette)]}"/>'
    body+=f'<path d="{path}" fill="none" stroke="#294a42" stroke-width="2"/><path d="m22 28 9-7 6-9m-16 19-5 8m36-27 9 5m12 41-4 13m-24 3-8-2m6-30 4 4-3 8 6 4" stroke="#e2eac2" stroke-width="1.5" fill="none"/><path d="m28 54 4-5 7 2-2 10m22-25 3 6 8-1m-22 8 5 8-2 5" stroke="#3e6759" stroke-width="1.5" fill="none"/>'
    save(f"crystal-{idx}",body)

save("mine", '<path d="m45 8 9 20 18-8-7 20 20 10-22 8 7 20-21-10-11 19-5-23-22 1 16-17-12-17 21 4Z" fill="#aa6c82" stroke="#2d323c" stroke-width="4"/><path d="m35 36 16-5 14 14-7 18-17 2-12-15Z" fill="#e9b3ae" stroke="#624a61" stroke-width="3"/><path d="m44 37 7 4-4 13-7-5Z" fill="#ffedba"/>')
save("coin", '<path d="m30 12 31 1 16 19-2 35-19 17-31-5-11-23 3-29Z" fill="#c5b86b" stroke="#273a36" stroke-width="5"/><path d="m31 22 26-2 11 15-2 26-16 12-20-6-7-18Z" fill="#eee0a3" stroke="#8c945f" stroke-width="3"/><path d="m46 30-8 19 14-2-8 19" stroke="#7b875c" stroke-width="5" fill="none"/><path d="m25 27 8-4m30 40-8 6" stroke="#fff3c7" stroke-width="3"/>')
save("damage", '<path d="m17 73 11 9 48-57-2-13-15 4Z" fill="#d5dec0" stroke="#283f37" stroke-width="4"/><path d="m31 62 33-40m-44 32 21 21m-29 6 17-18" stroke="#c7a574" stroke-width="7"/><path d="m30 62 32-38" stroke="#f8f0c5" stroke-width="3"/>')
save("speed", '<path d="m13 27 68 20-27 9-23 25-1-34Z" fill="#b5ddb1" stroke="#2b4c41" stroke-width="4"/><path d="m9 57 11-5m-14 18 15-7m-8 18 13-8" stroke="#e1dba6" stroke-width="4"/><path d="m23 32 35 13-18 3" fill="none" stroke="#f5edc7" stroke-width="3"/>')
save("capacity", '<path d="m8 43 24 8-9 4-6 12-1-16Zm24-26 28 10-10 4-8 13-1-16Zm20 41 31 11-11 4-11 14-1-17Z" fill="#b8dbac" stroke="#2e4b3e" stroke-width="3"/><path d="m65 13 0 27m-13-13h27" stroke="#ede2a8" stroke-width="5"/>')
save("merge", '<path d="m11 17 29 11-10 6-9 12-1-17Zm2 43 28 10-11 6-7 10-2-15Zm43-27 30 11-12 7-11 15-1-21Z" fill="#d3e6b5" stroke="#2b493c" stroke-width="3"/><path d="m38 33 13 13-12 16m5-16h15" stroke="#e3c890" stroke-width="4" fill="none"/>')

random.seed(17)
body='<path fill="#142c29" d="M0 0h192v192H0Z"/>'
for _ in range(45):
    x,y=random.randrange(192),random.randrange(192)
    body+=f'<path d="m{x} {y} {random.randrange(1,5)} {random.choice([-1,0,1])}" stroke="{random.choice(["#203b33","#1a342e","#294138"])}" stroke-width="1"/>'
body+='<path d="m11 66 4-3 3 2m104 85 2-6 5 2m-63 71 7 1-4 4" stroke="#35513e" stroke-width="1" fill="none"/>'
save("floor",body,"0 0 192 192")
save("panel", '<path d="m2 3 18-1 2 3-1 17-18-1-2-3Z" fill="#1d3530" stroke="#60715a" stroke-width="2"/><path d="m4 5 13-1m-13 4-1 9m4 2 12 1" stroke="#829376" stroke-width="1" fill="none"/>',"0 0 24 24")
save("fern", '<g fill="none" stroke="#2b4d3b" stroke-width="3"><path d="m48 91-4-70m2 51L15 48m32 13L76 31m-30 9-20-22m19 35 18-34m-16 61 35-17"/></g><g fill="#375b41" stroke="#1b3a2e" stroke-width="1"><path d="m44 63-25-3-8-17 23 11Zm2-5 17-26 19-7-8 22Zm0-16-21-13-3-16 17 13Zm2 35 20-17 18-2-13 16Zm-3 0-28-3-10-14 22 5Z"/></g>')
print("Drew 19 original Shard Drift sprites.")
