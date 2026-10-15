"""Original mouse-drawn-style RPG doodles. Python 3 standard library only."""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'public' / 'sprites'
OUT.mkdir(parents=True, exist_ok=True)
art = {}
def put(name, body):
    art['rpg-'+name] = body

def sword(color):
    return f'<path d="m25 72 39-54 9-4 1 11-40 54Z" fill="{color}"/><path d="m30 72 35-48" stroke="#f6e8c0"/><path d="m19 65 23 15m-11-6-12 13" stroke="#8c6e52" stroke-width="7"/><path d="m20 64 24 15" stroke="#564b42"/>'
for name,col in [('pencil','#c2a176'),('sword','#a8b18e'),('sword-silver','#c1d0cf'),('sword-gold','#dfc17e')]:put(name,sword(col))
put('shield','<path d="m19 20 28-9 28 8c1 28-9 48-27 64-21-14-30-36-29-63Z" fill="#a8bdb0"/><path d="m47 18 2 54m-22-30 39-2" stroke="#e1cf97" stroke-width="6"/><path d="m22 23 1 19m45-15-1 16" stroke="#d5dfcf"/>')
put('brush','<path d="m27 67 35-49c3-5 11-2 9 3L37 73Z" fill="#bc9671"/><path d="M29 60c-16-1-10 17-22 21 12 11 28 2 31-12Z" fill="#b28679"/><path d="m17 78 8-7" stroke="#e6c6a8"/>')
put('bucket','<path d="m22 28 35-16 23 36-37 20Z" fill="#c4d3cc"/><path d="M29 25c-13-24 22-32 27-9m-32 17 18 29"/><path d="m73 57 9 14c8 18-17 20-14 5Z" fill="#96b8c6"/>')
put('spray','<path d="m35 34 33-1 2 48-35 2Z" fill="#b7c6c1"/><path d="m40 22 22-1 1 12-23 1Z" fill="#8e8e96"/><path d="m38 48 28-1 1 19-29 2Z" fill="#c5a582"/><path d="m37 25-18-5m-1 9-7 1m12-15-5-4" stroke="#bca2c1"/>')
for name,col in [('tunic','#b8b28c'),('armor','#adbfc5')]:put(name,f'<path d="m29 18 12-2 8 10 9-10 12 2 16 20-14 13-9-8 5 38-39 1 5-39-11 9L9 39Z" fill="{col}"/><path d="m47 29 2 46m-17-16 32-1" stroke="#8d8a74"/><path d="m34 23 6 6" stroke="#e6dfbf"/>')
for name,col in [('potion','#d58f98'),('ink','#8c84b4')]:put(name,f'<path d="m36 24 22-1 1 19c26 22 20 43-11 44C17 85 9 65 36 43Z" fill="#dae2d6"/><path d="M28 61q19 7 40-1c9 29-43 32-40 1Z" fill="{col}" stroke="none"/><path d="m33 18 28-1-1 10-26 1Z" fill="#b3956c"/><path d="M31 54q-9 10-5 15" stroke="#f3f0d4" stroke-width="4"/>')
put('pendant','<path d="M24 18c2-18 48-20 49-1 2 14-13 27-23 28-10-2-26-13-26-27Z" fill="none" stroke="#b2a078" stroke-width="4"/><path d="m47 39 13 17-10 25-15-23Z" fill="#bdacc9"/><path d="m46 47-4 12 8 13" stroke="#e6d5d5"/>')
put('orb','<path d="M22 41C16 6 77 4 77 41c3 33-58 37-55 0Z" fill="#baa5ca"/><path d="M32 24q-7 7-6 14" stroke="#eadcd8" stroke-width="5"/><path d="m29 69 39-1 9 15-57 1Z" fill="#c0a783"/><path d="m34 51q14 11 30-2" stroke="#a28ab7"/>')
put('scroll','<path d="m25 15 42-1c14-1 15 15 2 18l-1 44c-4 13-32 16-40 3-11-4-13-14-2-16Z" fill="#e9d8ad"/><path d="M66 15c-10 5-7 16 3 17M28 63c14-6 18 13 3 16m6-50 17 1m-18 12 18-1m-19 13 13-1" stroke="#ad9b79"/>')
put('map','<path d="m12 24 23-8 27 10 23-9-1 57-23 7-26-9-23 9Z" fill="#ded1a8"/><path d="m35 20 1 49m26-39-1 47" stroke="#aca98b"/><path d="m23 60 12-16 17 7 18-16" stroke="#aa7c68" stroke-dasharray="3 5"/><path d="m66 31 9 9m-8 0 8-10" stroke="#b4826d"/>')
put('chest','<path d="m16 42 64-1 1 39-65 1Zm0 0c-3-39 64-39 64-1" fill="#bd956e"/><path d="m18 51 61-1m-49-23 1 50m35-51 1 50" stroke="#e2c38c" stroke-width="5"/><path d="m43 45 12-1 1 16-12 1Z" fill="#e1c583"/><path d="m49 48 1 6"/>')
put('hammer','<path d="m48 33-26 48 9 5 27-49" fill="#b68b63"/><path d="m37 13 13-7 35 22-13 21-34-21Z" fill="#b6c4bf"/><path d="m48 14 27 16" stroke="#d9dfcd"/>')
put('crown','<path d="m16 63-3-39 23 18L49 14l16 28 23-19-7 40Z" fill="#e0bf79"/><path d="m18 64 61-1-1 13-59 1Z" fill="#cba970"/><path d="m46 58 9-1 1 11-9 1Z" fill="#bd9cb2"/><circle cx="13" cy="22" r="4" fill="#efcf89"/><circle cx="49" cy="13" r="4" fill="#efcf89"/><circle cx="88" cy="22" r="4" fill="#efcf89"/>')
put('camp','<path d="m11 79 37-65 39 65Z" fill="#ba8772"/><path d="m48 24-1 55 29-1Z" fill="#725e50"/><path d="m48 14 1-8M16 76l-7 9m71-9 8 9"/><path d="m47 22-9 49" stroke="#d8b28b"/>')
put('hut','<path d="m22 41 52-1 1 43-54 1Z" fill="#e4d4ae"/><path d="M12 42 48 10l39 30Z" fill="#b48570"/><path d="m43 82 1-27 16 1v27" fill="#8b8267"/><path d="m29 51 11 1-1 13-10-1m34-13 10 1-1 12-9-1" fill="#a5c2c5"/><path d="m20 44 56-1" stroke="#826a57"/>')
put('hero','<path d="m33 54 28-2 12 28-48 2Z" fill="#9cb8ae"/><path d="m36 78-3 12 12-1 3-10m10-1 2 12 13-1-7-12" fill="#7d8a99"/><path d="m30 89 17-1m11 0 17 1" stroke="#8c6e5a" stroke-width="5"/><path d="M31 36c-2-25 37-24 36-1 1 21-36 25-36 1Z" fill="#e4bf9a"/><path d="m25 29 8-18 26-2 11 18Z" fill="#bd8b78"/><path d="m25 28 49-2" stroke="#d1a48b" stroke-width="6"/><path d="m54 34 1 4m9-5 1 4m-9 8 7-1"/><path d="m31 52 23-5 11 7-23 5-14 16-7-6Z" fill="#e7ca86"/><path d="m60 60 15 7" stroke="#e4bf9a" stroke-width="7"/><path d="m77 41-5 39" stroke="#8b8365" stroke-width="4"/><path d="m75 65 9 2" stroke="#a6b492" stroke-width="5"/><path d="m77 41 5-9 1 10-7 26" fill="#bfbea1"/><path d="m36 45 3 1" stroke="#dba893"/>')
for name,col in [('slime','#b2c890'),('slime-blue','#a1c6d1'),('slime-gold','#e1ca8d'),('slime-king','#b2c48a')]:
    body=f'<path d="M12 70c-3-13 8-26 19-34C43 18 60 22 69 39c12 6 18 16 18 29 2 19-75 24-75 2Z" fill="{col}"/><path d="M25 49q8-12 18-12" stroke="#e6ecc7" stroke-width="5"/><path d="m37 58 1 6m23-7 1 6m-18 9q6 4 11-1"/><path d="m27 66 5 1m35-2 5-1" stroke="#d3a491" stroke-width="3"/>'
    if name.endswith('king'):body+='<path d="m29 36-3-23 14 10 9-19 12 18 15-12-4 24Z" fill="#ddbd76"/><path d="m33 36 36-2" stroke="#f2d69d" stroke-width="4"/>'
    put(name,body)
put('mite','<path d="m23 46-12-9m12 20L8 59m18 10L14 80m61-35 12-9M73 57l16 3M70 69l12 10" stroke="#7f8a65" stroke-width="4"/><path d="M21 56c-1-35 55-34 55-1 3 35-55 32-55 1Z" fill="#b6bf8c"/><path d="m38 49 1 6m21-7 1 6m-16 13 10-1"/><path d="m29 37-6-14m38 13 6-15"/>')
put('bee','<path d="M28 38C2 25 18 3 34 17c7 5 11 13 10 21m7-1c-2-30 30-32 28-12-1 10-13 15-20 17" fill="#d9e2d4"/><path d="M18 55c-5-30 60-31 64-3 5 28-57 32-64 3Z" fill="#e1c88b"/><path d="m42 36-1 36m16-35 2 33" stroke="#8c806a" stroke-width="8"/><path d="m25 49 1 5m-2 10 6 1M82 52l9 4-8 5"/>')
put('mushroom','<path d="M35 49 34 81c13 8 26 1 26-5l-2-29Z" fill="#e5d9b3"/><path d="M13 49C7 7 79 2 83 46c-15 11-51 11-70 3Z" fill="#c58e88"/><path d="M24 30q4-9 15-9" stroke="#e6bca5" stroke-width="4"/><path d="m42 62 1 5m13-5 1 5m-9 6 6-1"/><path d="M55 21q12 0 13 10c-8 9-21 2-13-10Z" fill="#e8d8b7"/>')
for name,boss in [('tree',False),('tree-boss',True)]:
    body='<path d="m37 51-3 33 30 1-8-36Z" fill="#ad9271"/><path d="M17 53C0 39 19 15 33 22 29 2 65 6 66 23 88 16 96 50 78 55c-14 6-24 3-33-2-11 8-22 7-28 0Z" fill="#94b082"/><path d="m43 58 3 17m9-16 2 15" stroke="#8e795f"/>'
    if boss:body+='<path d="m32 47 5 4m23-4-6 4" stroke="#574e43" stroke-width="3"/><path d="m37 59q9 5 18-1"/><path d="m35 67-17 9m41-9 18 12" stroke="#ad9271" stroke-width="6"/>'
    put(name,body)
put('wolf','<path d="m19 63 9-17 22 3 13-14 15 5 6 22-14 5-9-3-29 5-8 15-8-1 3-21-9-16 12 5" fill="#b5c3c4"/><path d="m60 38 2-23 12 18 11-8 1 24-10 5Z" fill="#a5b3bb"/><path d="m75 39 1 4m8 8 8 1m-67 15 6 16m32-16 7 15"/><path d="m31 51 17 4" stroke="#dde1cb" stroke-width="4"/>')
put('bat','<path d="m43 35-10-6-24-11 3 38 18-4 9 18 21-1 10-18 15 4 3-40-25 15-10 5-4-11Z" fill="#b3a3c2"/><path d="m43 44 1 5m11-5 1 5m-9 12 5-1m-21-7-9-15m43 15 10-15"/>')
put('golem','<path d="m28 24 33-4 15 16 2 30-15 18-35-1-12-21 1-26Z" fill="#afb8b0"/><path d="m22 45 5-13 13-3m22 1 8 13" stroke="#d7d9c3" stroke-width="4"/><path d="m34 48 5 1m20-2 5 1m-24 18 15-1M21 56l13 4-2 17m30-18 11 3"/>')
put('goblin','<path d="m28 38-12-16 25 8c14-13 22-7 26-2l19-8-12 22c7 16-3 24-25 21C23 65 19 53 28 38Z" fill="#9cb18a"/><path d="m34 43 1 5m24-7 1 5m-22 9 13 2"/><path d="m33 60-8 24 43 1-8-25Z" fill="#b4977c"/><path d="m78 50 3 34" stroke="#b9a276" stroke-width="4"/>')
put('witch','<path d="m22 37 24-29 10 20 27 9Z" fill="#a998b8"/><path d="M35 40c-7 24 27 30 28 2Z" fill="#bdc6a7"/><path d="m44 46 1 4m10-3 1 4"/><path d="m37 60-15 25 52-1-15-25Z" fill="#ab98b8"/><path d="m79 29-2 56" stroke="#bda278" stroke-width="4"/><path d="M71 27c-2-12 17-13 17-2 0 10-17 13-17 2Z" fill="#d4cd91"/>')
put('roc','<path d="m35 43-23-22-3 33 24 2 8 25 16-1 7-24 24-4-4-32-24 23c-2-22-22-22-25 0Z" fill="#acbfca"/><path d="m47 40 13 5-13 6" fill="#ddc38c"/><path d="m42 37 2 1m-24 3 12 9m40-9-8 9m-26 15-4 16m20-16 4 16"/>')
put('shade','<path d="M25 81c-11-44 10-73 28-64 15 8 18 24 12 38l12 29-21-6-10 7-10-7Z" fill="#a39bb9"/><path d="m39 42 1 6m16-7 1 6" stroke="#e2d4c2" stroke-width="4"/><path d="M32 36q2-11 8-13" stroke="#c5b9cc"/>')
for name,king in [('knight',False),('king',True)]:
    body='<path d="m34 53-9 31 47 1-13-32Z" fill="#a5b4c1"/><path d="M29 35c-3-31 40-32 39-1 0 27-39 31-39 1Z" fill="#becacb"/><path d="m31 31 33-1 1 11-33 2Z" fill="#7f8b98"/><path d="m47 31 1 11m-5 17 10 1m-5-6 2 19" stroke="#d8c496" stroke-width="4"/><path d="m80 32-3 50m-7-14 15 1" stroke="#d9d4b7" stroke-width="4"/>'
    if king:body+='<path d="m30 21-4-15 14 9L49 2l10 12 15-9-5 18Z" fill="#e1c27e"/>'
    put(name,body)
put('sun-boss','<path d="m49 5 6 11 15-7 1 15 16 2-7 13 11 11-12 8 5 15-16 1-3 16-14-8-12 10-8-14-15 3 1-16L4 57l12-11L7 33l17-3 1-17 15 6Z" fill="#dec084"/><path d="M23 48C17 9 79 8 78 47c2 36-53 40-55 1Z" fill="#efdaa6"/><path d="M26 49q24-27 48-1c-19 23-34 19-48 1Z" fill="#b7a4c0"/><path d="M44 45c-2-11 12-12 12 1 1 15-13 15-12-1Z" fill="#68617a"/><path d="m46 41 1 4" stroke="#f5e2bb" stroke-width="3"/>')
for name,body in art.items():
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><defs><filter id="w" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale=".65" xChannelSelector="R" yChannelSelector="G"/></filter></defs><g fill="none" stroke="#696654" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" filter="url(#w)">{body}</g></svg>'''
    (OUT/(name+'.svg')).write_text(svg)
print(f'Drew {len(art)} original RPG doodles.')
