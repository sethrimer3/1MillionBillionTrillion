"""Original little Paint-like crystal doodles. Python 3, no dependencies."""
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'public' / 'sprites'
OUT.mkdir(exist_ok=True)

def draw(name, body):
    (OUT / f'rpg-{name}.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 112" width="96" height="112">
<defs><filter id="pencil" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".065" numOctaves="2" seed="19"/><feDisplacementMap in="SourceGraphic" scale=".65"/></filter></defs>
<g filter="url(#pencil)" stroke="#302f41" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">{body}</g></svg>''')

draw('iridescent', '''
<path d="m17 40 16-22 33 1 17 23-34 55Z" fill="#d7dfd9"/>
<path d="m17 40 22 4-6-26Zm22 4 10 53-32-57" fill="#c9a9c9"/>
<path d="m39 44 21-1L49 97Z" fill="#a3d1cc"/>
<path d="m60 43 23-1-34 55Z" fill="#b3bbdb"/>
<path d="m33 18 6 26 21-1 6-24" fill="#f2e3bd"/>
<path d="m66 19-6 24 23-1" fill="#a9c9de"/>
<path d="m17 40 66 2M33 18l27 25m6-24L39 44" fill="none" stroke="#77788b" stroke-width="1.5"/>
<path d="m25 37 9-12m8 31 4 18m12-45 3-3" fill="none" stroke="#f7f3df" stroke-width="3"/>
<path d="m42 48 1 3m12-3 1 3m-11 7 7 1" stroke="#6b748a" stroke-width="1.8"/>
<path d="m10 23 1 7m-4-4 7 1m62 48 1 8m-5-4 9 1M73 8v8m-4-4 8 1" stroke="#d8ddc7" stroke-width="2"/>
<path d="m29 103 14 2 17-2" fill="none" stroke="#8f9dac" opacity=".7"/>
''')
# A broken, hollow geode. Its forked silhouette is unlike the diamond.
draw('void', '''
<path d="m9 41 13-29 13 19L49 6l12 24L79 12l7 33-8 38-28 21-28-22Z" fill="#292038" stroke="#9b80b6"/>
<path d="m9 41 24 8 2-18-13-19Zm24 8 17 55-28-22Z" fill="#594269"/>
<path d="m35 31 14-25 12 24-11 17Z" fill="#745785"/>
<path d="m61 30 18-18-6 37-23-2Z" fill="#46304f"/>
<path d="m73 49 13-4-8 38-28 21Z" fill="#4a3159"/>
<path d="m33 49 17-10 20 11-4 26-16 14-17-16Z" fill="#0e0c19" stroke="#b18fc8" stroke-width="1.8"/>
<path d="m40 52 10-5 12 7m-11 28 10-10M20 33l2-10m51 42-2 12" fill="none" stroke="#9875ae" stroke-width="2"/>
<path d="m43 61 1 3m12-4 1 3" stroke="#d4acd9" stroke-width="2.5"/>
<path d="M17 72C-3 59 0 38 13 33m67 44c20-17 17-37 7-44M25 98l-6 7m62-95 5-5" fill="none" stroke="#806393" stroke-width="1.6"/>
''')
# Each refraction has a recognizable outline as well as a color.
for n,(color,body) in enumerate([
    ('#ddaebd','<path d="m22 61 23-44 29 45-26 28Z" fill="COLOR"/><path d="m45 17 3 45-26-1m26 1 26 0m-26 0v28" fill="none"/>'),
    ('#e5d09c','<path d="m22 34 39-12 15 42-38 24Z" fill="COLOR"/><path d="m22 34 25 20 14-32M47 54 38 88m9-34 29 10" fill="none"/>'),
    ('#a7cbdf','<path d="m45 13 24 20 7 29-24 30-28-25 2-30Z" fill="COLOR"/><path d="m45 13 2 41-23 13m23-13 22-21m-22 21 5 38 24-30Z" fill="none"/>'),
]):
    draw(f'shard-{n}',body.replace('COLOR',color)+'<path d="m32 39 7-10" stroke="#f4e8d1" stroke-width="3"/>')
draw('void-mote', '''<path d="m33 31 18-9 13 19-10 24-21-8Z" fill="#8f70a9"/><path d="m35 32 15 11 14-2m-14 2 4 22m-3-43-1 21" fill="none" stroke="#c5a5d5" stroke-width="1.5"/>''')
draw('hourglass', '''<path d="m23 16 52-1-2 11-48 1Zm2 78 49 1 1 11-52-1Z" fill="#b99376"/><path d="M29 28c0 20 8 23 16 32-12 11-17 21-16 34l40 1c1-18-6-26-17-35 12-11 18-20 17-33Z" fill="#bccbcc"/><path d="m34 40 14 16 17-17-31 1Zm13 25-13 23 31 1-15-24Z" fill="#dfc28d"/><path d="m48 59 1 16M34 30l-1 7m1 45-1 8" stroke="#f0e4c8" stroke-width="2.4"/>''')
draw('rebirth', '''<path d="M24 95V42c-3-41 52-41 50-1v54Z" fill="#74696b"/><path d="M33 93V42c-2-27 33-28 33 0v51Z" fill="#272839"/><path d="m36 43 1 45 11-2 1-48Z" fill="#4d4652"/><path d="m52 39 2 50 8 2-1-48Z" fill="#aaa3ad"/><path d="m48 43 1 46" stroke="#dad9b5" stroke-width="2"/><path d="m26 40 7 1m-9 15 9 1m-9 15 9 1m-8 15 8 1m36-48 6-1m-6 16 5-1m-5 16 6-1m-7 15 7-1" stroke="#b29b8a" stroke-width="1.5"/><path d="M10 71C-2 27 25 4 51 7m-1 0-8-5m8 5-9 6M85 40c19 44-12 66-42 64m0 0 9 7m-9-7 10-6" fill="none" stroke="#aac3b4" stroke-width="2.5"/><path d="m42 25 7-8 8 9-8 7Z" fill="#c4c9e0"/>''')
