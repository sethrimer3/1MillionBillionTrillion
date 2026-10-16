"""Original Paint-like fireflies, celestial bodies, tools, and midnight scenery."""
from pathlib import Path
import random
OUT=Path(__file__).resolve().parents[1]/"public"/"sprites"
def save(name,body,box="0 0 96 96"):
    w,h=box.split()[2:]
    (OUT/f"cosmos-{name}.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{box}" shape-rendering="crispEdges"><g fill="none" stroke="#333544" stroke-width="2" stroke-linejoin="round">{body}</g></svg>')

for frame in range(3):
    wing=['m40 40-23-13-6 10 9 13 20 5m16-15 23-13 6 10-9 13-20 5','m40 40-12-22-12 3 2 18 22 13m16-12 12-22 12 3-2 18-22 13','m39 43-25 2-2 13 14 5 16-11m14-9 25 2 2 13-14 5-16-11'][frame]
    body='<path d="m45 9 16 4 13 13 5 22-7 22-21 12-23-8-12-20 3-25Z" fill="#e8db8b" opacity=".12" stroke="none"/>'
    body+=f'<path d="{wing}" fill="#b3bad3" stroke="#6b7195"/><path d="m39 34 18-1 6 15-4 25-10 9-12-8-4-24Z" fill="#464458"/><path d="m36 56 25-1-2 18-10 8-12-8Z" fill="#e3d782"/><path d="m40 59 17-1-3 13-7 4-7-6Z" fill="#fff0b2" stroke="none"/><path d="m38 35-6-12m24 12 6-13" stroke="#a6b1bd"/><path d="m41 41 2 2m10-2 2 1m-14 11 15-1" stroke="#d7d4bd"/>'
    save("firefly" if frame==0 else f"firefly-{frame}",body)
save("star",'<path d="m48 7 10 26 28 6-23 18 3 28-20-17-25 12 7-27-18-22 28 1Z" fill="#e8d993" stroke="#8d88a3" stroke-width="3"/><path d="m47 22-4 16-14 1 12 9-4 14 11-9 11 6-3-15 12-5-16-2Z" fill="#fff1c1" stroke="none"/>')
save("star-off",'<path d="m48 7 10 26 28 6-23 18 3 28-20-17-25 12 7-27-18-22 28 1Z" fill="#302d46" stroke="#7c7898" stroke-width="3"/><path d="m47 25-4 14-12 1m27 23-2-13 11-8" stroke="#a29bb5"/>')
save("constellation",'<path d="m47 10 29 29-25 29-27-28 23-30m4 58 12 17" stroke="#bfc4db" stroke-width="3"/><g fill="#eddda0" stroke="#e4d5b0"><path d="m47 4 3 5 5 2-5 3-3 5-3-5-5-3 5-2Zm29 28 3 5 5 2-5 3-3 5-3-5-5-3 5-2ZM24 33l3 5 5 2-5 3-3 5-3-5-5-3 5-2Zm27 28 3 5 5 2-5 3-3 5-3-5-5-3 5-2Zm12 18 2 4 5 2-5 3-2 4-3-4-4-3 4-2Z"/></g>')
save("planet",'<path d="M14 46Q10 14 43 10q34-6 40 29 6 35-28 44-36 6-41-37Z" fill="#879fae" stroke="#575a78" stroke-width="3"/><path d="m22 20 17-4 12 6-6 13-17-1-6 10-7-7Zm34 23 16-7 10 7-5 20-12 11-11-7 3-12-7-5Z" fill="#a9bb91"/><path d="m28 17 12-2m-20 19-2 7m48 32-11 4" stroke="#d4dfce" stroke-width="3"/><path d="M9 54Q-7 75 34 67q49-10 55-33 11 4-1 18Q66 80 18 77-7 75 9 54Z" fill="#d1ba91" stroke="#77708a"/><path d="M5 68q42 5 81-22" stroke="#ecdbb0"/>')
save("system",'<path d="M10 48Q11 13 48 12t38 37Q83 83 47 84T10 48Z" stroke="#8e87b0"/><path d="M22 49q0-22 25-23t27 22q-3 22-26 23T22 49Z" stroke="#b5a2c5"/><path d="m48 27 6 8 12-1-6 11 5 11-12 3-7 11-7-12-12-3 7-11-4-11 12 1Z" fill="#e1c98b"/><path d="M36 47q1-13 12-12 13 1 12 12 0 14-13 13-12 0-11-13Z" fill="#f5df9d"/><path d="m6 46 9-5 8 6-3 9-10 1Z" fill="#94b8b4"/><path d="m66 69 8-4 8 5-1 9-9 2-6-6Z" fill="#bb94a9"/>')
save("galaxy",'<path d="M44 43Q20 6 8 34q-6 27 23 44 28 14 49-6 21-19 2-44Q65 5 42 18q-14 10-10 27 6 20 24 12 10-6 1-15-8-6-13 1Z" fill="#8077a3" stroke="#514866" stroke-width="3"/><path d="M43 40Q26 17 17 36q-6 17 14 33 24 15 43-5 12-15 1-32-15-19-33-5-8 9-3 19 5 12 17 5" stroke="#c0a6cc" stroke-width="5"/><path d="m49 33 8 7 1 9-8 7-10-6-3-10Z" fill="#edcf9e"/><path d="m18 43 3 1m8 22 3 1m33-4 3-1m8-23 2 2m-21-17 3 1" stroke="#efe3ba" stroke-width="3"/>')
save("universe",'<path d="m48 4 20 8 15 15 7 23-7 21-16 15-23 5-22-10L8 65 5 43l11-22Z" fill="#3b355c" stroke="#9a90ba" stroke-width="3"/><path d="M16 31q7-16 25-17m20 64 13-9 7-16m-66-1 6 15" stroke="#c2aecf" stroke-width="2"/><path d="m27 24 3 7 9 1-7 5-1 9-5-7-8-2 7-4m36 22 4 7 9 2-8 5-2 9-4-8-9-2 7-4" fill="#d5c0dd" stroke="none"/><path d="M38 48q-9-15 8-19 16-1 17 14-1 15-17 15-16-1-17-12m9 0q7 13 16 0 1-9-8-6" stroke="#ad8eb9" stroke-width="3"/><path d="m47 41 5 3-2 6-6 1-2-6Z" fill="#f6dda7"/><path d="m24 62 3 2m43-34 3 1m-20-17 2 2m-12 53 2-1m-32-22 2-1" stroke="#e9dfb8" stroke-width="3"/>')
save("jar",'<path d="m30 14 36-1 1 13-36 1Z" fill="#a6a1b1"/><path d="m30 27-7 10 1 45 49-1 1-44-8-11Z" fill="#585774" stroke="#b1aec4" stroke-width="3"/><path d="m31 39 1 34m7-49 16-1m9 13 2 8" stroke="#d0c8d7" stroke-width="2"/><path d="m39 48 8-7 10 6-4 11-10 1Zm17 18 6-4 5 4-4 6-6-1Zm-26 2 4-5 5 3-1 5-5 2Z" fill="#e7d794" stroke="#8b839b"/>')
save("glow",'<path d="m45 7 10 26 29 11-28 9-12 29-10-28-27-9 29-11Z" fill="#ecdda0" stroke="#a79bb3" stroke-width="3"/><path d="m44 27 5 15 14 4-14 4-5 14-4-15-14-4 14-4Z" fill="#fff0c1" stroke="none"/>')
save("net",'<path d="m58 45-36 43" stroke="#bc9d83" stroke-width="7"/><path d="M25 27q6-29 34-19 34 10 11 38-12 15-33-1-18-10-12-18Z" fill="#818aa1" stroke="#bab5cb" stroke-width="3"/><path d="m33 15 2 29m10-34 2 42m12-39 2 35m9-30 1 20M27 24l48 3m-42 9 38 3" stroke="#b3b2c6"/><path d="m47 27 7 2-2 9-7-2Z" fill="#eddc9a"/>')
save("mesh",'<path d="m20 17 58 3-3 56-58 1Z" fill="#666b8d" stroke="#b2a9c1" stroke-width="4"/><path d="m31 19-2 57m16-56-1 57m16-57-2 57M21 32l56 3m-58 11 58 3m-59 12 58 2" stroke="#b8b5cd" stroke-width="2"/><path d="m38 37 8-2 6 8-4 10-10-4Z" fill="#eedaa2"/>')
save("flower",'<path d="m48 87 1-45m-1 28-20-8m20-3 18-9" stroke="#8ca390" stroke-width="4"/><path d="m48 11 10 15 19 2-12 16 1 19-19-7-18 9 2-21-12-15 19-2Z" fill="#b5adc8" stroke="#777691"/><path d="m42 31 13-1 8 11-9 12-15-7Z" fill="#e2d69a"/>')
save("loom",'<path d="m20 14 55-1 6 66-65 2Z" fill="#8f8398" stroke="#b8a7b5" stroke-width="4"/><path d="m32 17 1 59m13-59 1 59m12-60 2 60m11-59 1 58" stroke="#d5c0bc"/><path d="m19 31 57-2m-58 17 59-2m-59 19 61-3" stroke="#a3acc5" stroke-width="3"/><path d="m40 35 9-7 8 9-6 10-10-3Z" fill="#f1d99f"/><path d="m26 80-4 10m47-10 5 10" stroke="#b8a7b5" stroke-width="5"/>')
save("orbit",'<path d="M15 45Q13 13 48 13t34 33Q81 80 47 82T15 45Z" stroke="#b1a3c2" stroke-width="4"/><path d="m47 23 1 26 20 9" stroke="#e8d19d" stroke-width="4"/><path d="m7 43 13-3 4 10-12 6Zm63-21 9-6 9 8-7 10Z" fill="#b3b0cc"/>')
save("frame",'<path d="m2 3 18-1 2 3-1 17-18-1-2-3Z" fill="#302d43" stroke="#8a819b" stroke-width="2"/><path d="m4 5 13-1m-13 4-1 9m4 2 12 1" stroke="#a99bb0" stroke-width="1"/>',"0 0 24 24")
save("loop",'<path d="M20 54Q4 20 42 16q36-2 34 33M14 39l6 18 16-9m43 9Q73 88 43 82 14 77 16 61m46 2 17-9 9 17" stroke="#c3b3cd" stroke-width="5"/>')

random.seed(83)
body='<path d="M0 0h900v700H0Z" fill="#25273e" stroke="none"/>'
for _ in range(85):
    x,y=random.randrange(900),random.randrange(430)
    body+=f'<path d="m{x} {y} 2 1" stroke="{random.choice(["#8c889b","#c4baa7","#4d516b"])}" stroke-width="{random.choice([1,2])}"/>'
body+='<path d="M706 70q-40 12-35 52 6 31 35 35-58 19-67-30-9-42 32-58Z" fill="#bbb5b5" stroke="#73738f" stroke-width="2"/><path d="m0 397 97-43 83 22 102-62 83 56 87-43 112 50 94-39 113 34 129-41v369H0Z" fill="#343d43" stroke="#42495a" stroke-width="2"/><path d="m0 473 120-32 134 20 119-26 170 28 133-22 104 10 120-29v278H0Z" fill="#293b3c" stroke="#40514a" stroke-width="2"/><path d="m0 571 124-25 146 15 117-13 106 19 153-9 125 17 129-8v133H0Z" fill="#263637" stroke="#354b40" stroke-width="2"/>'
for _ in range(120):
    x,y=random.randrange(900),random.randrange(472,700)
    body+=f'<path d="m{x} {y} -3-8 4 5 3-10" stroke="{random.choice(["#465744","#657254","#354b43"])}" stroke-width="{random.choice([1,2])}"/>'
body+='<path d="m64 651 3-54m1 35-16-9m15-9 12-8m-1 11 5-40m-4 25 13-12" stroke="#72805d" stroke-width="3"/><path d="m57 592 9-8 10 9-9 9Zm19-18 9-7 9 8-8 9Z" fill="#b9acb9" stroke="#81788f"/><path d="m770 684 3-59m0 24-16-9m16-4 16-8" stroke="#72805d" stroke-width="3"/><path d="m764 620 10-9 10 10-11 10Z" fill="#c0b1c7" stroke="#8e7d9e"/>'
save("field",body,"0 0 900 700")
texture='<path d="M0 0h160v160H0Z" fill="#252439" stroke="none"/>'
for _ in range(40):
    x,y=random.randrange(160),random.randrange(160)
    texture+=f'<path d="m{x} {y} 2 1" stroke="{random.choice(["#343248","#40394f","#29283f"])}" stroke-width="1"/>'
save("paper",texture,"0 0 160 160")
print("Drew original firefly field, cosmic bodies, constellations and tools.")
