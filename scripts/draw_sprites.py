"""Original tiny Paint sprites. Standard library only; no external artwork."""
from pathlib import Path
import math
import random
import struct
import zlib

OUT = Path(__file__).resolve().parent.parent / 'public' / 'sprites'
OUT.mkdir(parents=True, exist_ok=True)

class Paint:
    def __init__(self, w=48, h=48):
        self.w, self.h = w, h
        self.p = [[(0, 0, 0, 0) for _ in range(w)] for _ in range(h)]

    def dot(self, x, y, color):
        if 0 <= int(x) < self.w and 0 <= int(y) < self.h:
            c = color.lstrip('#')
            self.p[int(y)][int(x)] = (*tuple(int(c[i:i+2], 16) for i in (0, 2, 4)), 255)

    def box(self, x, y, w, h, c):
        for yy in range(int(y), int(y+h)):
            for xx in range(int(x), int(x+w)):
                self.dot(xx, yy, c)

    def poly(self, pts, c):
        for y in range(max(0, int(min(p[1] for p in pts))), min(self.h, int(max(p[1] for p in pts))+1)):
            hits = []
            for i, (x1, y1) in enumerate(pts):
                x2, y2 = pts[(i+1) % len(pts)]
                if (y1 <= y < y2) or (y2 <= y < y1):
                    hits.append(x1 + (y-y1) * (x2-x1) / (y2-y1))
            hits.sort()
            for i in range(0, len(hits)-1, 2):
                self.box(math.ceil(hits[i]), y, max(0, math.ceil(hits[i+1])-math.ceil(hits[i])), 1, c)

    def line(self, x1, y1, x2, y2, c, width=1):
        n = max(abs(x2-x1), abs(y2-y1), 1)
        for i in range(int(n)+1):
            self.box(round(x1+(x2-x1)*i/n), round(y1+(y2-y1)*i/n), width, width, c)

    def oval(self, x, y, rx, ry, c):
        for yy in range(int(y-ry), int(y+ry)+1):
            for xx in range(int(x-rx), int(x+rx)+1):
                if ((xx-x)/rx)**2+((yy-y)/ry)**2 <= 1:
                    self.dot(xx, yy, c)

    def png(self, name):
        def chunk(t, d):
            return struct.pack('!I', len(d))+t+d+struct.pack('!I', zlib.crc32(t+d) & 0xffffffff)
        raw = b''.join(b'\0'+bytes(v for pixel in row for v in pixel) for row in self.p)
        data = b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR', struct.pack('!2I5B', self.w, self.h, 8, 6, 0, 0, 0))+chunk(b'IDAT', zlib.compress(raw, 9))+chunk(b'IEND', b'')
        (OUT / (name+'.png')).write_bytes(data)

INK = '#242536'
def fire(p, frame=0):
    p.poly([(9,42),(11,37),(39,41),(38,46)], '#4c3334')
    p.poly([(9,43),(36,36),(39,40),(12,47)], '#8c5b43')
    p.line(13,42,34,39,'#c28c58',2)
    dx = [0,2,-1][frame]
    p.poly([(12,34),(9,27),(15,19),(17,22),(21,8),(27+dx,2),(26,16),(32,22),(34,15),(39,28),(36,36),(27,40),(18,39)], '#733b42')
    p.poly([(14,31),(16,22),(20,26),(24+dx,10),(25,21),(30,26),(33,22),(36,30),(32,36),(23,38),(17,35)], '#e8764c')
    p.poly([(19,32),(23,24),(25,18),(28,30),(31,32),(28,36),(23,37)], '#ffd487')
    p.box(24,30,3,6,'#fff1ba')
    p.box(10+dx,12,2,3,'#e39150');p.box(35-dx,6,2,2,'#ffcf7e')

for frame in range(3):
    p=Paint();fire(p,frame);p.png('ember' if frame==0 else 'ember-'+str(frame))
p=Paint();fire(p,1);p.png('flame')
for name, gold in [('carrot',False),('gold-carrot',True)]:
    p=Paint();p.poly([(22,15),(38,25),(12,44),(8,43),(10,38)],INK)
    p.poly([(24,17),(35,25),(12,41)], '#f1c968' if gold else '#e8944c')
    p.line(22,22,27,27,'#ffe6a2' if gold else '#ffc176',2)
    p.line(19,30,22,33,'#b48045',2);p.line(26,23,30,26,'#b48045',2)
    p.poly([(23,16),(20,4),(26,7),(29,1),(32,8),(42,4),(36,16),(35,23)], '#3f6952')
    p.line(28,15,30,7,'#93bd72',2);p.line(32,18,38,9,'#93bd72',2);p.png(name)
p=Paint();p.poly([(8,43),(9,40),(39,40),(40,44)],'#6b4b44');p.line(24,40,23,24,'#69975c',2);p.poly([(23,33),(13,30),(9,21),(17,22),(23,28)],'#88b575');p.poly([(25,29),(29,18),(40,16),(38,25),(29,31)],'#aac579');p.png('sprout')
p=Paint();p.poly([(10,40),(15,43),(36,42),(39,38),(32,36),(17,37)],'#5b403f');p.oval(24,35,14,5,'#795647');p.box(14,35,3,2,'#ae7d56');p.box(30,37,2,1,'#ae7d56');p.png('soil')
p=Paint();p.oval(24,24,13,13,INK);p.oval(24,23,11,11,'#efbd58');p.box(16,17,9,3,'#ffdc7d');p.box(18,21,3,3,'#8c6647');p.box(28,21,3,3,'#8c6647');p.line(21,28,27,28,'#ad7948');
for x,y,xx,yy in [(24,2,24,6),(24,41,24,46),(2,24,7,24),(40,24,46,24),(7,7,11,11),(36,36,40,40),(40,7,36,11),(7,40,11,36)]:p.line(x,y,xx,yy,'#d49b4e',2)
p.png('sun')
p=Paint();p.poly([(8,39),(7,30),(11,19),(22,10),(40,5),(41,23),(33,36),(21,42)],INK);p.poly([(10,36),(11,25),(22,14),(37,9),(37,24),(29,35),(19,39)],'#719b65');p.poly([(12,34),(24,17),(35,11),(28,29),(19,36)],'#b0c57c');p.line(6,44,32,18,'#425d4d',2);p.line(20,30,18,23,'#425d4d');p.png('leaf')
for name, storm in [('cloud',False),('storm',True)]:
    p=Paint();p.oval(15,24,10,9,INK);p.oval(25,16,12,11,INK);p.oval(35,25,10,9,INK);p.box(12,22,26,13,INK)
    c='#747f9e' if storm else '#bbd6db';p.oval(15,24,8,7,c);p.oval(25,17,10,10,c);p.oval(35,25,8,7,c);p.box(13,23,24,10,c);p.box(15,16,5,2,'#a0b0c6' if storm else '#e3eff0');p.box(24,8,7,3,'#a0b0c6' if storm else '#e3eff0')
    if storm:p.poly([(25,30),(19,40),(25,40),(21,47),(33,35),(26,35),(29,30)],'#f4ca72')
    else:
        for x,y in [(12,39),(25,41),(38,39)]:p.line(x,y,x-2,y+4,'#7baac3',2)
    p.png(name)
p=Paint();p.poly([(31,3),(19,5),(11,14),(7,25),(10,36),(20,43),(33,43),(41,35),(30,36),(22,30),(18,22),(20,12)],INK);p.poly([(26,7),(17,13),(12,24),(14,34),(23,40),(33,39),(27,36),(21,31),(16,23),(18,14)],'#b8b1d0');p.box(13,22,2,9,'#e0d6db');p.box(29,7,2,2,'#f1d88a');p.png('moon')
for name, color in [('flower','#b88fc6'),('flower-red','#d97e7e'),('flower-blue','#7fa9d5'),('flower-gold','#e8bf70')]:
    p=Paint();p.line(24,29,24,45,'#63845c',3);p.poly([(23,40),(13,39),(10,33),(17,34)],'#9dbd7e');p.poly([(27,36),(36,28),(40,29),(37,35)],'#759e70')
    for x,y in [(24,8),(14,15),(16,26),(29,27),(35,15)]:p.oval(x,y,8,8,INK);p.oval(x,y-1,6,6,color)
    p.oval(25,19,7,7,'#f4cc76');p.box(24,16,4,4,'#ffe5a0');p.png(name)
for name,col in [('star','#efd595'),('crystal','#b49ed0'),('rune','#b5cbd6')]:
    p=Paint()
    if name=='star':
        pts=[(24,3),(30,16),(45,18),(34,29),(37,44),(24,37),(10,44),(13,29),(2,18),(18,16)];p.poly(pts,INK);p.poly([(24,8),(28,20),(39,21),(31,29),(33,38),(24,33),(15,38),(17,28),(8,21),(20,20)],col);p.box(19,22,2,3,'#83745d');p.box(29,22,2,3,'#83745d')
    else:
        p.poly([(24,2),(39,14),(35,37),(24,46),(11,34),(9,15)],INK);p.poly([(24,5),(35,15),(32,35),(24,41),(14,32),(13,16)],col);p.poly([(24,8),(23,39),(16,31),(15,17)],'#d4c8e0');p.line(26,14,29,24,'#7b709f',2);p.line(29,24,24,30,'#7b709f',2)
    p.png(name)
p=Paint();p.poly([(4,23),(14,12),(32,12),(44,24),(34,35),(14,35)],INK);p.poly([(7,24),(15,16),(31,16),(40,24),(32,31),(15,31)],'#b6aaa7');p.oval(24,23,9,10,'#8a78a4');p.oval(24,24,4,7,INK);p.box(20,17,3,3,'#f5dcc3');p.png('eye')
p=Paint();p.oval(30,13,10,10,INK);p.oval(30,13,7,7,'#d6b46f');p.oval(30,13,3,3,'#524741');p.line(25,20,9,39,INK,6);p.line(25,20,9,39,'#d6b46f',3);p.box(11,31,9,3,'#edce83');p.box(8,36,8,3,'#edce83');p.png('key')
p=Paint();p.poly([(24,3),(43,40),(5,40)],INK);p.poly([(24,8),(36,36),(12,36)],'#bcb4d4');p.poly([(24,8),(24,36),(12,36)],'#8eb9b0');p.line(25,17,32,33,'#ead8c3',2);p.png('prism')
p=Paint();p.box(17,20,16,19,INK);p.box(19,22,12,15,'#c7a47c');p.poly([(12,23),(23,2),(37,23)],INK);p.poly([(16,21),(23,7),(33,21)],'#cf7c6c');p.box(17,34,18,9,'#8d9c7a');p.box(20,25,3,3,INK);p.box(28,25,3,3,INK);p.oval(25,32,4,5,'#e8d5ae');p.png('gnome')
p=Paint();p.oval(24,25,16,12,INK);p.oval(24,24,14,10,'#ccb48c');p.oval(23,24,8,8,'#9f805d');p.oval(24,25,4,5,'#dfc895');p.line(36,28,41,18,'#74906e',3);p.line(40,22,44,18,'#74906e',2);p.box(40,17,2,2,INK);p.png('snail')
p=Paint();p.oval(23,31,14,10,INK);p.oval(23,30,12,8,'#e9cc7c');p.oval(31,16,8,9,INK);p.oval(31,16,6,7,'#edd68c');p.box(36,18,8,4,'#cb8858');p.box(30,14,2,3,INK);p.poly([(12,30),(24,30),(20,35)],'#c7a45f');p.png('duck')
p=Paint();p.poly([(24,23),(13,10),(4,11),(5,26),(18,33),(10,42),(19,43),(25,30),(31,43),(40,42),(32,31),(45,25),(44,10),(35,11)],INK);p.poly([(22,24),(13,14),(8,15),(9,24),(20,29)],'#ac9fbf');p.poly([(27,24),(36,14),(41,14),(40,24),(29,29)],'#b8accc');p.line(24,20,25,35,'#d6bd8c',3);p.line(25,20,21,14,'#b5a78c');p.line(26,20,30,14,'#b5a78c');p.png('moth')
p=Paint();p.oval(24,24,15,19,INK);p.oval(24,23,12,16,'#d9b46b');p.oval(24,23,8,12,'#a98550');p.line(24,15,24,31,'#ebce8b',2);p.line(20,20,28,20,'#ebce8b',2);p.png('coin')
p=Paint();p.poly([(12,39),(11,24),(14,22),(15,11),(20,10),(21,22),(23,6),(28,6),(28,22),(31,11),(35,12),(34,26),(39,20),(43,22),(37,36),(28,43),(18,42)],INK);p.poly([(15,37),(14,26),(17,25),(18,13),(19,25),(25,25),(26,10),(27,26),(32,27),(33,16),(32,30),(39,25),(34,34),(26,39),(20,39)],'#c4ad97');p.png('glove')
p=Paint();p.box(14,22,22,20,INK);p.box(16,24,18,16,'#a49f9c');p.line(19,22,19,13,INK,3);p.line(19,13,32,13,INK,3);p.line(32,13,32,23,INK,3);p.box(21,15,9,8,'#bbb5ad');p.box(24,29,4,7,'#454650');p.png('lock')
for frame in range(3):
    p=Paint(48,80);p.poly([(20,43),(30,42),(29,77),(22,77)],INK);p.box(23,43,5,32,'#6d4c3b');p.box(25,44,2,28,'#94744e');p.poly([(13,39),(35,39),(31,49),(17,49)],'#696b70');p.box(14,39,20,3,'#98918a');
    flame=Paint();fire(flame,frame)
    for yy in range(39):
        for xx in range(48):
            if flame.p[yy][xx][3]:p.p[yy+1][xx]=flame.p[yy][xx]
    p.png('torch-'+str(frame))

# A deliberately lopsided 192-pixel doorway, stone by stone.
p=Paint(192,240);random.seed(42)
p.poly([(19,230),(20,94),(23,69),(33,44),(53,24),(76,11),(100,9),(127,16),(153,37),(168,67),(173,94),(174,230)],'#151722')
p.poly([(28,224),(29,95),(32,72),(43,48),(61,32),(81,21),(101,20),(123,27),(145,45),(158,72),(163,96),(165,225)],'#4b4b58')
p.poly([(48,225),(48,96),(52,73),(64,54),(82,44),(101,41),(121,49),(137,68),(144,96),(145,226)],'#11121d')
for side in [0,1]:
    x=29 if side==0 else 146
    for y in range(98,220,23):
        p.box(x+random.randint(-1,1),y,17,20,'#565562' if (y//23)%2 else '#444650');p.box(x+2,y+1,13,2,'#68636b');p.box(x+15,y+4,2,16,'#303540');p.box(x+4,y+14,2,2,'#3a3c47')
for angle in range(180,360,20):
    a=math.radians(angle);a2=math.radians(angle+18)
    pts=[(96+67*math.cos(a),94+75*math.sin(a)),(96+67*math.cos(a2),94+75*math.sin(a2)),(96+48*math.cos(a2),94+53*math.sin(a2)),(96+48*math.cos(a),94+53*math.sin(a))]
    p.poly(pts,random.choice(['#595865','#4f4e5c','#62606b']));p.line(int(pts[0][0]),int(pts[0][1]),int(pts[1][0]),int(pts[1][1]),'#77707a')
p.poly([(51,225),(51,96),(55,76),(66,59),(83,49),(101,47),(119,55),(132,72),(141,96),(142,226)],'#383342')
for x in range(54,140,10):
    top=96-int(math.sqrt(max(0,43**2-(x-97)**2)))
    p.box(x,top,8,225-top,random.choice(['#39323f','#443847','#3d3443']));p.line(x+1,top+5,x+1,219,'#514151');p.line(x+6,top+24,x+6,204,'#302d3c')
p.line(97,49,97,225,'#1c202c',3)
for x in [51,102]:
    for y in [100,180]:
        p.box(x,y,40,6,'#1b202b');p.box(x+2,y,36,2,'#5c5961');p.box(x+4,y+2,2,2,'#aaa083');p.box(x+32,y+2,2,2,'#aaa083')
for x in [85,109]:
    p.oval(x,155,5,7,'#151b27');p.oval(x,153,4,5,'#b29a69');p.oval(x,152,2,3,'#3b333a');p.box(x-1,151,3,2,'#e5c78a')
p.box(56,113,82,29,'#252632');p.box(57,113,80,1,'#796c63');p.box(57,141,80,1,'#796c63')
p.poly([(21,222),(43,219),(46,226),(155,225),(158,219),(175,223),(179,233),(17,233)],'#5a5660');p.box(20,230,156,4,'#323441');p.box(25,222,13,2,'#77707a')
for x,y in [(32,204),(28,189),(159,192),(164,215),(35,56),(143,39)]:
    p.box(x,y,4,3,'#485448');p.box(x+2,y+3,4,3,'#323f37')
# Separate the wooden leaves from the masonry so the stone arch never swings.
mask=Paint(192,240)
mask.poly([(51,221),(51,96),(55,76),(66,59),(83,49),(101,47),(119,55),(132,72),(141,96),(142,221)],'#ffffff')
frame=Paint(192,240);left=Paint(192,240);right=Paint(192,240)
for yy in range(240):
    for xx in range(192):
        if mask.p[yy][xx][3]:
            (left if xx<=97 else right).p[yy][xx]=p.p[yy][xx]
        else:
            frame.p[yy][xx]=p.p[yy][xx]
frame.png('gate-frame');left.png('gate-left');right.png('gate-right')
p.png('gate')

# App icons use the same original door sprite.
for size in [192,512]:
    q=Paint(size,size)
    for y in range(size):
        for x in range(size):
            q.p[y][x]=(23,25,38,255)
            sx=int((x/size)*240)-24;sy=int((y/size)*240)
            if 0<=sx<p.w and p.p[sy][sx][3]:q.p[y][x]=p.p[sy][sx]
    q.png('app-'+str(size))
print(f'Drew {len(list(OUT.glob("*.png")))} original sprites.')
