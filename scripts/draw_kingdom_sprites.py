"""Original hand-drawn atlas, party and battle sprites. Standard library only."""
from pathlib import Path
import random
OUT=Path(__file__).resolve().parents[1]/"public"/"sprites"
def save(name,body,box="0 0 96 96"):
    w,h=box.split()[2:]
    (OUT/f"rpg-{name}.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{box}" shape-rendering="crispEdges"><g stroke="#454d3b" stroke-width="2" stroke-linejoin="round" fill="none">{body}</g></svg>')

save("ally-pip",'<path d="m32 54-8 29 40 1-9-30Z" fill="#9caa6e"/><path d="m30 82-3 9h14l2-9m9 0 3 9h14l-7-9" fill="#8c7155"/><path d="M29 37q-3-22 19-22 24 1 20 23-3 18-19 17-18 1-20-18Z" fill="#e0b58a"/><path d="m21 28 17-21 25 11 12 11Z" fill="#86965f"/><path d="m28 27 39-1" stroke="#b9b985" stroke-width="4"/><path d="m52 32 1 6m10-6 1 6m-12 7 8 1"/><path d="m63 51 13 11" stroke="#e0b58a" stroke-width="7"/><path d="M79 39q18 27-3 45l3-45-7 23 6 22" stroke="#b99368" stroke-width="3"/><path d="m66 63 28-6-5 6m1-6-2-3" stroke="#e5d6a1"/><path d="m34 54 17 21" stroke="#d9c28b" stroke-width="5"/>')
save("ally-moss",'<path d="M14 74q-4-21 18-23l45 2q18 11 6 28l-62 3Z" fill="#aab57d"/><path d="M22 57Q9 15 45 14q42 1 25 46Z" fill="#b0a281"/><path d="M36 44q-12-8-3-17 17-8 25 9 5 17-17 19-20 1-22-18" stroke="#6e7c58" stroke-width="4"/><path d="m68 51 1-23m12 24 6-21" stroke="#aab57d" stroke-width="5"/><path d="m64 27 10-3 1 7-10 2m17-5 10-1v7H82" fill="#c8ceaa"/><path d="m70 28 1 2m16-1 1 2"/><path d="m16 49 21-7 23 6-3 25-18 14-19-13Z" fill="#91aaa1"/><path d="m24 54 25-1m-14-6 2 28" stroke="#d9c68a" stroke-width="5"/><path d="m17 79 9 1m43-4 8 2"/>')
save("ally-mote",'<path d="M41 43Q9 8 10 34q-2 20 28 29Q7 61 18 82q9 12 24-15m15-24q30-34 30-9 0 20-27 29 30-2 19 19-10 12-25-15" fill="#b5a4c5"/><path d="m41 36-5 23 7 23 12 1 8-23-6-24Z" fill="#d3bd8b"/><path d="m40 34-5-10m21 10 7-10m-18 19v6m8-5v6"/><path d="m39 63 21-1m-18 9 16-1" stroke="#84799f" stroke-width="4"/><path d="m31 38 16-27 9 18 15 8Z" fill="#9984b4"/><path d="m78 46-6 42" stroke="#bb9a6f" stroke-width="4"/><path d="m76 31 9 10-7 13-10-12Z" fill="#ead48f"/>')
save("ally-puddle",'<path d="M25 61Q10 72 22 81q39 15 56-9l8-20-21 4Z" fill="#e5d6a1"/><path d="M38 47Q19 14 44 10q26-4 23 21l-6 23Z" fill="#e9deb5"/><path d="m57 31 26 9-25 7Z" fill="#cf9e6c"/><path d="m53 23 1 5"/><path d="m31 48 35 1-3 12-28 2Z" fill="#ae7e78"/><path d="m30 72q21-18 34-8-2 11-20 12"/><path d="m35 16 25-2-2 12-26 1Z" fill="#ede6c7"/><path d="m44 15 1 10m-5-5h10" stroke="#b28179" stroke-width="3"/><path d="m80 51-2 35" stroke="#b6a17b" stroke-width="3"/><path d="m72 55 16-1m-8-10-1 19" stroke="#eee0a5" stroke-width="5"/>')
icons={
"arrow":'<path d="m15 77 61-60m-20 3 22-5-5 23M17 62l13 5 3 14" stroke="#c8b87b" stroke-width="5"/>',
"volley":'<path d="m10 66 47-48m-16 4 18-7-4 19M26 78l46-47m-15 2 18-5-4 19M44 86l39-39m-16 1 18-3-3 17" stroke="#d8c48f" stroke-width="4"/>',
"target":'<path d="M23 46q0-25 26-25 24 0 24 25t-24 27q-27 0-26-27Z" stroke="#c39182" stroke-width="5"/><path d="m47 8 2 24m-2 29v24M9 47l25 1m28-1h24" stroke="#e3cc99" stroke-width="4"/>',
"shell":'<path d="M14 68q-5-50 35-50 39 2 33 51Z" fill="#a9b58d"/><path d="M29 64q-8-31 18-32 28 1 22 30-11 13-24 0-7-9 3-15 11-3 11 9" stroke="#6e886d" stroke-width="4"/><path d="m14 70 69-1" stroke="#ddd19c" stroke-width="5"/>',
"horn":'<path d="m20 47 57-29-10 58-33-17Z" fill="#c6a77a"/><path d="m23 47-10 17 15 11 11-18m36-36-8 47" stroke="#e8d1a1" stroke-width="5"/><path d="m82 13 9-5m-8 22 10 2m-18-27 2-5" stroke="#d6c28a" stroke-width="3"/>',
"spark":'<path d="m55 7-32 44 24-2-10 39 39-52-25 4Z" fill="#e1c67c"/><path d="m53 21-17 23 20-2-9 25" stroke="#f8e9b7" stroke-width="4"/>',
"arc":'<path d="m17 18 6 25 19-14 4 31 19-19 13 35" stroke="#bea6cc" stroke-width="7"/><path d="m17 18 6 25 19-14 4 31 19-19 13 35" stroke="#f0dfbf" stroke-width="2"/>',
"siphon":'<path d="M70 25Q28 2 20 44q-5 29 33 25m-12-8 13 9-14 8M48 29l21 7 4-23" stroke="#b4c58b" stroke-width="5"/><path d="m65 47-9 14 10 11 10-13Z" fill="#b7a4c6"/>',
"heart":'<path d="M46 80 16 49Q-2 21 21 17q14-4 25 14 15-21 30-13 24 13 5 35Z" fill="#c4918e"/><path d="m22 28-5 10m28-5 1 3" stroke="#eac3af" stroke-width="4"/>',
"rain":'<path d="M13 41q-4-16 12-19 9-22 28-10 22-9 26 17 17 15-1 20l-57 2Z" fill="#bacad0"/><path d="m24 61-5 13m28-13-5 20m28-22-4 13" stroke="#a2bdc3" stroke-width="5"/>',
"footsteps":'<path d="m23 20 12-7 9 5-2 21-14 8-9-11Zm29 27 12-5 12 9-5 23-15 6-8-14Z" fill="#d5bd8e"/>',
"pause":'<path d="m24 19 15-1-1 58-15 1Zm31-1 15 1 1 57-15-1Z" fill="#d9cb9d"/>',
"play":'<path d="m29 16 46 32-44 32Z" fill="#c7d19b"/>',
"locate":'<path d="m48 8 2 78M8 48l78 1" stroke="#dfc992" stroke-width="3"/><path d="m29 28 38-1 1 40-39 1Z" stroke="#c7d29f" stroke-width="4"/><path d="m42 42 14 1-1 14-13-1Z" fill="#d5bc83"/>',
}
for name,body in icons.items():save(name,body)
save("frame",'<path d="m2 3 18-1 2 3-1 16-17 1-3-3Z" fill="#30392e" stroke="#9b9d75" stroke-width="2"/><path d="m4 5 13-1m-13 4-1 8m4 3 12 1" stroke="#bdb58a" stroke-width="1"/>',"0 0 24 24")
palettes=[("#738967","#b2bd8b","#e1d4a5"),("#506d52","#8d9e71","#c0bf8d"),("#697577","#9ba5a1","#c4c9b6"),("#526e66","#93a88b","#b6b890"),("#849f9c","#b0c8bb","#e2dfbc"),("#869eaa","#bfd0cf","#e0e5d4"),("#797c76","#acae95","#d0c5a0"),("#a18d64","#c8bc85","#e9dba9")]
for i,(dark,mid,light)in enumerate(palettes):
    random.seed(12+i)
    floor=f'<path d="M0 0h64v64H0Z" fill="{light}" stroke="none"/>'
    for n in range(16):
        x,y=random.randrange(4,59),random.randrange(4,59)
        floor+=f'<path d="m{x} {y} 3-1 2 1" stroke="{mid}" stroke-width="1"/>'
    floor+=f'<path d="m1 2 24-1m8 0 29 2m0 9 1 27m-1 9 1 14m-4-1-31 1m-9-1H2m0-5-1-28m1-8V3" stroke="{mid}" stroke-width="1"/>'
    wall=f'<path d="M0 0h64v64H0Z" fill="{dark}" stroke="none"/><path d="m3 9 15-6 19 3 20-3 5 16-4 18 4 17-15 8-19-4-21 2-6-20Z" fill="{mid}" stroke="{dark}" stroke-width="3"/><path d="m8 15 12-5 12 2m-23 8 1 8m26-17 15-2 4 10m-3 25-5 9-16 1M6 38l17-5 12 4 21-5m-31 1-1-23m10 27 2 17" stroke="{dark}" stroke-width="2"/>'
    if i<2 or i==3:wall+=f'<path d="m12 25 6-10 6 10m16 3 5-12 6 12m-30 25 5-11 6 11" stroke="{light}" stroke-width="1"/>'
    elif i==5:wall+='<path d="m4 10 18-6 16 4 18-3 3 11-13-4-11 3-14-4-15 6Z" fill="#e4e9db" stroke="none"/>'
    save(f"tile-floor-{i}",floor,"0 0 64 64");save(f"tile-wall-{i}",wall,"0 0 64 64")
    scene=f'<path d="M0 0h640v300H0Z" fill="{light}" stroke="none"/><path d="m0 140 58-24 65 11 70-59 63 40 75-66 92 72 79-24 72 40 66-26v196H0Z" fill="{mid}" stroke="{dark}" stroke-width="3"/><path d="m0 210 98-30 84 17 117-36 103 28 96-17 142 31v97H0Z" fill="{dark}" stroke="none"/><path d="M0 264q152-26 317 0t323-3v39H0Z" fill="{mid}" stroke="{dark}" stroke-width="2"/><path d="m32 286 17-4 21 3m134 2 19-2m157-1 31 4m131-7 24 2" stroke="{dark}" stroke-width="2"/>'
    save(f"landscape-{i}",scene,"0 0 640 300")
print("Drew original atlas tiles, landscapes, party members, and ability icons.")
