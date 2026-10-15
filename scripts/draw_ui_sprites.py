"""Paint-like UI artwork: opaque pencil strokes on transparent PNGs.

Python 3 standard library only. Every wobble is intentional and repeatable.
"""
from pathlib import Path
import math
import struct
import zlib

OUT = Path(__file__).resolve().parents[1] / 'public' / 'sprites'
OUT.mkdir(exist_ok=True)
INK = '#383241'
GOLD = '#d8b87d'
LIGHT = '#f0dba6'
SAGE = '#a6ba96'
LILAC = '#b9a4cc'
BLUE = '#9abecb'
RED = '#d69391'

class Drawing:
    def __init__(self, w=64, h=64):
        self.w, self.h = w, h
        self.p = [[(0, 0, 0, 0) for _ in range(w)] for _ in range(h)]

    def dot(self, x, y, color):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < self.w and 0 <= y < self.h:
            color = color.lstrip('#')
            self.p[y][x] = (*[int(color[i:i+2], 16) for i in (0, 2, 4)], 255)

    def line(self, points, color, width=2):
        for (x, y), (xx, yy) in zip(points, points[1:]):
            length = max(1, math.ceil(max(abs(xx-x), abs(yy-y))))
            for k in range(length + 1):
                px, py = round(x + (xx-x)*k/length), round(y + (yy-y)*k/length)
                for dy in range(-(width//2), width-width//2):
                    for dx in range(-(width//2), width-width//2):
                        self.dot(px+dx, py+dy, color)

    def poly(self, points, color, stroke=INK, width=2):
        for y in range(max(0, min(y for _, y in points)), min(self.h, max(y for _, y in points)+1)):
            hits=[]
            for (x, yy), (xx, yyy) in zip(points, points[1:]+points[:1]):
                if (yy <= y < yyy) or (yyy <= y < yy):
                    hits.append(x + (y-yy)*(xx-x)/(yyy-yy))
            hits.sort()
            for a,b in zip(hits[::2], hits[1::2]):
                for x in range(math.ceil(a), math.ceil(b)):
                    self.dot(x,y,color)
        if stroke:
            self.line(points+points[:1], stroke, width)

    def oval(self, x, y, rx, ry, color, stroke=INK, width=2):
        # Slightly lopsided, as if dragged with a mouse.
        pts=[(round(x+math.cos(k*math.pi/10)*(rx+(k%3==0))), round(y+math.sin(k*math.pi/10)*ry)) for k in range(20)]
        self.poly(pts,color,stroke,width)

    def save(self, name):
        def chunk(kind, data):
            return struct.pack('!I',len(data))+kind+data+struct.pack('!I',zlib.crc32(kind+data)&0xffffffff)
        raw=b''.join(b'\0'+bytes(channel for pixel in row for channel in pixel) for row in self.p)
        (OUT/f'ui-{name}.png').write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',self.w,self.h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b''))

def sparkle(p,x,y,c=LIGHT):
    p.line([(x,y-4),(x+1,y+4)],c)
    p.line([(x-4,y),(x+4,y-1)],c)

def arrow(p, back=False, c=GOLD):
    pts=[(9,27),(38,26),(36,14),(55,31),(36,49),(37,36),(9,37)]
    if back: pts=[(64-x,y) for x,y in pts]
    p.poly(pts,c)
    p.line([(64-14 if back else 14,30),(64-38 if back else 38,29)],LIGHT,2)

p=Drawing()
p.poly([(15,56),(16,27),(20,16),(30,10),(40,12),(49,23),(50,56)],'#a6a0ae')
p.poly([(23,55),(24,28),(29,21),(35,20),(42,28),(42,55)],'#454052')
p.line([(33,25),(32,54)],GOLD,2)
p.line([(17,31),(22,31)],'#d5c5ba');p.line([(43,38),(49,39)],'#d5c5ba');p.line([(15,46),(22,45)],'#d5c5ba')
p.line([(11,57),(31,58),(53,57)],'#bcad9d',3);sparkle(p,52,14);p.save('gate')

p=Drawing();p.poly([(7,17),(23,12),(41,19),(56,13),(57,48),(40,54),(23,47),(8,53)],'#c8c4a5')
p.line([(23,15),(24,45)],'#8d987e');p.line([(41,22),(40,51)],'#8d987e')
p.poly([(12,32),(18,20),(25,33)],SAGE, '#748c73',1)
p.poly([(29,42),(35,29),(42,41)],'#a6b29a','#7d8b78',1)
p.line([(14,43),(19,38),(29,39),(34,30),(47,27)],'#a37b76',2)
p.line([(45,23),(51,29)],'#b47970',2);p.line([(45,29),(51,23)],'#b47970',2)
p.line([(11,18),(17,16)],LIGHT);p.save('worlds')

p=Drawing();p.poly([(11,30),(12,24),(20,16),(44,15),(52,23),(53,50),(12,52)],'#bd9271')
p.poly([(12,31),(52,30),(53,49),(12,51)],'#9c795f')
p.line([(12,31),(28,32),(52,30)],LIGHT,3);p.line([(20,19),(21,49)],GOLD,3);p.line([(43,18),(44,49)],GOLD,3)
p.poly([(28,29),(36,28),(37,40),(28,41)],LIGHT);p.line([(32,33),(32,37)],INK,2)
p.line([(16,44),(18,44)],'#dbb183');sparkle(p,53,10);p.save('relics')

p=Drawing();p.line([(46,16),(34,10),(20,16),(13,29),(16,43),(28,50),(42,47),(50,35)],INK,7)
p.line([(46,16),(34,10),(20,16),(13,29),(16,43),(28,50),(42,47),(50,35)],GOLD,4)
p.poly([(42,8),(54,21),(37,24)],GOLD);p.poly([(28,25),(35,24),(40,31),(32,41),(25,31)],LILAC)
p.line([(30,27),(31,36)],'#e6d8e5',2);sparkle(p,53,52);p.save('prestige')

p=Drawing();p.poly([(25,8),(38,8),(40,16),(47,18),(53,15),(59,27),(52,32),(52,39),(56,44),(46,54),(39,49),(32,51),(28,57),(15,50),(18,43),(13,36),(6,34),(8,21),(16,21),(21,16)],'#ad9b86')
p.oval(32,32,12,12,'#4c4757');p.oval(32,31,7,7,'#d1ba91');p.line([(25,12),(32,12)],LIGHT,2);p.line([(14,27),(13,32)],'#ddc4a1',2);p.save('settings')

for name,muted in [('sound',False),('muted',True)]:
    p=Drawing();p.poly([(10,26),(22,25),(36,13),(36,51),(23,40),(11,39)],GOLD)
    p.line([(14,28),(24,28),(31,21)],LIGHT,2);p.line([(15,40),(15,47),(22,48),(23,41)],'#ae8d66',3)
    if muted:
        p.line([(43,24),(49,30),(56,39)],INK,5);p.line([(56,23),(49,31),(43,39)],INK,5)
        p.line([(43,24),(49,30),(56,39)],RED,3);p.line([(56,23),(49,31),(43,39)],RED,3)
    else:
        p.line([(43,24),(47,29),(47,35),(43,40)],BLUE,3);p.line([(50,17),(56,25),(57,36),(52,46)],BLUE,3)
    p.save(name)

for name,back in [('arrow',False),('back',True)]:
    p=Drawing();arrow(p,back);p.save(name)

p=Drawing();p.line([(17,15),(31,31),(49,49)],INK,8);p.line([(47,15),(31,33),(16,49)],INK,8)
p.line([(17,15),(31,31),(49,49)],RED,5);p.line([(47,15),(31,33),(16,49)],RED,5)
p.line([(18,16),(25,23)],'#edc2b4',2);p.save('close')
p=Drawing();p.line([(11,32),(20,43),(24,47),(35,29),(53,14)],INK,8)
p.line([(11,32),(20,43),(24,47),(35,29),(53,14)],SAGE,5);p.line([(12,31),(20,39)],'#d9dfbb',2);p.save('check')
p=Drawing();p.poly([(32,8),(16,35),(30,34),(25,57),(50,25),(35,27),(42,8)],GOLD);p.line([(33,13),(23,31),(31,30)],LIGHT,2);p.save('bolt')
p=Drawing();p.poly([(24,22),(19,10),(31,14),(44,9),(40,23),(46,31),(51,43),(46,53),(18,54),(12,47),(15,34)],'#b79878')
p.line([(24,23),(40,24)],LIGHT,3);p.line([(29,26),(27,34)],INK);p.line([(36,25),(39,31)],INK)
p.oval(32,40,8,9,GOLD);p.line([(32,35),(33,43)],'#8b7159',2);p.line([(20,35),(17,42)],'#e1c69c');p.save('bag')
p=Drawing();p.oval(32,34,22,22,'#a99075');p.oval(31,33,17,17,'#e4d2ae');p.line([(30,23),(31,34),(39,38)],'#6e6770',3)
p.line([(29,7),(35,7)],GOLD,4);p.line([(32,8),(32,12)],GOLD,3)
for x,y in [(31,18),(46,33),(32,48),(17,34)]:p.line([(x,y),(x+1,y+2)],'#aa9378',2)
p.line([(17,22),(21,19)],LIGHT,2);p.save('clock')

for name,up in [('upload',True),('download',False)]:
    p=Drawing();p.poly([(12,8),(39,7),(49,18),(51,55),(12,56)],'#d1c9b0')
    p.poly([(39,7),(38,19),(49,18)],'#a9a59b');p.line([(17,48),(35,49)],'#8c8b8b',2)
    pts=[(28,17),(38,17),(37,32),(46,32),(31,45),(18,32),(28,32)]
    if up:pts=[(x,62-y) for x,y in pts]
    p.poly(pts,BLUE if up else SAGE);p.save(name)
p=Drawing();p.line([(20,29),(20,20),(25,13),(36,12),(43,20),(43,30)],INK,8)
p.line([(20,29),(20,20),(25,13),(36,12),(43,20),(43,30)],'#b7afb8',4)
p.poly([(14,28),(48,27),(50,52),(14,54)],GOLD);p.oval(32,38,3,4,INK,INK,1)
p.line([(31,40),(31,46)],INK,3);p.line([(18,32),(25,32)],LIGHT,2);p.save('lock')
p=Drawing();p.poly([(31,6),(39,24),(57,25),(44,38),(48,57),(31,46),(14,55),(18,37),(5,24),(25,23)],GOLD)
p.line([(30,12),(26,28),(14,28)],LIGHT,2);p.line([(24,34),(25,37)],'#8f775d',2);p.line([(38,34),(38,36)],'#8f775d',2);p.save('star')
p=Drawing()
for pts in [[(10,23),(11,11),(24,10)],[(40,10),(53,11),(54,24)],[(54,40),(53,53),(40,54)],[(24,54),(10,53),(11,40)]]:
    p.line(pts,INK,7);p.line(pts,GOLD,4)
p.save('full')
p=Drawing();p.line([(31,12),(31,28),(32,51)],INK,8);p.line([(12,31),(31,32),(51,31)],INK,8)
p.line([(31,12),(31,28),(32,51)],SAGE,5);p.line([(12,31),(31,32),(51,31)],SAGE,5);p.save('plus')
p=Drawing();sparkle(p,31,31);p.line([(31,19),(33,43)],GOLD,3);p.line([(21,31),(42,30)],GOLD,3);p.save('spark')

p=Drawing();p.line([(8,31),(15,21),(24,23),(39,41),(50,42),(57,32),(51,21),(41,23),(24,42),(14,42),(8,31)],INK,6);p.line([(8,31),(15,21),(24,23),(39,41),(50,42),(57,32),(51,21),(41,23),(24,42),(14,42),(8,31)],LILAC,3);p.save('infinity')

# Every rainbow crystal has its own silhouette, even in an unfilled socket.
crystals = [
    # Ember fang: an asymmetric, leaning spear.
    ([(29,3),(27,20),(40,28),(32,48),(18,57),(8,38),(13,22)], [(29,6),(19,28),(11,38),(16,22)], [(19,28),(18,54),(31,46),(37,29)]),
    # Amber pebble: a broad, roughly octagonal nugget.
    ([(15,12),(32,10),(43,23),(40,43),(28,51),(12,48),(4,32),(7,20)], [(15,15),(31,13),(24,28),(8,31),(10,22)], [(24,28),(28,48),(38,41),(40,24)]),
    # Citrine sun: six long mineral points.
    ([(23,2),(29,17),(41,10),(37,26),(46,32),(34,38),(38,53),(25,46),(16,58),(14,41),(3,39),(12,28),(7,15),(20,19)], [(23,7),(20,24),(10,19),(15,29),(24,31),(28,20)], [(24,31),(25,45),(35,49),(31,37),(42,32)]),
    # Emerald cluster: three interlocking crystals rooted together.
    ([(5,31),(13,20),(19,29),(20,10),(29,3),(35,21),(34,33),(41,25),(46,35),(37,53),(20,58),(10,49)], [(29,7),(25,25),(25,51),(21,47),(23,13)], [(25,27),(25,54),(34,50),(32,23)]),
    # Sapphire drop: round at the base, one curved crystalline tip.
    ([(30,3),(28,17),(36,25),(42,37),(39,49),(30,56),(16,55),(6,45),(6,32),(13,21),(23,14)], [(26,12),(17,26),(11,35),(12,43),(23,34)], [(23,34),(28,52),(37,46),(39,37),(32,27)]),
    # Indigo crescent: the open edge is part of the silhouette.
    ([(32,4),(18,9),(8,22),(5,39),(13,52),(27,56),(41,48),(31,47),(22,39),(19,26),(23,15)], [(27,9),(17,19),(12,34),(9,38),(12,23),(20,13)], [(12,34),(16,48),(27,53),(35,49),(23,43)]),
    # Violet bow: a short cross with four large wing-shaped facets.
    ([(5,11),(22,20),(32,8),(33,25),(46,30),(34,37),(38,53),(23,44),(10,54),(13,37),(3,30),(15,25)], [(9,16),(22,24),(23,33),(7,30),(18,28)], [(23,33),(24,42),(35,49),(31,36),(42,31)]),
]
for n,(outline,highlight,shadow) in enumerate(crystals):
    for lit in [True,False]:
        p=Drawing(48,60)
        col=['#dd958a','#e3ac6e','#dbc482','#a1b58b','#8db4c9','#a6a1c7','#bb98c5'][n] if lit else '#514c60'
        p.poly(outline,col,'#34313f',2)
        p.poly(highlight,'#f0dfc3' if lit else '#797184',None)
        p.poly(shadow,'#796b87' if lit else '#3b374b',None)
        p.line([highlight[0],highlight[1]],'#faeacd' if lit else '#92869c',2)
        p.line([highlight[-1],shadow[0],shadow[1]],'#9b8298' if lit else '#4b445b',1)
        p.save(f'gem-{n}' if lit else f'gem-{n}-off')
    # A chiseled negative of the exact crystal, not a separate badge or mount.
    p=Drawing(64,76)
    rim=[(round((x-24)*1.18+32),round((y-30)*1.18+38)) for x,y in outline]
    cut=[(x+8,y+8) for x,y in outline]
    p.poly(rim,'#494553','#343442',2)
    p.poly(cut,'#171925','#252634',3)
    for a,b in zip(rim,rim[1:]+rim[:1]):
        if (a[1]+b[1])/2>39:
            p.line([a,b],'#827887',1)
    p.line([(rim[0][0]-2,rim[0][1]-2),(rim[0][0]-4,rim[0][1]-4)],'#6b6271',1)
    p.line([(rim[-1][0]-2,rim[-1][1]+1),(rim[-1][0]-4,rim[-1][1]+3)],'#383846',1)
    p.save(f'socket-{n}')


# Small source borders are sliced by CSS, preserving the drawn corners at every size.
for name,col,shine in [('frame','#72677d','#9a8891'),('frame-gold','#a18e6e','#d2b58b'),('frame-green','#7c8c77','#aeb89c'),('frame-paper','#9e8b70','#c7b190')]:
    p=Drawing()
    p.line([(6,3),(19,2),(40,3),(59,2),(61,5),(60,24),(61,46),(60,59),(56,61),(34,60),(17,61),(4,60),(2,56),(3,35),(2,17),(3,6),(6,3)],'#2a2637',3)
    p.line([(6,4),(23,3),(43,4),(58,3),(60,6),(59,27),(60,44),(59,58),(55,60),(35,59),(16,60),(5,59),(3,55),(4,35),(3,19),(4,7),(6,4)],col,1)
    p.line([(7,7),(17,6)],shine,1);p.line([(6,8),(5,16)],shine,1)
    p.line([(48,58),(56,57),(57,52)],shine,1);p.line([(58,7),(58,12)],col,1)
    p.save(name)
for name,on in [('toggle-off',False),('toggle-on',True)]:
    p=Drawing(64,36)
    p.poly([(5,6),(55,5),(59,9),(58,29),(6,30),(3,25),(4,10)],'#3a3945', '#9ba98c' if on else '#82738d',2)
    x=37 if on else 9
    p.poly([(x,10),(x+17,9),(x+18,24),(x,25)],SAGE if on else '#9b8fa9','#4c4456',1)
    p.line([(x+3,12),(x+12,12)],'#d3d5b8' if on else '#c0afcb',1);p.save(name)
print('Drew UI icons, distinct rainbow crystals, frames, and toggles.')
