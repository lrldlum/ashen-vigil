from gen_common import *
from PIL import ImageFont
TH={'stone':('stone0','stone1','stone2','stone3'),'frozen':('ice0','ice1','ice2','ice3'),'burning':('ember0','stone0','ember1','ember2')}
# tileset 16x16, 8 cols x 2 rows: 0 fill,1 top,2 left edge,3 right edge,4 brick,5 pillar,6 platform,7 window ; row2: 8 spikes/hazard,9 arch,10 rubble,11 deco,12-15 variants
def tiles(name,k):
    a,b,c,e=[P[x] for x in TH[k]]; im=img(128,32); d=ImageDraw.Draw(im); random.seed(len(name))
    for t in range(16):
        ox,oy=(t%8)*16,(t//8)*16
        if t in(0,12,13): rect(d,ox,oy,16,16,a); [px(d,ox+random.randint(0,15),oy+random.randint(0,15),b) for _ in range(10)]
        if t in(1,14): rect(d,ox,oy,16,16,a); rect(d,ox,oy,16,3,e); rect(d,ox,oy+3,16,1,c)
        if t==2: rect(d,ox,oy,16,16,a); rect(d,ox,oy,2,16,c)
        if t==3: rect(d,ox,oy,16,16,a); rect(d,ox+14,oy,2,16,c)
        if t in(4,15):
            rect(d,ox,oy,16,16,b)
            for r in range(4): rect(d,ox,oy+r*4+3,16,1,a); rect(d,ox+(r%2)*8+4,oy+r*4,1,3,a)
        if t==5: rect(d,ox+3,oy,10,16,b); rect(d,ox+4,oy,2,16,c); rect(d,ox+11,oy,1,16,a)
        if t==6: rect(d,ox,oy,16,5,b); rect(d,ox,oy,16,1,e)
        if t==7: rect(d,ox,oy,16,16,a); rect(d,ox+4,oy+2,8,13,P['void']); d.ellipse([ox+4,oy+1,ox+11,oy+8],fill=P['void']); rect(d,ox+7,oy+3,2,12,b)
        if t==8:
            col=P['ice3'] if k=='frozen' else (P['ember3'] if k=='burning' else P['stone3'])
            for s in range(4): d.polygon([(ox+s*4,oy+15),(ox+s*4+2,oy+6),(ox+s*4+3,oy+15)],fill=col)
        if t==9: rect(d,ox,oy,16,16,b); d.ellipse([ox+2,oy+4,ox+13,oy+20],fill=P['void'])
        if t==10: [rect(d,ox+random.randint(0,12),oy+8+random.randint(0,6),3,2,c) for _ in range(6)]
        if t==11:
            col=P['ice2'] if k=='frozen' else (P['ember2'] if k=='burning' else P['moss'])
            for s in range(5): rect(d,ox+2+s*3,oy,1,3+s%3*3,col)
    im.save(f'../assets/tiles/tiles_{k}.png')
# parallax 320x180: far sky, mid silhouettes, near
SKY={'stone':((20,18,30),(60,50,70)),'frozen':((10,20,40),(80,120,160)),'burning':((30,8,10),(140,50,20))}
def bgs(k):
    top,bot=SKY[k]; random.seed(k)
    im=img(320,180); d=ImageDraw.Draw(im)
    for y in range(180):
        t=y/179; d.line([(0,y),(319,y)],fill=tuple(int(top[i]+(bot[i]-top[i])*t) for i in range(3))+(255,))
    for _ in range(60): px(d,random.randint(0,319),random.randint(0,110),P['bone'] if k!='burning' else P['ember2'])
    d.ellipse([230,20,262,52],fill=(P['ash'] if k!='burning' else P['ember1'])+(255,))
    im.save(f'../assets/bg/bg_{k}_far.png')
    im=img(320,180); d=ImageDraw.Draw(im); c=tuple(int(x*0.6) for x in bot)+(255,)
    x=0
    while x<320:
        w=random.randint(20,40); h=random.randint(50,110); rect(d,x,180-h,w,h,c)
        d.polygon([(x,180-h),(x+w//2,180-h-random.randint(15,40)),(x+w,180-h)],fill=c); x+=w+random.randint(2,12)
    im.save(f'../assets/bg/bg_{k}_mid.png')
    im=img(320,180); d=ImageDraw.Draw(im); c=P['ink']+(255,)
    for x in range(0,320,64):
        rect(d,x+8,40,10,140,c); d.ellipse([x+4,30,x+22,50],fill=c)
        d.arc([x+18,60,x+70,140],180,360,fill=c,width=5)
    if k=='frozen':
        for _ in range(40): px(d,random.randint(0,319),random.randint(0,179),P['ice3'])
    if k=='burning':
        for _ in range(40): px(d,random.randint(0,319),random.randint(100,179),P['ember3'])
    im.save(f'../assets/bg/bg_{k}_near.png')
for k in TH: tiles(k,k) if False else tiles('t'+k,k); bgs(k)
# UI
im=img(64,8);d=ImageDraw.Draw(im)
for i,c in enumerate(['blood','ice1','moss']): pass
for i,(c,n) in enumerate([('blood','hp'),('ice1','fp'),('moss','stamina')]):
    b=img(64,6);bd=ImageDraw.Draw(b); rect(bd,0,0,64,6,P['ink']); rect(bd,1,1,62,4,P[c]); rect(bd,1,1,62,1,tuple(min(255,v+60) for v in P[c])); b.save(f'../assets/ui/bar_{n}.png')
b=img(64,6);bd=ImageDraw.Draw(b); rect(bd,0,0,64,6,P['gold']); rect(bd,1,1,62,4,P['void']); b.save('../assets/ui/bar_frame.png')
s=img(12,12);sd=ImageDraw.Draw(s); sd.ellipse([2,3,9,10],fill=P['soul']+(255,)); sd.polygon([(5,0),(8,4),(3,4)],fill=P['soul']+(255,)); px(sd,5,6,P['ice3']); s.save('../assets/ui/souls_icon.png')
fl=img(12,12);fd=ImageDraw.Draw(fl); rect(fd,4,1,4,3,P['stone2']); fd.ellipse([2,3,9,11],fill=P['ember2']+(255,)); fl.save('../assets/ui/flask_icon.png')
