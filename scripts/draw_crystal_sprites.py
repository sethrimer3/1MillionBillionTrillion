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
draw('void', '''
<path d="m20 39 13-24 33-1 15 27-30 57Z" fill="#1b172a" stroke="#9b80b6"/>
<path d="m20 39 20 6-7-30Zm20 6 11 53-31-59" fill="#30243f"/>
<path d="m40 45 21-2-10 55Z" fill="#11101e"/>
<path d="m61 43 20-2-30 57Z" fill="#352340"/>
<path d="m33 15 7 30 21-2 5-29" fill="#4a355a"/>
<path d="m66 14-5 29 20-2" fill="#695074"/>
<path d="m21 39 60 2M33 15l28 28m5-29L40 45" fill="none" stroke="#795a91" stroke-width="1.4"/>
<path d="m28 35 6-12m30 45-8 17" fill="none" stroke="#9f80b8" stroke-width="2"/>
<path d="m44 53 1 2m10-4 1 2" stroke="#d4acd9" stroke-width="2.5"/>
<path d="M14 68C-9 43 8 27 23 26M75 80c22-3 23-31 11-43M26 94l-5 6m61-84 4-5M9 83l-3 3" fill="none" stroke="#806393" stroke-width="1.6"/>
<path d="m39 105 18 1" stroke="#886895" opacity=".7"/>
''')
for n, color in enumerate(['#ddaebd', '#e5d09c', '#a7cbdf']):
    draw(f'shard-{n}', f'''<path d="m29 41 16-23 24 24-17 45Z" fill="{color}"/><path d="m45 18 3 28 4 41m-23-46 19 5 21-4" fill="none" stroke="#6d6c88" stroke-width="1.5"/><path d="m35 39 8-12m-22 5v8m-4-4 8 1" fill="none" stroke="#f4e8d1" stroke-width="2.8"/>''')
draw('void-mote', '''<path d="m33 31 18-9 13 19-10 24-21-8Z" fill="#8f70a9"/><path d="m35 32 15 11 14-2m-14 2 4 22m-3-43-1 21" fill="none" stroke="#c5a5d5" stroke-width="1.5"/>''')
draw('hourglass', '''<path d="m23 16 52-1-2 11-48 1Zm2 78 49 1 1 11-52-1Z" fill="#b99376"/><path d="M29 28c0 20 8 23 16 32-12 11-17 21-16 34l40 1c1-18-6-26-17-35 12-11 18-20 17-33Z" fill="#bccbcc"/><path d="m34 40 14 16 17-17-31 1Zm13 25-13 23 31 1-15-24Z" fill="#dfc28d"/><path d="m48 59 1 16M34 30l-1 7m1 45-1 8" stroke="#f0e4c8" stroke-width="2.4"/>''')
draw('rebirth', '''<path d="M24 95V42c-3-41 52-41 50-1v54Z" fill="#74696b"/><path d="M33 93V42c-2-27 33-28 33 0v51Z" fill="#272839"/><path d="m36 43 1 45 11-2 1-48Z" fill="#4d4652"/><path d="m52 39 2 50 8 2-1-48Z" fill="#aaa3ad"/><path d="m48 43 1 46" stroke="#dad9b5" stroke-width="2"/><path d="m26 40 7 1m-9 15 9 1m-9 15 9 1m-8 15 8 1m36-48 6-1m-6 16 5-1m-5 16 6-1m-7 15 7-1" stroke="#b29b8a" stroke-width="1.5"/><path d="M10 71C-2 27 25 4 51 7m-1 0-8-5m8 5-9 6M85 40c19 44-12 66-42 64m0 0 9 7m-9-7 10-6" fill="none" stroke="#aac3b4" stroke-width="2.5"/><path d="m42 25 7-8 8 9-8 7Z" fill="#c4c9e0"/>''')
